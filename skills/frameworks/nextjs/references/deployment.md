# Next.js Deployment Guide

Complete guide to deploying Next.js applications to production.

## Table of Contents

- [Vercel Deployment](#vercel-deployment)
- [Self-Hosting](#self-hosting)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Production Checklist](#production-checklist)

## Vercel Deployment

Vercel is the recommended platform for deploying Next.js applications (built by the Next.js team).

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Git Integration

1. Push your code to GitHub, GitLab, or Bitbucket
2. Import your repository at [vercel.com/new](https://vercel.com/new)
3. Configure your project (Next.js auto-detected)
4. Deploy

**Automatic deployments:**
- Production: `main` or `master` branch
- Preview: All other branches and PRs

### Environment Variables

Add in Vercel dashboard or via CLI:

```bash
# Via CLI
vercel env add VARIABLE_NAME

# Via dashboard
# Project Settings → Environment Variables
```

**Environment types:**
- Production
- Preview
- Development

### Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

Vercel automatically detects and runs these scripts.

### Custom Domains

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS:
   - A record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sfo1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Self-Hosting

Deploy Next.js on your own infrastructure.

### Node.js Server

**Requirements:**
- Node.js 18.17 or later
- Build output from `next build`

**Steps:**

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The server runs on port 3000 by default. Set `PORT` environment variable to change:

```bash
PORT=8080 npm start
```

### Standalone Output

Reduce deployment size by using standalone output:

```js
// next.config.js
module.exports = {
  output: 'standalone',
}
```

After build, copy these files:

```bash
.next/standalone/
.next/static/
public/
```

Start the server:

```bash
node .next/standalone/server.js
```

### Static Export

For static-only sites (no Server Components, API routes):

```js
// next.config.js
module.exports = {
  output: 'export',
}
```

```bash
npm run build
# Output in 'out' directory
```

Serve with any static host (Nginx, Apache, Cloudflare Pages, etc.)

**Limitations:**
- No Server Components
- No API Routes
- No dynamic rendering
- No ISR
- No Image Optimization (unless using custom loader)

### PM2 Process Manager

Keep your app running with PM2:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "nextjs-app" -- start

# Auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs nextjs-app

# Restart
pm2 restart nextjs-app
```

**PM2 Ecosystem File:**

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nextjs-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}

// Start with ecosystem file
pm2 start ecosystem.config.js
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/nextjs-app
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/nextjs-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Reverse Proxy

```apache
# /etc/apache2/sites-available/nextjs-app.conf
<VirtualHost *:80>
    ServerName example.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
</VirtualHost>

# Enable modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite

# Enable site
sudo a2ensite nextjs-app
sudo systemctl reload apache2
```

## Docker Deployment

Containerize your Next.js application.

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - nextjs
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t nextjs-app .

# Run container
docker run -p 3000:3000 nextjs-app

# With environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXT_PUBLIC_API_URL="https://api.example.com" \
  nextjs-app

# With Docker Compose
docker-compose up -d
```

### Multi-stage Build with Standalone

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Enable standalone output
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## Environment Variables

### Development

```env
# .env.local
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=dev_api_key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Production

**Server-side only:**
```env
DATABASE_URL=postgresql://prod-db:5432/mydb
API_KEY=prod_api_key
SECRET_TOKEN=secret_value
```

**Client and server (NEXT_PUBLIC_ prefix):**
```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://example.com
```

### Environment Files

Next.js loads environment variables from:

1. `.env.local` (ignored by git, local overrides)
2. `.env.production` (production environment)
3. `.env.development` (development environment)
4. `.env` (all environments)

**Priority (highest to lowest):**
1. `process.env`
2. `.env.$(NODE_ENV).local`
3. `.env.local` (Not loaded when NODE_ENV is test)
4. `.env.$(NODE_ENV)`
5. `.env`

### Runtime Configuration

Access in Server Components:

```tsx
export default async function Page() {
  const apiKey = process.env.API_KEY // Server-only
  const publicUrl = process.env.NEXT_PUBLIC_API_URL // Client and server

  return <div>API URL: {publicUrl}</div>
}
```

### Build-time vs Runtime

**Build-time (inlined during build):**
```tsx
// These are replaced at build time
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

**Runtime (loaded when server starts):**
```tsx
// Server-side only vars are loaded at runtime
const dbUrl = process.env.DATABASE_URL
```

## Production Checklist

### Pre-deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure all environment variables
- [ ] Enable TypeScript strict mode
- [ ] Run `npm run build` successfully
- [ ] Test production build locally (`npm run build && npm start`)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics
- [ ] Set up monitoring
- [ ] Review bundle size
- [ ] Optimize images
- [ ] Configure caching strategies
- [ ] Set up database migrations
- [ ] Configure CDN for static assets
- [ ] Set up SSL/TLS certificates
- [ ] Configure security headers
- [ ] Test on target devices/browsers

### Security

```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

### Performance

```js
// next.config.js
module.exports = {
  // Compress responses
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Remove console logs
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable SWC minification
  swcMinify: true,
}
```

### Monitoring

**Web Vitals tracking:**

```tsx
// app/layout.tsx
export function reportWebVitals(metric) {
  // Send to analytics
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(metric),
    })
  }
}
```

**Error tracking:**

```tsx
// app/error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Database

- [ ] Set up connection pooling
- [ ] Configure database backups
- [ ] Set up read replicas if needed
- [ ] Use database indexes
- [ ] Implement rate limiting
- [ ] Monitor query performance

### CI/CD Pipeline

**GitHub Actions example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Platform-Specific Guides

### AWS (EC2, ECS, Elastic Beanstalk)

1. Build standalone output
2. Create Docker image
3. Deploy to ECS/EC2
4. Configure ALB for load balancing
5. Set up CloudFront for CDN

### Google Cloud Platform (Cloud Run, App Engine)

```yaml
# app.yaml (App Engine)
runtime: nodejs18
env: standard

env_variables:
  NODE_ENV: 'production'

handlers:
  - url: /.*
    script: auto
```

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Best Practices

1. **Use CDN**: Serve static assets from CDN
2. **Enable Compression**: Use gzip or brotli compression
3. **Monitor Performance**: Track Core Web Vitals
4. **Set up Logging**: Centralized logging for debugging
5. **Database Connection Pooling**: Prevent connection exhaustion
6. **Graceful Shutdown**: Handle SIGTERM signals properly
7. **Health Checks**: Implement /health endpoint
8. **Rate Limiting**: Protect API routes
9. **Backups**: Regular automated backups
10. **Security Headers**: Configure all security headers
