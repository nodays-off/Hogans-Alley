# Next.js Routing Guide

Complete guide to routing in Next.js App Router.

## Table of Contents

- [Basic Routing](#basic-routing)
- [Dynamic Routes](#dynamic-routes)
- [Route Groups](#route-groups)
- [Parallel Routes](#parallel-routes)
- [Intercepting Routes](#intercepting-routes)
- [Navigation](#navigation)

## Basic Routing

Next.js uses a file-system based router where folders define routes.

### Static Routes

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx         → /about
└── blog/
    └── page.tsx         → /blog
```

**Example page:**
```tsx
// app/about/page.tsx
export default function AboutPage() {
  return <h1>About Us</h1>
}
```

### Nested Routes

```
app/
└── blog/
    ├── page.tsx         → /blog
    └── [slug]/
        └── page.tsx     → /blog/:slug
```

## Dynamic Routes

Use square brackets to create dynamic route segments.

### Single Dynamic Segment

```tsx
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>
}

// Matches: /blog/hello-world, /blog/first-post
```

### Multiple Dynamic Segments

```tsx
// app/shop/[category]/[product]/page.tsx
export default function Product({
  params,
}: {
  params: { category: string; product: string }
}) {
  return (
    <div>
      <h1>Category: {params.category}</h1>
      <h2>Product: {params.product}</h2>
    </div>
  )
}

// Matches: /shop/electronics/laptop, /shop/clothing/shirt
```

### Catch-all Segments

Catch all subsequent segments with `[...slug]`:

```tsx
// app/docs/[...slug]/page.tsx
export default function Docs({ params }: { params: { slug: string[] } }) {
  return <h1>Docs: {params.slug.join('/')}</h1>
}

// Matches: /docs/a, /docs/a/b, /docs/a/b/c
// Does NOT match: /docs
```

### Optional Catch-all Segments

Use `[[...slug]]` to make the segment optional:

```tsx
// app/docs/[[...slug]]/page.tsx
export default function Docs({ params }: { params: { slug?: string[] } }) {
  return <h1>Docs: {params.slug?.join('/') || 'Home'}</h1>
}

// Matches: /docs, /docs/a, /docs/a/b
```

### Generate Static Params

Pre-render dynamic routes at build time:

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then(r => r.json())
  return <article>{post.content}</article>
}
```

## Route Groups

Organize routes without affecting the URL structure using parentheses.

### Basic Route Groups

```
app/
├── (marketing)/          # Route group (not in URL)
│   ├── about/
│   │   └── page.tsx     → /about
│   └── blog/
│       └── page.tsx     → /blog
└── (shop)/
    ├── products/
    │   └── page.tsx     → /products
    └── cart/
        └── page.tsx     → /cart
```

### Route Groups with Different Layouts

```
app/
├── (marketing)/
│   ├── layout.tsx       # Marketing layout
│   └── about/page.tsx
└── (dashboard)/
    ├── layout.tsx       # Dashboard layout
    └── settings/page.tsx
```

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <nav>Dashboard Navigation</nav>
      {children}
    </div>
  )
}
```

### Multiple Root Layouts

Use route groups to have multiple root layouts:

```
app/
├── (main)/
│   ├── layout.tsx       # Root layout for main
│   └── page.tsx
└── (admin)/
    ├── layout.tsx       # Different root layout for admin
    └── page.tsx
```

## Parallel Routes

Render multiple pages in the same layout simultaneously using named slots.

### Basic Parallel Routes

```
app/
├── @team/               # Named slot
│   └── page.tsx
├── @analytics/          # Named slot
│   └── page.tsx
└── layout.tsx           # Consumes both slots
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <>
      {children}
      <div className="grid grid-cols-2">
        {team}
        {analytics}
      </div>
    </>
  )
}
```

### Conditional Rendering with Parallel Routes

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  const showAnalytics = true // Could be based on auth, feature flags, etc.

  return (
    <>
      {children}
      {team}
      {showAnalytics && analytics}
    </>
  )
}
```

### Default Routes for Parallel Routes

Provide fallback for slots using `default.tsx`:

```
app/
├── @team/
│   ├── page.tsx
│   └── default.tsx      # Fallback
└── layout.tsx
```

```tsx
// app/@team/default.tsx
export default function Default() {
  return <div>Loading team...</div>
}
```

## Intercepting Routes

Intercept routes to display in a different context (like a modal) while preserving the URL.

### Intercepting Convention

- `(.)` - match segments on the same level
- `(..)` - match segments one level above
- `(..)(..)` - match segments two levels above
- `(...)` - match segments from the root app directory

### Photo Modal Example

```
app/
├── feed/
│   └── page.tsx                    # /feed
├── photo/
│   └── [id]/
│       └── page.tsx                # /photo/123
└── @modal/
    └── (..)photo/                   # Intercepts /photo/[id]
        └── [id]/
            └── page.tsx
```

```tsx
// app/feed/page.tsx
import Link from 'next/link'

export default function Feed() {
  return (
    <div>
      {photos.map(photo => (
        <Link key={photo.id} href={`/photo/${photo.id}`}>
          <img src={photo.thumbnail} alt={photo.title} />
        </Link>
      ))}
    </div>
  )
}

// app/@modal/(..)photo/[id]/page.tsx
export default function PhotoModal({ params }: { params: { id: string } }) {
  return (
    <dialog open>
      <img src={`/photos/${params.id}.jpg`} alt="Photo" />
    </dialog>
  )
}

// app/photo/[id]/page.tsx
export default function PhotoPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Photo {params.id}</h1>
      <img src={`/photos/${params.id}.jpg`} alt="Photo" />
    </div>
  )
}
```

When navigating from `/feed` to `/photo/123`:
- Soft navigation (client-side): Shows modal from `@modal/(..)photo/[id]/page.tsx`
- Hard navigation (refresh/direct): Shows full page from `photo/[id]/page.tsx`

## Navigation

### Link Component

The primary way to navigate between routes.

**Basic usage:**
```tsx
import Link from 'next/link'

export default function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/hello-world">Blog Post</Link>
    </nav>
  )
}
```

**Dynamic paths:**
```tsx
<Link href={`/blog/${post.slug}`}>
  {post.title}
</Link>

// Alternative object syntax
<Link href={{
  pathname: '/blog/[slug]',
  query: { slug: post.slug },
}}>
  {post.title}
</Link>
```

**Styling active links:**
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={isActive ? 'text-blue-500' : 'text-gray-500'}
    >
      {children}
    </Link>
  )
}
```

### useRouter Hook (Client Components)

Programmatic navigation in Client Components.

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function LoginButton() {
  const router = useRouter()

  const handleLogin = async () => {
    const res = await login()
    if (res.success) {
      router.push('/dashboard')
    }
  }

  return <button onClick={handleLogin}>Login</button>
}
```

**Router methods:**
```tsx
const router = useRouter()

// Navigate to route
router.push('/dashboard')

// Replace current history entry
router.replace('/login')

// Go back
router.back()

// Go forward
router.forward()

// Refresh current route
router.refresh()

// Prefetch route
router.prefetch('/dashboard')
```

### redirect() Function (Server Components)

Server-side redirects in Server Components, Route Handlers, or Server Actions.

```tsx
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return <div>Profile: {session.user.name}</div>
}
```

**In Server Actions:**
```tsx
'use server'

import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    title: formData.get('title'),
  })

  redirect(`/posts/${post.slug}`)
}
```

### permanentRedirect() Function

For permanent (308) redirects:

```tsx
import { permanentRedirect } from 'next/navigation'

export default async function OldPage() {
  permanentRedirect('/new-page')
}
```

### Prefetching

Next.js automatically prefetches routes in the viewport.

```tsx
// Disable prefetching
<Link href="/about" prefetch={false}>
  About
</Link>

// Explicitly prefetch
const router = useRouter()
router.prefetch('/dashboard')
```

## Loading States

Show loading UI while navigating between routes.

### loading.tsx File

Automatically wraps page in React Suspense:

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>
}
```

### Instant Loading States

Loading UI shows instantly on navigation:

```
app/
└── dashboard/
    ├── loading.tsx      # Shows while page.tsx loads
    └── page.tsx
```

### Streaming with Suspense

For more granular loading states:

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments />
      </Suspense>
    </div>
  )
}
```

## Error Handling

### error.tsx File

Catch errors in route segments:

```tsx
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### not-found.tsx

Custom 404 page:

```tsx
// app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <p>Could not find the requested resource</p>
    </div>
  )
}
```

Trigger programmatically:

```tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }) {
  const data = await fetchData(params.id)

  if (!data) {
    notFound()
  }

  return <div>{data.title}</div>
}
```

## Advanced Patterns

### Protected Routes

Use layouts to protect entire route sections:

```tsx
// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function DashboardLayout({ children }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
```

### Route Handlers with Dynamic Routes

```tsx
// app/api/posts/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  return Response.json(post)
}
```

### Middleware for Route Protection

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
```
