# Implementation Tasks: Premium E-Commerce Checkout System

**Feature:** stripe-checkout
**Date:** 2026-01-27

---

## Task Legend

| Symbol | Meaning |
|--------|---------|
| `[P]` | Parallelizable (no dependencies on other tasks in group) |
| `[S]` | Sequential (depends on previous task) |
| `[S/M/L/XL]` | Complexity estimate |
| `[US#]` | User story reference |

---

## Phase 1: Foundation (Database + Backend)

### Task 1.1: Supabase Schema Setup [S] [M] [US1]
**File:** Supabase SQL Editor (manual)
**Dependencies:** None
**Description:** Create database tables and RLS policies
**Subtasks:**
- [ ] Create `products` table with all columns
- [ ] Create `inventory` table with foreign key
- [ ] Create `orders` table
- [ ] Enable RLS on all tables
- [ ] Create public read policies for products/inventory
- [ ] Create service role policy for orders
- [ ] Enable realtime for inventory table
- [ ] Create indexes for performance

### Task 1.2: Supabase Function for Inventory [S] [S] [US1]
**File:** Supabase SQL Editor (manual)
**Dependencies:** Task 1.1
**Description:** Create atomic inventory decrement function
**Subtasks:**
- [ ] Create `decrement_inventory` function
- [ ] Set SECURITY DEFINER for elevated access
- [ ] Test function manually

### Task 1.3: Seed Product Data [S] [S] [US1]
**File:** Supabase SQL Editor (manual)
**Dependencies:** Task 1.1
**Description:** Insert initial product and inventory data
**Subtasks:**
- [ ] Insert 4 products (Libation, Money, Transport, Sanitation)
- [ ] Insert inventory records (10 each size, each product)
- [ ] Verify data via Supabase dashboard

### Task 1.4: Netlify Project Configuration [P] [S] [US1]
**File:** `netlify.toml`
**Dependencies:** None
**Description:** Configure Netlify for serverless functions
**Subtasks:**
- [ ] Create `netlify.toml` in project root
- [ ] Configure functions directory
- [ ] Set up API redirects
- [ ] Configure CORS headers

### Task 1.5: Package.json for Functions [P] [S] [US1]
**File:** `package.json`
**Dependencies:** None
**Description:** Add dependencies for serverless functions
**Subtasks:**
- [ ] Create package.json with stripe and supabase-js
- [ ] Run `npm install`
- [ ] Verify node_modules in functions directory

### Task 1.6: Environment Variables Setup [S] [S] [US1]
**File:** Netlify Dashboard + `.env.example`
**Dependencies:** Task 1.1
**Description:** Configure environment variables
**Subtasks:**
- [ ] Create `.env.example` with required vars
- [ ] Add `.env` to `.gitignore`
- [ ] Set variables in Netlify dashboard
- [ ] Verify Supabase connection works

---

## Phase 2: Inventory System

### Task 2.1: Inventory API Endpoint [S] [M] [US2]
**File:** `netlify/functions/inventory.js`
**Dependencies:** Task 1.1, 1.5, 1.6
**Description:** Create serverless function to fetch inventory
**Subtasks:**
- [ ] Create function file structure
- [ ] Initialize Supabase client
- [ ] Implement GET handler with productId param
- [ ] Query products and inventory tables
- [ ] Transform response with status labels
- [ ] Handle errors with proper codes
- [ ] Test locally with `netlify dev`

### Task 2.2: Client Inventory Module [P] [M] [US2]
**File:** `js/inventory.js`
**Dependencies:** Task 2.1 (for testing)
**Description:** Client-side inventory fetching with caching
**Subtasks:**
- [ ] Create InventoryManager class
- [ ] Implement fetchInventory with caching
- [ ] Add cache invalidation logic
- [ ] Export as window.inventoryManager
- [ ] Add JSDoc comments

### Task 2.3: Supabase Realtime Client [S] [S] [US2]
**File:** `js/inventory.js` (extend)
**Dependencies:** Task 2.2
**Description:** Add real-time subscription support
**Subtasks:**
- [ ] Add Supabase JS client (CDN)
- [ ] Implement subscribeToUpdates method
- [ ] Handle inventory table changes
- [ ] Implement unsubscribe method
- [ ] Test real-time updates

### Task 2.4: Size Selector Component CSS [P] [M] [US2]
**File:** `css/components.css`
**Dependencies:** None
**Description:** Styles for size selector with stock states
**Subtasks:**
- [ ] Create `.size-btn` base styles
- [ ] Add `.size-btn--sold-out` state
- [ ] Add `.size-btn--selected` state
- [ ] Style `.size-btn__status` label
- [ ] Add low stock warning styles
- [ ] Ensure mobile responsiveness

### Task 2.5: Size Selector Component JS [S] [M] [US2]
**File:** `js/product.js`
**Dependencies:** Task 2.2, 2.4
**Description:** Render size selector with inventory
**Subtasks:**
- [ ] Create renderSizeSelector function
- [ ] Handle size selection state
- [ ] Integrate with inventoryManager
- [ ] Update add-to-cart button state
- [ ] Handle sold out product state

---

## Phase 3: Cart System

### Task 3.1: Cart State Manager [P] [M] [US3]
**File:** `js/cart.js`
**Dependencies:** None
**Description:** localStorage cart management
**Subtasks:**
- [ ] Create CartManager class
- [ ] Implement load/save with versioning
- [ ] Implement addItem with quantity limits
- [ ] Implement removeItem
- [ ] Implement updateQuantity
- [ ] Implement clear
- [ ] Add subscriber pattern for UI updates
- [ ] Export as window.cart

### Task 3.2: Cart Drawer CSS [P] [L] [US3]
**File:** `css/cart-drawer.css`
**Dependencies:** None
**Description:** Styles for slide-out cart drawer
**Subtasks:**
- [ ] Create `.cart-drawer` container styles
- [ ] Style `.cart-drawer__backdrop` overlay
- [ ] Style `.cart-drawer__panel` slide animation
- [ ] Style `.cart-drawer--open` state
- [ ] Create header styles with title and close
- [ ] Style `.cart-item` card layout
- [ ] Style quantity controls
- [ ] Style footer with subtotal and CTA
- [ ] Create empty state styles
- [ ] Add mobile responsive styles
- [ ] Match brand typography and colors

### Task 3.3: Cart Drawer JS [S] [L] [US3]
**File:** `js/cart-drawer.js`
**Dependencies:** Task 3.1, 3.2
**Description:** Cart drawer component logic
**Subtasks:**
- [ ] Create CartDrawer class
- [ ] Implement render method (inject HTML)
- [ ] Implement bindEvents for interactions
- [ ] Implement open/close methods
- [ ] Implement update method (re-render items)
- [ ] Implement renderItem method
- [ ] Subscribe to cart changes
- [ ] Implement checkout button handler
- [ ] Export as window.cartDrawer

### Task 3.4: Cart Icon with Badge [S] [S] [US3]
**File:** Multiple HTML files + `js/cart-drawer.js`
**Dependencies:** Task 3.3
**Description:** Add cart icon to navigation
**Subtasks:**
- [ ] Create cart icon SVG
- [ ] Add badge element for count
- [ ] Style badge (positioned, colored)
- [ ] Update badge from CartDrawer
- [ ] Add click handler to open drawer
- [ ] Add to all page templates

### Task 3.5: Add to Cart Button [S] [M] [US3]
**File:** `js/product.js` (extend)
**Dependencies:** Task 3.1, 2.5
**Description:** Integrate add-to-cart on product pages
**Subtasks:**
- [ ] Create addToCart function
- [ ] Validate size selection
- [ ] Get product data from page
- [ ] Call cart.addItem
- [ ] Show success state on button
- [ ] Open cart drawer automatically
- [ ] Handle errors gracefully

---

## Phase 4: Checkout Integration

### Task 4.1: Stripe Product Setup [S] [S] [US4]
**File:** Stripe Dashboard (manual)
**Dependencies:** None
**Description:** Create products in Stripe
**Subtasks:**
- [ ] Create Stripe account (if needed)
- [ ] Create 4 products (one per collection)
- [ ] Note Product IDs for reference
- [ ] Configure checkout branding
- [ ] Enable payment methods (card, Apple Pay, Google Pay, Klarna)

### Task 4.2: Create Checkout Endpoint [S] [L] [US4]
**File:** `netlify/functions/create-checkout.js`
**Dependencies:** Task 1.5, 1.6, 4.1
**Description:** Serverless function for Stripe checkout
**Subtasks:**
- [ ] Create function file
- [ ] Initialize Stripe client
- [ ] Parse request body (items, URLs)
- [ ] Validate items exist in database
- [ ] Check inventory availability
- [ ] Build line_items array with metadata
- [ ] Create Stripe checkout session
- [ ] Configure shipping options
- [ ] Store items in session metadata
- [ ] Return session URL
- [ ] Handle and return errors

### Task 4.3: Webhook Handler [S] [L] [US4]
**File:** `netlify/functions/webhook.js`
**Dependencies:** Task 1.2, 4.2
**Description:** Handle Stripe payment webhooks
**Subtasks:**
- [ ] Create function file
- [ ] Verify Stripe webhook signature
- [ ] Handle checkout.session.completed event
- [ ] Parse items from session metadata
- [ ] Decrement inventory for each item
- [ ] Create order record in database
- [ ] Log success/failure
- [ ] Return 200 acknowledgment

### Task 4.4: Configure Stripe Webhook [S] [S] [US4]
**File:** Stripe Dashboard (manual)
**Dependencies:** Task 4.3 (deployed)
**Description:** Register webhook endpoint with Stripe
**Subtasks:**
- [ ] Go to Stripe Webhooks settings
- [ ] Add endpoint URL: `https://yoursite.netlify.app/api/webhook`
- [ ] Select events: `checkout.session.completed`
- [ ] Copy webhook signing secret
- [ ] Add secret to Netlify env vars

### Task 4.5: Client Checkout Integration [S] [M] [US4]
**File:** `js/cart-drawer.js` (extend)
**Dependencies:** Task 4.2, 3.3
**Description:** Connect checkout button to API
**Subtasks:**
- [ ] Implement checkout method in CartDrawer
- [ ] Build request payload from cart items
- [ ] Call /api/create-checkout endpoint
- [ ] Handle success (redirect to Stripe)
- [ ] Handle errors (show message)
- [ ] Add loading state to button

### Task 4.6: Success Page [S] [M] [US4]
**File:** `success.html`
**Dependencies:** Task 3.4 (nav)
**Description:** Order confirmation page
**Subtasks:**
- [ ] Create success.html with brand styling
- [ ] Add confirmation message
- [ ] Parse session_id from URL params
- [ ] Display order summary (optional)
- [ ] Add continue shopping CTA
- [ ] Add newsletter signup prompt
- [ ] Clear cart on page load

### Task 4.7: Cancel/Cart Page [P] [S] [US4]
**File:** `cart.html`
**Dependencies:** Task 3.2, 3.3
**Description:** Full cart page for returns
**Subtasks:**
- [ ] Create cart.html with brand styling
- [ ] Display full cart items
- [ ] Include checkout CTA
- [ ] Link back to shop

---

## Phase 5: Product Page Integration

### Task 5.1: Update Collection Pages [S] [L] [US5]
**File:** `collections/*.html`
**Dependencies:** Task 2.5, 3.5, 3.4
**Description:** Add e-commerce functionality to product pages
**Subtasks:**
- [ ] Add size selector HTML structure
- [ ] Add quantity selector
- [ ] Update Add to Cart button
- [ ] Add product data attributes
- [ ] Include required JS files
- [ ] Include required CSS files
- [ ] Add cart icon to nav
- [ ] Test each collection page

### Task 5.2: Update Index/Shop Pages [S] [M] [US5]
**File:** `index.html`, `shop.html`
**Dependencies:** Task 3.4
**Description:** Add cart icon to main pages
**Subtasks:**
- [ ] Add cart icon to navigation
- [ ] Include cart-drawer.js
- [ ] Include cart.js
- [ ] Include cart-drawer.css
- [ ] Test drawer functionality

---

## Phase 6: Testing & Polish

### Task 6.1: End-to-End Testing [S] [L] [US6]
**File:** Manual testing
**Dependencies:** All previous tasks
**Description:** Complete purchase flow testing
**Subtasks:**
- [ ] Test add to cart from each collection
- [ ] Test cart persistence across pages
- [ ] Test quantity changes in cart
- [ ] Test remove from cart
- [ ] Test checkout with test card
- [ ] Verify inventory decremented
- [ ] Verify order created in database
- [ ] Test success page
- [ ] Test cancel/return flow
- [ ] Test on mobile devices

### Task 6.2: Error Handling Polish [S] [M] [US6]
**File:** Multiple JS files
**Dependencies:** Task 6.1
**Description:** Improve error states
**Subtasks:**
- [ ] Add error toast/notification component
- [ ] Handle network failures gracefully
- [ ] Handle sold-out during checkout
- [ ] Add retry logic where appropriate
- [ ] Test error scenarios

### Task 6.3: Performance Optimization [P] [M] [US6]
**File:** Multiple files
**Dependencies:** Task 6.1
**Description:** Optimize load times
**Subtasks:**
- [ ] Defer non-critical JS loading
- [ ] Minimize CSS (remove unused)
- [ ] Lazy load inventory on scroll
- [ ] Add loading skeletons
- [ ] Test Lighthouse scores

### Task 6.4: Documentation [P] [S] [US6]
**File:** `README.md`, `docs/`
**Dependencies:** None
**Description:** Document setup and usage
**Subtasks:**
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Document Stripe configuration
- [ ] Document Supabase schema
- [ ] Add troubleshooting guide

---

## Task Dependency Graph

```
PHASE 1 (Foundation) ─────────────────────────────────────────────
  1.1 Schema ──┬── 1.2 Function ──┬── 1.3 Seed Data
               │                  │
  1.4 Config ──┼── 1.5 Package ───┼── 1.6 Env Vars
               │                  │
               └──────────────────┘

PHASE 2 (Inventory) ──────────────────────────────────────────────
                     ┌── 2.4 CSS [P] ──┐
  1.6 ── 2.1 API ────┤                 ├── 2.5 JS Component
                     └── 2.2 Client ───┘
                              │
                         2.3 Realtime

PHASE 3 (Cart) ───────────────────────────────────────────────────
  3.1 State [P] ──┬── 3.3 Drawer JS ──── 3.4 Icon ── 3.5 Add to Cart
                  │
  3.2 CSS [P] ────┘

PHASE 4 (Checkout) ───────────────────────────────────────────────
  4.1 Stripe Setup ──── 4.2 Checkout API ──── 4.5 Client
                              │
                         4.3 Webhook ──── 4.4 Configure
                              │
                    4.6 Success ──── 4.7 Cart Page

PHASE 5 (Integration) ────────────────────────────────────────────
  All Phase 2-4 ──── 5.1 Collection Pages ──── 5.2 Other Pages

PHASE 6 (Testing) ────────────────────────────────────────────────
  All previous ──── 6.1 E2E ──┬── 6.2 Errors
                              ├── 6.3 Performance [P]
                              └── 6.4 Docs [P]
```

---

## Parallelization Summary

### Can Run in Parallel (Phase 1):
- Task 1.4 (netlify.toml)
- Task 1.5 (package.json)

### Can Run in Parallel (Phase 2):
- Task 2.2 (Client inventory) - after 2.1
- Task 2.4 (Size selector CSS)

### Can Run in Parallel (Phase 3):
- Task 3.1 (Cart state)
- Task 3.2 (Cart drawer CSS)

### Can Run in Parallel (Phase 4):
- Task 4.7 (Cart page)

### Can Run in Parallel (Phase 6):
- Task 6.3 (Performance)
- Task 6.4 (Documentation)

---

## Estimated Effort

| Phase | Tasks | Total Estimate |
|-------|-------|----------------|
| Phase 1 | 6 | ~4 hours |
| Phase 2 | 5 | ~6 hours |
| Phase 3 | 5 | ~8 hours |
| Phase 4 | 7 | ~10 hours |
| Phase 5 | 2 | ~4 hours |
| Phase 6 | 4 | ~6 hours |
| **Total** | **29** | **~38 hours** |
