# Tailwind CSS Common UI Patterns

Real-world component patterns and best practices for building modern UIs with Tailwind CSS.

## Table of Contents

- [Buttons](#buttons)
- [Forms](#forms)
- [Cards](#cards)
- [Navigation](#navigation)
- [Modals & Dialogs](#modals--dialogs)
- [Tables](#tables)
- [Lists](#lists)
- [Badges & Pills](#badges--pills)
- [Alerts & Notifications](#alerts--notifications)
- [Loading States](#loading-states)
- [Empty States](#empty-states)
- [Layouts](#layouts)

## Buttons

### Primary Button

```html
<button class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
  Primary Button
</button>
```

### Button Variants

```html
<!-- Secondary Button -->
<button class="bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-gray-200">
  Secondary
</button>

<!-- Outline Button -->
<button class="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200">
  Outline
</button>

<!-- Ghost Button -->
<button class="text-gray-700 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-gray-200">
  Ghost
</button>

<!-- Danger Button -->
<button class="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-red-300">
  Delete
</button>

<!-- Link Button -->
<button class="text-blue-600 hover:text-blue-700 hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 py-1">
  Link Button
</button>
```

### Button Sizes

```html
<!-- Small -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 text-sm rounded">
  Small
</button>

<!-- Medium (default) -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
  Medium
</button>

<!-- Large -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg rounded-xl">
  Large
</button>
```

### Button with Icon

```html
<!-- Icon Left -->
<button class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
  Add Item
</button>

<!-- Icon Right -->
<button class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
  Continue
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
  </svg>
</button>

<!-- Icon Only -->
<button class="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
```

### Button Group

```html
<div class="inline-flex rounded-lg shadow-sm" role="group">
  <button class="px-4 py-2 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500">
    Left
  </button>
  <button class="px-4 py-2 bg-white border-t border-b border-gray-300 hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500">
    Middle
  </button>
  <button class="px-4 py-2 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500">
    Right
  </button>
</div>
```

### Loading Button

```html
<button class="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg opacity-75 cursor-not-allowed" disabled>
  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
  Loading...
</button>
```

## Forms

### Text Input

```html
<div class="mb-4">
  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
    placeholder="you@example.com"
  />
</div>
```

### Input with Icon

```html
<div class="relative">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
  <input
    type="text"
    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Search..."
  />
</div>
```

### Input States

```html
<!-- Success -->
<input class="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300">

<!-- Error -->
<input class="w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300">

<!-- Disabled -->
<input class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" disabled>
```

### Textarea

```html
<textarea
  rows="4"
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
  placeholder="Enter your message..."
></textarea>
```

### Select Dropdown

```html
<select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
  <option>Select an option</option>
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</select>
```

### Checkbox

```html
<div class="flex items-center">
  <input
    type="checkbox"
    id="remember"
    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
  />
  <label for="remember" class="ml-2 text-sm text-gray-700">
    Remember me
  </label>
</div>
```

### Radio Buttons

```html
<div class="space-y-2">
  <div class="flex items-center">
    <input type="radio" id="option1" name="options" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500">
    <label for="option1" class="ml-2 text-sm text-gray-700">Option 1</label>
  </div>
  <div class="flex items-center">
    <input type="radio" id="option2" name="options" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500">
    <label for="option2" class="ml-2 text-sm text-gray-700">Option 2</label>
  </div>
</div>
```

### Toggle Switch

```html
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer">
  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  <span class="ml-3 text-sm font-medium text-gray-700">Toggle me</span>
</label>
```

### Complete Form Example

```html
<form class="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
  <h2 class="text-2xl font-bold mb-6 text-gray-900">Sign Up</h2>

  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  </div>

  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
    <input type="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  </div>

  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
    <input type="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  </div>

  <div class="mb-6">
    <div class="flex items-center">
      <input type="checkbox" id="terms" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
      <label for="terms" class="ml-2 text-sm text-gray-700">I agree to the terms and conditions</label>
    </div>
  </div>

  <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
    Create Account
  </button>
</form>
```

## Cards

### Basic Card

```html
<div class="bg-white rounded-lg shadow-md p-6">
  <h3 class="text-xl font-bold mb-2">Card Title</h3>
  <p class="text-gray-600">Card content goes here.</p>
</div>
```

### Card with Image

```html
<div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
  <img class="w-full h-48 object-cover" src="/image.jpg" alt="Card image">
  <div class="p-6">
    <h3 class="text-2xl font-bold mb-2 text-gray-900">Card Title</h3>
    <p class="text-gray-600 mb-4">Card description text goes here.</p>
    <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg">
      Learn More
    </button>
  </div>
</div>
```

### Card with Header and Footer

```html
<div class="bg-white rounded-lg shadow-md overflow-hidden">
  <!-- Header -->
  <div class="bg-gray-50 border-b border-gray-200 px-6 py-4">
    <h3 class="text-lg font-semibold text-gray-900">Card Header</h3>
  </div>

  <!-- Body -->
  <div class="p-6">
    <p class="text-gray-600">Card content goes here.</p>
  </div>

  <!-- Footer -->
  <div class="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
    <span class="text-sm text-gray-500">Last updated 2 hours ago</span>
    <button class="text-blue-600 hover:text-blue-700 font-medium text-sm">
      View Details
    </button>
  </div>
</div>
```

### Product Card

```html
<div class="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
  <div class="relative overflow-hidden">
    <img class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300" src="/product.jpg" alt="Product">
    <div class="absolute top-4 right-4">
      <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SALE</span>
    </div>
  </div>
  <div class="p-4">
    <h3 class="text-lg font-semibold mb-1">Product Name</h3>
    <p class="text-sm text-gray-600 mb-3">Brief product description</p>
    <div class="flex items-center justify-between">
      <div>
        <span class="text-2xl font-bold text-gray-900">$99</span>
        <span class="text-sm text-gray-500 line-through ml-2">$149</span>
      </div>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
        Add to Cart
      </button>
    </div>
  </div>
</div>
```

### Stat Card

```html
<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm text-gray-600 mb-1">Total Revenue</p>
      <p class="text-3xl font-bold text-gray-900">$45,231</p>
      <p class="text-sm text-green-600 mt-1">+20.1% from last month</p>
    </div>
    <div class="bg-blue-100 p-3 rounded-full">
      <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  </div>
</div>
```

## Navigation

### Navbar

```html
<nav class="bg-white shadow-md sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="text-2xl font-bold text-blue-600">Logo</a>
      </div>

      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">Home</a>
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</a>
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">Services</a>
        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
      </div>

      <!-- CTA Button -->
      <div class="hidden md:block">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
          Get Started
        </button>
      </div>

      <!-- Mobile Menu Button -->
      <button class="md:hidden p-2 rounded hover:bg-gray-100">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>
</nav>
```

### Sidebar

```html
<aside class="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
  <!-- Logo -->
  <div class="p-6 border-b border-gray-700">
    <h1 class="text-2xl font-bold">Dashboard</h1>
  </div>

  <!-- Navigation -->
  <nav class="p-4">
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white mb-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      Dashboard
    </a>

    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 mb-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Analytics
    </a>

    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 mb-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      Users
    </a>
  </nav>
</aside>
```

### Breadcrumbs

```html
<nav class="flex" aria-label="Breadcrumb">
  <ol class="inline-flex items-center space-x-1 md:space-x-3">
    <li class="inline-flex items-center">
      <a href="#" class="text-gray-700 hover:text-blue-600">
        Home
      </a>
    </li>
    <li>
      <div class="flex items-center">
        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        <a href="#" class="ml-1 text-gray-700 hover:text-blue-600">
          Category
        </a>
      </div>
    </li>
    <li aria-current="page">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        <span class="ml-1 text-gray-500">
          Current Page
        </span>
      </div>
    </li>
  </ol>
</nav>
```

### Tabs

```html
<div class="border-b border-gray-200">
  <nav class="flex space-x-8" aria-label="Tabs">
    <a href="#" class="border-b-2 border-blue-600 text-blue-600 py-4 px-1 text-sm font-medium">
      Tab 1
    </a>
    <a href="#" class="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
      Tab 2
    </a>
    <a href="#" class="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
      Tab 3
    </a>
  </nav>
</div>
```

## Modals & Dialogs

### Modal

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 z-40"></div>

<!-- Modal -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h3 class="text-xl font-semibold text-gray-900">Modal Title</h3>
      <button class="p-1 rounded-full hover:bg-gray-100">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="p-6">
      <p class="text-gray-600">Modal content goes here.</p>
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
      <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        Cancel
      </button>
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Alert Dialog

```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
    <div class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-center mb-2">Delete Account?</h3>
    <p class="text-sm text-gray-600 text-center mb-6">
      This action cannot be undone. All your data will be permanently deleted.
    </p>
    <div class="flex gap-3">
      <button class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        Cancel
      </button>
      <button class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
        Delete
      </button>
    </div>
  </div>
</div>
```

## Tables

### Basic Table

```html
<div class="overflow-x-auto">
  <table class="min-w-full bg-white border border-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">John Doe</td>
        <td class="px-6 py-4 whitespace-nowrap">john@example.com</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Admin</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="text-blue-600 hover:text-blue-700 mr-3">Edit</button>
          <button class="text-red-600 hover:text-red-700">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## Badges & Pills

```html
<!-- Basic Badge -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  Badge
</span>

<!-- Dot Badge -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  <svg class="w-2 h-2 fill-current" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" /></svg>
  Active
</span>

<!-- Removable Badge -->
<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
  Tag
  <button class="hover:bg-gray-200 rounded-full p-0.5">
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</span>
```

## Alerts & Notifications

```html
<!-- Success Alert -->
<div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <div class="flex-1">
    <h4 class="text-sm font-medium text-green-800">Success!</h4>
    <p class="text-sm text-green-700 mt-1">Your changes have been saved successfully.</p>
  </div>
  <button class="text-green-600 hover:text-green-700">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>

<!-- Error Alert -->
<div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <div class="flex-1">
    <h4 class="text-sm font-medium text-red-800">Error!</h4>
    <p class="text-sm text-red-700 mt-1">There was a problem processing your request.</p>
  </div>
</div>
```

## Loading States

```html
<!-- Spinner -->
<svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>

<!-- Skeleton -->
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded"></div>
  <div class="h-4 bg-gray-200 rounded w-5/6"></div>
</div>

<!-- Progress Bar -->
<div class="w-full bg-gray-200 rounded-full h-2">
  <div class="bg-blue-600 h-2 rounded-full" style="width: 45%"></div>
</div>
```

## Empty States

```html
<div class="text-center py-12">
  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
  <h3 class="mt-2 text-sm font-medium text-gray-900">No projects</h3>
  <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
  <div class="mt-6">
    <button class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Project
    </button>
  </div>
</div>
```

## Layouts

### Centered Container

```html
<div class="container mx-auto px-4 max-w-7xl">
  <div class="py-12">
    Content
  </div>
</div>
```

### Two Column Layout

```html
<div class="container mx-auto px-4">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Sidebar -->
    <aside class="lg:col-span-1">
      Sidebar content
    </aside>

    <!-- Main Content -->
    <main class="lg:col-span-2">
      Main content
    </main>
  </div>
</div>
```

### Dashboard Layout

```html
<div class="flex h-screen bg-gray-100">
  <!-- Sidebar -->
  <aside class="w-64 bg-white shadow-md">
    Sidebar
  </aside>

  <!-- Main Content -->
  <div class="flex-1 overflow-auto">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="px-8 py-4">
        <h1 class="text-2xl font-bold">Dashboard</h1>
      </div>
    </header>

    <!-- Content -->
    <main class="p-8">
      Content
    </main>
  </div>
</div>
```

For more UI patterns and components, visit:
- https://tailwindui.com - Official component library
- https://tailwindcomponents.com - Community components
- https://flowbite.com - Open-source component library
