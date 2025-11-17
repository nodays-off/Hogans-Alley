# Next.js Data Fetching Guide

Complete guide to data fetching patterns in Next.js App Router.

## Table of Contents

- [Server Component Data Fetching](#server-component-data-fetching)
- [Parallel and Sequential Fetching](#parallel-and-sequential-fetching)
- [Server Actions](#server-actions)
- [Route Handlers](#route-handlers)
- [Client-side Fetching](#client-side-fetching)

## Server Component Data Fetching

Server Components can fetch data directly using async/await.

### Basic Fetch

```tsx
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts')

  if (!res.ok) {
    throw new Error('Failed to fetch posts')
  }

  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Direct Database Access

```tsx
// app/users/page.tsx
import { db } from '@/lib/db'

async function getUsers() {
  return await db.user.findMany()
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Error Handling

```tsx
async function getData() {
  try {
    const res = await fetch('https://api.example.com/data')

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('Failed to fetch data:', error)
    throw error // Will be caught by error.tsx
  }
}
```

## Parallel and Sequential Fetching

### Parallel Fetching

Fetch multiple resources simultaneously for better performance:

```tsx
async function getData() {
  // Initiate both requests in parallel
  const postsPromise = fetch('https://api.example.com/posts').then(r => r.json())
  const usersPromise = fetch('https://api.example.com/users').then(r => r.json())

  // Wait for both to complete
  const [posts, users] = await Promise.all([postsPromise, usersPromise])

  return { posts, users }
}

export default async function Page() {
  const { posts, users } = await getData()

  return (
    <div>
      <h2>Posts: {posts.length}</h2>
      <h2>Users: {users.length}</h2>
    </div>
  )
}
```

### Sequential Fetching

When one request depends on another:

```tsx
async function getData(postId: string) {
  // First fetch the post
  const post = await fetch(`https://api.example.com/posts/${postId}`)
    .then(r => r.json())

  // Then fetch the author using the post's authorId
  const author = await fetch(`https://api.example.com/users/${post.authorId}`)
    .then(r => r.json())

  return { post, author }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const { post, author } = await getData(params.id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {author.name}</p>
      <div>{post.content}</div>
    </article>
  )
}
```

### Preloading Pattern

Start fetching early, await later:

```tsx
// lib/data.ts
const postsCache = new Map()

export function preloadPosts() {
  // Start fetching
  void getPosts()
}

export async function getPosts() {
  const cached = postsCache.get('posts')
  if (cached) return cached

  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  postsCache.set('posts', posts)
  return posts
}

// app/posts/page.tsx
import { preloadPosts, getPosts } from '@/lib/data'

// Start fetching before rendering
preloadPosts()

export default async function PostsPage() {
  // This will use the already-started request
  const posts = await getPosts()

  return <div>{/* render posts */}</div>
}
```

## Server Actions

Server Actions are asynchronous functions that run on the server. Use them for mutations (create, update, delete).

### Basic Server Action

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
}

// app/posts/new/page.tsx
import { createPost } from '@/app/actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" type="text" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

### Server Action with Validation

```tsx
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
})

export async function createPost(formData: FormData) {
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { title, content } = validatedFields.data

  try {
    await db.post.create({
      data: { title, content }
    })
  } catch (error) {
    return {
      message: 'Database Error: Failed to create post.',
    }
  }

  revalidatePath('/posts')
  redirect('/posts')
}
```

### Server Action in Client Component

```tsx
// app/actions.ts
'use server'

export async function incrementLikes(postId: string) {
  await db.post.update({
    where: { id: postId },
    data: { likes: { increment: 1 } }
  })

  revalidatePath('/posts')
}

// components/like-button.tsx
'use client'

import { incrementLikes } from '@/app/actions'
import { useState } from 'react'

export function LikeButton({ postId }: { postId: string }) {
  const [pending, setPending] = useState(false)

  const handleLike = async () => {
    setPending(true)
    await incrementLikes(postId)
    setPending(false)
  }

  return (
    <button onClick={handleLike} disabled={pending}>
      {pending ? 'Liking...' : 'Like'}
    </button>
  )
}
```

### Server Action with useFormState

For progressive enhancement:

```tsx
// app/actions.ts
'use server'

export async function createPost(prevState: any, formData: FormData) {
  const title = formData.get('title') as string

  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' }
  }

  try {
    await db.post.create({ data: { title } })
    return { success: true }
  } catch (error) {
    return { error: 'Failed to create post' }
  }
}

// components/create-post-form.tsx
'use client'

import { useFormState } from 'react-dom'
import { createPost } from '@/app/actions'

export function CreatePostForm() {
  const [state, formAction] = useFormState(createPost, { error: null })

  return (
    <form action={formAction}>
      <input name="title" type="text" />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit">Create</button>
    </form>
  )
}
```

### Server Action with useFormStatus

Show pending state:

```tsx
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  )
}

export function CreatePostForm() {
  return (
    <form action={createPost}>
      <input name="title" type="text" />
      <SubmitButton />
    </form>
  )
}
```

### Optimistic Updates

```tsx
'use client'

import { useOptimistic } from 'react'
import { incrementLikes } from '@/app/actions'

export function Post({ post }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    post.likes,
    (state) => state + 1
  )

  async function handleLike() {
    addOptimisticLike(null)
    await incrementLikes(post.id)
  }

  return (
    <div>
      <h2>{post.title}</h2>
      <button onClick={handleLike}>
        Likes: {optimisticLikes}
      </button>
    </div>
  )
}
```

## Route Handlers

API endpoints for handling HTTP requests.

### Basic Route Handler

```tsx
// app/api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello World' })
}

export async function POST(request: Request) {
  const body = await request.json()

  return Response.json({
    message: 'Data received',
    data: body
  })
}
```

### Dynamic Route Handler

```tsx
// app/api/posts/[id]/route.ts
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  if (!post) {
    return new Response('Post not found', { status: 404 })
  }

  return Response.json(post)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const post = await db.post.update({
    where: { id: params.id },
    data: body
  })

  return Response.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.post.delete({
    where: { id: params.id }
  })

  return new Response(null, { status: 204 })
}
```

### Query Parameters

```tsx
// app/api/search/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = searchParams.get('page') || '1'

  const results = await searchPosts(query, parseInt(page))

  return Response.json(results)
}

// Usage: /api/search?q=nextjs&page=2
```

### Request Headers

```tsx
export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify token...
  return Response.json({ data: 'protected data' })
}
```

### Response Types

```tsx
// JSON Response
export async function GET() {
  return Response.json({ message: 'Hello' })
}

// Text Response
export async function GET() {
  return new Response('Hello World', {
    headers: { 'Content-Type': 'text/plain' }
  })
}

// Redirect Response
export async function GET() {
  return Response.redirect('https://example.com', 307)
}

// Streaming Response
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('chunk 1\n'))
      await sleep(1000)
      controller.enqueue(encoder.encode('chunk 2\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
```

### CORS Configuration

```tsx
// app/api/data/route.ts
export async function GET(request: Request) {
  const data = { message: 'Hello from API' }

  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

## Client-side Fetching

For dynamic data that changes frequently or depends on user interaction.

### Using SWR

```tsx
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function Posts() {
  const { data, error, isLoading } = useSWR('/api/posts', fetcher)

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Using React Query

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

async function fetchPosts() {
  const res = await fetch('/api/posts')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function Posts() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Native fetch in useEffect

```tsx
'use client'

import { useState, useEffect } from 'react'

export function Posts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

## Request Memoization

Next.js automatically memoizes fetch requests in Server Components.

### Automatic Deduplication

```tsx
// These two fetches are automatically deduplicated
async function getPost(id: string) {
  return fetch(`https://api.example.com/posts/${id}`).then(r => r.json())
}

export default async function Page({ params }) {
  // Both components call getPost with the same ID
  // Only one network request is made
  const post1 = await getPost(params.id)
  const post2 = await getPost(params.id)

  return <div>{post1.title}</div>
}
```

### Manual Memoization with React cache

```tsx
import { cache } from 'react'

const getPost = cache(async (id: string) => {
  return db.post.findUnique({ where: { id } })
})

export default async function Page({ params }) {
  // Memoized - same data returned
  const post1 = await getPost(params.id)
  const post2 = await getPost(params.id)

  return <div>{post1.title}</div>
}
```

## Best Practices

1. **Prefer Server Components**: Fetch data on the server when possible
2. **Use Parallel Fetching**: Initiate requests in parallel with Promise.all()
3. **Handle Errors**: Always handle fetch errors appropriately
4. **Use Server Actions for Mutations**: Prefer Server Actions over Route Handlers for mutations
5. **Revalidate After Mutations**: Use revalidatePath() or revalidateTag() after data changes
6. **Type Safety**: Use TypeScript for request/response types
7. **Validate Input**: Always validate and sanitize user input in Server Actions
8. **Consider Caching**: Choose appropriate caching strategy for each endpoint
9. **Progressive Enhancement**: Use useFormState for forms that work without JavaScript
10. **Optimize Loading States**: Use Suspense and loading.tsx for better UX
