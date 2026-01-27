# Feature Specification: Premium E-Commerce Checkout System

**Feature ID:** `stripe-checkout`
**Version:** 1.0
**Created:** 2026-01-27
**Status:** Draft

---

## 1. Executive Summary

Implement a complete e-commerce checkout system for Hogan's Alley, a premium rainwear brand. The system will provide real-time inventory tracking with Supabase, payment processing through Stripe Checkout, and a sophisticated cart experience that matches the brand's premium aesthetic.

### Key Objectives
- Enable customers to purchase rain jackets ($395 CAD) directly from the website
- Provide real-time inventory visibility with scarcity messaging ("Only 2 left")
- Maintain premium brand experience throughout the purchase flow
- Support multiple payment methods (cards, Apple Pay, Google Pay, Klarna)
- Ensure inventory accuracy with webhook-based stock management

---

## 2. Product Context

### 2.1 Current State
- **Site Type:** Static HTML/CSS/JavaScript
- **Hosting:** Netlify
- **Products:** 4 collections (Libation, Money, Sanitation, Transport), each with 1 jacket at $395 CAD
- **Sizes:** XS, S, M, L, XL, XXL
- **Existing Cart:** UI placeholder only (button animation, no actual functionality)

### 2.2 Brand Guidelines
- **Typography:** Cormorant Garamond (headlines), Inter (body), JetBrains Mono (accents)
- **Colors:**
  - Primary: `#0A0A0A` (black), `#FAFAF9` (white)
  - Accent: `#C4A962` (gold)
  - Muted: `#8A8A8A`, `#4A4A4A`
  - Border: `#E5E5E3`
- **Aesthetic:** Minimal, premium, editorial fashion feel
- **UI Pattern:** Sharp corners (no rounded borders on images), subtle animations

### 2.3 Target Markets
- Vancouver, BC (primary)
- Seattle, WA
- Portland, OR
- London, UK

---

## 3. Functional Requirements

### 3.1 Shopping Cart System

#### FR-3.1.1: Add to Cart
- Users can add products to cart from collection pages
- Must select size before adding (XS-XXL)
- Quantity selector (default: 1, max: 3 per size)
- Visual feedback on successful add (checkmark animation)
- Cart drawer opens automatically after add

#### FR-3.1.2: Cart Drawer
- Slides in from right side of screen
- Semi-transparent backdrop (click to close)
- Close button (×) in header
- Displays:
  - Product image (thumbnail)
  - Product name and collection
  - Selected size
  - Quantity with +/- controls
  - Line item price
  - Remove item button
- Subtotal calculation
- "Checkout" button (primary CTA)
- "Continue Shopping" link
- Empty cart state with "Start Shopping" CTA

#### FR-3.1.3: Cart Persistence
- Cart stored in localStorage
- Persists across browser sessions
- Cart data structure:
  ```json
  {
    "items": [
      {
        "productId": "money-jacket",
        "collection": "Money",
        "name": "Money Rain Parka",
        "size": "M",
        "quantity": 1,
        "price": 395,
        "image": "url"
      }
    ],
    "updatedAt": "ISO timestamp"
  }
  ```

#### FR-3.1.4: Cart Icon Badge
- Display item count in nav cart icon
- Badge hidden when cart empty
- Updates in real-time on add/remove

### 3.2 Inventory Management

#### FR-3.2.1: Stock Display on Product Pages
- Show available quantity per size
- Display states:
  - "In Stock" (quantity > 5)
  - "Only X left" (quantity 1-5) - creates urgency
  - "Sold Out" (quantity = 0) - disable size option
- Real-time updates from Supabase

#### FR-3.2.2: Size Selector with Stock
- Each size button shows availability
- Sold out sizes: greyed out, not clickable, shows "Sold Out" label
- Low stock sizes: shows "Only X left" below button

#### FR-3.2.3: Product-Level Sold Out
- When all sizes sold out:
  - Replace "Add to Cart" with "Sold Out" (disabled)
  - Optional: "Notify Me" email capture

### 3.3 Checkout Flow

#### FR-3.3.1: Stripe Checkout Session
- Click "Checkout" → redirect to Stripe Checkout
- Checkout includes:
  - All cart items with images
  - Size displayed in item description
  - Shipping address collection
  - Tax calculation (optional, Phase 2)
  - Brand logo and colors

#### FR-3.3.2: Payment Methods
- Credit/Debit cards (Visa, Mastercard, Amex)
- Apple Pay
- Google Pay
- Klarna (buy now, pay later) - important for $395 items

#### FR-3.3.3: Shipping
- Free shipping within Canada
- Flat rate for US ($25 USD)
- UK/International (Phase 2)

### 3.4 Post-Purchase

#### FR-3.4.1: Success Page
- Custom branded page on hogansalley.com
- Order confirmation number
- Purchased items summary
- "Continue Shopping" CTA
- Newsletter signup prompt

#### FR-3.4.2: Cancel/Return Page
- Branded page for abandoned checkouts
- Cart preserved for easy return
- "Return to Cart" CTA

#### FR-3.4.3: Inventory Update
- Stripe webhook fires on successful payment
- Stock decremented in Supabase
- Real-time update on product pages

---

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Static HTML/JS)                   │
├─────────────────────────────────────────────────────────────────┤
│  • cart.js - Cart state management & localStorage               │
│  • inventory.js - Fetch & display stock from Supabase           │
│  • checkout.js - Create Stripe checkout session                 │
│  • cart-drawer.html - Injected drawer component                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NETLIFY FUNCTIONS (Serverless)                │
├─────────────────────────────────────────────────────────────────┤
│  • /api/create-checkout - Creates Stripe checkout session       │
│  • /api/webhook - Handles Stripe payment success webhook        │
│  • /api/inventory - Proxy for Supabase inventory queries        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│       SUPABASE          │     │        STRIPE           │
├─────────────────────────┤     ├─────────────────────────┤
│  • products table       │     │  • Checkout Sessions    │
│  • inventory table      │     │  • Payments             │
│  • orders table         │     │  • Webhooks             │
│  • Real-time subscr.    │     │  • Customer portal      │
└─────────────────────────┘     └─────────────────────────┘
```

### 4.2 Database Schema (Supabase)

#### Table: `products`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL-friendly ID (e.g., "money-jacket") |
| name | text | Display name |
| collection | text | Collection name |
| description | text | Product description |
| price | integer | Price in cents (39500) |
| currency | text | Currency code (CAD) |
| images | jsonb | Array of image URLs |
| stripe_price_id | text | Stripe Price ID for checkout |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### Table: `inventory`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | uuid | FK to products |
| size | text | Size code (XS, S, M, L, XL, XXL) |
| quantity | integer | Available stock |
| reserved | integer | Reserved during checkout (future) |
| updated_at | timestamp | Last update timestamp |

**Unique constraint:** `(product_id, size)`

#### Table: `orders`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| stripe_checkout_id | text | Stripe session ID |
| stripe_payment_intent | text | Payment intent ID |
| customer_email | text | Customer email |
| items | jsonb | Order items snapshot |
| subtotal | integer | Subtotal in cents |
| shipping | integer | Shipping in cents |
| total | integer | Total in cents |
| currency | text | Currency code |
| status | text | pending, paid, shipped, delivered |
| shipping_address | jsonb | Shipping details |
| created_at | timestamp | Order creation |
| paid_at | timestamp | Payment confirmation |

### 4.3 API Endpoints

#### POST `/api/create-checkout`
Creates a Stripe Checkout session.

**Request:**
```json
{
  "items": [
    {
      "productId": "money-jacket",
      "size": "M",
      "quantity": 1
    }
  ],
  "successUrl": "https://hogansalley.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://hogansalley.com/cart"
}
```

**Response:**
```json
{
  "sessionId": "cs_live_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST `/api/webhook`
Handles Stripe webhooks (payment success, etc.).

**Events handled:**
- `checkout.session.completed` - Decrement inventory, create order
- `payment_intent.payment_failed` - Log failure (future: notify)

#### GET `/api/inventory?productId={slug}`
Returns current inventory for a product.

**Response:**
```json
{
  "productId": "money-jacket",
  "inventory": {
    "XS": 5,
    "S": 3,
    "M": 0,
    "L": 8,
    "XL": 2,
    "XXL": 0
  }
}
```

### 4.4 File Structure

```
Hogans Alley/
├── index.html
├── shop.html
├── collections/
│   ├── libation.html
│   ├── money.html
│   ├── sanitation.html
│   └── transport.html
├── success.html              # NEW: Order success page
├── cart.html                 # NEW: Full cart page (optional)
├── js/
│   ├── cart.js               # NEW: Cart management
│   ├── inventory.js          # NEW: Stock fetching
│   ├── checkout.js           # NEW: Stripe integration
│   └── cart-drawer.js        # NEW: Drawer UI component
├── css/
│   └── cart.css              # NEW: Cart & drawer styles
├── netlify/
│   └── functions/
│       ├── create-checkout.js    # NEW: Checkout session API
│       ├── webhook.js            # NEW: Stripe webhook handler
│       └── inventory.js          # NEW: Inventory API
├── netlify.toml              # NEW: Netlify configuration
└── .env                      # NEW: Environment variables (gitignored)
```

---

## 5. User Interface Specifications

### 5.1 Cart Drawer Design

```
┌─────────────────────────────────────────┐
│  YOUR CART (2)                      ×   │  ← Header with close
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐  Money Rain Parka              │
│  │     │  Money Collection              │
│  │ IMG │  Size: M                       │
│  │     │  ─ 1 +              $395 CAD   │
│  └─────┘                      [Remove]  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────┐  Libation Rain Parka           │
│  │     │  Libation Collection           │
│  │ IMG │  Size: L                       │
│  │     │  ─ 1 +              $395 CAD   │
│  └─────┘                      [Remove]  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Subtotal                    $790 CAD   │
│  Shipping          Calculated at checkout│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │         CHECKOUT — $790 CAD         ││  ← Primary CTA
│  └─────────────────────────────────────┘│
│                                         │
│          Continue Shopping →            │  ← Secondary link
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 Size Selector with Stock

```
SELECT SIZE
┌─────┐ ┌─────┐ ┌─────────┐ ┌─────┐ ┌─────────┐ ┌─────────┐
│ XS  │ │  S  │ │    M    │ │  L  │ │   XL    │ │   XXL   │
│     │ │     │ │SOLD OUT │ │     │ │Only 2   │ │SOLD OUT │
└─────┘ └─────┘ └─────────┘ └─────┘ └─────────┘ └─────────┘
  ↑        ↑         ↑         ↑         ↑           ↑
 In      In       Greyed    In       Warning      Greyed
Stock   Stock     + text   Stock     text         + text
```

### 5.3 Add to Cart Button States

| State | Button Text | Style |
|-------|-------------|-------|
| Default | Add to Cart — $395 CAD | Black bg, white text |
| No size selected | Select a Size | Grey bg, disabled |
| Adding | Adding... | Black bg, spinner |
| Added | Added ✓ | Green bg, checkmark |
| Sold out | Sold Out | Grey bg, disabled |

### 5.4 Cart Icon with Badge

```
     ┌───┐
     │ 2 │  ← Red badge (#E63B3B)
┌────┴───┴────┐
│    🛒       │  ← Cart icon in nav
└─────────────┘
```

---

## 6. Integration Points

### 6.1 Stripe Configuration

**Required Stripe Products:**
| Product | Price ID | Amount |
|---------|----------|--------|
| Libation Rain Parka | price_libation | $395 CAD |
| Money Rain Parka | price_money | $395 CAD |
| Transport Rain Parka | price_transport | $395 CAD |
| Sanitation Rain Parka | price_sanitation | $395 CAD |

**Checkout Settings:**
- Collect shipping address: Yes
- Collect phone number: Optional
- Allow promotion codes: Yes (future)
- Payment methods: card, apple_pay, google_pay, klarna

**Branding:**
- Logo: Hogan's Alley wordmark
- Primary color: #0A0A0A
- Background color: #FAFAF9
- Button color: #0A0A0A

### 6.2 Supabase Configuration

**Row Level Security (RLS):**
- `products`: Public read, admin write
- `inventory`: Public read, service role write
- `orders`: Service role only

**Real-time Subscriptions:**
- Subscribe to `inventory` table changes
- Update UI when stock changes

### 6.3 Netlify Configuration

**netlify.toml:**
```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

**Environment Variables:**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 7. Security Requirements

### 7.1 Payment Security
- All payment processing handled by Stripe (PCI compliant)
- No card data touches our servers
- Webhook signatures verified before processing

### 7.2 API Security
- Netlify functions run server-side (secrets never exposed)
- Supabase anon key used for read operations only
- Service role key only used in serverless functions
- CORS configured for hogansalley.com domain only

### 7.3 Inventory Security
- Stock updates only via authenticated webhook
- Webhook signature verification required
- Idempotency keys prevent duplicate decrements

---

## 8. Performance Requirements

### 8.1 Load Times
- Cart drawer: < 100ms to open
- Inventory fetch: < 500ms
- Checkout redirect: < 2s

### 8.2 Caching
- Inventory cached client-side for 30 seconds
- Invalidate cache on cart update
- Real-time subscription for live updates

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Cart abandonment rate | < 70% |
| Checkout completion rate | > 3% of visitors |
| Add-to-cart rate | > 5% of product page visitors |
| Page load impact | < 200ms additional |
| Mobile checkout completion | > 60% of checkouts |

---

## 10. Future Enhancements (Out of Scope)

- [ ] Discount codes / promotional pricing
- [ ] Tax calculation by region
- [ ] International shipping rates
- [ ] Inventory reservation during checkout
- [ ] "Notify when back in stock" feature
- [ ] Order tracking integration
- [ ] Customer accounts / order history
- [ ] Wishlist functionality

---

## 11. Dependencies

### External Services
- Stripe account (active)
- Supabase account (free tier sufficient)
- Netlify hosting (current)

### npm Packages (for Netlify Functions)
- `stripe` - Stripe API client
- `@supabase/supabase-js` - Supabase client

### Browser Support
- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+
- Mobile Safari / Chrome

---

## Appendix A: Sample Cart State

```javascript
// localStorage key: 'hogans-alley-cart'
{
  "items": [
    {
      "productId": "money-jacket",
      "collection": "Money",
      "name": "Money Rain Parka",
      "size": "M",
      "quantity": 1,
      "price": 395,
      "currency": "CAD",
      "image": "https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Money.png",
      "stripePriceId": "price_money_m"
    }
  ],
  "version": 1,
  "createdAt": "2026-01-27T10:00:00Z",
  "updatedAt": "2026-01-27T10:05:00Z"
}
```

## Appendix B: Inventory API Response Example

```json
{
  "productId": "money-jacket",
  "name": "Money Rain Parka",
  "collection": "Money",
  "price": 39500,
  "currency": "CAD",
  "inventory": {
    "XS": { "quantity": 5, "status": "in_stock" },
    "S": { "quantity": 3, "status": "low_stock" },
    "M": { "quantity": 0, "status": "sold_out" },
    "L": { "quantity": 8, "status": "in_stock" },
    "XL": { "quantity": 2, "status": "low_stock" },
    "XXL": { "quantity": 0, "status": "sold_out" }
  },
  "totalAvailable": 18,
  "updatedAt": "2026-01-27T10:00:00Z"
}
```
