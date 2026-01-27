# Validation Checklists: Premium E-Commerce Checkout System

**Feature:** stripe-checkout
**Date:** 2026-01-27

---

## 1. Database Validation Checklist

### 1.1 Schema Verification
- [ ] `products` table exists with correct columns
- [ ] `inventory` table exists with foreign key to products
- [ ] `orders` table exists with all required columns
- [ ] All tables have RLS enabled
- [ ] `products` has public SELECT policy
- [ ] `inventory` has public SELECT policy
- [ ] `orders` restricted to service_role
- [ ] Realtime enabled for `inventory` table
- [ ] `decrement_inventory` function exists and works

### 1.2 Data Integrity
- [ ] 4 products exist (Libation, Money, Transport, Sanitation)
- [ ] Each product has correct slug, name, collection
- [ ] Price is 39500 (cents) for all products
- [ ] Images array populated for each product
- [ ] 24 inventory records exist (4 products × 6 sizes)
- [ ] Each inventory record has quantity = 10
- [ ] Unique constraint on (product_id, size) working

### 1.3 Query Performance
- [ ] Index on `products.slug` exists
- [ ] Index on `inventory.product_id` exists
- [ ] Product lookup by slug < 50ms
- [ ] Inventory fetch by product < 100ms

---

## 2. API Endpoint Checklist

### 2.1 GET /api/inventory
- [ ] Returns 200 for valid productId
- [ ] Returns 404 for invalid productId
- [ ] Returns 400 if productId missing
- [ ] Response includes inventory for all 6 sizes
- [ ] Status correctly shows: in_stock, low_stock, sold_out
- [ ] Response time < 500ms
- [ ] CORS headers present

### 2.2 POST /api/create-checkout
- [ ] Returns 200 with valid cart items
- [ ] Returns 400 for malformed request
- [ ] Returns 404 for invalid product
- [ ] Returns 409 if item sold out
- [ ] Session URL redirects to Stripe
- [ ] Line items include product name, description, image
- [ ] Size included in description
- [ ] Shipping options present (Free CA, $25 US)
- [ ] Items stored in session metadata
- [ ] Response time < 2s

### 2.3 POST /api/webhook
- [ ] Returns 400 for invalid signature
- [ ] Returns 200 for valid webhook
- [ ] Handles `checkout.session.completed` event
- [ ] Decrements inventory correctly
- [ ] Creates order record in database
- [ ] Handles duplicate webhooks gracefully
- [ ] Logs errors without failing

---

## 3. Frontend Component Checklist

### 3.1 Cart State Manager (cart.js)
- [ ] Loads cart from localStorage on init
- [ ] Handles corrupted localStorage gracefully
- [ ] Saves to localStorage after each change
- [ ] addItem creates new item or increments quantity
- [ ] Quantity capped at 3 per item
- [ ] removeItem removes correct item
- [ ] updateQuantity enforces min 1, max 3
- [ ] clear removes all items
- [ ] getItemCount returns total quantity
- [ ] getSubtotal calculates correctly
- [ ] Subscribers notified on changes

### 3.2 Cart Drawer (cart-drawer.js)
- [ ] Renders into DOM on load
- [ ] Opens with slide animation
- [ ] Closes on × button click
- [ ] Closes on backdrop click
- [ ] Closes on "Continue Shopping" click
- [ ] Body scroll locked when open
- [ ] Items display correctly (image, name, size, qty, price)
- [ ] Quantity +/- buttons work
- [ ] Remove button removes item
- [ ] Subtotal updates correctly
- [ ] Empty state shows when cart empty
- [ ] Checkout button triggers API call
- [ ] Loading state during checkout
- [ ] Error message on checkout failure

### 3.3 Inventory Display (inventory.js + product.js)
- [ ] Fetches inventory on page load
- [ ] Caches results for 30 seconds
- [ ] Size buttons render all 6 sizes
- [ ] Sold out sizes disabled and labeled
- [ ] Low stock shows "Only X left"
- [ ] Size selection updates button state
- [ ] Real-time subscription connects
- [ ] UI updates on inventory change

### 3.4 Cart Icon Badge
- [ ] Icon visible in navigation
- [ ] Badge hidden when cart empty
- [ ] Badge shows correct count
- [ ] Badge updates on cart changes
- [ ] Click opens cart drawer

---

## 4. User Flow Checklist

### 4.1 Add to Cart Flow
- [ ] User lands on collection page
- [ ] Inventory loads and sizes display
- [ ] User selects available size
- [ ] "Add to Cart" button enables
- [ ] User clicks Add to Cart
- [ ] Button shows "Added ✓" briefly
- [ ] Cart drawer opens automatically
- [ ] Item appears in cart drawer
- [ ] Cart badge updates
- [ ] User can continue shopping

### 4.2 Cart Management Flow
- [ ] User clicks cart icon
- [ ] Cart drawer opens
- [ ] User can change quantity
- [ ] User can remove items
- [ ] Subtotal updates correctly
- [ ] User clicks Continue Shopping
- [ ] Drawer closes
- [ ] Cart persists after page navigation
- [ ] Cart persists after browser close

### 4.3 Checkout Flow
- [ ] User clicks Checkout in cart drawer
- [ ] Loading indicator appears
- [ ] Redirects to Stripe Checkout
- [ ] Product info displays correctly
- [ ] Shipping address form works
- [ ] Payment methods available
- [ ] User completes payment
- [ ] Redirects to success page
- [ ] Success message displays
- [ ] Cart is cleared

### 4.4 Inventory Sync Flow
- [ ] User A adds item to cart
- [ ] User B purchases last item
- [ ] User A's page updates (via realtime)
- [ ] User A sees "Sold Out" on that size
- [ ] User A attempts checkout
- [ ] API returns "sold out" error
- [ ] User sees error message

---

## 5. Error Handling Checklist

### 5.1 Network Errors
- [ ] Inventory fetch failure shows error state
- [ ] Checkout failure shows error message
- [ ] Webhook failure doesn't crash
- [ ] Retry logic for transient failures

### 5.2 Data Validation
- [ ] Invalid product IDs rejected
- [ ] Invalid sizes rejected
- [ ] Negative quantities prevented
- [ ] Empty cart checkout prevented
- [ ] Malformed requests handled

### 5.3 Edge Cases
- [ ] Cart with removed product handled
- [ ] Concurrent purchases handled
- [ ] Session timeout handled
- [ ] Browser back button handled
- [ ] Multiple tabs handled

---

## 6. Security Checklist

### 6.1 Payment Security
- [ ] No card data in our logs
- [ ] No card data in our database
- [ ] Stripe handles all PCI requirements
- [ ] HTTPS enforced on all pages

### 6.2 API Security
- [ ] Webhook signature verified
- [ ] Secret keys in env vars only
- [ ] Anon key used for reads only
- [ ] Service role key server-side only
- [ ] No secrets in client code
- [ ] No secrets in git history

### 6.3 Data Security
- [ ] RLS active on all tables
- [ ] Orders only accessible via service role
- [ ] Customer email not exposed publicly
- [ ] Shipping addresses protected

---

## 7. Performance Checklist

### 7.1 Load Times
- [ ] Initial page load < 3s
- [ ] Cart drawer opens < 100ms
- [ ] Inventory fetch < 500ms
- [ ] Checkout redirect < 2s

### 7.2 Bundle Size
- [ ] cart.js < 10KB
- [ ] cart-drawer.js < 15KB
- [ ] inventory.js < 10KB
- [ ] cart-drawer.css < 10KB
- [ ] No unnecessary dependencies

### 7.3 Optimization
- [ ] JS deferred loading
- [ ] CSS critical path identified
- [ ] Images lazy loaded
- [ ] No render blocking resources

---

## 8. Mobile Responsiveness Checklist

### 8.1 Cart Drawer
- [ ] Drawer full width on mobile
- [ ] Touch targets > 44px
- [ ] Scrollable when content overflows
- [ ] Checkout button sticky at bottom
- [ ] Close button easily reachable

### 8.2 Size Selector
- [ ] Buttons large enough for touch
- [ ] Status text readable
- [ ] Grid layout adapts

### 8.3 Navigation
- [ ] Cart icon visible in mobile nav
- [ ] Badge positioned correctly
- [ ] Drawer accessible from hamburger

---

## 9. Browser Compatibility Checklist

### 9.1 Desktop
- [ ] Chrome 80+ works
- [ ] Safari 13+ works
- [ ] Firefox 75+ works
- [ ] Edge 80+ works

### 9.2 Mobile
- [ ] iOS Safari works
- [ ] Android Chrome works
- [ ] Samsung Internet works

### 9.3 Feature Support
- [ ] localStorage available
- [ ] fetch API available
- [ ] CSS Grid supported
- [ ] CSS custom properties supported

---

## 10. Accessibility Checklist

### 10.1 Keyboard Navigation
- [ ] Cart icon focusable
- [ ] Drawer traps focus when open
- [ ] Close button first in tab order
- [ ] Escape key closes drawer
- [ ] All buttons keyboard accessible

### 10.2 Screen Readers
- [ ] Cart icon has aria-label
- [ ] Cart count announced
- [ ] Drawer has role="dialog"
- [ ] Close button has aria-label
- [ ] Item remove buttons labeled

### 10.3 Visual
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Error states clear
- [ ] Loading states announced

---

## 11. Pre-Deployment Checklist

### 11.1 Environment
- [ ] STRIPE_SECRET_KEY set (live or test)
- [ ] STRIPE_WEBHOOK_SECRET set
- [ ] SUPABASE_URL set
- [ ] SUPABASE_ANON_KEY set
- [ ] SUPABASE_SERVICE_ROLE set

### 11.2 Stripe Configuration
- [ ] Products created in Stripe
- [ ] Webhook endpoint registered
- [ ] Events selected correctly
- [ ] Branding configured

### 11.3 Code Quality
- [ ] No console.log in production code
- [ ] No TODO comments remaining
- [ ] Error handling complete
- [ ] No hardcoded secrets

### 11.4 Testing
- [ ] Full E2E test completed
- [ ] Test purchase successful
- [ ] Inventory decremented
- [ ] Order recorded
- [ ] Mobile tested

---

## 12. Post-Launch Monitoring Checklist

### 12.1 First 24 Hours
- [ ] Monitor Stripe Dashboard for errors
- [ ] Check Netlify function logs
- [ ] Verify orders appearing in Supabase
- [ ] Test a real purchase

### 12.2 First Week
- [ ] Review checkout abandonment rate
- [ ] Check for any payment failures
- [ ] Verify inventory accuracy
- [ ] Address any customer issues

### 12.3 Ongoing
- [ ] Weekly inventory reconciliation
- [ ] Monthly Stripe fee review
- [ ] Quarterly security review
