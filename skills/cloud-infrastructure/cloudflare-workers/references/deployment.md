# Deployment Guide

Complete guide to deploying Cloudflare Workers to production with CI/CD, monitoring, and best practices.

## Table of Contents

- [Basic Deployment](#basic-deployment)
- [Environments](#environments)
- [CI/CD Pipelines](#cicd-pipelines)
- [Secrets Management](#secrets-management)
- [Routes and Domains](#routes-and-domains)
- [Versioning and Rollback](#versioning-and-rollback)
- [Monitoring and Logging](#monitoring-and-logging)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Basic Deployment

### Deploy to Production

```bash
# Deploy Worker
wrangler deploy

# Deploy specific environment
wrangler deploy --env staging

# Preview deployment (dry run)
wrangler deploy --dry-run

# Deploy with specific configuration
wrangler deploy --config wrangler.production.toml
```

### Deployment Checklist

- [ ] Test locally with `wrangler dev`
- [ ] Run tests (`npm test`)
- [ ] Update `compatibility_date` in wrangler.toml
- [ ] Review bundle size (`wrangler deploy --dry-run --outdir=dist`)
- [ ] Set all required secrets
- [ ] Configure routes or custom domains
- [ ] Deploy to staging first
- [ ] Test staging deployment
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Verify functionality

## Environments

### Configuration

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Production (default)
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]

[vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"

# Staging environment
[env.staging]
name = "my-worker-staging"
routes = [
  { pattern = "staging.api.example.com/*", zone_name = "example.com" }
]

[env.staging.vars]
ENVIRONMENT = "staging"
API_URL = "https://staging.api.example.com"

# Development environment
[env.dev]
name = "my-worker-dev"

[env.dev.vars]
ENVIRONMENT = "development"
API_URL = "http://localhost:3000"
```

### Deploy to Different Environments

```bash
# Deploy to production (default)
wrangler deploy

# Deploy to staging
wrangler deploy --env staging

# Deploy to dev
wrangler deploy --env dev
```

### Environment-Specific Bindings

```toml
# Production KV namespace
[[kv_namespaces]]
binding = "MY_KV"
id = "production-kv-id"

# Staging KV namespace
[env.staging]
[[env.staging.kv_namespaces]]
binding = "MY_KV"
id = "staging-kv-id"

# Same pattern for D1, R2, etc.
```

## CI/CD Pipelines

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Worker

on:
  push:
    branches:
      - main
      - staging

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to staging
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

variables:
  NODE_VERSION: "20"

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm test
    - npm run build

deploy-staging:
  stage: deploy
  image: node:${NODE_VERSION}
  only:
    - staging
  script:
    - npm ci
    - npx wrangler deploy --env staging
  environment:
    name: staging

deploy-production:
  stage: deploy
  image: node:${NODE_VERSION}
  only:
    - main
  script:
    - npm ci
    - npx wrangler deploy
  environment:
    name: production
  when: manual
```

### Deployment with Secrets

```yaml
# GitHub Actions
- name: Set secrets
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  run: |
    echo "${{ secrets.API_KEY }}" | npx wrangler secret put API_KEY
    echo "${{ secrets.JWT_SECRET }}" | npx wrangler secret put JWT_SECRET
```

## Secrets Management

### Add Secrets via CLI

```bash
# Add secret (prompts for value)
wrangler secret put API_KEY

# Add secret from stdin
echo "my-secret-value" | wrangler secret put API_KEY

# Add secret to specific environment
wrangler secret put API_KEY --env staging

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete API_KEY
```

### Access Secrets in Code

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Secrets are available in env
    const apiKey = env.API_KEY;
    const jwtSecret = env.JWT_SECRET;

    return new Response('OK');
  }
};
```

### Secrets Best Practices

- Never commit secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Use environment variables for non-sensitive config
- Audit secret access

## Routes and Domains

### Routes Configuration

```toml
# wrangler.toml

# Route with zone name
routes = [
  { pattern = "example.com/*", zone_name = "example.com" },
  { pattern = "api.example.com/*", zone_name = "example.com" }
]

# Multiple routes
routes = [
  { pattern = "example.com/api/*", zone_name = "example.com" },
  { pattern = "example.com/auth/*", zone_name = "example.com" }
]
```

### Custom Domains (Recommended)

```toml
# wrangler.toml
[[routes]]
pattern = "api.example.com"
custom_domain = true
```

```bash
# Create custom domain
wrangler deploy
```

Benefits of custom domains:
- Automatic SSL certificates
- No zone ID needed
- Simpler configuration
- Better performance

### workers.dev Subdomain

```toml
# wrangler.toml
name = "my-worker"

# Deploys to: my-worker.your-subdomain.workers.dev
```

```bash
# Disable workers.dev deployment
wrangler deploy --no-workers-dev
```

## Versioning and Rollback

### Gradual Deployments

```bash
# Deploy to 10% of traffic
wrangler versions deploy --percentage 10

# Increase to 50%
wrangler versions deploy --percentage 50

# Promote to 100%
wrangler versions deploy --percentage 100
```

### List Deployments

```bash
# List recent deployments
wrangler deployments list

# View specific deployment
wrangler deployments view <deployment-id>
```

### Rollback

```bash
# List versions
wrangler versions list

# Rollback to previous version
wrangler rollback

# Rollback to specific version
wrangler rollback <version-id>
```

### Version Management

```bash
# View current version
wrangler versions view

# Upload new version (doesn't deploy)
wrangler versions upload

# Deploy specific version
wrangler versions deploy <version-id>
```

## Monitoring and Logging

### Real-Time Logs

```bash
# Tail logs
wrangler tail

# Formatted output
wrangler tail --format pretty

# Filter by status
wrangler tail --status error
wrangler tail --status ok

# Filter by method
wrangler tail --method POST

# Filter by sampling rate (0.0-1.0)
wrangler tail --sampling-rate 0.1

# Filter by IP
wrangler tail --ip 1.2.3.4
```

### Structured Logging

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Structured logging
    console.log(JSON.stringify({
      level: 'info',
      message: 'Request processed',
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      cf: {
        country: request.cf?.country,
        colo: request.cf?.colo
      }
    }));

    return new Response('OK');
  }
};
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/cloudflare';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.ENVIRONMENT,
      tracesSampleRate: 1.0
    });

    try {
      return await handleRequest(request, env);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
};
```

### Analytics Engine

```toml
# wrangler.toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const start = Date.now();

    try {
      const response = await handleRequest(request, env);

      // Log analytics
      ctx.waitUntil(
        env.ANALYTICS.writeDataPoint({
          blobs: [request.url, request.method],
          doubles: [Date.now() - start, response.status],
          indexes: [request.cf?.country || 'unknown']
        })
      );

      return response;
    } catch (error) {
      ctx.waitUntil(
        env.ANALYTICS.writeDataPoint({
          blobs: [request.url, 'error'],
          doubles: [Date.now() - start],
          indexes: ['error']
        })
      );

      throw error;
    }
  }
};
```

### Logpush (Enterprise)

Send logs to external services:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Datadog
- Splunk
- Elasticsearch

## Performance Optimization

### Bundle Size Optimization

```bash
# Check bundle size
wrangler deploy --dry-run --outdir=dist

# Analyze bundle
npx esbuild dist/index.js --analyze
```

**Optimization techniques**:

```typescript
// Code splitting - lazy load heavy dependencies
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/heavy') {
      const { processHeavy } = await import('./heavy');
      return processHeavy(request);
    }

    return new Response('OK');
  }
};

// Tree shaking - import only what you need
import { specific } from 'library'; // Good
import * as library from 'library'; // Bad
```

### Performance Best Practices

1. **Minimize Bundle Size**: Keep Workers under 1 MB
2. **Use Bindings**: Direct bindings faster than fetch
3. **Cache Aggressively**: Use Cache API and KV
4. **Stream Large Responses**: Avoid buffering
5. **Batch D1 Queries**: Use `batch()` for transactions
6. **Background Tasks**: Use `waitUntil()` for non-critical work
7. **Async Everything**: No synchronous I/O

### Caching Strategy

```typescript
const CACHE_TTL = 3600;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 1. Check edge cache
    const cache = caches.default;
    let response = await cache.match(request);
    if (response) return response;

    // 2. Check KV cache
    const cached = await env.CACHE.get(request.url);
    if (cached) {
      response = new Response(cached);
      ctx.waitUntil(cache.put(request, response.clone()));
      return response;
    }

    // 3. Fetch from origin
    response = await fetch(request);

    // 4. Store in both caches
    ctx.waitUntil(Promise.all([
      cache.put(request, response.clone()),
      env.CACHE.put(request.url, await response.clone().text(), {
        expirationTtl: CACHE_TTL
      })
    ]));

    return response;
  }
};
```

### Resource Limits

| Resource | Free Plan | Paid Plan |
|----------|-----------|-----------|
| CPU time | 10ms | 30 seconds |
| Memory | 128 MB | 128 MB |
| Script size | 1 MB | 10 MB |
| Subrequests | 50 | 1000 |
| KV reads/request | 1000 | Unlimited |
| KV writes/request | Unlimited | Unlimited |

## Troubleshooting

### Common Issues

#### CPU Time Exceeded

**Symptoms**: `Error 1102: Worker exceeded CPU time limit`

**Solutions**:
- Optimize expensive operations
- Use streams for large data
- Move processing to Durable Objects
- Split work across multiple requests
- Check for infinite loops

#### Memory Exceeded

**Symptoms**: `Error 1101: Worker exceeded memory limits`

**Solutions**:
- Stream large responses instead of buffering
- Clear unused variables
- Use chunked processing
- Reduce in-memory cache size

#### Script Too Large

**Symptoms**: `Error 10021: Script size exceeds 1MB`

**Solutions**:
- Remove unused dependencies
- Use code splitting
- Minify production builds
- Check for duplicate dependencies

```bash
# Inspect bundle
wrangler deploy --dry-run --outdir=dist
ls -lh dist/
```

#### Binding Not Found

**Symptoms**: `env.MY_KV is undefined`

**Solutions**:
- Check wrangler.toml configuration
- Ensure binding name matches env property
- Redeploy after configuration changes
- Verify namespace/bucket exists

```bash
# List KV namespaces
wrangler kv:namespace list

# List R2 buckets
wrangler r2 bucket list

# List D1 databases
wrangler d1 list
```

#### CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
- Add proper CORS headers
- Handle OPTIONS preflight requests
- Check allowed origins
- Verify headers in response

```typescript
// Add CORS headers
if (request.method === 'OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
```

### Debugging Commands

```bash
# Local debugging
wrangler dev --local

# Remote debugging (real edge environment)
wrangler dev --remote

# Inspect bundle
wrangler deploy --dry-run --outdir=dist

# Check logs
wrangler tail --format pretty

# Check deployments
wrangler deployments list

# Check versions
wrangler versions list
```

### Debug Mode

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const debug = new URL(request.url).searchParams.has('debug');

    if (debug) {
      return new Response(JSON.stringify({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers),
        cf: request.cf,
        env: Object.keys(env)
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handleRequest(request, env);
  }
};
```

### Health Checks

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      // Check dependencies
      const checks = await Promise.all([
        checkKV(env),
        checkD1(env),
        checkR2(env)
      ]);

      const healthy = checks.every(check => check.ok);

      return new Response(JSON.stringify({
        status: healthy ? 'healthy' : 'unhealthy',
        checks
      }), {
        status: healthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handleRequest(request, env);
  }
};

async function checkKV(env: Env) {
  try {
    await env.MY_KV.get('health-check');
    return { service: 'kv', ok: true };
  } catch (error) {
    return { service: 'kv', ok: false, error: error.message };
  }
}
```

### Production Checklist

- [ ] All tests passing
- [ ] Bundle size optimized
- [ ] Secrets configured
- [ ] Routes/domains configured
- [ ] Error tracking enabled
- [ ] Logging configured
- [ ] Health check endpoint
- [ ] Rate limiting implemented
- [ ] CORS configured
- [ ] Staging tested
- [ ] Gradual rollout plan
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Performance benchmarked
