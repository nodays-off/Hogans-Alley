# Runtime APIs Reference

Complete reference for Cloudflare Workers runtime APIs and Web Platform APIs.

## Table of Contents

- [Fetch API](#fetch-api)
- [Headers API](#headers-api)
- [Cache API](#cache-api)
- [HTMLRewriter](#htmlrewriter)
- [WebSockets](#websockets)
- [Streams API](#streams-api)
- [Context API](#context-api)
- [Web Crypto API](#web-crypto-api)
- [URL API](#url-api)
- [Encoding API](#encoding-api)

## Fetch API

### Basic Request Handling

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Parse URL
    const url = new URL(request.url);

    // Request properties
    const method = request.method;
    const headers = request.headers;

    // Read body (choose one based on content type)
    const text = await request.text();
    const json = await request.json();
    const formData = await request.formData();
    const arrayBuffer = await request.arrayBuffer();
    const blob = await request.blob();

    return new Response('Hello World!');
  }
};
```

### Making Subrequests

```typescript
// Simple GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// POST with JSON body
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({ key: 'value' })
});

// With Cloudflare-specific options
const response = await fetch('https://example.com', {
  cf: {
    cacheTtl: 3600,
    cacheEverything: true,
    cacheKey: 'custom-key',
    polish: 'lossy',
    minify: {
      javascript: true,
      css: true,
      html: true
    }
  }
});
```

### Request Object

```typescript
// Request properties
request.method          // 'GET', 'POST', etc.
request.url            // Full URL string
request.headers        // Headers object
request.cf             // Cloudflare-specific properties
request.body           // ReadableStream
request.bodyUsed       // boolean

// Clone request (needed if reading body multiple times)
const clonedRequest = request.clone();

// Create new request
const newRequest = new Request('https://example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'value' })
});

// Modify request
const modifiedRequest = new Request(request, {
  headers: new Headers(request.headers)
});
```

### Response Object

```typescript
// Create response
return new Response('Hello World!', {
  status: 200,
  statusText: 'OK',
  headers: {
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=3600',
    'X-Custom-Header': 'value'
  }
});

// JSON response
return new Response(JSON.stringify({ data: 'value' }), {
  headers: { 'Content-Type': 'application/json' }
});

// Redirect
return Response.redirect('https://example.com', 301);

// Clone response
const clonedResponse = response.clone();

// Response properties
response.status        // 200
response.statusText    // 'OK'
response.ok           // true if 200-299
response.headers      // Headers object
response.body         // ReadableStream
response.bodyUsed     // boolean
```

## Headers API

### Reading Headers

```typescript
// Get single header
const userAgent = request.headers.get('User-Agent');
const contentType = request.headers.get('Content-Type');

// Check if header exists
if (request.headers.has('Authorization')) {
  // Handle auth
}

// Iterate all headers
for (const [key, value] of request.headers) {
  console.log(`${key}: ${value}`);
}

// Convert to object
const headersObj = Object.fromEntries(request.headers);

// Cloudflare-specific headers
const clientIP = request.headers.get('CF-Connecting-IP');
const country = request.headers.get('CF-IPCountry');
const ray = request.headers.get('CF-Ray');
```

### Setting Headers

```typescript
// Create headers
const headers = new Headers();
headers.set('Content-Type', 'application/json');
headers.append('Set-Cookie', 'session=abc');
headers.append('Set-Cookie', 'user=123');
headers.delete('X-Unwanted-Header');

// From object
const headers = new Headers({
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600'
});

// Copy and modify
const newHeaders = new Headers(response.headers);
newHeaders.set('X-Custom', 'value');

return new Response(body, { headers });
```

### Cloudflare Request Object (request.cf)

```typescript
// Geographic data
request.cf.country          // 'US'
request.cf.city            // 'Austin'
request.cf.continent       // 'NA'
request.cf.latitude        // '30.27130'
request.cf.longitude       // '-97.74260'
request.cf.postalCode      // '78701'
request.cf.region          // 'Texas'
request.cf.regionCode      // 'TX'
request.cf.timezone        // 'America/Chicago'

// Connection data
request.cf.asn             // 13335
request.cf.colo            // 'DFW'
request.cf.httpProtocol    // 'HTTP/2'
request.cf.tlsVersion      // 'TLSv1.3'
request.cf.tlsCipher       // 'AEAD-AES128-GCM-SHA256'

// Request metadata
request.cf.requestPriority // 'weight=192;exclusive=0'
request.cf.isEUCountry     // '0' or '1'
request.cf.botManagement   // { score: 99, verifiedBot: false }
```

## Cache API

### Basic Caching

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cache = caches.default;

    // Try to get from cache
    let response = await cache.match(request);

    if (!response) {
      // Cache miss - fetch from origin
      response = await fetch(request);

      // Clone and cache the response
      ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  }
};
```

### Custom Cache Keys

```typescript
// Create cache key from URL parts
const url = new URL(request.url);
const cacheKey = new Request(
  `${url.protocol}//${url.host}${url.pathname}`,
  request
);

const response = await cache.match(cacheKey);

if (!response) {
  response = await fetch(request);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
}
```

### Cache with TTL

```typescript
// Using fetch options
const response = await fetch('https://api.example.com/data', {
  cf: {
    cacheTtl: 3600,           // Cache for 1 hour
    cacheEverything: true,    // Cache regardless of headers
    cacheKey: 'custom-key'    // Custom cache key
  }
});

// Cache control headers
return new Response(data, {
  headers: {
    'Cache-Control': 'public, max-age=3600',
    'CDN-Cache-Control': 'public, max-age=86400'
  }
});
```

### Advanced Cache Operations

```typescript
// Delete from cache
await cache.delete(request);

// Match with options
const response = await cache.match(request, {
  ignoreMethod: true  // Match non-GET requests
});

// Multiple cache instances
const cache1 = await caches.open('v1');
const cache2 = await caches.open('v2');

await cache1.put(request, response.clone());
await cache2.delete(request);
```

## HTMLRewriter

### Element Manipulation

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);

    return new HTMLRewriter()
      // Modify text content
      .on('title', {
        element(element) {
          element.setInnerContent('New Title');
        }
      })

      // Modify attributes
      .on('a[href]', {
        element(element) {
          const href = element.getAttribute('href');
          element.setAttribute('href', href.replace('http://', 'https://'));
        }
      })

      // Remove elements
      .on('script[src*="analytics"]', {
        element(element) {
          element.remove();
        }
      })

      // Add elements
      .on('head', {
        element(element) {
          element.append('<meta name="robots" content="noindex">', { html: true });
        }
      })

      .transform(response);
  }
};
```

### Text Handlers

```typescript
new HTMLRewriter()
  .on('p', {
    text(text) {
      // Replace text
      if (text.text.includes('replace-me')) {
        text.replace('new-text');
      }

      // Access text properties
      console.log(text.text);           // Text content
      console.log(text.lastInTextNode); // Is this the last chunk?
      console.log(text.removed);        // Was this text removed?
    }
  })
  .transform(response);
```

### Element Handlers

```typescript
new HTMLRewriter()
  .on('div.content', {
    element(element) {
      // Read attributes
      const id = element.getAttribute('id');
      const classes = element.getAttribute('class');

      // Modify attributes
      element.setAttribute('data-processed', 'true');
      element.removeAttribute('onclick');

      // Modify content
      element.setInnerContent('<p>New content</p>', { html: true });
      element.prepend('<div>Before</div>', { html: true });
      element.append('<div>After</div>', { html: true });

      // Replace element
      element.replace('<section>Replacement</section>', { html: true });

      // Remove element
      element.remove();

      // Remove and keep content
      element.removeAndKeepContent();
    },

    comments(comment) {
      // Handle HTML comments
      console.log(comment.text);
    }
  })
  .transform(response);
```

## WebSockets

### Basic WebSocket Server

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Handle messages
    server.addEventListener('message', (event) => {
      console.log('Received:', event.data);
      server.send(`Echo: ${event.data}`);
    });

    // Handle close
    server.addEventListener('close', (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    });

    // Handle errors
    server.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};
```

### WebSocket with Durable Objects

```typescript
export class ChatRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.sessions.add(server);

    server.addEventListener('message', (event) => {
      // Broadcast to all connected clients
      for (const session of this.sessions) {
        session.send(event.data);
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}
```

## Streams API

### ReadableStream

```typescript
// Create readable stream
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('chunk 1');
    controller.enqueue('chunk 2');
    controller.close();
  }
});

return new Response(stream);
```

### TransformStream

```typescript
// Transform response stream
const response = await fetch('https://example.com/data');

const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    // Modify each chunk
    const modified = chunk.toString().toUpperCase();
    controller.enqueue(new TextEncoder().encode(modified));
  }
});

response.body.pipeTo(writable);

return new Response(readable);
```

### Streaming JSON

```typescript
// Stream JSON array
const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue('[');

    for (let i = 0; i < 1000; i++) {
      const item = JSON.stringify({ id: i, value: `item-${i}` });
      controller.enqueue(item);

      if (i < 999) {
        controller.enqueue(',');
      }
    }

    controller.enqueue(']');
    controller.close();
  }
});

return new Response(stream, {
  headers: { 'Content-Type': 'application/json' }
});
```

## Context API

### waitUntil

Run tasks after the response is sent without blocking:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Log analytics without blocking response
    ctx.waitUntil(
      fetch('https://analytics.example.com/log', {
        method: 'POST',
        body: JSON.stringify({
          url: request.url,
          timestamp: Date.now()
        })
      })
    );

    // Multiple background tasks
    ctx.waitUntil(Promise.all([
      env.KV.put('last-request', request.url),
      fetch('https://webhook.example.com', { method: 'POST' })
    ]));

    return new Response('OK');
  }
};
```

### passThroughOnException

Allow request to pass through to origin on error:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // If an error occurs, pass request to origin
    ctx.passThroughOnException();

    // Risky operation
    const data = await processRequest(request);

    return new Response(data);
  }
};
```

## Web Crypto API

### Hashing

```typescript
// SHA-256 hash
const data = new TextEncoder().encode('message');
const hashBuffer = await crypto.subtle.digest('SHA-256', data);

// Convert to hex string
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

// Available algorithms: SHA-1, SHA-256, SHA-384, SHA-512
```

### HMAC Signatures

```typescript
// Create HMAC key
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode('secret-key'),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

// Sign data
const data = new TextEncoder().encode('message');
const signature = await crypto.subtle.sign('HMAC', key, data);

// Verify signature
const valid = await crypto.subtle.verify('HMAC', key, signature, data);
```

### Random Values

```typescript
// Random bytes
const randomBytes = crypto.getRandomValues(new Uint8Array(32));

// Random UUID
const uuid = crypto.randomUUID(); // e.g., '550e8400-e29b-41d4-a716-446655440000'

// Random number
const randomNumber = crypto.getRandomValues(new Uint32Array(1))[0];
```

### Timing-Safe Comparison

```typescript
// Compare secrets safely (constant-time comparison)
const buffer1 = new TextEncoder().encode('secret1');
const buffer2 = new TextEncoder().encode('secret2');

const isEqual = crypto.timingSafeEqual(buffer1, buffer2);
```

### Encryption/Decryption (AES-GCM)

```typescript
// Generate encryption key
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Encrypt
const iv = crypto.getRandomValues(new Uint8Array(12));
const data = new TextEncoder().encode('secret message');

const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

// Decrypt
const decrypted = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  key,
  encrypted
);

const message = new TextDecoder().decode(decrypted);
```

## URL API

```typescript
// Parse URL
const url = new URL('https://example.com/path?query=value#hash');

url.protocol   // 'https:'
url.host       // 'example.com'
url.hostname   // 'example.com'
url.port       // ''
url.pathname   // '/path'
url.search     // '?query=value'
url.hash       // '#hash'
url.origin     // 'https://example.com'
url.href       // full URL

// Query parameters
url.searchParams.get('query')           // 'value'
url.searchParams.set('key', 'value')
url.searchParams.append('key', 'value2')
url.searchParams.delete('key')
url.searchParams.has('key')

// Iterate parameters
for (const [key, value] of url.searchParams) {
  console.log(`${key}: ${value}`);
}

// Modify URL
url.pathname = '/new-path';
url.searchParams.set('page', '2');
const newUrl = url.toString();
```

## Encoding API

```typescript
// Text encoding/decoding
const encoder = new TextEncoder();
const bytes = encoder.encode('Hello World!');

const decoder = new TextDecoder();
const text = decoder.decode(bytes);

// Different encodings
const decoder = new TextDecoder('utf-8');
const decoder = new TextDecoder('iso-8859-1');

// Base64 encoding/decoding (using btoa/atob)
const base64 = btoa('Hello World!');
const original = atob(base64);
```
