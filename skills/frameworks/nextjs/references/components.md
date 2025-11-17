# Next.js Components Guide

Complete guide to Server and Client Components in Next.js App Router.

## Table of Contents

- [Server Components](#server-components)
- [Client Components](#client-components)
- [Composition Patterns](#composition-patterns)
- [When to Use Each](#when-to-use-each)

## Server Components

Server Components are the default in the App Router. They render on the server and can access backend resources directly.

### Benefits

1. **Data Fetching**: Fetch data closer to the source
2. **Security**: Keep sensitive data and logic on server
3. **Caching**: Server-side caching benefits
4. **Bundle Size**: Reduce client-side JavaScript
5. **Initial Page Load**: Faster first contentful paint
6. **SEO**: Better search engine optimization
7. **Streaming**: Stream UI as it's ready

### Basic Server Component

```tsx
// app/posts/page.tsx (default = Server Component)
async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Accessing Backend Resources

```tsx
// Server Component can import and use server-only code
import { db } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'

export default async function Dashboard() {
  const user = await getCurrentUser()
  const data = await db.query('SELECT * FROM data WHERE userId = ?', [user.id])

  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
```

### Using Environment Variables

```tsx
// Server Component can access server-only env vars
export default async function Page() {
  // This env var is only available on server
  const apiKey = process.env.API_KEY

  const data = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  }).then(r => r.json())

  return <div>{data.message}</div>
}
```

### Server Component Limitations

Server Components CANNOT:
- Use React hooks (useState, useEffect, etc.)
- Use browser APIs (localStorage, window, etc.)
- Add event listeners (onClick, onChange, etc.)
- Use Context Providers (for state)
- Use class components

```tsx
// ❌ WRONG - Cannot use hooks in Server Component
export default async function Page() {
  const [count, setCount] = useState(0) // Error!

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}

// ✅ CORRECT - Use Client Component for interactivity
```

## Client Components

Client Components render on the client and enable interactivity. Mark them with the `'use client'` directive.

### Basic Client Component

```tsx
// components/counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

### When to Use Client Components

Use Client Components when you need:

1. **Interactivity**: Event listeners (onClick, onChange, etc.)
2. **State**: useState, useReducer, or state management libraries
3. **Effects**: useEffect, useLayoutEffect
4. **Browser APIs**: localStorage, sessionStorage, geolocation, etc.
5. **Custom Hooks**: Any hook that uses the above
6. **Context**: Context Providers for client state
7. **Class Components**: React class components

### Event Handlers

```tsx
'use client'

export function SearchForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Search..." />
      <button type="submit">Search</button>
    </form>
  )
}
```

### Using Hooks

```tsx
'use client'

import { useState, useEffect } from 'react'

export function Timer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return <div>Seconds: {seconds}</div>
}
```

### Browser APIs

```tsx
'use client'

import { useEffect, useState } from 'react'

export function GeolocationDisplay() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      })
    }
  }, [])

  if (!location) return <div>Loading location...</div>

  return <div>Location: {location.lat}, {location.lng}</div>
}
```

### Context Providers

```tsx
// providers/theme-provider.tsx
'use client'

import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext<{
  theme: string
  setTheme: (theme: string) => void
}>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// components/theme-toggle.tsx
'use client'

import { useTheme } from '@/providers/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  )
}
```

### Third-party Libraries

Many third-party libraries require Client Components:

```tsx
'use client'

import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
```

## Composition Patterns

How to combine Server and Client Components effectively.

### Pattern 1: Server Wrapping Client

The most common pattern - Server Component fetches data, Client Component handles interactivity.

```tsx
// app/posts/page.tsx (Server Component)
import { ClientComponent } from '@/components/client-component'

async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div>
      <h1>Posts</h1>
      {/* Pass server data to client component as props */}
      <ClientComponent posts={posts} />
    </div>
  )
}

// components/client-component.tsx (Client Component)
'use client'

import { useState } from 'react'

export function ClientComponent({ posts }) {
  const [filter, setFilter] = useState('')

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter posts..."
      />
      <ul>
        {filteredPosts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Pattern 2: Passing Server Components as Children

Client Components can accept Server Components as children or props.

```tsx
// components/client-wrapper.tsx
'use client'

import { useState } from 'react'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  )
}

// app/page.tsx (Server Component)
import { ClientWrapper } from '@/components/client-wrapper'

async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function Page() {
  const data = await getData()

  return (
    <ClientWrapper>
      {/* This is still a Server Component! */}
      <div>
        <h2>Server-fetched data:</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </ClientWrapper>
  )
}
```

### Pattern 3: Interleaving Server and Client Components

```tsx
// app/page.tsx (Server Component)
import { ClientNav } from '@/components/client-nav'
import { ServerContent } from '@/components/server-content'

export default function Page() {
  return (
    <div>
      {/* Client Component for interactivity */}
      <ClientNav />

      {/* Server Component for data fetching */}
      <ServerContent />
    </div>
  )
}

// components/client-nav.tsx
'use client'

import { useState } from 'react'

export function ClientNav() {
  const [active, setActive] = useState('home')

  return (
    <nav>
      <button onClick={() => setActive('home')}>Home</button>
      <button onClick={() => setActive('about')}>About</button>
      <p>Active: {active}</p>
    </nav>
  )
}

// components/server-content.tsx (Server Component)
async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export async function ServerContent() {
  const data = await getData()

  return <div>{data.content}</div>
}
```

### Pattern 4: Unsupported - Importing Server into Client

You CANNOT import a Server Component into a Client Component:

```tsx
// ❌ WRONG
'use client'

import { ServerComponent } from './server-component'

export function ClientComponent() {
  return <ServerComponent /> // Error!
}

// ✅ CORRECT - Pass as children
'use client'

export function ClientComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// app/page.tsx
import { ServerComponent } from './server-component'
import { ClientComponent } from './client-component'

export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}
```

## When to Use Each

### Use Server Components For

| Use Case | Why |
|----------|-----|
| Data fetching | Direct database/API access without exposing credentials |
| Backend logic | Keep business logic on server |
| Large dependencies | Reduce client bundle size |
| Static content | Content that doesn't need interactivity |
| SEO-critical content | Ensure content is in initial HTML |
| Security-sensitive operations | API keys, tokens stay on server |

**Examples:**
- Blog posts display
- Product listings
- User profiles (display only)
- Server-rendered forms
- Static marketing pages

### Use Client Components For

| Use Case | Why |
|----------|-----|
| Interactive UI | Event handlers, user input |
| State management | Component state, global state |
| Effects | Side effects, subscriptions |
| Browser APIs | Access to window, localStorage, etc. |
| Real-time features | WebSockets, polling |
| Animations | CSS-in-JS, animation libraries |
| User feedback | Toasts, modals, tooltips |

**Examples:**
- Search bars with filtering
- Shopping carts
- Like/favorite buttons
- Comment forms
- Modals and dialogs
- Interactive charts
- Real-time chat

### Hybrid Patterns

**Interactive Dashboard:**
```tsx
// app/dashboard/page.tsx (Server)
export default async function Dashboard() {
  const stats = await getStats() // Server

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Server-rendered stats */}
      <StatsDisplay stats={stats} />

      {/* Client-side interactive chart */}
      <InteractiveChart data={stats} />
    </div>
  )
}
```

**E-commerce Product Page:**
```tsx
// app/products/[id]/page.tsx (Server)
export default async function ProductPage({ params }) {
  const product = await getProduct(params.id) // Server

  return (
    <div>
      {/* Server-rendered product info */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Client-side add to cart */}
      <AddToCartButton product={product} />

      {/* Client-side image gallery */}
      <ImageGallery images={product.images} />
    </div>
  )
}
```

## Best Practices

1. **Start with Server Components**: Default to Server Components, add Client Components only when needed
2. **Keep Client Components Small**: Extract only the interactive parts into Client Components
3. **Move Client Components Down**: Push Client Components as deep in the tree as possible
4. **Pass Data as Props**: Server Components can pass data to Client Components via props
5. **Use Children Pattern**: Pass Server Components as children to Client Components when possible
6. **Avoid Large Client Dependencies**: Keep heavy dependencies in Server Components
7. **Consider the Boundary**: Think carefully about where to place the 'use client' directive
8. **Serialize Props**: Props passed to Client Components must be serializable (no functions, Dates need conversion)
9. **Environment Variables**: Use NEXT_PUBLIC_ prefix for client-accessible env vars
10. **Don't Mix Patterns**: Don't try to import Server Components into Client Components

## Common Mistakes

### Mistake 1: Making Everything a Client Component

```tsx
// ❌ BAD
'use client'

export default async function Page() {
  const data = await fetch('https://api.example.com/data').then(r => r.json())
  const [count, setCount] = useState(0)

  return (
    <div>
      <div>{data.title}</div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  )
}

// ✅ GOOD - Separate Server and Client concerns
// app/page.tsx (Server)
export default async function Page() {
  const data = await fetch('https://api.example.com/data').then(r => r.json())

  return (
    <div>
      <div>{data.title}</div>
      <Counter />
    </div>
  )
}

// components/counter.tsx (Client)
'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

### Mistake 2: Forgetting 'use client'

```tsx
// ❌ BAD - Missing 'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0) // Error!
  return <button>Count: {count}</button>
}

// ✅ GOOD
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button>Count: {count}</button>
}
```

### Mistake 3: Non-serializable Props

```tsx
// ❌ BAD - Passing function as prop
export default function Page() {
  const handleClick = () => console.log('clicked')

  return <ClientComponent onClick={handleClick} /> // Error!
}

// ✅ GOOD - Define function in Client Component
export default function Page() {
  return <ClientComponent />
}

// components/client-component.tsx
'use client'

export function ClientComponent() {
  const handleClick = () => console.log('clicked')

  return <button onClick={handleClick}>Click me</button>
}
```
