# Next.js Optimization Guide

Complete guide to optimizing performance in Next.js applications.

## Table of Contents

- [Image Optimization](#image-optimization)
- [Font Optimization](#font-optimization)
- [Script Optimization](#script-optimization)
- [Bundle Optimization](#bundle-optimization)
- [Performance Monitoring](#performance-monitoring)

## Image Optimization

Next.js automatically optimizes images with the Image component.

### Basic Image Usage

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
      priority // Load immediately for above-fold images
    />
  )
}
```

### Image Sizing Strategies

**Fixed dimensions:**
```tsx
// Use when you know exact dimensions
<Image
  src="/profile.jpg"
  alt="Profile"
  width={500}
  height={500}
/>
```

**Fill container:**
```tsx
// Use for responsive images
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

**Responsive with sizes:**
```tsx
<Image
  src="/responsive.jpg"
  alt="Responsive"
  width={1200}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Priority Loading

Mark above-fold images as priority:

```tsx
export default function Page() {
  return (
    <>
      {/* Hero image - loads immediately */}
      <Image
        src="/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority
      />

      {/* Below-fold images - lazy loaded */}
      <Image
        src="/content.jpg"
        alt="Content"
        width={800}
        height={400}
      />
    </>
  )
}
```

### Remote Images

Configure allowed domains in next.config.js:

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
}
```

Then use remote images:

```tsx
<Image
  src="https://example.com/images/photo.jpg"
  alt="Remote image"
  width={800}
  height={600}
/>
```

### Image Quality

Adjust quality (1-100, default 75):

```tsx
// Higher quality (larger file)
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  quality={90}
/>

// Lower quality (smaller file)
<Image
  src="/thumbnail.jpg"
  alt="Thumbnail"
  width={200}
  height={200}
  quality={60}
/>
```

### Placeholder Blur

Show blurred placeholder while loading:

```tsx
import blurDataURL from './blur-data'

<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurDataURL} // Base64 encoded data URL
/>
```

Generate blur data URL:

```tsx
import { getPlaiceholder } from 'plaiceholder'

async function getBlurData(src: string) {
  const buffer = await fetch(src).then(res => res.arrayBuffer())
  const { base64 } = await getPlaiceholder(Buffer.from(buffer))
  return base64
}
```

### Static Images

Import local images for automatic optimization:

```tsx
import heroImage from '@/public/hero.jpg'

<Image
  src={heroImage}
  alt="Hero"
  placeholder="blur" // Automatic blur data
  // No width/height needed - inferred from import
/>
```

### Image Formats

Next.js automatically serves modern formats (WebP, AVIF) when supported:

```js
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

### Responsive Images

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
  style={{
    width: '100%',
    height: 'auto',
  }}
/>
```

## Font Optimization

Next.js optimizes fonts by hosting them locally and inlining font CSS.

### Google Fonts

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono, Playfair_Display } from 'next/font/google'

// Single font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Use 'swap' for better performance
})

// Font with weights
const roboto = Roboto_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

// Variable font
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Multiple Fonts

```tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

Use in CSS:

```css
body {
  font-family: var(--font-inter);
}

code {
  font-family: var(--font-roboto-mono);
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: './fonts/my-font.woff2',
  display: 'swap',
  variable: '--font-my-font',
})

// Multiple weights
const customFont = localFont({
  src: [
    {
      path: './fonts/custom-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/custom-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-custom',
})
```

### Font Display Strategies

```tsx
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Options: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
})
```

| Strategy | Behavior | Use When |
|----------|----------|----------|
| `swap` | Show fallback, swap when loaded | Best for performance |
| `block` | Block text render (max 3s) | Critical for brand |
| `fallback` | Brief block, swap if loaded quickly | Balanced approach |
| `optional` | Brief block, use fallback if slow | Performance critical |
| `auto` | Browser default | Let browser decide |

### Preload Fonts

Fonts are automatically preloaded. To disable:

```tsx
const inter = Inter({
  subsets: ['latin'],
  preload: false,
})
```

## Script Optimization

Control third-party script loading with next/script.

### Loading Strategies

```tsx
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* Load after page is interactive */}
      <Script src="https://example.com/script.js" strategy="afterInteractive" />

      {/* Load before page is interactive */}
      <Script src="https://example.com/critical.js" strategy="beforeInteractive" />

      {/* Load during idle time */}
      <Script src="https://example.com/analytics.js" strategy="lazyOnload" />

      {/* Inline script */}
      <Script id="inline-script" strategy="afterInteractive">
        {`console.log('Inline script')`}
      </Script>
    </>
  )
}
```

### Analytics Example

```tsx
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  )
}
```

### Load Event Handlers

```tsx
<Script
  src="https://example.com/script.js"
  onLoad={() => {
    console.log('Script loaded')
  }}
  onError={(e) => {
    console.error('Script failed to load', e)
  }}
/>
```

## Bundle Optimization

Reduce JavaScript bundle size for faster page loads.

### Analyze Bundle

```bash
# Install bundle analyzer
npm install @next/bundle-analyzer

# Configure
# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Next.js config
})

# Run analysis
ANALYZE=true npm run build
```

### Dynamic Imports

Code-split components:

```tsx
import dynamic from 'next/dynamic'

// Dynamic import - loads only when needed
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'))

// With loading state
const ChartComponent = dynamic(() => import('@/components/Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable server-side rendering if needed
})

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ChartComponent />
    </div>
  )
}
```

### Named Exports

```tsx
const MyComponent = dynamic(() =>
  import('@/components/MyComponent').then(mod => mod.MyComponent)
)
```

### Client-only Components

```tsx
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false, // Don't render on server
})
```

### Tree Shaking

Import only what you need:

```tsx
// ❌ BAD - Imports entire library
import _ from 'lodash'

// ✅ GOOD - Imports only debounce
import debounce from 'lodash/debounce'

// ✅ GOOD - Named import (if library supports tree shaking)
import { debounce } from 'lodash-es'
```

### Modularize Dependencies

Configure package imports:

```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['icon-library', 'lucide-react'],
  },
}
```

### Remove Unused Code

```js
// next.config.js
module.exports = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

## Performance Monitoring

### Web Vitals

Built-in web vitals reporting:

```tsx
// app/layout.tsx or app/page.tsx
export function reportWebVitals(metric) {
  console.log(metric)

  // Send to analytics
  if (metric.label === 'web-vital') {
    analytics.track(metric.name, metric.value)
  }
}
```

### Custom Performance Tracking

```tsx
// lib/analytics.ts
export function trackPerformance(metric: {
  name: string
  value: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
}) {
  // Send to your analytics service
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  })
}

// app/layout.tsx
export function reportWebVitals(metric) {
  trackPerformance(metric)
}
```

### Core Web Vitals

Monitor key metrics:
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

### Improve LCP

```tsx
// 1. Optimize images
<Image src="/hero.jpg" alt="Hero" priority />

// 2. Preload critical assets
<link rel="preload" href="/critical.css" as="style" />

// 3. Use Server Components for data fetching
async function getData() {
  return fetch('...').then(r => r.json())
}
```

### Improve FID

```tsx
// 1. Reduce JavaScript bundle
const Chart = dynamic(() => import('@/components/Chart'))

// 2. Use Server Components
// Default to Server Components, add 'use client' only when needed

// 3. Defer non-critical JavaScript
<Script src="/analytics.js" strategy="lazyOnload" />
```

### Improve CLS

```tsx
// 1. Set dimensions on images
<Image src="/hero.jpg" width={1200} height={600} alt="Hero" />

// 2. Reserve space for dynamic content
<div style={{ minHeight: '200px' }}>
  <Suspense fallback={<Skeleton />}>
    <DynamicContent />
  </Suspense>
</div>

// 3. Use font-display: swap
const inter = Inter({ display: 'swap' })
```

## Advanced Optimizations

### Streaming and Suspense

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Stream this section separately */}
      <Suspense fallback={<LoadingSkeleton />}>
        <SlowComponent />
      </Suspense>

      {/* Stream this section separately */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AnotherSlowComponent />
      </Suspense>
    </div>
  )
}
```

### Parallel Data Fetching

```tsx
async function getData() {
  // Parallel fetching
  const [posts, users, comments] = await Promise.all([
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/users').then(r => r.json()),
    fetch('/api/comments').then(r => r.json()),
  ])

  return { posts, users, comments }
}
```

### Partial Prerendering (Experimental)

```tsx
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
}

// Combine static and dynamic content
export default async function Page() {
  return (
    <div>
      {/* Static shell */}
      <header>My App</header>

      {/* Dynamic content */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}
```

### Route Prefetching

```tsx
import Link from 'next/link'

// Automatic prefetching
<Link href="/dashboard">Dashboard</Link>

// Disable prefetching
<Link href="/settings" prefetch={false}>Settings</Link>

// Manual prefetch
'use client'
import { useRouter } from 'next/navigation'

function Navigation() {
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

### Middleware Edge Runtime

```tsx
// middleware.ts
export const config = {
  runtime: 'edge', // Use Edge Runtime for faster response
}

export function middleware(request) {
  return NextResponse.next()
}
```

## Best Practices Checklist

### Images
- [ ] Use next/image for all images
- [ ] Set priority on above-fold images
- [ ] Configure remote image domains
- [ ] Use appropriate sizes attribute
- [ ] Set explicit width/height

### Fonts
- [ ] Use next/font for all fonts
- [ ] Set display: 'swap' for performance
- [ ] Limit number of font weights
- [ ] Use variable fonts when possible

### Scripts
- [ ] Use next/script for third-party scripts
- [ ] Choose appropriate loading strategy
- [ ] Load analytics scripts with lazyOnload
- [ ] Avoid inline scripts in components

### Bundle
- [ ] Analyze bundle size regularly
- [ ] Use dynamic imports for heavy components
- [ ] Tree-shake unused dependencies
- [ ] Remove console logs in production
- [ ] Optimize imports (specific vs. full library)

### Caching
- [ ] Choose appropriate cache strategy per route
- [ ] Use ISR for mostly-static content
- [ ] Implement tag-based revalidation
- [ ] Monitor cache hit rates

### Components
- [ ] Default to Server Components
- [ ] Move Client Components down the tree
- [ ] Use Suspense for loading states
- [ ] Implement error boundaries

### Data Fetching
- [ ] Fetch data in Server Components
- [ ] Use parallel fetching when possible
- [ ] Implement proper error handling
- [ ] Use Server Actions for mutations

### Monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor bundle size
- [ ] Test on real devices
- [ ] Use Lighthouse for audits
- [ ] Set performance budgets
