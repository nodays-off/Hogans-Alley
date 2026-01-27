# Project Constitution: Hogan's Alley E-Commerce

**Feature:** Premium E-Commerce Checkout System
**Date:** 2026-01-27

---

## 1. Core Principles

### 1.1 Brand Integrity
- Every UI element must match the premium, editorial aesthetic
- No generic e-commerce patterns (rounded buttons, bright colors, emoji)
- Typography hierarchy: Cormorant Garamond → Inter → JetBrains Mono
- Sharp corners, subtle animations, minimal visual noise

### 1.2 Performance First
- Static site must remain fast (< 3s initial load)
- JavaScript deferred and minimal
- No heavy frameworks (React, Vue) - vanilla JS only
- Lazy load inventory data after initial render

### 1.3 Security Non-Negotiables
- Zero payment data on our servers (Stripe handles all)
- Webhook signature verification required
- Environment variables for all secrets
- No sensitive data in client-side code

### 1.4 Graceful Degradation
- Site must function without JavaScript (view-only)
- Checkout requires JS but fails gracefully with clear message
- Handle API failures with user-friendly error states

---

## 2. Technical Constraints

### 2.1 Architecture Boundaries
| Component | Constraint | Rationale |
|-----------|------------|-----------|
| Frontend | Vanilla HTML/CSS/JS only | No build step, matches existing site |
| Backend | Netlify Functions only | Already on Netlify, serverless simplicity |
| Database | Supabase only | Real-time support, generous free tier |
| Payments | Stripe Checkout (hosted) | PCI compliance, minimal integration |
| State | localStorage only | No server sessions needed |

### 2.2 File Organization
```
/js/         - All JavaScript (cart, inventory, checkout)
/css/        - Additional styles (cart-drawer)
/netlify/functions/  - All serverless functions
/specs/      - Documentation (not deployed)
```

### 2.3 Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `cart-drawer.js` |
| JS Functions | camelCase | `addToCart()` |
| CSS Classes | BEM-style | `.cart-drawer__item` |
| Constants | SCREAMING_SNAKE | `SUPABASE_URL` |
| DB Tables | snake_case | `product_inventory` |
| API Routes | kebab-case | `/api/create-checkout` |

### 2.4 Browser Support
- Modern browsers only (ES6+ support required)
- No IE11 support
- Target: Chrome 80+, Safari 13+, Firefox 75+, Edge 80+

---

## 3. Code Standards

### 3.1 JavaScript
```javascript
// GOOD: Clear, explicit, no magic
async function fetchInventory(productId) {
  const response = await fetch(`/api/inventory?productId=${productId}`);
  if (!response.ok) {
    throw new Error(`Inventory fetch failed: ${response.status}`);
  }
  return response.json();
}

// BAD: Implicit, unclear error handling
const getInv = async (id) => (await fetch(`/api/inventory?productId=${id}`)).json();
```

### 3.2 CSS
```css
/* GOOD: Scoped, explicit, uses CSS variables */
.cart-drawer {
  position: fixed;
  right: 0;
  background: var(--color-white);
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.cart-drawer--open {
  transform: translateX(0);
}

/* BAD: Global selectors, magic numbers */
.open {
  right: 0 !important;
}
```

### 3.3 HTML
```html
<!-- GOOD: Semantic, accessible -->
<button
  class="cart-drawer__remove"
  aria-label="Remove Money Rain Parka from cart"
  data-product-id="money-jacket"
>
  Remove
</button>

<!-- BAD: Non-semantic, inaccessible -->
<div class="remove" onclick="remove()">×</div>
```

---

## 4. API Contracts

### 4.1 Request/Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}

// or on error:
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVENTORY_UNAVAILABLE",
    "message": "Requested size is sold out"
  }
}
```

### 4.2 Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `INVALID_REQUEST` | 400 | Malformed request body |
| `PRODUCT_NOT_FOUND` | 404 | Product slug doesn't exist |
| `INVENTORY_UNAVAILABLE` | 409 | Size sold out |
| `STRIPE_ERROR` | 502 | Stripe API failure |
| `DATABASE_ERROR` | 502 | Supabase connection failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 4.3 Webhook Verification
All incoming webhooks MUST verify Stripe signature:
```javascript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

## 5. Testing Requirements

### 5.1 Manual Testing Checklist
Before any deploy:
- [ ] Add item to cart from each collection page
- [ ] Verify cart persists after page refresh
- [ ] Test sold-out size display
- [ ] Complete test purchase in Stripe test mode
- [ ] Verify inventory decremented after purchase
- [ ] Test on mobile (iOS Safari, Android Chrome)

### 5.2 Stripe Test Cards
| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| 3D Secure | 4000 0027 6000 3184 |

---

## 6. Deployment Rules

### 6.1 Environment Variables
Required in Netlify dashboard:
```
STRIPE_SECRET_KEY        # sk_live_... (production) or sk_test_...
STRIPE_WEBHOOK_SECRET    # whsec_...
SUPABASE_URL             # https://xxx.supabase.co
SUPABASE_ANON_KEY        # eyJ... (public, safe for client)
SUPABASE_SERVICE_ROLE    # eyJ... (server only, never expose)
```

### 6.2 Deployment Checklist
1. All tests pass locally
2. Build completes without errors
3. Environment variables set in Netlify
4. Stripe webhook endpoint configured
5. Supabase RLS policies active

### 6.3 Rollback Plan
- Netlify auto-deploys from `master` branch
- Rollback via Netlify dashboard (previous deploy)
- If payment issues: disable checkout button, show "Temporarily unavailable"

---

## 7. Monitoring & Alerts

### 7.1 What to Monitor
- Stripe Dashboard: Failed payments, disputes
- Netlify Functions: Error rates, cold starts
- Supabase: API request count, database size

### 7.2 Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Checkout error rate | > 5% | > 15% |
| Function timeout | > 5s | > 10s |
| Database latency | > 500ms | > 2s |

---

## 8. Documentation Standards

### 8.1 Code Comments
```javascript
// GOOD: Explain WHY, not WHAT
// Stripe requires price in cents, not dollars
const priceInCents = price * 100;

// BAD: States the obvious
// Multiply price by 100
const priceInCents = price * 100;
```

### 8.2 Commit Messages
```
feat: add cart drawer component with slide animation
fix: prevent duplicate inventory decrement on webhook retry
docs: update API endpoint documentation
refactor: extract inventory fetching to separate module
```

---

## Appendix: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-27 | Vanilla JS only | Matches existing site, no build complexity |
| 2026-01-27 | Supabase for inventory | Real-time support, free tier sufficient |
| 2026-01-27 | Single Stripe price per product | Simpler management, size as metadata |
| 2026-01-27 | CAD only | Primary market, simplifies implementation |
