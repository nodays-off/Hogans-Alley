# Bindings Reference

Complete guide to all Cloudflare Workers bindings for storage, compute, and services.

## Table of Contents

- [Environment Variables](#environment-variables)
- [KV Namespace](#kv-namespace)
- [R2 Bucket](#r2-bucket)
- [D1 Database](#d1-database)
- [Durable Objects](#durable-objects)
- [Queues](#queues)
- [Workers AI](#workers-ai)
- [Vectorize](#vectorize)
- [Analytics Engine](#analytics-engine)
- [Service Bindings](#service-bindings)

## Environment Variables

Simple string configuration values.

### Configuration

```toml
# wrangler.toml
[vars]
API_URL = "https://api.example.com"
API_VERSION = "v1"
ENVIRONMENT = "production"
MAX_RETRIES = "3"
```

### Usage

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const apiUrl = env.API_URL;
    const version = env.API_VERSION;

    return new Response(`API: ${apiUrl}/${version}`);
  }
};
```

### Type Safety

```typescript
interface Env {
  API_URL: string;
  API_VERSION: string;
  ENVIRONMENT: 'production' | 'staging' | 'development';
  MAX_RETRIES: string;
}
```

## KV Namespace

Global, low-latency key-value data storage.

### When to Use KV

| Use Case | Good Fit? | Why |
|----------|-----------|-----|
| Cache API responses | Yes | Low latency, global replication |
| User sessions | Yes | Fast reads, TTL support |
| Configuration data | Yes | Read-heavy, infrequent writes |
| Frequently updated data | No | Eventual consistency (60s) |
| Complex queries | No | No filtering/sorting |
| Large values (>25 MB) | No | Use R2 instead |

### Configuration

```bash
# Create KV namespace
wrangler kv:namespace create MY_KV

# Preview namespace (for wrangler dev)
wrangler kv:namespace create MY_KV --preview
```

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "MY_KV"
id = "your-namespace-id"
preview_id = "your-preview-namespace-id"
```

### Basic Operations

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // PUT - Write key
    await env.MY_KV.put('key', 'value');

    // PUT with options
    await env.MY_KV.put('key', 'value', {
      expirationTtl: 3600,           // Expire in 1 hour
      expiration: 1234567890,        // Unix timestamp
      metadata: { userId: '123' }    // Custom metadata (1024 bytes max)
    });

    // GET - Read key
    const value = await env.MY_KV.get('key');

    // GET with type
    const json = await env.MY_KV.get('key', 'json');
    const buffer = await env.MY_KV.get('key', 'arrayBuffer');
    const stream = await env.MY_KV.get('key', 'stream');

    // GET with metadata
    const { value, metadata } = await env.MY_KV.getWithMetadata('key');

    // DELETE
    await env.MY_KV.delete('key');

    return new Response(value);
  }
};
```

### List Keys

```typescript
// List all keys
const list = await env.MY_KV.list();

// List with prefix
const list = await env.MY_KV.list({ prefix: 'user:' });

// Paginated list
const list = await env.MY_KV.list({
  limit: 100,
  cursor: 'cursor-from-previous-request'
});

// Response structure
interface KVNamespaceListResult {
  keys: Array<{
    name: string;
    expiration?: number;
    metadata?: any;
  }>;
  list_complete: boolean;
  cursor?: string;
}
```

### Common Patterns

#### Caching with TTL

```typescript
async function getCachedData(key: string, env: Env): Promise<any> {
  // Try cache first
  const cached = await env.MY_KV.get(key, 'json');
  if (cached) return cached;

  // Fetch fresh data
  const data = await fetchFromAPI();

  // Cache for 1 hour
  await env.MY_KV.put(key, JSON.stringify(data), {
    expirationTtl: 3600
  });

  return data;
}
```

#### Namespacing with Prefixes

```typescript
// User data
await env.MY_KV.put('user:123', JSON.stringify(userData));
await env.MY_KV.put('user:456', JSON.stringify(userData));

// Session data
await env.MY_KV.put('session:abc', sessionData);

// List all users
const users = await env.MY_KV.list({ prefix: 'user:' });
```

#### Metadata for Filtering

```typescript
await env.MY_KV.put('post:1', content, {
  metadata: {
    author: 'user123',
    tags: ['tech', 'cloudflare'],
    published: true
  }
});

const { metadata } = await env.MY_KV.getWithMetadata('post:1');
if (metadata.published) {
  // Show post
}
```

### Limits

- **Key size**: 512 bytes max
- **Value size**: 25 MB max
- **Metadata size**: 1024 bytes max
- **Keys per namespace**: Unlimited
- **Read latency**: <100ms globally
- **Write propagation**: ~60 seconds globally
- **Operations per second**: 1000+ reads/writes

## R2 Bucket

Object storage for large files (like AWS S3).

### When to Use R2

| Use Case | Good Fit? | Why |
|----------|-----------|-----|
| Store images/videos | Yes | No egress fees, large files |
| File uploads | Yes | Handles any size |
| Static assets | Yes | Integrated with Workers |
| Small cached values | No | Use KV instead |
| Database replacement | No | Use D1 instead |

### Configuration

```bash
# Create R2 bucket
wrangler r2 bucket create my-bucket
```

```toml
# wrangler.toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
preview_bucket_name = "my-bucket-preview"
```

### Basic Operations

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (request.method === 'PUT') {
      // Upload object
      await env.MY_BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType: 'image/jpeg',
          contentLanguage: 'en-US',
          contentDisposition: 'attachment; filename="file.jpg"',
          contentEncoding: 'gzip',
          cacheControl: 'public, max-age=3600',
          cacheExpiry: new Date('2025-01-01')
        },
        customMetadata: {
          uploadedBy: 'user123',
          version: '1.0'
        }
      });

      return new Response('Uploaded', { status: 201 });
    }

    if (request.method === 'GET') {
      // Get object
      const object = await env.MY_BUCKET.get(key);

      if (!object) {
        return new Response('Not Found', { status: 404 });
      }

      // Return with proper headers
      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'ETag': object.etag,
          'Cache-Control': object.httpMetadata?.cacheControl || ''
        }
      });
    }

    if (request.method === 'DELETE') {
      // Delete object
      await env.MY_BUCKET.delete(key);
      return new Response('Deleted', { status: 204 });
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
```

### Head (Metadata Only)

```typescript
// Get metadata without downloading body
const object = await env.MY_BUCKET.head('file.jpg');

if (object) {
  console.log(object.key);              // 'file.jpg'
  console.log(object.size);             // 1024000
  console.log(object.etag);             // '"abc123"'
  console.log(object.httpMetadata);     // Content-Type, etc.
  console.log(object.customMetadata);   // Custom metadata
  console.log(object.uploaded);         // Date uploaded
}
```

### List Objects

```typescript
// List all objects
const listed = await env.MY_BUCKET.list();

// List with prefix
const listed = await env.MY_BUCKET.list({ prefix: 'uploads/' });

// Paginated listing
const listed = await env.MY_BUCKET.list({
  limit: 100,
  cursor: 'cursor-from-previous',
  delimiter: '/',
  prefix: 'folder/'
});

// Response structure
interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}
```

### Multipart Upload

For files larger than 5GB or resumable uploads:

```typescript
// Create multipart upload
const multipart = await env.MY_BUCKET.createMultipartUpload('large-file.bin', {
  httpMetadata: { contentType: 'application/octet-stream' }
});

// Upload parts
const part1 = await multipart.uploadPart(1, chunk1);
const part2 = await multipart.uploadPart(2, chunk2);
const part3 = await multipart.uploadPart(3, chunk3);

// Complete upload
const object = await multipart.complete([part1, part2, part3]);

// Or abort
await multipart.abort();
```

### Conditional Operations

```typescript
// Only update if etag matches (optimistic locking)
await env.MY_BUCKET.put('key', data, {
  onlyIf: { etagMatches: '"current-etag"' }
});

// Only update if etag doesn't match
await env.MY_BUCKET.put('key', data, {
  onlyIf: { etagDoesNotMatch: '"old-etag"' }
});

// Only update if uploaded before date
await env.MY_BUCKET.put('key', data, {
  onlyIf: { uploadedBefore: new Date('2025-01-01') }
});
```

### Limits

- **Object size**: 5 TB max per object
- **Multipart uploads**: Required for >5 GB
- **Part size**: 5 MB - 5 GB per part
- **Parts per upload**: 10,000 max
- **Operations**: Unlimited reads/writes
- **No egress fees**: Free data transfer out

## D1 Database

Serverless SQL database built on SQLite.

### When to Use D1

| Use Case | Good Fit? | Why |
|----------|-----------|-----|
| Relational data | Yes | SQL queries, joins, transactions |
| User accounts | Yes | ACID transactions |
| Analytics queries | Yes | Aggregations, GROUP BY |
| Real-time updates | Partial | Read replicas have slight delay |
| Large datasets (>10 GB) | No | SQLite limitations |
| High write volume | No | Single-writer architecture |

### Configuration

```bash
# Create database
wrangler d1 create my-database

# Run migrations
wrangler d1 execute my-database --file=schema.sql
wrangler d1 execute my-database --command="SELECT * FROM users"
```

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
```

### Basic Queries

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // SELECT - First row
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    // SELECT - All rows
    const { results } = await env.DB.prepare(
      'SELECT * FROM users WHERE active = ?'
    ).bind(true).all();

    // SELECT - Raw results (array of arrays)
    const { results } = await env.DB.prepare(
      'SELECT name, email FROM users'
    ).raw();

    // INSERT
    const info = await env.DB.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?)'
    ).bind('Alice', 'alice@example.com').run();

    console.log(info.meta.last_row_id);   // Inserted ID
    console.log(info.meta.changes);       // Rows affected

    // UPDATE
    const info = await env.DB.prepare(
      'UPDATE users SET active = ? WHERE id = ?'
    ).bind(false, userId).run();

    // DELETE
    await env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(userId).run();

    return new Response(JSON.stringify(results));
  }
};
```

### Batch Operations (Transactions)

```typescript
// All queries in a batch are atomic
const results = await env.DB.batch([
  env.DB.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').bind(100, 1),
  env.DB.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').bind(100, 2),
  env.DB.prepare('INSERT INTO transactions (from_id, to_id, amount) VALUES (?, ?, ?)').bind(1, 2, 100)
]);

// If any query fails, entire batch is rolled back
```

### Parameter Binding

```typescript
// Positional parameters (?)
await env.DB.prepare(
  'SELECT * FROM users WHERE name = ? AND age > ?'
).bind('Alice', 18).all();

// Named parameters
await env.DB.prepare(
  'SELECT * FROM users WHERE name = ?1 AND email = ?2'
).bind('Alice', 'alice@example.com').all();

// Always use bind() to prevent SQL injection
// NEVER: `SELECT * FROM users WHERE id = ${userId}` ❌
// ALWAYS: prepare('SELECT * FROM users WHERE id = ?').bind(userId) ✅
```

### Schema Design

```sql
-- Create tables
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  active BOOLEAN DEFAULT 1
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);

-- Foreign keys
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Common Patterns

#### Pagination

```typescript
const limit = 20;
const offset = (page - 1) * limit;

const { results } = await env.DB.prepare(
  'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
).bind(limit, offset).all();
```

#### Search

```typescript
// Full-text search
await env.DB.prepare(
  'SELECT * FROM posts WHERE title LIKE ? OR content LIKE ?'
).bind(`%${query}%`, `%${query}%`).all();

// Case-insensitive search
await env.DB.prepare(
  'SELECT * FROM users WHERE LOWER(email) = LOWER(?)'
).bind(email).first();
```

#### Aggregations

```typescript
// Count
const { count } = await env.DB.prepare(
  'SELECT COUNT(*) as count FROM users WHERE active = ?'
).bind(true).first();

// Group by
const { results } = await env.DB.prepare(
  'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
).all();
```

### Limits

- **Database size**: 10 GB (beta)
- **Query timeout**: 30 seconds
- **Row size**: ~1 MB max
- **Batch size**: 1000 statements max
- **Read replicas**: Automatic for scaling reads

## Durable Objects

Stateful, coordinated compute with guaranteed uniqueness.

### When to Use Durable Objects

| Use Case | Good Fit? | Why |
|----------|-----------|-----|
| WebSocket connections | Yes | Persistent connections |
| Real-time collaboration | Yes | Coordination required |
| Rate limiting | Yes | Per-user state |
| Distributed locks | Yes | Guaranteed uniqueness |
| Caching | No | Use KV instead |
| Simple storage | No | Use KV or D1 |

### Configuration

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
script_name = "my-worker"

[[migrations]]
tag = "v1"
new_classes = ["Counter"]
```

### Basic Durable Object

```typescript
// Define Durable Object class
export class Counter {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    // Get current count
    let count = (await this.storage.get<number>('count')) || 0;

    // Increment
    count++;

    // Persist
    await this.storage.put('count', count);

    return new Response(JSON.stringify({ count }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Use in Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Get Durable Object instance by name
    const id = env.COUNTER.idFromName('global');
    const counter = env.COUNTER.get(id);

    // Forward request to Durable Object
    return counter.fetch(request);
  }
};
```

### Storage API

```typescript
export class MyDurableObject {
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.storage = state.storage;
  }

  async example() {
    // Put single value
    await this.storage.put('key', 'value');

    // Put multiple values (atomic)
    await this.storage.put({
      key1: 'value1',
      key2: 'value2',
      key3: { nested: 'object' }
    });

    // Get single value
    const value = await this.storage.get('key');

    // Get multiple values
    const values = await this.storage.get(['key1', 'key2']);

    // Delete
    await this.storage.delete('key');
    await this.storage.delete(['key1', 'key2']);

    // List keys
    const keys = await this.storage.list();
    const keysWithPrefix = await this.storage.list({ prefix: 'user:' });

    // Delete all
    await this.storage.deleteAll();
  }
}
```

### ID Generation

```typescript
// Named ID (same name = same instance)
const id = env.COUNTER.idFromName('global');

// Random ID (unique instance)
const id = env.COUNTER.newUniqueId();

// ID from string (deterministic)
const id = env.COUNTER.idFromString('user-123');

// Get Durable Object
const durableObject = env.COUNTER.get(id);
```

### WebSocket Example (Chat Room)

```typescript
export class ChatRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    // Upgrade to WebSocket
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.sessions.add(server);

    // Handle messages
    server.addEventListener('message', (event) => {
      // Broadcast to all connected clients
      for (const session of this.sessions) {
        try {
          session.send(event.data);
        } catch (err) {
          // Client disconnected
        }
      }
    });

    // Handle close
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

### Alarms (Scheduled Tasks)

```typescript
export class MyDurableObject {
  state: DurableObjectState;

  async fetch(request: Request): Promise<Response> {
    // Schedule alarm for 1 hour from now
    await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);

    return new Response('Alarm scheduled');
  }

  // Alarm handler
  async alarm(): Promise<void> {
    // This runs when alarm fires
    await this.cleanup();

    // Can reschedule
    await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
  }

  async cleanup() {
    // Cleanup logic
  }
}
```

### Limits

- **Storage per object**: 128 KB + 1 GB (paid)
- **CPU time per request**: 30 seconds
- **WebSocket connections**: Unlimited per object
- **Objects per account**: Unlimited
- **Alarm precision**: ~1 minute

## Queues

Message queues for async processing.

### Configuration

```toml
# wrangler.toml
[[queues.producers]]
binding = "MY_QUEUE"
queue = "my-queue"

[[queues.consumers]]
queue = "my-queue"
max_batch_size = 10
max_batch_timeout = 5
max_retries = 3
dead_letter_queue = "my-dlq"
```

### Producer (Send Messages)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Send single message
    await env.MY_QUEUE.send({
      type: 'email',
      to: 'user@example.com',
      subject: 'Hello'
    });

    // Send batch
    await env.MY_QUEUE.sendBatch([
      { body: { message: 1 } },
      { body: { message: 2 }, contentType: 'json' }
    ]);

    return new Response('Queued');
  }
};
```

### Consumer (Process Messages)

```typescript
export default {
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Process message
        await processMessage(message.body);

        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        // Retry message
        message.retry();

        // Or retry with delay
        message.retry({ delaySeconds: 60 });
      }
    }
  }
};
```

## Workers AI

Run AI models on Cloudflare's network.

### Configuration

```toml
# wrangler.toml
[ai]
binding = "AI"
```

### Text Generation

```typescript
const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is edge computing?' }
  ]
});

console.log(response.response);
```

### Image Generation

```typescript
const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
  prompt: 'A sunset over mountains'
});

return new Response(response, {
  headers: { 'Content-Type': 'image/png' }
});
```

### Embeddings

```typescript
const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: ['Hello world', 'Cloudflare Workers']
});

console.log(embeddings.data); // [[0.1, 0.2, ...], [0.3, 0.4, ...]]
```

## Vectorize

Vector database for similarity search.

### Configuration

```toml
# wrangler.toml
[[vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "my-index"
```

### Insert and Query

```typescript
// Insert vectors
await env.VECTORIZE_INDEX.insert([
  {
    id: '1',
    values: [0.1, 0.2, 0.3, 0.4, 0.5],
    metadata: { text: 'Hello world' }
  },
  {
    id: '2',
    values: [0.5, 0.4, 0.3, 0.2, 0.1],
    metadata: { text: 'Goodbye world' }
  }
]);

// Query for similar vectors
const results = await env.VECTORIZE_INDEX.query(
  [0.1, 0.2, 0.3, 0.4, 0.5],
  { topK: 5, returnMetadata: true }
);
```

## Analytics Engine

Write custom analytics data.

### Configuration

```toml
# wrangler.toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

### Usage

```typescript
env.ANALYTICS.writeDataPoint({
  blobs: ['example'],
  doubles: [123.45],
  indexes: ['index_value']
});
```

## Service Bindings

Call other Workers directly (no HTTP overhead).

### Configuration

```toml
# wrangler.toml
[[services]]
binding = "AUTH_SERVICE"
service = "auth-worker"
environment = "production"
```

### Usage

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Call another Worker directly
    const authResponse = await env.AUTH_SERVICE.fetch(request);

    if (authResponse.status !== 200) {
      return new Response('Unauthorized', { status: 401 });
    }

    return new Response('Authorized');
  }
};
```
