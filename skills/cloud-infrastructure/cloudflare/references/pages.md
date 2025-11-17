# Cloudflare Pages Deployment Guide

Complete guide to deploying static sites and full-stack applications with Cloudflare Pages.

## Table of Contents

1. [Overview](#overview)
2. [Deployment Methods](#deployment-methods)
3. [Git Integration](#git-integration)
4. [Framework Support](#framework-support)
5. [Pages Functions](#pages-functions)
6. [Build Configuration](#build-configuration)
7. [Environment Variables](#environment-variables)
8. [Custom Domains](#custom-domains)
9. [Troubleshooting](#troubleshooting)

## Overview

Cloudflare Pages is a JAMstack platform for deploying static sites and full-stack applications.

**Features**:
- Unlimited bandwidth (free)
- Automatic HTTPS
- Git integration (GitHub, GitLab)
- Preview deployments for PRs
- Pages Functions (serverless)
- Edge rendering
- 500 builds/month (Free plan)

**Use Cases**:
- Static websites
- Single-page applications (React, Vue, Svelte)
- SSR applications (Next.js, Remix, SvelteKit)
- Documentation sites
- Landing pages
- Blogs

## Deployment Methods

### Method 1: Git Integration (Recommended)

**Advantages**:
- Automatic deployments on push
- Preview deployments for pull requests
- Build history and rollbacks
- Branch-based environments

**Supported Providers**:
- GitHub
- GitLab

**Setup**:
1. Dashboard → Workers & Pages → Create application → Pages
2. Click "Connect to Git"
3. Authorize Cloudflare to access repository
4. Select repository
5. Configure build settings
6. Deploy

### Method 2: Direct Upload (Wrangler CLI)

**Advantages**:
- No Git required
- Quick deployments
- CI/CD flexibility
- Local builds

**Setup**:
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build your site
npm run build

# Deploy
wrangler pages deploy ./dist --project-name=my-site
```

### Method 3: Drag and Drop (Dashboard)

**Advantages**:
- No CLI required
- Quick testing
- Simple uploads

**Setup**:
1. Dashboard → Workers & Pages → Create application → Pages
2. Click "Upload assets"
3. Drag and drop dist folder
4. Deploy

**Limitations**:
- Manual deployments only
- No automatic updates
- Not recommended for production

## Git Integration

### Connect Repository

**Initial Setup**:
1. Dashboard → Workers & Pages → Create application → Pages
2. Click "Connect to Git"
3. Select provider (GitHub/GitLab)
4. Authorize Cloudflare
5. Select repository
6. Configure build settings

**Repository Permissions**:
- Cloudflare needs read access to repository
- Write access for commit statuses
- Can limit to specific repositories

### Branch Configuration

**Production Branch**:
- Default: `main` or `master`
- Deploys to production URL: `project-name.pages.dev`

**Preview Branches**:
- All other branches
- Deploy to preview URL: `branch.project-name.pages.dev`
- Perfect for staging/testing

**Configuration**:
```
Dashboard → Workers & Pages → [Project] → Settings → Builds & deployments

Production branch: main
Preview branches: All branches (or specific branches)
```

### Automatic Deployments

**Triggers**:
- Push to production branch → Production deployment
- Push to other branches → Preview deployment
- Pull request opened → Preview deployment

**Deployment Status**:
- Shows in Git provider (GitHub/GitLab)
- Commit status checks
- Direct link to preview URL

**Disable Auto Deploy**:
```
Dashboard → Settings → Builds & deployments → Build settings
Toggle: "Pause automatic builds"
```

### Preview Deployments

**Purpose**: Test changes before merging to production

**Features**:
- Unique URL per branch/PR
- Full production parity
- Independent environments
- Easy sharing with team

**URL Pattern**:
```
Production:    project-name.pages.dev
Branch:        branch-name.project-name.pages.dev
PR #123:       123.project-name.pages.dev
```

**Access Preview**:
- Click deployment link in Git PR/commit
- Dashboard → Workers & Pages → [Project] → Deployments

## Framework Support

### React

**Create React App**:
```bash
# Build command
npm run build

# Build output directory
build
```

**Vite**:
```bash
# Build command
npm run build

# Build output directory
dist
```

### Vue.js

**Vue CLI**:
```bash
# Build command
npm run build

# Build output directory
dist
```

**Vite + Vue**:
```bash
# Build command
npm run build

# Build output directory
dist
```

### Next.js

**Static Export**:
```bash
# Build command
npm run build && npx next export

# Build output directory
out
```

**With @cloudflare/next-on-pages** (SSR):
```bash
# Build command
npx @cloudflare/next-on-pages

# Build output directory
.vercel/output/static
```

**Configuration**:
```javascript
// next.config.js
module.exports = {
  output: 'export', // For static export
  images: {
    unoptimized: true // Required for static export
  }
}
```

### SvelteKit

**With @sveltejs/adapter-cloudflare**:

```bash
# Install adapter
npm install -D @sveltejs/adapter-cloudflare

# Build command
npm run build

# Build output directory
.svelte-kit/cloudflare
```

**Configuration**:
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';

export default {
  kit: {
    adapter: adapter()
  }
};
```

### Astro

```bash
# Install adapter
npm install @astrojs/cloudflare

# Build command
npm run build

# Build output directory
dist
```

**Configuration**:
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});
```

### Remix

```bash
# Build command
npm run build

# Build output directory
public
```

**Configuration**:
```javascript
// remix.config.js
module.exports = {
  serverBuildTarget: 'cloudflare-pages',
  server: './server.js',
  devServerBroadcastDelay: 1000,
  ignoredRouteFiles: ['.*']
};
```

### Hugo (Static Site Generator)

```bash
# Build command
hugo --minify

# Build output directory
public
```

### Gatsby

```bash
# Build command
npm run build

# Build output directory
public
```

## Pages Functions

### Overview

**Purpose**: Add serverless API routes to static sites

**Features**:
- Full Workers API access
- D1, KV, R2 bindings
- File-based routing
- Middleware support

**Location**: `functions/` directory in project root

### Directory Structure

```
project/
├── functions/              # Serverless functions
│   ├── api/
│   │   ├── users/
│   │   │   └── [id].ts    # /api/users/:id
│   │   └── posts.ts       # /api/posts
│   ├── _middleware.ts     # Global middleware
│   └── [[path]].ts        # Catch-all route
├── public/                # Static assets
└── package.json
```

### Function Examples

**Basic Function**:
```typescript
// functions/api/hello.ts
export async function onRequest(context) {
  return new Response('Hello from Pages Functions!');
}
```

**HTTP Method Handlers**:
```typescript
// functions/api/users.ts
export async function onRequestGet(context) {
  return new Response('GET /api/users');
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Dynamic Routes**:
```typescript
// functions/api/users/[id].ts
export async function onRequestGet(context) {
  const { id } = context.params;

  return new Response(JSON.stringify({ id, name: 'Alice' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Database Access (D1)**:
```typescript
// functions/api/posts.ts
export async function onRequestGet(context) {
  const { DB } = context.env;

  const { results } = await DB.prepare(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT 10"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**KV Storage**:
```typescript
// functions/api/config.ts
export async function onRequestGet(context) {
  const { KV } = context.env;

  const config = await KV.get('site-config', 'json');

  return new Response(JSON.stringify(config), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Middleware

**Global Middleware**:
```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  // Log all requests
  console.log(`${context.request.method} ${context.request.url}`);

  // Continue to next handler
  const response = await context.next();

  // Add custom header
  response.headers.set('X-Custom-Header', 'Pages Functions');

  return response;
}
```

**Authentication Middleware**:
```typescript
// functions/api/_middleware.ts
export async function onRequest(context) {
  const token = context.request.headers.get('Authorization');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify token...

  return context.next();
}
```

**CORS Middleware**:
```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  const response = await context.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');

  return response;
}
```

## Build Configuration

### Build Settings

**Location**: Dashboard → Workers & Pages → [Project] → Settings → Builds & deployments

**Key Settings**:
- **Build command**: Command to build your site
- **Build output directory**: Where build artifacts are
- **Root directory**: Monorepo subdirectory (optional)
- **Environment variables**: Build-time variables

### Common Build Configurations

**React (Vite)**:
```
Build command: npm run build
Build output directory: dist
Root directory: (leave empty)
```

**Next.js (Static)**:
```
Build command: npm run build && npx next export
Build output directory: out
```

**Next.js (SSR with adapter)**:
```
Build command: npx @cloudflare/next-on-pages
Build output directory: .vercel/output/static
```

**SvelteKit**:
```
Build command: npm run build
Build output directory: .svelte-kit/cloudflare
```

**Astro**:
```
Build command: npm run build
Build output directory: dist
```

**Hugo**:
```
Build command: hugo --minify
Build output directory: public
```

### Build Environment

**Node.js Version**:
- Default: Node 16
- Can specify in environment variable: `NODE_VERSION=18`

**Environment Variables**:
- Set in dashboard or wrangler.toml
- Available during build and runtime
- Production vs Preview environments

### Build Caching

**Automatic Caching**:
- `node_modules` cached between builds
- Speeds up dependency installation
- Cleared on configuration changes

**Clear Cache**:
1. Dashboard → Workers & Pages → [Project] → Settings
2. Scroll to "Build cache"
3. Click "Clear build cache"
4. Rebuild

## Environment Variables

### Types of Variables

**Build Variables**:
- Available during build process
- Used by build tools (Vite, Webpack, etc.)
- Example: `VITE_API_URL`, `NEXT_PUBLIC_API_KEY`

**Runtime Variables**:
- Available to Pages Functions
- Server-side only (not exposed to browser)
- Example: Database credentials, API keys

### Set Environment Variables

**Via Dashboard**:
1. Dashboard → Workers & Pages → [Project] → Settings
2. Scroll to "Environment variables"
3. Click "Add variable"
4. Enter name and value
5. Select environment (Production/Preview/Both)

**Via Wrangler**:
```bash
# Set variable
wrangler pages secret put SECRET_NAME

# List variables
wrangler pages secret list --project-name=my-project
```

### Environment-Specific Variables

**Production Environment**:
```
NODE_ENV=production
API_URL=https://api.example.com
DATABASE_URL=production-db-url
```

**Preview Environment**:
```
NODE_ENV=development
API_URL=https://api-staging.example.com
DATABASE_URL=staging-db-url
```

### Access Variables

**In Build (Vite)**:
```javascript
// Only variables with VITE_ prefix are exposed
const apiUrl = import.meta.env.VITE_API_URL;
```

**In Build (Next.js)**:
```javascript
// Only variables with NEXT_PUBLIC_ prefix are exposed
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

**In Pages Functions**:
```typescript
export async function onRequest(context) {
  const apiKey = context.env.API_KEY; // Server-side only

  return new Response('OK');
}
```

## Custom Domains

### Add Custom Domain

**Steps**:
1. Dashboard → Workers & Pages → [Project] → Custom domains
2. Click "Set up a custom domain"
3. Enter domain name (e.g., `example.com` or `www.example.com`)
4. Click "Continue"
5. Cloudflare configures DNS automatically (if domain is on Cloudflare)

**DNS Configuration**:
- Cloudflare automatically creates CNAME record
- Points to `project-name.pages.dev`
- SSL certificate issued automatically

**External DNS** (domain not on Cloudflare):
```
CNAME  www  project-name.pages.dev
```

### Multiple Domains

**Example Setup**:
- `example.com` → Production
- `www.example.com` → Production (alias)
- `staging.example.com` → Preview branch

**Add Multiple**:
1. Add first domain
2. Click "Add a domain"
3. Repeat for each domain/subdomain

### Apex Domain (Root Domain)

**Using Cloudflare DNS**:
- Automatically handled via CNAME flattening
- Just add `example.com` as custom domain

**External DNS**:
- Use CNAME if provider supports CNAME flattening
- Or use A/AAAA records (not recommended, IPs may change)

### SSL Certificates

**Automatic SSL**:
- Free SSL certificate issued automatically
- Usually within 15 minutes
- Covers all custom domains

**Verify SSL**:
```bash
# Check certificate
curl -I https://example.com

# Should show cf-ray header (Cloudflare serving)
```

## Troubleshooting

### Build Failures

**Problem**: Build fails in Cloudflare but works locally

**Common Causes**:

1. **Missing Environment Variables**:
   - Check dashboard → Settings → Environment variables
   - Add required build variables

2. **Wrong Node Version**:
   - Set `NODE_VERSION` environment variable
   - Example: `NODE_VERSION=18`

3. **Wrong Build Command**:
   - Verify build command in settings
   - Test locally: run exact same command

4. **Wrong Output Directory**:
   - Check build output location
   - Update "Build output directory" setting

5. **Dependency Installation Fails**:
   - Check `package.json` and lock file committed
   - Clear build cache and retry

**Debug**:
1. Check build logs in dashboard
2. Run build locally with same command
3. Verify `package.json` has all dependencies
4. Test with fresh `node_modules`:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### 404 Errors

**Problem**: Routes return 404 after deployment

**Solutions**:

1. **SPA Routing** (React Router, Vue Router):
   - Add `_redirects` file to public directory:
   ```
   /*    /index.html   200
   ```

   - Or create `functions/[[path]].ts`:
   ```typescript
   export async function onRequest(context) {
     return context.env.ASSETS.fetch(context.request);
   }
   ```

2. **Missing Files**:
   - Verify files in build output directory
   - Check build command produces expected output

3. **Wrong Base Path**:
   - Check framework base URL configuration
   - Ensure matches deployment path

### Pages Functions Not Working

**Problem**: Functions returning errors or not found

**Checks**:

1. **File Location**:
   - Must be in `functions/` directory in project root
   - Check path matches URL (e.g., `functions/api/hello.ts` → `/api/hello`)

2. **Export Format**:
   ```typescript
   // Correct
   export async function onRequest(context) { }
   export async function onRequestGet(context) { }

   // Incorrect
   export default async function(context) { }
   ```

3. **TypeScript Errors**:
   - Add `@cloudflare/workers-types` to dependencies
   - Configure `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "types": ["@cloudflare/workers-types"]
     }
   }
   ```

4. **Bindings Not Available**:
   - Configure in wrangler.toml
   - Redeploy after configuration change

### Custom Domain Not Working

**Problem**: Custom domain shows error or doesn't resolve

**Checks**:

1. **DNS Propagation**:
   ```bash
   dig CNAME www.example.com
   # Should point to project-name.pages.dev
   ```

2. **SSL Certificate Pending**:
   - Wait up to 24 hours for certificate issuance
   - Check dashboard for status

3. **Domain Not on Cloudflare**:
   - Manually add CNAME record at DNS provider
   - Point to `project-name.pages.dev`

4. **Conflicting Records**:
   - Remove existing A/AAAA records for subdomain
   - CNAME cannot coexist with other records

### Preview Deployments Not Creating

**Problem**: No preview deployment for PR/branch

**Checks**:

1. **Preview Deployments Disabled**:
   - Dashboard → Settings → Builds & deployments
   - Enable "Preview deployments"

2. **Branch Not Included**:
   - Check branch filter settings
   - Ensure branch matches pattern

3. **Build Fails**:
   - Check build logs
   - Fix build errors

## Pages Deployment Checklist

### Initial Setup
- [ ] Choose deployment method (Git/CLI)
- [ ] Connect repository or prepare build
- [ ] Configure framework build settings
- [ ] Set build command and output directory
- [ ] Add required environment variables

### Framework Configuration
- [ ] Install necessary adapters (@cloudflare/next-on-pages, etc.)
- [ ] Configure framework for Pages deployment
- [ ] Test build locally
- [ ] Verify build output directory

### Functions (if needed)
- [ ] Create `functions/` directory
- [ ] Add API routes
- [ ] Test Functions locally with Wrangler
- [ ] Configure bindings (D1, KV, R2)

### Custom Domain
- [ ] Add custom domain in dashboard
- [ ] Verify DNS configuration
- [ ] Wait for SSL certificate issuance
- [ ] Test HTTPS connection

### Production Deployment
- [ ] Test preview deployment first
- [ ] Merge to production branch
- [ ] Verify production deployment
- [ ] Test all functionality
- [ ] Monitor build logs and analytics

### Post-Deployment
- [ ] Set up monitoring/alerts
- [ ] Configure branch environments
- [ ] Enable preview deployments for PRs
- [ ] Document deployment process
- [ ] Plan rollback strategy
