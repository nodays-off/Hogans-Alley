# Clarification Decisions

**Feature:** Premium E-Commerce Checkout System
**Date:** 2026-01-27

---

## Resolved Questions

### 1. Stripe Price Structure
**Decision:** Single price per product
- One Stripe Price ID per jacket ($395 CAD)
- Size passed as line item metadata
- Simplifies Stripe Dashboard management
- 4 total Stripe products (one per collection)

### 2. Initial Inventory Levels
**Decision:** Equal distribution (10 each)
- 10 units per size, per collection
- 6 sizes × 4 collections × 10 units = **240 total units**
- Inventory breakdown:
  | Collection | XS | S | M | L | XL | XXL | Total |
  |------------|-----|-----|-----|-----|-----|------|-------|
  | Libation | 10 | 10 | 10 | 10 | 10 | 10 | 60 |
  | Money | 10 | 10 | 10 | 10 | 10 | 10 | 60 |
  | Transport | 10 | 10 | 10 | 10 | 10 | 10 | 60 |
  | Sanitation | 10 | 10 | 10 | 10 | 10 | 10 | 60 |

### 3. Real-time Updates
**Decision:** Yes, real-time via Supabase subscriptions
- Instant stock updates when purchases occur
- Subscribe to `inventory` table changes
- Premium user experience with live data
- Requires Supabase Realtime enabled (included in free tier)

### 4. Currency
**Decision:** CAD (Canadian Dollar) only
- Single currency simplifies implementation
- Stripe handles display formatting
- Price: $395 CAD for all products
- No multi-currency conversion needed

---

## Spec Updates Required

Based on clarifications, update spec.md:

1. **Section 4.2 Database Schema:**
   - Remove `stripe_price_id` per-size logic
   - Add `stripe_product_id` and `stripe_price_id` to products table only

2. **Section 6.1 Stripe Configuration:**
   - 4 Stripe Products (not 24)
   - Size captured in `line_items[].metadata.size`

3. **Section 4.3 API Endpoints:**
   - `/api/create-checkout` passes size as metadata

4. **Section 4.4 File Structure:**
   - Add Supabase real-time subscription setup in `inventory.js`

---

## Outstanding Decisions (Deferred to Implementation)

1. **Shipping rates** - Free Canada, $25 US (as specified)
2. **Tax handling** - Deferred to Phase 2
3. **Email notifications** - Use Stripe's built-in receipts initially
