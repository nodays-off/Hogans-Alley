# Next.js Caching Guide

Complete guide to caching strategies in Next.js App Router.

## Table of Contents

- [Caching Overview](#caching-overview)
- [Request Memoization](#request-memoization)
- [Data Cache](#data-cache)
- [Full Route Cache](#full-route-cache)
- [Router Cache](#router-cache)
- [Revalidation](#revalidation)

## Caching Overview

Next.js has four caching mechanisms:

| Mechanism | What | Where | Purpose | Duration |
|-----------|------|-------|---------|----------|
| Request Memoization | Function results | Server | Dedupe requests | Request lifecycle |
| Data Cache | Data | Server | Persist across requests | Persistent (until revalidated) |
| Full Route Cache | HTML & RSC payload | Server | Reduce rendering cost | Persistent (until revalidated) |
| Router Cache | RSC payload | Client | Reduce server requests | User session or time-based |

## Request Memoization

Automatic deduplication of fetch requests during a single render pass.

### How It Works

```tsx
// During rendering, these two identical fetches are deduplicated
async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`)
  return res.json()
}

export default async function Page() {
  // Only ONE network request is made
  const user1 = await getUser('123')
  const user2 = await getUser('123')

  return <div>{user1.name}</div>
}
```

### Scope

- Only applies to GET requests
- Only within a single render pass
- Resets between server renders
- Works with fetch and React cache()

### Manual Memoization with React cache()

For non-fetch data sources:

```tsx
import { cache } from 'react'

const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})

export default async function Page() {
  // Memoized - query runs once
  const user1 = await getUser('123')
  const user2 = await getUser('123')

  return <div>{user1.name}</div>
}
```

## Data Cache

Persistent cache for fetch requests across requests and deployments.

### Force Cache (Static)

Default behavior - cache indefinitely until revalidated.

```tsx
// Cached indefinitely
const res = await fetch('https://api.example.com/posts', {
  cache: 'force-cache' // Default, can be omitted
})
```

**Use for:**
- Marketing pages
- Documentation
- Blog posts
- Any content that rarely changes

### No Store (Dynamic)

Never cache - always fetch fresh data.

```tsx
// Always fetch fresh data
const res = await fetch('https://api.example.com/user', {
  cache: 'no-store'
})
```

**Use for:**
- User-specific data
- Real-time dashboards
- Authentication status
- Shopping cart contents
- Live feeds

### Time-based Revalidation (ISR)

Cache with automatic revalidation after a time period.

```tsx
// Revalidate every hour (3600 seconds)
const res = await fetch('https://api.example.com/posts', {
  next: { revalidate: 3600 }
})
```

**Use for:**
- Product catalogs
- Blog listings
- Public profiles
- News feeds
- Data that changes predictably

**Common revalidation times:**
```tsx
// Every minute
next: { revalidate: 60 }

// Every 5 minutes
next: { revalidate: 300 }

// Every hour
next: { revalidate: 3600 }

// Every day
next: { revalidate: 86400 }
```

### Tag-based Revalidation (On-demand)

Cache with manual revalidation using tags.

```tsx
// Tag the request
const res = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }
})
```

Then revalidate when data changes:

```tsx
// In a Server Action or Route Handler
import { revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') } })

  // Revalidate all requests tagged with 'posts'
  revalidateTag('posts')
}
```

**Use for:**
- CMS content
- E-commerce products
- User-generated content
- Any data updated through your app

### Mixed Strategies

Different parts of your app can use different strategies:

```tsx
export default async function Page() {
  // Static - marketing content
  const marketing = await fetch('https://api.example.com/marketing', {
    cache: 'force-cache'
  }).then(r => r.json())

  // ISR - product catalog
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }
  }).then(r => r.json())

  // Dynamic - user data
  const user = await fetch('https://api.example.com/user', {
    cache: 'no-store'
  }).then(r => r.json())

  return (
    <div>
      <Banner content={marketing} />
      <Products items={products} />
      <UserProfile user={user} />
    </div>
  )
}
```

## Full Route Cache

Next.js automatically caches the rendered output of routes at build time.

### Static Routes (Default)

Routes are cached by default if they don't use dynamic functions.

```tsx
// app/about/page.tsx
// This route is statically cached at build time
export default function AboutPage() {
  return <h1>About Us</h1>
}
```

### Dynamic Routes

Routes become dynamic if they use:
- `cookies()`, `headers()`, `searchParams`
- Uncached fetch requests (`cache: 'no-store'`)
- `export const dynamic = 'force-dynamic'`

```tsx
import { cookies } from 'next/headers'

// This route is dynamic (not cached)
export default async function Page() {
  const cookieStore = cookies()
  const theme = cookieStore.get('theme')

  return <div>Theme: {theme?.value}</div>
}
```

### Force Dynamic Rendering

Opt out of static caching:

```tsx
// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export default async function Page() {
  return <div>{new Date().toISOString()}</div>
}
```

### Force Static Rendering

Opt into static rendering even with dynamic functions:

```tsx
export const dynamic = 'force-static'

export default async function Page() {
  return <div>Static page</div>
}
```

### generateStaticParams

Pre-render dynamic routes at build time:

```tsx
// app/posts/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

// These routes are statically generated:
// /posts/first-post
// /posts/second-post
// etc.
export default async function Post({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`)
    .then(r => r.json())

  return <article>{post.content}</article>
}
```

## Router Cache

Client-side cache of visited routes.

### How It Works

- Caches the RSC payload of visited routes
- Reduces server requests on navigation
- Automatically invalidates after a time period

### Duration

| Route Type | Default Duration |
|------------|------------------|
| Static | 5 minutes |
| Dynamic | 30 seconds |

### Prefetching

Link components automatically prefetch routes:

```tsx
import Link from 'next/link'

export default function Page() {
  return (
    <>
      {/* Automatically prefetched */}
      <Link href="/about">About</Link>

      {/* Disable prefetching */}
      <Link href="/about" prefetch={false}>About</Link>
    </>
  )
}
```

### Manual Prefetch

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function PrefetchButton() {
  const router = useRouter()

  return (
    <button
      onMouseEnter={() => router.prefetch('/dashboard')}
      onClick={() => router.push('/dashboard')}
    >
      Go to Dashboard
    </button>
  )
}
```

## Revalidation

Methods to update cached data.

### Time-based Revalidation

Automatically revalidate after a time period:

```tsx
// Fetch-level
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // 1 hour
})

// Route-level
export const revalidate = 3600 // 1 hour

export default async function Page() {
  return <div>Content</div>
}
```

### On-demand Revalidation by Path

Revalidate a specific path:

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') } })

  // Revalidate the /posts page
  revalidatePath('/posts')

  // Revalidate all posts routes
  revalidatePath('/posts/[slug]', 'page')

  // Revalidate all routes in layout
  revalidatePath('/posts', 'layout')
}
```

### On-demand Revalidation by Tag

Revalidate all requests with a tag:

```tsx
// Tag fetch requests
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts', 'published'] }
})

const drafts = await fetch('https://api.example.com/drafts', {
  next: { tags: ['posts', 'drafts'] }
})

// Revalidate by tag
import { revalidateTag } from 'next/cache'

export async function publishPost(id: string) {
  await db.post.update({ where: { id }, data: { published: true } })

  // Revalidate all requests tagged with 'posts'
  revalidateTag('posts')
}
```

### Multiple Tags

Use multiple tags for granular control:

```tsx
// Fetch with multiple tags
const data = await fetch('https://api.example.com/posts/123', {
  next: { tags: ['posts', 'post-123', 'user-456'] }
})

// Revalidate specific post
revalidateTag('post-123')

// Revalidate all posts
revalidateTag('posts')

// Revalidate all content by user
revalidateTag('user-456')
```

### Revalidation in Route Handlers

```tsx
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  // Verify webhook secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const body = await request.json()

  // Revalidate by path
  if (body.path) {
    revalidatePath(body.path)
    return Response.json({ revalidated: true, path: body.path })
  }

  // Revalidate by tag
  if (body.tag) {
    revalidateTag(body.tag)
    return Response.json({ revalidated: true, tag: body.tag })
  }

  return Response.json({ message: 'Missing path or tag' }, { status: 400 })
}

// Webhook from CMS
// POST /api/revalidate?secret=TOKEN
// { "tag": "posts" }
```

## Opting Out of Caching

### Per-request Opt-out

```tsx
// Don't cache this request
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})
```

### Route-level Opt-out

```tsx
// Entire route is dynamic
export const dynamic = 'force-dynamic'

export default async function Page() {
  return <div>Always fresh</div>
}
```

### Using Dynamic Functions

These functions automatically opt out of caching:

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  // Using cookies makes route dynamic
  const cookieStore = cookies()

  // Using headers makes route dynamic
  const headersList = headers()

  return <div>Dynamic route</div>
}
```

### searchParams

Using searchParams makes the page dynamic:

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: { query?: string }
}) {
  // This page is dynamic due to searchParams
  return <div>Query: {searchParams.query}</div>
}
```

## Cache Configuration

### Segment Config Options

```tsx
// app/posts/page.tsx

// Revalidation period (seconds) or false to cache indefinitely
export const revalidate = 3600

// 'auto' | 'force-dynamic' | 'error' | 'force-static'
export const dynamic = 'auto'

// 'auto' | 'force-dynamic' | 'force-static'
export const dynamicParams = 'auto'

// 'auto' | 'force-no-store' | 'default-cache' | 'only-no-store' | 'force-cache' | 'only-cache'
export const fetchCache = 'auto'

// 'nodejs' | 'edge'
export const runtime = 'nodejs'

// Control which routes are generated at build time
export const generateStaticParams = async () => []
```

### Next.js Config

```js
// next.config.js
module.exports = {
  // Configure how long Next.js will wait before timing out
  experimental: {
    // Adjust the maximum age of the client router cache
    staleTimes: {
      dynamic: 30, // seconds
      static: 180, // seconds
    },
  },
}
```

## Best Practices

1. **Default to Static**: Let routes cache by default, opt out only when needed
2. **Use Tags for Mutations**: Tag-based revalidation is more precise than path-based
3. **Combine Strategies**: Use different caching strategies for different data
4. **Monitor Performance**: Check cache hit rates and adjust strategies
5. **Granular Tags**: Use multiple specific tags rather than few broad tags
6. **Time-based for Predictable Updates**: Use revalidate for data that changes on schedule
7. **On-demand for User Actions**: Use revalidateTag/Path for user-triggered updates
8. **Opt Out Carefully**: Dynamic routes use more resources, use sparingly
9. **Prefetch Important Routes**: Use prefetch for key user journeys
10. **Test Cache Behavior**: Verify caching works as expected in production

## Common Patterns

### E-commerce Product Page

```tsx
// app/products/[id]/page.tsx

// Revalidate every 5 minutes
export const revalidate = 300

export default async function ProductPage({ params }) {
  // Static product data (ISR)
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { revalidate: 300, tags: [`product-${params.id}`] }
  }).then(r => r.json())

  // Dynamic user-specific data (never cache)
  const cart = await fetch('https://api.example.com/cart', {
    cache: 'no-store'
  }).then(r => r.json())

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      <CartButton cart={cart} />
    </div>
  )
}
```

### Blog with CMS

```tsx
// app/blog/[slug]/page.tsx

// Tag all blog posts
async function getPost(slug: string) {
  return fetch(`https://cms.example.com/posts/${slug}`, {
    next: { tags: ['posts', `post-${slug}`] }
  }).then(r => r.json())
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug)
  return <article>{post.content}</article>
}

// CMS webhook handler
// app/api/revalidate/route.ts
export async function POST(request: Request) {
  const { slug } = await request.json()

  // Revalidate specific post
  revalidateTag(`post-${slug}`)

  // Revalidate all posts list
  revalidatePath('/blog')

  return Response.json({ revalidated: true })
}
```

### User Dashboard

```tsx
// app/dashboard/page.tsx

// Force dynamic - always fresh data
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const user = await getUser() // No cache
  const stats = await getUserStats(user.id) // No cache

  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <Stats data={stats} />
    </div>
  )
}
```
