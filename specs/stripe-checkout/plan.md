# Implementation Plan: Premium E-Commerce Checkout System

**Feature:** stripe-checkout
**Date:** 2026-01-27

---

## 1. Implementation Phases

```
PHASE 1: Foundation (Database + Backend)
├── 1.1 Supabase schema setup
├── 1.2 Seed product and inventory data
├── 1.3 Netlify Functions setup
└── 1.4 Environment configuration

PHASE 2: Inventory System
├── 2.1 Inventory API endpoint
├── 2.2 Client-side inventory fetching
├── 2.3 Real-time subscriptions
└── 2.4 Stock display UI components

PHASE 3: Cart System
├── 3.1 Cart state management (localStorage)
├── 3.2 Cart drawer component
├── 3.3 Add-to-cart functionality
├── 3.4 Cart icon badge
└── 3.5 Product page integration

PHASE 4: Checkout Integration
├── 4.1 Stripe configuration
├── 4.2 Create checkout endpoint
├── 4.3 Checkout button integration
├── 4.4 Success/cancel pages
└── 4.5 Webhook handler

PHASE 5: Polish & Testing
├── 5.1 Error handling & edge cases
├── 5.2 Mobile responsiveness
├── 5.3 End-to-end testing
└── 5.4 Documentation
```

---

## 2. Phase 1: Foundation

### 2.1 Supabase Schema Setup

**File:** Execute in Supabase SQL Editor

```sql
-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents (39500 = $395.00)
  currency TEXT DEFAULT 'CAD',
  images JSONB DEFAULT '[]',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size)
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_checkout_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  customer_email TEXT,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'CAD',
  status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: Public read
CREATE POLICY "Public read products" ON products
  FOR SELECT USING (true);

-- Inventory: Public read
CREATE POLICY "Public read inventory" ON inventory
  FOR SELECT USING (true);

-- Orders: Service role only (via functions)
CREATE POLICY "Service role orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Enable realtime for inventory
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- Create indexes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_orders_stripe_checkout ON orders(stripe_checkout_id);
```

### 2.2 Seed Data

```sql
-- Insert products
INSERT INTO products (slug, name, collection, description, price, images) VALUES
  ('libation-jacket', 'Libation Rain Parka', 'Libation', 'Mid-thigh length waterproof parka featuring our signature Libation print.', 39500, '["https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Libation.png"]'),
  ('money-jacket', 'Money Rain Parka', 'Money', 'Mid-thigh length waterproof parka featuring our signature Money print.', 39500, '["https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Money.png"]'),
  ('transport-jacket', 'Transport Rain Parka', 'Transport', 'Mid-thigh length waterproof parka featuring our signature Transport print.', 39500, '["https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Transportaion.png"]'),
  ('sanitation-jacket', 'Sanitation Rain Parka', 'Sanitation', 'Mid-thigh length waterproof parka featuring our signature Sanitation print.', 39500, '["https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Sanitation.png"]');

-- Insert inventory (10 each size, each product)
INSERT INTO inventory (product_id, size, quantity)
SELECT p.id, s.size, 10
FROM products p
CROSS JOIN (VALUES ('XS'), ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(size);
```

### 2.3 Netlify Functions Directory Structure

```
netlify/
└── functions/
    ├── create-checkout.js    # POST: Create Stripe checkout session
    ├── inventory.js          # GET: Fetch product inventory
    └── webhook.js            # POST: Handle Stripe webhooks
```

### 2.4 Configuration Files

**netlify.toml:**
```toml
[build]
  functions = "netlify/functions"
  publish = "."

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://hogansalley.com"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

**package.json (for functions):**
```json
{
  "name": "hogans-alley-functions",
  "private": true,
  "dependencies": {
    "stripe": "^14.0.0",
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

---

## 3. Phase 2: Inventory System

### 3.1 Inventory API Endpoint

**netlify/functions/inventory.js:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const productId = event.queryStringParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'productId required' }
      })
    };
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', productId)
    .single();

  if (productError || !product) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' }
      })
    };
  }

  const { data: inventory, error: invError } = await supabase
    .from('inventory')
    .select('size, quantity')
    .eq('product_id', product.id);

  if (invError) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch inventory' }
      })
    };
  }

  const inventoryMap = {};
  let totalAvailable = 0;

  inventory.forEach(item => {
    const status = item.quantity === 0 ? 'sold_out'
                 : item.quantity <= 3 ? 'low_stock'
                 : 'in_stock';
    inventoryMap[item.size] = { quantity: item.quantity, status };
    totalAvailable += item.quantity;
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      data: {
        productId: product.slug,
        name: product.name,
        collection: product.collection,
        price: product.price,
        currency: product.currency,
        inventory: inventoryMap,
        totalAvailable,
        updatedAt: new Date().toISOString()
      }
    })
  };
};
```

### 3.2 Client-Side Inventory Module

**js/inventory.js:**
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

class InventoryManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
    this.subscriptions = new Map();
  }

  async fetchInventory(productId) {
    // Check cache
    const cached = this.cache.get(productId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`/api/inventory?productId=${productId}`);
      const result = await response.json();

      if (result.success) {
        this.cache.set(productId, { data: result.data, timestamp: Date.now() });
        return result.data;
      }
      throw new Error(result.error?.message || 'Failed to fetch inventory');
    } catch (error) {
      console.error('Inventory fetch error:', error);
      return null;
    }
  }

  subscribeToUpdates(productId, callback) {
    // Supabase real-time subscription
    const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (!supabase) return;

    const subscription = supabase
      .channel(`inventory:${productId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory' },
        (payload) => {
          this.cache.delete(productId); // Invalidate cache
          this.fetchInventory(productId).then(callback);
        }
      )
      .subscribe();

    this.subscriptions.set(productId, subscription);
  }

  unsubscribe(productId) {
    const subscription = this.subscriptions.get(productId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(productId);
    }
  }
}

window.inventoryManager = new InventoryManager();
```

### 3.3 Stock Display Component

**Integration into collection pages:**
```javascript
function renderSizeSelector(inventory) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const container = document.getElementById('size-selector');

  container.innerHTML = sizes.map(size => {
    const stock = inventory[size];
    const isSoldOut = stock.status === 'sold_out';
    const isLowStock = stock.status === 'low_stock';

    return `
      <button
        class="size-btn ${isSoldOut ? 'size-btn--sold-out' : ''}"
        data-size="${size}"
        ${isSoldOut ? 'disabled' : ''}
      >
        <span class="size-btn__label">${size}</span>
        ${isSoldOut ? '<span class="size-btn__status">Sold Out</span>' : ''}
        ${isLowStock ? `<span class="size-btn__status size-btn__status--low">Only ${stock.quantity} left</span>` : ''}
      </button>
    `;
  }).join('');
}
```

---

## 4. Phase 3: Cart System

### 4.1 Cart State Management

**js/cart.js:**
```javascript
const CART_KEY = 'hogans-alley-cart';
const CART_VERSION = 1;

class CartManager {
  constructor() {
    this.listeners = [];
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === CART_VERSION) {
          this.items = data.items || [];
          return;
        }
      }
    } catch (e) {
      console.error('Cart load error:', e);
    }
    this.items = [];
  }

  save() {
    const data = {
      version: CART_VERSION,
      items: this.items,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CART_KEY, JSON.stringify(data));
    this.notify();
  }

  addItem(product) {
    const existing = this.items.find(
      item => item.productId === product.productId && item.size === product.size
    );

    if (existing) {
      existing.quantity = Math.min(existing.quantity + product.quantity, 3);
    } else {
      this.items.push({ ...product, quantity: product.quantity || 1 });
    }
    this.save();
  }

  removeItem(productId, size) {
    this.items = this.items.filter(
      item => !(item.productId === productId && item.size === size)
    );
    this.save();
  }

  updateQuantity(productId, size, quantity) {
    const item = this.items.find(
      item => item.productId === productId && item.size === size
    );
    if (item) {
      item.quantity = Math.max(1, Math.min(quantity, 3));
      this.save();
    }
  }

  clear() {
    this.items = [];
    this.save();
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(callback => callback(this));
  }
}

window.cart = new CartManager();
```

### 4.2 Cart Drawer Component

**js/cart-drawer.js:**
```javascript
class CartDrawer {
  constructor() {
    this.isOpen = false;
    this.render();
    this.bindEvents();
    window.cart.subscribe(() => this.update());
  }

  render() {
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-drawer__backdrop"></div>
      <div class="cart-drawer__panel">
        <header class="cart-drawer__header">
          <h2 class="cart-drawer__title">Your Cart (<span class="cart-drawer__count">0</span>)</h2>
          <button class="cart-drawer__close" aria-label="Close cart">&times;</button>
        </header>
        <div class="cart-drawer__items"></div>
        <footer class="cart-drawer__footer">
          <div class="cart-drawer__subtotal">
            <span>Subtotal</span>
            <span class="cart-drawer__subtotal-amount">$0 CAD</span>
          </div>
          <p class="cart-drawer__shipping">Shipping calculated at checkout</p>
          <button class="cart-drawer__checkout btn">Checkout</button>
          <button class="cart-drawer__continue">Continue Shopping</button>
        </footer>
        <div class="cart-drawer__empty">
          <p>Your cart is empty</p>
          <a href="/shop.html" class="btn">Start Shopping</a>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  bindEvents() {
    const drawer = document.getElementById('cart-drawer');

    drawer.querySelector('.cart-drawer__close').addEventListener('click', () => this.close());
    drawer.querySelector('.cart-drawer__backdrop').addEventListener('click', () => this.close());
    drawer.querySelector('.cart-drawer__continue').addEventListener('click', () => this.close());
    drawer.querySelector('.cart-drawer__checkout').addEventListener('click', () => this.checkout());

    // Quantity and remove buttons (delegated)
    drawer.querySelector('.cart-drawer__items').addEventListener('click', (e) => {
      const target = e.target;
      const item = target.closest('.cart-item');
      if (!item) return;

      const productId = item.dataset.productId;
      const size = item.dataset.size;

      if (target.classList.contains('cart-item__remove')) {
        window.cart.removeItem(productId, size);
      } else if (target.classList.contains('cart-item__qty-btn--minus')) {
        const current = parseInt(item.querySelector('.cart-item__qty-value').textContent);
        window.cart.updateQuantity(productId, size, current - 1);
      } else if (target.classList.contains('cart-item__qty-btn--plus')) {
        const current = parseInt(item.querySelector('.cart-item__qty-value').textContent);
        window.cart.updateQuantity(productId, size, current + 1);
      }
    });
  }

  open() {
    this.isOpen = true;
    document.getElementById('cart-drawer').classList.add('cart-drawer--open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    document.getElementById('cart-drawer').classList.remove('cart-drawer--open');
    document.body.style.overflow = '';
  }

  update() {
    const items = window.cart.items;
    const count = window.cart.getItemCount();
    const subtotal = window.cart.getSubtotal();

    const drawer = document.getElementById('cart-drawer');
    drawer.querySelector('.cart-drawer__count').textContent = count;
    drawer.querySelector('.cart-drawer__subtotal-amount').textContent = `$${subtotal} CAD`;

    const itemsContainer = drawer.querySelector('.cart-drawer__items');
    const emptyState = drawer.querySelector('.cart-drawer__empty');
    const footer = drawer.querySelector('.cart-drawer__footer');

    if (items.length === 0) {
      itemsContainer.innerHTML = '';
      emptyState.style.display = 'block';
      footer.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      footer.style.display = 'block';
      itemsContainer.innerHTML = items.map(item => this.renderItem(item)).join('');
    }

    // Update nav badge
    this.updateBadge(count);
  }

  renderItem(item) {
    return `
      <div class="cart-item" data-product-id="${item.productId}" data-size="${item.size}">
        <img src="${item.image}" alt="${item.name}" class="cart-item__image">
        <div class="cart-item__details">
          <h3 class="cart-item__name">${item.name}</h3>
          <p class="cart-item__collection">${item.collection} Collection</p>
          <p class="cart-item__size">Size: ${item.size}</p>
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn cart-item__qty-btn--minus">−</button>
            <span class="cart-item__qty-value">${item.quantity}</span>
            <button class="cart-item__qty-btn cart-item__qty-btn--plus">+</button>
          </div>
        </div>
        <div class="cart-item__right">
          <span class="cart-item__price">$${item.price * item.quantity} CAD</span>
          <button class="cart-item__remove">Remove</button>
        </div>
      </div>
    `;
  }

  updateBadge(count) {
    let badge = document.querySelector('.cart-badge');
    if (!badge) {
      const cartIcon = document.querySelector('.cart-icon');
      if (cartIcon) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        cartIcon.appendChild(badge);
      }
    }
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  async checkout() {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: window.cart.items,
          successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cart.html`
        })
      });

      const result = await response.json();

      if (result.success && result.data.url) {
        window.location.href = result.data.url;
      } else {
        alert('Unable to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to start checkout. Please try again.');
    }
  }
}

// Initialize drawer when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.cartDrawer = new CartDrawer();
});
```

---

## 5. Phase 4: Checkout Integration

### 5.1 Create Checkout Endpoint

**netlify/functions/create-checkout.js:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { items, successUrl, cancelUrl } = JSON.parse(event.body);

    // Validate items and get product details
    const lineItems = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('slug', item.productId)
        .single();

      if (!product) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: { code: 'PRODUCT_NOT_FOUND', message: `Product ${item.productId} not found` }
          })
        };
      }

      // Check inventory
      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', product.id)
        .eq('size', item.size)
        .single();

      if (!inv || inv.quantity < item.quantity) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            success: false,
            error: { code: 'INVENTORY_UNAVAILABLE', message: `${product.name} size ${item.size} is not available` }
          })
        };
      }

      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: product.name,
            description: `${product.collection} Collection — Size ${item.size}`,
            images: product.images
          },
          unit_amount: product.price
        },
        quantity: item.quantity
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['CA', 'US']
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'cad' },
            display_name: 'Free shipping (Canada)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 7 }
            }
          }
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 2500, currency: 'cad' },
            display_name: 'Standard shipping (USA)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 7 },
              maximum: { unit: 'business_day', value: 14 }
            }
          }
        }
      ],
      metadata: {
        items: JSON.stringify(items) // Store for webhook
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: { sessionId: session.id, url: session.url }
      })
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: { code: 'STRIPE_ERROR', message: 'Failed to create checkout session' }
      })
    };
  }
};
```

### 5.2 Webhook Handler

**netlify/functions/webhook.js:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      // Parse items from metadata
      const items = JSON.parse(session.metadata.items);

      // Decrement inventory for each item
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('slug', item.productId)
          .single();

        if (product) {
          await supabase.rpc('decrement_inventory', {
            p_product_id: product.id,
            p_size: item.size,
            p_quantity: item.quantity
          });
        }
      }

      // Create order record
      await supabase.from('orders').insert({
        stripe_checkout_id: session.id,
        stripe_payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email,
        items: items,
        subtotal: session.amount_subtotal,
        shipping: session.total_details?.amount_shipping || 0,
        total: session.amount_total,
        currency: session.currency.toUpperCase(),
        status: 'paid',
        shipping_address: session.shipping_details?.address,
        paid_at: new Date().toISOString()
      });

      console.log('Order processed:', session.id);
    } catch (error) {
      console.error('Order processing error:', error);
      // Don't return error - Stripe will retry
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
```

**Supabase function for atomic inventory decrement:**
```sql
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id UUID,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND size = p_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Phase 5: Polish & Integration

### 6.1 Success Page

**success.html** - Create branded confirmation page with:
- Order confirmation message
- Purchased items summary
- Continue shopping CTA
- Newsletter signup

### 6.2 Cart Icon in Navigation

Add to all pages in `<nav>`:
```html
<button class="cart-icon" aria-label="Open cart">
  <svg>...</svg>
  <span class="cart-badge" style="display: none;">0</span>
</button>
```

### 6.3 Product Page Integration

Add to each collection page:
1. Size selector with inventory display
2. Quantity selector
3. Add to Cart button
4. Include cart.js and cart-drawer.js scripts

---

## 7. File Dependency Graph

```
             ┌─────────────────┐
             │  supabase.sql   │ ← Run first
             └────────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│ inventory │  │  create-  │  │  webhook  │
│    .js    │  │ checkout  │  │    .js    │
│ (function)│  │   .js     │  │ (function)│
└───────────┘  └───────────┘  └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │   netlify.toml  │
             └─────────────────┘
                      │
                      ▼
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  cart.js  │  │ inventory │  │ checkout  │
│ (client)  │  │    .js    │  │    .js    │
│           │  │ (client)  │  │ (client)  │
└───────────┘  └───────────┘  └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ cart-drawer.js  │
             └─────────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  cart-drawer.css│
             └─────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│collections│  │success.html│ │ All pages │
│  pages    │  │           │  │ (nav cart)│
└───────────┘  └───────────┘  └───────────┘
```

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Overselling | Webhook decrements stock; check stock at checkout creation |
| Double charge | Stripe handles idempotency; webhook verifies signature |
| API failures | Graceful error messages; retry logic in functions |
| Mobile UX | Test drawer on iOS/Android; ensure touch targets |
| Slow checkout | Optimize function cold starts; lazy load Supabase client |
