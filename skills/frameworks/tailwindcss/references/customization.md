# Tailwind CSS Customization & Theme Configuration

Complete guide to customizing Tailwind CSS themes, colors, fonts, and creating custom utilities.

## Table of Contents

- [Theme Customization with @theme](#theme-customization-with-theme)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing Scale](#spacing-scale)
- [Breakpoints](#breakpoints)
- [Custom Utilities](#custom-utilities)
- [Custom Variants](#custom-variants)
- [Plugins](#plugins)
- [Legacy tailwind.config.js](#legacy-tailwindconfigjs)

## Theme Customization with @theme

Tailwind v4+ uses the `@theme` directive in your CSS file for theme customization. This replaces the old `tailwind.config.js` approach.

### Basic Theme Setup

```css
@import "tailwindcss";

@theme {
  /* Your custom theme tokens */
}
```

### Complete Theme Example

```css
@import "tailwindcss";

@theme {
  /* ==================== COLORS ==================== */

  /* Custom brand colors */
  --color-brand-50: oklch(0.97 0.02 264);
  --color-brand-100: oklch(0.94 0.05 264);
  --color-brand-200: oklch(0.88 0.10 264);
  --color-brand-300: oklch(0.78 0.15 264);
  --color-brand-400: oklch(0.68 0.20 264);
  --color-brand-500: oklch(0.55 0.22 264);
  --color-brand-600: oklch(0.45 0.20 264);
  --color-brand-700: oklch(0.38 0.18 264);
  --color-brand-800: oklch(0.30 0.16 264);
  --color-brand-900: oklch(0.25 0.15 264);
  --color-brand-950: oklch(0.18 0.10 264);

  /* Accent colors */
  --color-accent-light: oklch(0.85 0.15 180);
  --color-accent-dark: oklch(0.45 0.18 180);

  /* Semantic colors */
  --color-success: oklch(0.65 0.20 145);
  --color-warning: oklch(0.75 0.18 85);
  --color-error: oklch(0.60 0.22 25);
  --color-info: oklch(0.60 0.20 250);

  /* ==================== FONTS ==================== */

  /* Font families */
  --font-display: "Satoshi", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Custom font sizes */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */
  --font-size-5xl: 3rem;       /* 48px */
  --font-size-display: 4rem;   /* 64px */

  /* Line heights */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* ==================== SPACING ==================== */

  /* Custom spacing values */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0.5: 0.125rem;   /* 2px */
  --spacing-1: 0.25rem;      /* 4px */
  --spacing-2: 0.5rem;       /* 8px */
  --spacing-3: 0.75rem;      /* 12px */
  --spacing-4: 1rem;         /* 16px */
  --spacing-5: 1.25rem;      /* 20px */
  --spacing-6: 1.5rem;       /* 24px */
  --spacing-8: 2rem;         /* 32px */
  --spacing-10: 2.5rem;      /* 40px */
  --spacing-12: 3rem;        /* 48px */
  --spacing-16: 4rem;        /* 64px */
  --spacing-20: 5rem;        /* 80px */
  --spacing-24: 6rem;        /* 96px */
  --spacing-32: 8rem;        /* 128px */

  /* Custom semantic spacing */
  --spacing-navbar: 4.5rem;
  --spacing-sidebar: 16rem;
  --spacing-section: 8rem;
  --spacing-card: 1.5rem;

  /* ==================== BREAKPOINTS ==================== */

  /* Custom breakpoints */
  --breakpoint-xs: 20rem;      /* 320px */
  --breakpoint-sm: 40rem;      /* 640px */
  --breakpoint-md: 48rem;      /* 768px */
  --breakpoint-lg: 64rem;      /* 1024px */
  --breakpoint-xl: 80rem;      /* 1280px */
  --breakpoint-2xl: 96rem;     /* 1536px */
  --breakpoint-3xl: 120rem;    /* 1920px */
  --breakpoint-4xl: 160rem;    /* 2560px */

  /* ==================== SHADOWS ==================== */

  /* Custom shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 20px rgba(139, 92, 246, 0.3);
  --shadow-brutal: 4px 4px 0 0 rgba(0, 0, 0, 1);

  /* ==================== BORDER RADIUS ==================== */

  --radius-none: 0;
  --radius-sm: 0.125rem;     /* 2px */
  --radius-base: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;     /* 6px */
  --radius-lg: 0.5rem;       /* 8px */
  --radius-xl: 0.75rem;      /* 12px */
  --radius-2xl: 1rem;        /* 16px */
  --radius-3xl: 1.5rem;      /* 24px */
  --radius-full: 9999px;

  /* ==================== Z-INDEX ==================== */

  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;

  /* ==================== TRANSITIONS ==================== */

  --transition-fast: 150ms;
  --transition-base: 200ms;
  --transition-slow: 300ms;
  --transition-slower: 500ms;
}
```

## Color System

### Using OKLCH Colors (Recommended)

OKLCH is the modern, perceptually uniform color space:

```css
@theme {
  /* OKLCH: oklch(lightness chroma hue / alpha) */
  --color-primary-500: oklch(0.55 0.22 264);
  --color-primary-500-alpha: oklch(0.55 0.22 264 / 0.5);

  /* Lightness: 0 (black) to 1 (white) */
  /* Chroma: 0 (gray) to 0.4+ (vibrant) */
  /* Hue: 0-360 (color wheel) */
}
```

**Benefits of OKLCH:**
- Perceptually uniform (equal numeric changes = equal visual changes)
- Better color interpolation in gradients
- More accurate brightness across hues
- Future-proof (CSS standard)

### Other Color Formats

```css
@theme {
  /* Hex colors */
  --color-brand-500: #3b82f6;

  /* RGB colors */
  --color-brand-500: rgb(59 130 246);
  --color-brand-500-alpha: rgb(59 130 246 / 0.5);

  /* HSL colors */
  --color-brand-500: hsl(217 91% 60%);
  --color-brand-500-alpha: hsl(217 91% 60% / 0.5);
}
```

### Creating Color Palettes

Generate a full color palette from a base color:

```css
@theme {
  /* Base color */
  --color-brand: oklch(0.55 0.22 264);

  /* Generate shades by adjusting lightness */
  --color-brand-50: oklch(0.97 0.02 264);   /* Very light */
  --color-brand-100: oklch(0.94 0.05 264);
  --color-brand-200: oklch(0.88 0.10 264);
  --color-brand-300: oklch(0.78 0.15 264);
  --color-brand-400: oklch(0.68 0.20 264);
  --color-brand-500: oklch(0.55 0.22 264);  /* Base */
  --color-brand-600: oklch(0.45 0.20 264);
  --color-brand-700: oklch(0.38 0.18 264);
  --color-brand-800: oklch(0.30 0.16 264);
  --color-brand-900: oklch(0.25 0.15 264);
  --color-brand-950: oklch(0.18 0.10 264);  /* Very dark */
}
```

**Tools for generating palettes:**
- https://uicolors.app - Generate Tailwind palettes
- https://oklch.com - OKLCH color picker
- https://www.colorbox.io - Palette generator

### Semantic Color Names

```css
@theme {
  /* Semantic naming for better maintainability */
  --color-primary-*: /* Your main brand color palette */
  --color-secondary-*: /* Secondary brand color */
  --color-accent-*: /* Accent color */
  --color-neutral-*: /* Grays */

  --color-success-*: /* Success states (green) */
  --color-warning-*: /* Warning states (yellow) */
  --color-error-*: /* Error states (red) */
  --color-info-*: /* Info states (blue) */
}
```

### Dark Mode Colors

```css
@theme {
  /* Light mode colors (default) */
  --color-background: oklch(1 0 0);          /* White */
  --color-foreground: oklch(0.2 0 0);        /* Near black */
  --color-border: oklch(0.85 0 0);           /* Light gray */

  /* Dark mode colors */
  @media (prefers-color-scheme: dark) {
    --color-background: oklch(0.15 0 0);     /* Dark gray */
    --color-foreground: oklch(0.95 0 0);     /* Off white */
    --color-border: oklch(0.25 0 0);         /* Dark border */
  }
}
```

## Typography

### Custom Font Families

```css
@theme {
  /* Import fonts first (in HTML or CSS) */
  --font-display: "Satoshi", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}
```

**Usage:**
```html
<h1 class="font-display text-4xl">Display Font</h1>
<p class="font-body">Body text</p>
<code class="font-mono">Code block</code>
```

### Font Loading

**Option 1: Google Fonts (CDN)**
```html
<!-- In HTML <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Option 2: Self-Hosted with @font-face**
```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/inter-v12-latin-regular.woff2') format('woff2');
}

@theme {
  --font-body: "Inter", system-ui, sans-serif;
}
```

**Option 3: Next.js (next/font)**
```javascript
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

```css
@theme {
  --font-body: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-mono), monospace;
}
```

### Custom Font Sizes with Line Heights

```css
@theme {
  /* Font size with default line height */
  --font-size-2xl: 1.5rem;
  --line-height-2xl: 2rem;

  /* Or use slash notation */
  --text-2xl: 1.5rem / 2rem;
}
```

**Usage:**
```html
<h1 class="text-2xl">Automatic line height</h1>
<h1 class="text-2xl/tight">Override with tight line height</h1>
```

## Spacing Scale

### Custom Spacing Values

```css
@theme {
  /* Extend default spacing scale */
  --spacing-18: calc(var(--spacing) * 18);  /* 4.5rem / 72px */
  --spacing-22: calc(var(--spacing) * 22);  /* 5.5rem / 88px */

  /* Semantic spacing */
  --spacing-navbar-height: 4rem;
  --spacing-sidebar-width: 16rem;
  --spacing-content-max: 65ch;
}
```

**Usage:**
```html
<nav class="h-navbar-height">Navbar</nav>
<aside class="w-sidebar-width">Sidebar</aside>
<div class="max-w-content-max">Content</div>
```

## Breakpoints

### Custom Responsive Breakpoints

```css
@theme {
  /* Add custom breakpoints */
  --breakpoint-xs: 20rem;      /* 320px - Small phones */
  --breakpoint-3xl: 96rem;     /* 1536px - Large desktops */
  --breakpoint-4xl: 120rem;    /* 1920px - Extra large */
  --breakpoint-tablet: 48rem;  /* 768px - Semantic name */
}
```

**Usage:**
```html
<div class="grid-cols-1 tablet:grid-cols-2 3xl:grid-cols-4">
  Responsive grid
</div>
```

### Container Queries

```css
@theme {
  /* Custom container sizes */
  --container-2xs: 16rem;   /* 256px */
  --container-xs: 20rem;    /* 320px */
  --container-sm: 24rem;    /* 384px */
  --container-md: 28rem;    /* 448px */
  --container-lg: 32rem;    /* 512px */
  --container-xl: 36rem;    /* 576px */
  --container-2xl: 42rem;   /* 672px */
}
```

**Usage:**
```html
<div class="@container">
  <div class="@md:flex @lg:grid-cols-2">
    Responds to parent container, not viewport
  </div>
</div>
```

## Custom Utilities

### Creating Custom Utility Classes

```css
@utility content-auto {
  content-visibility: auto;
}

@utility scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

@utility scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@utility text-balance {
  text-wrap: balance;
}

@utility text-pretty {
  text-wrap: pretty;
}
```

**Usage:**
```html
<div class="content-auto">Content visibility optimization</div>
<div class="scrollbar-hide">Hidden scrollbar</div>
<h1 class="text-balance">Balanced text wrapping</h1>
<p class="text-pretty">Pretty text wrapping</p>
```

### Parameterized Utilities

```css
@utility tab-* {
  tab-size: var(--tab-size-*);
}

@utility accent-* {
  accent-color: var(--color-*);
}
```

**Usage:**
```html
<pre class="tab-4">Code with 4-space tabs</pre>
<input type="checkbox" class="accent-blue-500">
```

### Layer-Based Utilities

```css
@layer utilities {
  .text-shadow-sm {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .text-shadow-md {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .clip-path-circle {
    clip-path: circle(50%);
  }
}
```

## Custom Variants

### Creating Custom Variants

```css
/* Data attribute variants */
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
@custom-variant theme-ocean (&:where([data-theme="ocean"] *));

/* ARIA variants */
@custom-variant aria-checked (&[aria-checked="true"]);
@custom-variant aria-expanded (&[aria-expanded="true"]);
@custom-variant aria-disabled (&[aria-disabled="true"]);

/* Custom state variants */
@custom-variant optional (&:optional);
@custom-variant in-range (&:in-range);
@custom-variant out-of-range (&:out-of-range);

/* Nested element variants */
@custom-variant hocus (&:hover, &:focus);
```

**Usage:**
```html
<div data-theme="midnight">
  <div class="bg-white theme-midnight:bg-navy-900">
    Changes when data-theme="midnight"
  </div>
</div>

<button aria-expanded="true" class="aria-expanded:bg-blue-100">
  Expandable button
</button>

<button class="hocus:bg-gray-100">
  Hover or focus
</button>
```

## Plugins

### Official Tailwind Plugins

```bash
# Install plugins
npm install @tailwindcss/typography
npm install @tailwindcss/forms
npm install @tailwindcss/aspect-ratio
npm install @tailwindcss/container-queries
```

**Usage in CSS:**
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/container-queries";
```

### Typography Plugin

```html
<article class="prose lg:prose-xl">
  <h1>Article Title</h1>
  <p>Automatically styled prose content...</p>
</article>

<!-- Dark mode -->
<article class="prose dark:prose-invert">
  Content
</article>

<!-- Color themes -->
<article class="prose prose-blue">
  Blue links and accents
</article>
```

### Forms Plugin

Automatically styles form elements with better defaults:

```html
<input type="text" class="form-input">
<select class="form-select">
<textarea class="form-textarea">
<input type="checkbox" class="form-checkbox">
<input type="radio" class="form-radio">
```

### Creating Custom Plugins

```javascript
// tailwind.config.js (if using legacy config)
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addUtilities, addComponents, theme }) {
      // Add custom utilities
      addUtilities({
        '.text-stroke': {
          '-webkit-text-stroke': '1px black',
        },
      })

      // Add custom components
      addComponents({
        '.btn': {
          padding: theme('spacing.4'),
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.semibold'),
        },
      })
    })
  ]
}
```

## Legacy tailwind.config.js

For older Tailwind versions (v3 and below), use `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        'navbar': '4rem',
      },
      screens: {
        '3xl': '1920px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

### Content Configuration (v3)

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  // Add dynamic class names to safelist
  safelist: [
    'bg-red-500',
    'bg-blue-500',
    {
      pattern: /bg-(red|blue|green)-(100|500|900)/,
    },
  ],
}
```

## Best Practices

### 1. Use Semantic Names

```css
/* Good: Semantic naming */
--color-primary-500
--color-success-500
--spacing-card
--breakpoint-tablet

/* Avoid: Generic naming */
--color-1
--spacing-custom
--breakpoint-1
```

### 2. Maintain Consistent Scales

Keep spacing, colors, and typography scales consistent:

```css
/* Good: Consistent scale */
--spacing-1: 0.25rem;
--spacing-2: 0.5rem;
--spacing-4: 1rem;
--spacing-8: 2rem;

/* Avoid: Random values */
--spacing-a: 0.3rem;
--spacing-b: 0.7rem;
--spacing-c: 1.1rem;
```

### 3. Document Custom Tokens

```css
@theme {
  /* Brand Colors - Primary palette for main UI elements */
  --color-brand-500: oklch(0.55 0.22 264);

  /* Semantic Spacing - Common layout measurements */
  --spacing-navbar: 4rem;  /* Fixed navbar height */
  --spacing-sidebar: 16rem; /* Sidebar width on desktop */
}
```

### 4. Test Dark Mode

Always test custom colors in dark mode:

```css
@theme {
  --color-background: white;

  @media (prefers-color-scheme: dark) {
    --color-background: oklch(0.15 0 0);
  }
}
```

## Migration from v3 to v4

**From tailwind.config.js:**
```javascript
// OLD: tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#3b82f6',
      },
    },
  },
}
```

**To @theme directive:**
```css
/* NEW: CSS file */
@import "tailwindcss";

@theme {
  --color-brand: #3b82f6;
}
```

For complete customization documentation, visit https://tailwindcss.com/docs/theme
