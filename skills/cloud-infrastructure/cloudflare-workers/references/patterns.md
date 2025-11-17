# Common Patterns

Production-ready patterns for authentication, security, performance, and common use cases.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Rate Limiting](#rate-limiting)
- [CORS](#cors)
- [Caching Strategies](#caching-strategies)
- [Error Handling](#error-handling)
- [Routing](#routing)
- [Middleware](#middleware)
- [API Gateway](#api-gateway)
- [Image Processing](#image-processing)
- [Webhook Handlers](#webhook-handlers)
- [Form Handling](#form-handling)

## Authentication & Authorization

### JWT Authentication

```typescript
import { sign, verify } from 'hono/jwt';

// Login endpoint
async function login(username: string, password: string, env: Env): Promise<Response> {
  // Verify credentials (check against D1, KV, etc.)
  const user = await verifyCredentials(username, password);

  if (!user) {
    return new Response('Invalid credentials', { status: 401 });
  }

  // Create JWT
  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    },
    env.JWT_SECRET
  );

  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Verify JWT middleware
async function authenticate(request: Request, env: Env): Promise<any> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing token');
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, env.JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Protected endpoint
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const user = await authenticate(request, env);
      return new Response(`Hello ${user.email}`);
    } catch (error) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
};
```

### API Key Authentication

```typescript
async function authenticateAPIKey(request: Request, env: Env): Promise<boolean> {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return false;
  }

  // Verify against KV
  const validKey = await env.API_KEYS.get(apiKey);

  return validKey !== null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!await authenticateAPIKey(request, env)) {
      return new Response('Invalid API key', { status: 401 });
    }

    return new Response('Authorized');
  }
};
```

### Session Management

```typescript
// Create session
async function createSession(userId: string, env: Env): Promise<string> {
  const sessionId = crypto.randomUUID();

  await env.SESSIONS.put(sessionId, JSON.stringify({ userId }), {
    expirationTtl: 60 * 60 * 24 * 7 // 7 days
  });

  return sessionId;
}

// Verify session
async function getSession(sessionId: string, env: Env): Promise<any> {
  const session = await env.SESSIONS.get(sessionId, 'json');
  return session;
}

// Logout
async function destroySession(sessionId: string, env: Env): Promise<void> {
  await env.SESSIONS.delete(sessionId);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const sessionId = request.headers.get('X-Session-ID');

    if (!sessionId) {
      return new Response('No session', { status: 401 });
    }

    const session = await getSession(sessionId, env);

    if (!session) {
      return new Response('Invalid session', { status: 401 });
    }

    return new Response(`User: ${session.userId}`);
  }
};
```

### OAuth 2.0 Flow

```typescript
// Redirect to OAuth provider
async function initiateOAuth(env: Env): Promise<Response> {
  const state = crypto.randomUUID();

  // Store state for verification
  await env.OAUTH_STATES.put(state, 'pending', { expirationTtl: 600 });

  const params = new URLSearchParams({
    client_id: env.OAUTH_CLIENT_ID,
    redirect_uri: env.OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile',
    state
  });

  const authUrl = `${env.OAUTH_PROVIDER}/authorize?${params}`;

  return Response.redirect(authUrl, 302);
}

// Handle OAuth callback
async function handleOAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Verify state
  const validState = await env.OAUTH_STATES.get(state);

  if (!validState) {
    return new Response('Invalid state', { status: 400 });
  }

  // Exchange code for token
  const tokenResponse = await fetch(`${env.OAUTH_PROVIDER}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.OAUTH_CLIENT_ID,
      client_secret: env.OAUTH_CLIENT_SECRET,
      redirect_uri: env.OAUTH_REDIRECT_URI
    })
  });

  const tokens = await tokenResponse.json();

  // Create session
  const sessionId = await createSession(tokens.access_token, env);

  return new Response('Login successful', {
    headers: { 'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict` }
  });
}
```

## Rate Limiting

### Per-IP Rate Limiting

```typescript
async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const limit = 100; // requests per window
  const window = 60; // seconds

  const current = await env.RATE_LIMITS.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= limit) {
    return false;
  }

  await env.RATE_LIMITS.put(key, (count + 1).toString(), {
    expirationTtl: window
  });

  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    if (!await checkRateLimit(ip, env)) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    return new Response('OK');
  }
};
```

### Sliding Window Rate Limiting

```typescript
async function slidingWindowRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  env: Env
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Get timestamps from KV
  const stored = await env.RATE_LIMITS.get(key, 'json') || [];
  const timestamps: number[] = stored;

  // Remove old timestamps
  const validTimestamps = timestamps.filter(ts => ts > now - windowMs);

  if (validTimestamps.length >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Add current timestamp
  validTimestamps.push(now);

  // Store updated timestamps
  await env.RATE_LIMITS.put(key, JSON.stringify(validTimestamps), {
    expirationTtl: windowSeconds
  });

  return { allowed: true, remaining: limit - validTimestamps.length };
}
```

### Per-User Rate Limiting

```typescript
async function userRateLimit(userId: string, env: Env): Promise<Response | null> {
  const key = `user:${userId}:requests`;
  const { allowed, remaining } = await slidingWindowRateLimit(key, 1000, 3600, env);

  if (!allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '3600'
      }
    });
  }

  return null; // Allowed
}
```

### Token Bucket Rate Limiting (Durable Objects)

```typescript
export class RateLimiter {
  state: DurableObjectState;

  async fetch(request: Request): Promise<Response> {
    const tokens = (await this.state.storage.get<number>('tokens')) || 100;
    const lastRefill = (await this.state.storage.get<number>('lastRefill')) || Date.now();

    const now = Date.now();
    const elapsed = now - lastRefill;
    const refillRate = 10; // tokens per second
    const maxTokens = 100;

    // Refill tokens
    const newTokens = Math.min(maxTokens, tokens + (elapsed / 1000) * refillRate);

    if (newTokens < 1) {
      return new Response(JSON.stringify({ allowed: false }), { status: 429 });
    }

    // Consume token
    await this.state.storage.put({
      tokens: newTokens - 1,
      lastRefill: now
    });

    return new Response(JSON.stringify({ allowed: true }));
  }
}
```

## CORS

### Basic CORS

```typescript
function corsHeaders(origin: string = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // Handle request
    const response = await handleRequest(request);

    // Add CORS headers to response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

### CORS with Origin Validation

```typescript
const ALLOWED_ORIGINS = [
  'https://example.com',
  'https://app.example.com'
];

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}
```

### CORS Middleware (Hono)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

export default app;
```

## Caching Strategies

### Multi-Layer Cache

```typescript
const CACHE_TTL = 3600;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cacheKey = url.pathname;

    // Layer 1: Edge Cache (fastest)
    const cache = caches.default;
    let response = await cache.match(request);
    if (response) {
      return response;
    }

    // Layer 2: KV Cache
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      response = new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'KV' }
      });
      ctx.waitUntil(cache.put(request, response.clone()));
      return response;
    }

    // Layer 3: Origin
    const data = await fetchFromOrigin(request);

    response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });

    // Store in both caches
    ctx.waitUntil(Promise.all([
      cache.put(request, response.clone()),
      env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL })
    ]));

    return response;
  }
};
```

### Cache with Stale-While-Revalidate

```typescript
async function staleWhileRevalidate(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(request);

  if (cached) {
    // Return stale cache immediately
    const age = Date.now() - new Date(cached.headers.get('Date')).getTime();

    if (age > 3600000) { // 1 hour
      // Revalidate in background
      ctx.waitUntil(
        fetch(request).then(response => cache.put(request, response))
      );
    }

    return cached;
  }

  // No cache, fetch fresh
  const response = await fetch(request);
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}
```

### Cache Busting

```typescript
// URL-based cache busting
const url = new URL(request.url);
url.searchParams.delete('v'); // Remove version param
url.searchParams.delete('_'); // Remove cache buster

const cacheKey = new Request(url.toString(), request);

// ETag-based cache validation
const etag = response.headers.get('ETag');
const ifNoneMatch = request.headers.get('If-None-Match');

if (etag && etag === ifNoneMatch) {
  return new Response(null, { status: 304 });
}
```

## Error Handling

### Structured Error Responses

```typescript
class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
  }
}

function errorResponse(error: APIError): Response {
  return new Response(JSON.stringify({
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  }), {
    status: error.statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Error:', error);

      // Log to external service
      ctx.waitUntil(logError(error, request, env));

      if (error instanceof APIError) {
        return errorResponse(error);
      }

      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
```

### Retry Logic

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Don't retry client errors
      if (response.status < 500) {
        return response;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
    }

    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
  }

  throw new Error('Max retries exceeded');
}
```

## Routing

### Path-Based Routing

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/':
        return new Response('Home');

      case '/about':
        return new Response('About');

      case '/api/users':
        return handleUsers(request, env);

      default:
        return new Response('Not Found', { status: 404 });
    }
  }
};
```

### Pattern Matching

```typescript
function matchRoute(pathname: string): { handler: string; params: Record<string, string> } | null {
  const routes = [
    { pattern: /^\/api\/users\/(\d+)$/, handler: 'getUser' },
    { pattern: /^\/api\/posts\/([a-z0-9-]+)$/, handler: 'getPost' }
  ];

  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (match) {
      return {
        handler: route.handler,
        params: { id: match[1] }
      };
    }
  }

  return null;
}
```

### Hono Framework (Recommended)

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Home'));

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(id, c.env);
  return c.json(user);
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  const user = await createUser(body, c.env);
  return c.json(user, 201);
});

export default app;
```

## Middleware

### Logging Middleware

```typescript
async function loggingMiddleware(
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();

  const response = await next();

  const duration = Date.now() - start;
  console.log(`${request.method} ${request.url} ${response.status} ${duration}ms`);

  return response;
}
```

### Authentication Middleware

```typescript
async function authMiddleware(
  request: Request,
  env: Env,
  next: () => Promise<Response>
): Promise<Response> {
  try {
    const user = await authenticate(request, env);
    request.user = user; // Attach user to request
    return next();
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

### Composing Middleware

```typescript
type Middleware = (request: Request, next: () => Promise<Response>) => Promise<Response>;

function compose(...middlewares: Middleware[]) {
  return async (request: Request, finalHandler: () => Promise<Response>) => {
    let index = 0;

    async function next(): Promise<Response> {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return middleware(request, next);
      }
      return finalHandler();
    }

    return next();
  };
}

const handler = compose(
  loggingMiddleware,
  authMiddleware,
  corsMiddleware
);
```

## API Gateway

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', logger());

// Public routes
app.get('/health', (c) => c.json({ status: 'ok' }));

// Protected routes
app.use('/api/*', jwt({ secret: c => c.env.JWT_SECRET }));

app.get('/api/users', async (c) => {
  const users = await c.env.DB.prepare('SELECT * FROM users').all();
  return c.json(users.results);
});

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(id).first();

  if (!user) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(user);
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).bind(body.name, body.email).run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

export default app;
```

## Image Processing

### Image Proxy with Caching

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Check cache
    const cache = caches.default;
    const cacheKey = new Request(imageUrl);
    let response = await cache.match(cacheKey);

    if (!response) {
      // Fetch image
      response = await fetch(imageUrl);

      // Cache for 1 day
      response = new Response(response.body, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
          'CDN-Cache-Control': 'public, max-age=31536000'
        }
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};
```

## Webhook Handlers

### GitHub Webhook

```typescript
async function verifyGitHubSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = new Uint8Array(
    signature.substring(7).match(/.{2}/g).map(byte => parseInt(byte, 16))
  );

  const bodyBuffer = new TextEncoder().encode(body);

  return crypto.subtle.verify('HMAC', key, signatureBuffer, bodyBuffer);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('X-Hub-Signature-256');
    const body = await request.text();

    const valid = await verifyGitHubSignature(body, signature, env.WEBHOOK_SECRET);

    if (!valid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);

    // Process webhook async
    ctx.waitUntil(processWebhook(payload, env));

    return new Response('OK');
  }
};
```

## Form Handling

### Multipart Form Data

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const formData = await request.formData();

    const name = formData.get('name');
    const email = formData.get('email');
    const file = formData.get('file') as File;

    if (file) {
      // Upload to R2
      await env.MY_BUCKET.put(file.name, file.stream(), {
        httpMetadata: {
          contentType: file.type
        }
      });
    }

    return new Response('Form submitted');
  }
};
```
