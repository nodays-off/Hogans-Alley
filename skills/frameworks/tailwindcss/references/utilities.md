# Tailwind CSS Utility Class Reference

Complete reference of all Tailwind CSS utility classes organized by category.

## Table of Contents

- [Layout](#layout)
- [Flexbox & Grid](#flexbox--grid)
- [Spacing](#spacing)
- [Sizing](#sizing)
- [Typography](#typography)
- [Backgrounds](#backgrounds)
- [Borders](#borders)
- [Effects](#effects)
- [Filters](#filters)
- [Tables](#tables)
- [Transitions & Animations](#transitions--animations)
- [Transforms](#transforms)
- [Interactivity](#interactivity)
- [SVG](#svg)
- [Accessibility](#accessibility)

## Layout

### Display

```html
<!-- Block & Inline -->
<div class="block">Block element</div>
<div class="inline-block">Inline block</div>
<div class="inline">Inline</div>
<div class="hidden">Hidden</div>

<!-- Flex -->
<div class="flex">Flex container</div>
<div class="inline-flex">Inline flex</div>

<!-- Grid -->
<div class="grid">Grid container</div>
<div class="inline-grid">Inline grid</div>

<!-- Table -->
<div class="table">Table</div>
<div class="table-row">Table row</div>
<div class="table-cell">Table cell</div>

<!-- Other -->
<div class="contents">Remove from normal flow</div>
<div class="flow-root">Create block formatting context</div>
```

### Position

```html
<div class="static">Static (default)</div>
<div class="fixed">Fixed positioning</div>
<div class="absolute">Absolute positioning</div>
<div class="relative">Relative positioning</div>
<div class="sticky">Sticky positioning</div>

<!-- Positioning coordinates -->
<div class="top-0">Top: 0</div>
<div class="right-4">Right: 1rem</div>
<div class="bottom-8">Bottom: 2rem</div>
<div class="left-12">Left: 3rem</div>
<div class="inset-0">All sides: 0</div>
<div class="inset-x-4">Left & right: 1rem</div>
<div class="inset-y-8">Top & bottom: 2rem</div>
```

### Overflow

```html
<div class="overflow-auto">Auto scrollbars</div>
<div class="overflow-hidden">Hide overflow</div>
<div class="overflow-visible">Show overflow</div>
<div class="overflow-scroll">Always scrollbars</div>
<div class="overflow-x-auto">Horizontal scroll</div>
<div class="overflow-y-auto">Vertical scroll</div>

<!-- Text overflow -->
<div class="truncate">Truncate with ellipsis</div>
<div class="text-ellipsis">Ellipsis</div>
<div class="text-clip">Clip text</div>
```

### Z-Index

```html
<div class="z-0">z-index: 0</div>
<div class="z-10">z-index: 10</div>
<div class="z-20">z-index: 20</div>
<div class="z-30">z-index: 30</div>
<div class="z-40">z-index: 40</div>
<div class="z-50">z-index: 50</div>
<div class="z-auto">z-index: auto</div>
```

## Flexbox & Grid

### Flexbox

```html
<!-- Direction -->
<div class="flex flex-row">Row (default)</div>
<div class="flex flex-row-reverse">Row reversed</div>
<div class="flex flex-col">Column</div>
<div class="flex flex-col-reverse">Column reversed</div>

<!-- Wrap -->
<div class="flex flex-wrap">Wrap</div>
<div class="flex flex-wrap-reverse">Wrap reversed</div>
<div class="flex flex-nowrap">No wrap</div>

<!-- Align Items (cross axis) -->
<div class="flex items-start">Start</div>
<div class="flex items-center">Center</div>
<div class="flex items-end">End</div>
<div class="flex items-baseline">Baseline</div>
<div class="flex items-stretch">Stretch (default)</div>

<!-- Justify Content (main axis) -->
<div class="flex justify-start">Start</div>
<div class="flex justify-center">Center</div>
<div class="flex justify-end">End</div>
<div class="flex justify-between">Space between</div>
<div class="flex justify-around">Space around</div>
<div class="flex justify-evenly">Space evenly</div>

<!-- Align Content (multiple lines) -->
<div class="flex content-start">Start</div>
<div class="flex content-center">Center</div>
<div class="flex content-end">End</div>
<div class="flex content-between">Space between</div>
<div class="flex content-around">Space around</div>
<div class="flex content-evenly">Space evenly</div>

<!-- Flex Item -->
<div class="flex-1">flex: 1 1 0%</div>
<div class="flex-auto">flex: 1 1 auto</div>
<div class="flex-initial">flex: 0 1 auto</div>
<div class="flex-none">flex: none</div>

<!-- Flex Grow & Shrink -->
<div class="grow">flex-grow: 1</div>
<div class="grow-0">flex-grow: 0</div>
<div class="shrink">flex-shrink: 1</div>
<div class="shrink-0">flex-shrink: 0</div>

<!-- Align Self -->
<div class="self-auto">auto</div>
<div class="self-start">Start</div>
<div class="self-center">Center</div>
<div class="self-end">End</div>
<div class="self-stretch">Stretch</div>

<!-- Order -->
<div class="order-1">Order: 1</div>
<div class="order-first">Order: -9999</div>
<div class="order-last">Order: 9999</div>
```

### Grid

```html
<!-- Grid Template Columns -->
<div class="grid grid-cols-1">1 column</div>
<div class="grid grid-cols-2">2 columns</div>
<div class="grid grid-cols-3">3 columns</div>
<div class="grid grid-cols-12">12 columns</div>
<div class="grid grid-cols-none">No columns</div>

<!-- Custom columns -->
<div class="grid grid-cols-[200px_1fr_2fr]">Custom columns</div>

<!-- Grid Template Rows -->
<div class="grid grid-rows-1">1 row</div>
<div class="grid grid-rows-3">3 rows</div>
<div class="grid grid-rows-6">6 rows</div>

<!-- Grid Column Span -->
<div class="col-span-1">Span 1 column</div>
<div class="col-span-2">Span 2 columns</div>
<div class="col-span-full">Span all columns</div>
<div class="col-start-1">Start at column 1</div>
<div class="col-end-3">End at column 3</div>

<!-- Grid Row Span -->
<div class="row-span-1">Span 1 row</div>
<div class="row-span-2">Span 2 rows</div>
<div class="row-span-full">Span all rows</div>

<!-- Grid Auto Flow -->
<div class="grid grid-flow-row">Row (default)</div>
<div class="grid grid-flow-col">Column</div>
<div class="grid grid-flow-dense">Dense</div>

<!-- Grid Auto Columns/Rows -->
<div class="grid auto-cols-auto">Auto columns</div>
<div class="grid auto-cols-min">Min columns</div>
<div class="grid auto-cols-max">Max columns</div>
<div class="grid auto-cols-fr">1fr columns</div>

<!-- Gap -->
<div class="grid gap-4">Gap: 1rem (all)</div>
<div class="grid gap-x-4">Column gap: 1rem</div>
<div class="grid gap-y-4">Row gap: 1rem</div>
<div class="grid gap-0">No gap</div>
```

### Place Content

```html
<!-- Place Content (grid/flex) -->
<div class="place-content-center">Center</div>
<div class="place-content-start">Start</div>
<div class="place-content-end">End</div>
<div class="place-content-between">Space between</div>
<div class="place-content-around">Space around</div>
<div class="place-content-evenly">Space evenly</div>
<div class="place-content-stretch">Stretch</div>

<!-- Place Items -->
<div class="place-items-center">Center</div>
<div class="place-items-start">Start</div>
<div class="place-items-end">End</div>
<div class="place-items-stretch">Stretch</div>

<!-- Place Self -->
<div class="place-self-auto">Auto</div>
<div class="place-self-start">Start</div>
<div class="place-self-center">Center</div>
<div class="place-self-end">End</div>
<div class="place-self-stretch">Stretch</div>
```

## Spacing

### Padding

```html
<!-- All sides -->
<div class="p-0">No padding</div>
<div class="p-1">0.25rem</div>
<div class="p-2">0.5rem</div>
<div class="p-4">1rem</div>
<div class="p-8">2rem</div>
<div class="p-16">4rem</div>

<!-- Horizontal & Vertical -->
<div class="px-4">Horizontal: 1rem</div>
<div class="py-4">Vertical: 1rem</div>

<!-- Individual sides -->
<div class="pt-4">Top: 1rem</div>
<div class="pr-4">Right: 1rem</div>
<div class="pb-4">Bottom: 1rem</div>
<div class="pl-4">Left: 1rem</div>
```

### Margin

```html
<!-- All sides -->
<div class="m-0">No margin</div>
<div class="m-4">1rem</div>
<div class="m-auto">Auto (centering)</div>

<!-- Horizontal & Vertical -->
<div class="mx-4">Horizontal: 1rem</div>
<div class="my-4">Vertical: 1rem</div>
<div class="mx-auto">Center horizontally</div>

<!-- Individual sides -->
<div class="mt-4">Top: 1rem</div>
<div class="mr-4">Right: 1rem</div>
<div class="mb-4">Bottom: 1rem</div>
<div class="ml-4">Left: 1rem</div>

<!-- Negative margins -->
<div class="-m-4">Negative margin</div>
<div class="-mt-4">Negative top</div>
<div class="-mx-4">Negative horizontal</div>
```

### Space Between

```html
<!-- Horizontal space -->
<div class="flex space-x-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Vertical space -->
<div class="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Reverse -->
<div class="flex flex-row-reverse space-x-reverse space-x-4">
  Items with reversed spacing
</div>
```

## Sizing

### Width

```html
<!-- Fixed widths -->
<div class="w-0">Width: 0</div>
<div class="w-px">Width: 1px</div>
<div class="w-full">Width: 100%</div>
<div class="w-screen">Width: 100vw</div>
<div class="w-min">min-content</div>
<div class="w-max">max-content</div>
<div class="w-fit">fit-content</div>

<!-- Fractional widths -->
<div class="w-1/2">50%</div>
<div class="w-1/3">33.333%</div>
<div class="w-2/3">66.667%</div>
<div class="w-1/4">25%</div>
<div class="w-3/4">75%</div>

<!-- Spacing scale -->
<div class="w-4">1rem (16px)</div>
<div class="w-64">16rem (256px)</div>
<div class="w-96">24rem (384px)</div>

<!-- Custom -->
<div class="w-[500px]">Custom 500px</div>
```

### Min/Max Width

```html
<div class="min-w-0">min-width: 0</div>
<div class="min-w-full">min-width: 100%</div>
<div class="min-w-min">min-width: min-content</div>
<div class="min-w-max">min-width: max-content</div>

<div class="max-w-xs">max-width: 20rem</div>
<div class="max-w-sm">max-width: 24rem</div>
<div class="max-w-md">max-width: 28rem</div>
<div class="max-w-lg">max-width: 32rem</div>
<div class="max-w-xl">max-width: 36rem</div>
<div class="max-w-2xl">max-width: 42rem</div>
<div class="max-w-7xl">max-width: 80rem</div>
<div class="max-w-full">max-width: 100%</div>
<div class="max-w-screen-xl">max-width: 1280px</div>
```

### Height

```html
<!-- Fixed heights -->
<div class="h-0">Height: 0</div>
<div class="h-full">Height: 100%</div>
<div class="h-screen">Height: 100vh</div>
<div class="h-min">min-content</div>
<div class="h-max">max-content</div>
<div class="h-fit">fit-content</div>

<!-- Spacing scale -->
<div class="h-4">1rem</div>
<div class="h-64">16rem</div>
<div class="h-96">24rem</div>
```

### Min/Max Height

```html
<div class="min-h-0">min-height: 0</div>
<div class="min-h-full">min-height: 100%</div>
<div class="min-h-screen">min-height: 100vh</div>

<div class="max-h-full">max-height: 100%</div>
<div class="max-h-screen">max-height: 100vh</div>
<div class="max-h-96">max-height: 24rem</div>
```

## Typography

### Font Family

```html
<p class="font-sans">Sans-serif font</p>
<p class="font-serif">Serif font</p>
<p class="font-mono">Monospace font</p>
```

### Font Size

```html
<p class="text-xs">Extra small (0.75rem)</p>
<p class="text-sm">Small (0.875rem)</p>
<p class="text-base">Base (1rem)</p>
<p class="text-lg">Large (1.125rem)</p>
<p class="text-xl">Extra large (1.25rem)</p>
<p class="text-2xl">2XL (1.5rem)</p>
<p class="text-3xl">3XL (1.875rem)</p>
<p class="text-4xl">4XL (2.25rem)</p>
<p class="text-5xl">5XL (3rem)</p>
<p class="text-6xl">6XL (3.75rem)</p>
<p class="text-7xl">7XL (4.5rem)</p>
<p class="text-8xl">8XL (6rem)</p>
<p class="text-9xl">9XL (8rem)</p>

<!-- With line height -->
<p class="text-2xl/tight">2xl with tight line-height</p>
<p class="text-4xl/normal">4xl with normal line-height</p>
```

### Font Weight

```html
<p class="font-thin">100</p>
<p class="font-extralight">200</p>
<p class="font-light">300</p>
<p class="font-normal">400</p>
<p class="font-medium">500</p>
<p class="font-semibold">600</p>
<p class="font-bold">700</p>
<p class="font-extrabold">800</p>
<p class="font-black">900</p>
```

### Line Height

```html
<p class="leading-none">line-height: 1</p>
<p class="leading-tight">line-height: 1.25</p>
<p class="leading-snug">line-height: 1.375</p>
<p class="leading-normal">line-height: 1.5</p>
<p class="leading-relaxed">line-height: 1.625</p>
<p class="leading-loose">line-height: 2</p>
```

### Text Alignment

```html
<p class="text-left">Left aligned</p>
<p class="text-center">Center aligned</p>
<p class="text-right">Right aligned</p>
<p class="text-justify">Justified</p>
<p class="text-start">Start (i18n aware)</p>
<p class="text-end">End (i18n aware)</p>
```

### Text Color

```html
<p class="text-black">Black</p>
<p class="text-white">White</p>
<p class="text-gray-500">Gray 500</p>
<p class="text-blue-600">Blue 600</p>
<p class="text-red-500">Red 500</p>

<!-- With opacity -->
<p class="text-blue-500/50">50% opacity</p>
<p class="text-black/75">75% opacity</p>
```

### Text Decoration

```html
<p class="underline">Underlined</p>
<p class="overline">Overlined</p>
<p class="line-through">Line through</p>
<p class="no-underline">No underline</p>

<!-- Decoration style -->
<p class="decoration-solid">Solid</p>
<p class="decoration-double">Double</p>
<p class="decoration-dotted">Dotted</p>
<p class="decoration-dashed">Dashed</p>
<p class="decoration-wavy">Wavy</p>

<!-- Decoration color -->
<p class="underline decoration-blue-500">Blue underline</p>

<!-- Decoration thickness -->
<p class="underline decoration-1">1px</p>
<p class="underline decoration-2">2px</p>
<p class="underline decoration-4">4px</p>
```

### Text Transform

```html
<p class="uppercase">UPPERCASE</p>
<p class="lowercase">lowercase</p>
<p class="capitalize">Capitalize Each Word</p>
<p class="normal-case">Normal case</p>
```

### Other Text Utilities

```html
<!-- Letter spacing -->
<p class="tracking-tighter">Tighter</p>
<p class="tracking-tight">Tight</p>
<p class="tracking-normal">Normal</p>
<p class="tracking-wide">Wide</p>
<p class="tracking-wider">Wider</p>
<p class="tracking-widest">Widest</p>

<!-- Truncate -->
<p class="truncate">Long text truncated with ellipsis...</p>
<p class="line-clamp-2">Clamp to 2 lines</p>
<p class="line-clamp-3">Clamp to 3 lines</p>

<!-- Text indent -->
<p class="indent-4">Indented by 1rem</p>

<!-- Vertical align -->
<span class="align-baseline">Baseline</span>
<span class="align-top">Top</span>
<span class="align-middle">Middle</span>
<span class="align-bottom">Bottom</span>
<span class="align-text-top">Text top</span>
<span class="align-text-bottom">Text bottom</span>

<!-- Whitespace -->
<p class="whitespace-normal">Normal</p>
<p class="whitespace-nowrap">No wrap</p>
<p class="whitespace-pre">Pre</p>
<p class="whitespace-pre-line">Pre line</p>
<p class="whitespace-pre-wrap">Pre wrap</p>

<!-- Word break -->
<p class="break-normal">Normal</p>
<p class="break-words">Break words</p>
<p class="break-all">Break all</p>
```

## Backgrounds

### Background Color

```html
<div class="bg-white">White</div>
<div class="bg-black">Black</div>
<div class="bg-gray-500">Gray 500</div>
<div class="bg-blue-600">Blue 600</div>

<!-- With opacity -->
<div class="bg-blue-500/50">50% opacity</div>
<div class="bg-black/25">25% opacity</div>
```

### Background Gradients

```html
<!-- Linear gradients -->
<div class="bg-gradient-to-r from-blue-500 to-purple-600">
  Left to right gradient
</div>

<div class="bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
  Diagonal with middle color
</div>

<!-- Gradient directions -->
<div class="bg-gradient-to-t">To top</div>
<div class="bg-gradient-to-tr">To top right</div>
<div class="bg-gradient-to-r">To right</div>
<div class="bg-gradient-to-br">To bottom right</div>
<div class="bg-gradient-to-b">To bottom</div>
<div class="bg-gradient-to-bl">To bottom left</div>
<div class="bg-gradient-to-l">To left</div>
<div class="bg-gradient-to-tl">To top left</div>
```

### Background Image

```html
<div class="bg-[url('/img/hero.jpg')]">Background image</div>
<div class="bg-none">No background</div>
```

### Background Size

```html
<div class="bg-auto">Auto</div>
<div class="bg-cover">Cover</div>
<div class="bg-contain">Contain</div>
```

### Background Position

```html
<div class="bg-center">Center</div>
<div class="bg-top">Top</div>
<div class="bg-right-top">Right top</div>
<div class="bg-right">Right</div>
<div class="bg-right-bottom">Right bottom</div>
<div class="bg-bottom">Bottom</div>
<div class="bg-left-bottom">Left bottom</div>
<div class="bg-left">Left</div>
<div class="bg-left-top">Left top</div>
```

### Background Repeat

```html
<div class="bg-repeat">Repeat</div>
<div class="bg-no-repeat">No repeat</div>
<div class="bg-repeat-x">Repeat X</div>
<div class="bg-repeat-y">Repeat Y</div>
<div class="bg-repeat-round">Round</div>
<div class="bg-repeat-space">Space</div>
```

## Borders

### Border Width

```html
<div class="border">Default (1px all sides)</div>
<div class="border-0">No border</div>
<div class="border-2">2px all sides</div>
<div class="border-4">4px all sides</div>
<div class="border-8">8px all sides</div>

<!-- Individual sides -->
<div class="border-t">Top border</div>
<div class="border-r">Right border</div>
<div class="border-b">Bottom border</div>
<div class="border-l">Left border</div>
<div class="border-x">Horizontal borders</div>
<div class="border-y">Vertical borders</div>

<!-- Individual side thickness -->
<div class="border-t-2">Top 2px</div>
<div class="border-b-4">Bottom 4px</div>
```

### Border Color

```html
<div class="border border-gray-300">Gray border</div>
<div class="border border-blue-500">Blue border</div>
<div class="border border-red-600">Red border</div>

<!-- With opacity -->
<div class="border border-blue-500/50">50% opacity</div>

<!-- Individual sides -->
<div class="border-t-blue-500">Top blue</div>
<div class="border-r-red-500">Right red</div>
```

### Border Style

```html
<div class="border border-solid">Solid</div>
<div class="border border-dashed">Dashed</div>
<div class="border border-dotted">Dotted</div>
<div class="border border-double">Double</div>
<div class="border border-hidden">Hidden</div>
<div class="border border-none">None</div>
```

### Border Radius

```html
<div class="rounded">Default (0.25rem)</div>
<div class="rounded-none">No rounding</div>
<div class="rounded-sm">Small</div>
<div class="rounded-md">Medium</div>
<div class="rounded-lg">Large</div>
<div class="rounded-xl">Extra large</div>
<div class="rounded-2xl">2XL</div>
<div class="rounded-3xl">3XL</div>
<div class="rounded-full">Fully rounded</div>

<!-- Individual corners -->
<div class="rounded-t-lg">Top rounded</div>
<div class="rounded-r-lg">Right rounded</div>
<div class="rounded-b-lg">Bottom rounded</div>
<div class="rounded-l-lg">Left rounded</div>
<div class="rounded-tl-lg">Top left</div>
<div class="rounded-tr-lg">Top right</div>
<div class="rounded-br-lg">Bottom right</div>
<div class="rounded-bl-lg">Bottom left</div>
```

### Outline

```html
<div class="outline">Default outline</div>
<div class="outline-0">No outline</div>
<div class="outline-2">2px outline</div>
<div class="outline-4">4px outline</div>

<!-- Outline color -->
<div class="outline outline-blue-500">Blue outline</div>

<!-- Outline style -->
<div class="outline outline-dashed">Dashed</div>
<div class="outline outline-dotted">Dotted</div>

<!-- Outline offset -->
<div class="outline outline-offset-0">No offset</div>
<div class="outline outline-offset-2">2px offset</div>
```

### Ring (Focus States)

```html
<button class="focus:ring">Focus ring</button>
<button class="focus:ring-2">2px ring</button>
<button class="focus:ring-4">4px ring</button>

<!-- Ring color -->
<button class="focus:ring-2 focus:ring-blue-500">Blue ring</button>

<!-- Ring offset -->
<button class="focus:ring-2 focus:ring-offset-2">With offset</button>
<button class="focus:ring-2 focus:ring-offset-4 focus:ring-offset-white">
  White offset
</button>
```

## Effects

### Box Shadow

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow">Default shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>
<div class="shadow-2xl">2XL shadow</div>
<div class="shadow-inner">Inner shadow</div>
<div class="shadow-none">No shadow</div>

<!-- Custom shadow color -->
<div class="shadow-lg shadow-blue-500/50">Colored shadow</div>
```

### Opacity

```html
<div class="opacity-0">Fully transparent</div>
<div class="opacity-25">25% opacity</div>
<div class="opacity-50">50% opacity</div>
<div class="opacity-75">75% opacity</div>
<div class="opacity-100">Fully opaque</div>
```

### Mix Blend Mode

```html
<div class="mix-blend-normal">Normal</div>
<div class="mix-blend-multiply">Multiply</div>
<div class="mix-blend-screen">Screen</div>
<div class="mix-blend-overlay">Overlay</div>
<div class="mix-blend-darken">Darken</div>
<div class="mix-blend-lighten">Lighten</div>
```

## Filters

### Blur

```html
<div class="blur-none">No blur</div>
<div class="blur-sm">Small blur</div>
<div class="blur">Default blur</div>
<div class="blur-md">Medium blur</div>
<div class="blur-lg">Large blur</div>
<div class="blur-xl">Extra large blur</div>
```

### Brightness

```html
<div class="brightness-0">0%</div>
<div class="brightness-50">50%</div>
<div class="brightness-100">100% (normal)</div>
<div class="brightness-125">125%</div>
<div class="brightness-150">150%</div>
<div class="brightness-200">200%</div>
```

### Contrast

```html
<div class="contrast-0">0%</div>
<div class="contrast-50">50%</div>
<div class="contrast-100">100% (normal)</div>
<div class="contrast-125">125%</div>
<div class="contrast-200">200%</div>
```

### Grayscale

```html
<div class="grayscale-0">No grayscale</div>
<div class="grayscale">Full grayscale</div>
```

### Backdrop Filters

```html
<div class="backdrop-blur-sm">Backdrop blur</div>
<div class="backdrop-brightness-125">Backdrop brightness</div>
<div class="backdrop-contrast-125">Backdrop contrast</div>
<div class="backdrop-grayscale">Backdrop grayscale</div>
<div class="backdrop-saturate-150">Backdrop saturate</div>
```

## Transitions & Animations

### Transition Property

```html
<div class="transition">All properties</div>
<div class="transition-none">No transition</div>
<div class="transition-colors">Colors only</div>
<div class="transition-opacity">Opacity only</div>
<div class="transition-shadow">Shadow only</div>
<div class="transition-transform">Transform only</div>
```

### Transition Duration

```html
<div class="transition duration-75">75ms</div>
<div class="transition duration-100">100ms</div>
<div class="transition duration-150">150ms</div>
<div class="transition duration-200">200ms</div>
<div class="transition duration-300">300ms</div>
<div class="transition duration-500">500ms</div>
<div class="transition duration-700">700ms</div>
<div class="transition duration-1000">1000ms</div>
```

### Transition Timing Function

```html
<div class="transition ease-linear">Linear</div>
<div class="transition ease-in">Ease in</div>
<div class="transition ease-out">Ease out</div>
<div class="transition ease-in-out">Ease in-out</div>
```

### Transition Delay

```html
<div class="transition delay-75">75ms delay</div>
<div class="transition delay-100">100ms delay</div>
<div class="transition delay-150">150ms delay</div>
<div class="transition delay-300">300ms delay</div>
<div class="transition delay-500">500ms delay</div>
```

### Animations

```html
<div class="animate-none">No animation</div>
<div class="animate-spin">Spinning</div>
<div class="animate-ping">Pinging</div>
<div class="animate-pulse">Pulsing</div>
<div class="animate-bounce">Bouncing</div>
```

## Transforms

### Scale

```html
<div class="scale-0">0%</div>
<div class="scale-50">50%</div>
<div class="scale-75">75%</div>
<div class="scale-90">90%</div>
<div class="scale-95">95%</div>
<div class="scale-100">100% (normal)</div>
<div class="scale-105">105%</div>
<div class="scale-110">110%</div>
<div class="scale-125">125%</div>
<div class="scale-150">150%</div>

<!-- Axis-specific -->
<div class="scale-x-50">X axis 50%</div>
<div class="scale-y-50">Y axis 50%</div>
```

### Rotate

```html
<div class="rotate-0">0deg</div>
<div class="rotate-1">1deg</div>
<div class="rotate-3">3deg</div>
<div class="rotate-6">6deg</div>
<div class="rotate-12">12deg</div>
<div class="rotate-45">45deg</div>
<div class="rotate-90">90deg</div>
<div class="rotate-180">180deg</div>
<div class="-rotate-45">-45deg</div>
```

### Translate

```html
<div class="translate-x-0">X: 0</div>
<div class="translate-x-4">X: 1rem</div>
<div class="translate-x-1/2">X: 50%</div>
<div class="translate-y-4">Y: 1rem</div>
<div class="translate-y-1/2">Y: 50%</div>
<div class="-translate-x-4">X: -1rem</div>
```

### Skew

```html
<div class="skew-x-0">X: 0deg</div>
<div class="skew-x-3">X: 3deg</div>
<div class="skew-x-6">X: 6deg</div>
<div class="skew-x-12">X: 12deg</div>
<div class="skew-y-3">Y: 3deg</div>
<div class="-skew-x-3">X: -3deg</div>
```

### Transform Origin

```html
<div class="origin-center">Center</div>
<div class="origin-top">Top</div>
<div class="origin-top-right">Top right</div>
<div class="origin-right">Right</div>
<div class="origin-bottom-right">Bottom right</div>
<div class="origin-bottom">Bottom</div>
<div class="origin-bottom-left">Bottom left</div>
<div class="origin-left">Left</div>
<div class="origin-top-left">Top left</div>
```

## Interactivity

### Cursor

```html
<div class="cursor-auto">Auto</div>
<div class="cursor-default">Default</div>
<div class="cursor-pointer">Pointer</div>
<div class="cursor-wait">Wait</div>
<div class="cursor-text">Text</div>
<div class="cursor-move">Move</div>
<div class="cursor-not-allowed">Not allowed</div>
<div class="cursor-none">None</div>
```

### Pointer Events

```html
<div class="pointer-events-none">Disabled</div>
<div class="pointer-events-auto">Enabled</div>
```

### User Select

```html
<div class="select-none">No selection</div>
<div class="select-text">Text selection</div>
<div class="select-all">Select all</div>
<div class="select-auto">Auto</div>
```

### Resize

```html
<textarea class="resize-none">No resize</textarea>
<textarea class="resize">Both directions</textarea>
<textarea class="resize-x">Horizontal</textarea>
<textarea class="resize-y">Vertical</textarea>
```

### Scroll Behavior

```html
<html class="scroll-auto">Auto scroll</html>
<html class="scroll-smooth">Smooth scroll</html>
```

### Scroll Snap

```html
<div class="snap-none">No snapping</div>
<div class="snap-x">Snap X</div>
<div class="snap-y">Snap Y</div>
<div class="snap-both">Snap both</div>
<div class="snap-mandatory">Mandatory</div>
<div class="snap-proximity">Proximity</div>

<!-- Snap align -->
<div class="snap-start">Snap start</div>
<div class="snap-center">Snap center</div>
<div class="snap-end">Snap end</div>
```

### Touch Action

```html
<div class="touch-auto">Auto</div>
<div class="touch-none">None</div>
<div class="touch-pan-x">Pan X</div>
<div class="touch-pan-y">Pan Y</div>
<div class="touch-pinch-zoom">Pinch zoom</div>
```

## SVG

```html
<svg class="fill-blue-500">Fill color</svg>
<svg class="stroke-red-500">Stroke color</svg>
<svg class="stroke-1">Stroke width 1</svg>
<svg class="stroke-2">Stroke width 2</svg>
```

## Accessibility

### Screen Readers

```html
<div class="sr-only">Screen reader only (visually hidden)</div>
<div class="not-sr-only">Visible to all</div>
```

### Focus Visible

```html
<button class="focus-visible:ring-2">
  Ring only with keyboard focus
</button>
```

This reference covers the most commonly used Tailwind utility classes. For the complete list and detailed documentation, visit https://tailwindcss.com/docs.
