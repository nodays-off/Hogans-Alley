# Customization & Theming

Complete guide to customizing shadcn/ui components, themes, and implementing dark mode.

## Table of Contents

- [Dark Mode](#dark-mode)
- [Color Customization](#color-customization)
- [Component Customization](#component-customization)
- [Typography & Fonts](#typography--fonts)
- [Framework-Specific Setup](#framework-specific-setup)

## Dark Mode

### Next.js App Router Setup

**1. Install next-themes:**

```bash
npm install next-themes
```

**2. Create theme provider component:**

```tsx
// components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**3. Wrap your app:**

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**4. Create theme toggle component:**

```tsx
// components/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Simple toggle button:**

```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### Next.js Pages Router Setup

```tsx
// pages/_app.tsx
import { ThemeProvider } from "next-themes"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

### Vite + React Setup

```tsx
// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { ThemeProvider } from "@/components/theme-provider"
import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
```

### Accessing Theme in Components

```tsx
"use client"

import { useTheme } from "next-themes"

export function MyComponent() {
  const { theme, setTheme, systemTheme } = useTheme()

  // Current theme: "light", "dark", or "system"
  console.log(theme)

  // Resolved theme (when theme is "system")
  console.log(systemTheme)

  return (
    <div>
      Current theme: {theme}
    </div>
  )
}
```

## Color Customization

### CSS Variables Approach

shadcn/ui uses CSS variables for theming. Edit `app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

**Color format**: HSL values without the `hsl()` wrapper
- Format: `H S% L%` (e.g., `222.2 47.4% 11.2%`)

### Tailwind Config Approach

Map CSS variables to Tailwind classes in `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### Changing Base Colors

To change the base color scheme, update the HSL values:

**Example: Blue to Purple**

```css
:root {
  /* Change primary from blue to purple */
  --primary: 270 80% 50%;  /* Purple */
  --primary-foreground: 0 0% 100%;
}

.dark {
  --primary: 270 70% 60%;  /* Lighter purple for dark mode */
  --primary-foreground: 0 0% 100%;
}
```

### Using Theme Colors

Components automatically use theme colors:

```tsx
// Uses --primary color
<Button variant="default">Primary Button</Button>

// Uses --secondary color
<Button variant="secondary">Secondary Button</Button>

// Uses --destructive color
<Button variant="destructive">Delete</Button>

// Uses theme colors in custom components
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Custom Color Scheme

Add custom color schemes beyond light/dark:

```css
/* globals.css */
[data-theme="ocean"] {
  --background: 210 100% 97%;
  --foreground: 210 50% 10%;
  --primary: 200 95% 45%;
  --primary-foreground: 0 0% 100%;
  /* ... other colors */
}

[data-theme="sunset"] {
  --background: 30 100% 98%;
  --foreground: 30 50% 10%;
  --primary: 15 85% 50%;
  --primary-foreground: 0 0% 100%;
  /* ... other colors */
}
```

```tsx
// Usage
<ThemeProvider attribute="data-theme" defaultTheme="ocean">
  {children}
</ThemeProvider>
```

## Component Customization

### Modifying Variants

Components use Class Variance Authority (CVA) for variants. Edit directly in `components/ui/`:

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // Add custom variant
        gradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",

        // Add custom size
        xl: "h-14 rounded-md px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Usage:**

```tsx
<Button variant="gradient">Gradient Button</Button>
<Button size="xl">Extra Large</Button>
```

### Changing Border Radius

Globally adjust border radius:

```css
/* globals.css */
:root {
  --radius: 0.5rem;  /* Default */
}

/* For sharper corners */
:root {
  --radius: 0.25rem;
}

/* For more rounded */
:root {
  --radius: 1rem;
}

/* For fully rounded */
:root {
  --radius: 9999px;
}
```

### Changing Default Styles

Modify any component directly:

```tsx
// components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",

          // Add custom styles
          "transition-all duration-200",
          "hover:border-primary/50",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

## Typography & Fonts

### Using Custom Fonts

**Next.js with next/font:**

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**Update Tailwind config:**

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
}
```

**Update globals.css:**

```css
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
    font-family: var(--font-sans);
  }
}
```

### Typography Utilities

Add typography utilities to `globals.css`:

```css
@layer base {
  h1 {
    @apply scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl;
  }

  h2 {
    @apply scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0;
  }

  h3 {
    @apply scroll-m-20 text-2xl font-semibold tracking-tight;
  }

  h4 {
    @apply scroll-m-20 text-xl font-semibold tracking-tight;
  }

  p {
    @apply leading-7 [&:not(:first-child)]:mt-6;
  }

  blockquote {
    @apply mt-6 border-l-2 pl-6 italic;
  }
}
```

## Framework-Specific Setup

### Tailwind v4 (New)

shadcn/ui now supports Tailwind CSS v4:

```bash
npx shadcn@latest init --tailwind-v4
```

**globals.css with Tailwind v4:**

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(0% 0 0);
  --color-foreground: oklch(98% 0 0);
  /* ... */
}
```

### Vite Configuration

```ts
// vite.config.ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Remix Configuration

```ts
// remix.config.js
export default {
  tailwind: true,
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
}
```

### Astro Configuration

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
})
```
