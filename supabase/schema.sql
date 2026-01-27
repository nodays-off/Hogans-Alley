-- ============================================================================
-- Hogan's Alley E-commerce Database Schema
-- Supabase PostgreSQL
-- ============================================================================
-- Run this file in the Supabase SQL Editor to set up the complete database
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA CREATION
-- ============================================================================

-- Drop existing tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ----------------------------------------------------------------------------
-- Products Table
-- Stores product catalog information for all jacket collections
-- ----------------------------------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,  -- Price in cents (39500 = $395.00)
  currency TEXT DEFAULT 'CAD',
  images JSONB DEFAULT '[]'::jsonb,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE products IS 'Product catalog for Hogan''s Alley jacket collections';
COMMENT ON COLUMN products.price IS 'Price in cents (39500 = $395.00 CAD)';
COMMENT ON COLUMN products.images IS 'Array of Cloudinary image URLs';

-- ----------------------------------------------------------------------------
-- Inventory Table
-- Tracks stock levels by product and size
-- ----------------------------------------------------------------------------
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,  -- Reserved for pending checkouts
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, size)
);

COMMENT ON TABLE inventory IS 'Stock levels by product and size';
COMMENT ON COLUMN inventory.reserved IS 'Units reserved for pending checkout sessions';

-- ----------------------------------------------------------------------------
-- Orders Table
-- Stores customer orders from Stripe checkout
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_checkout_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  customer_email TEXT,
  items JSONB NOT NULL,  -- Array of {product_id, size, quantity, price}
  subtotal INTEGER NOT NULL,  -- In cents
  shipping INTEGER DEFAULT 0,  -- In cents
  total INTEGER NOT NULL,  -- In cents
  currency TEXT DEFAULT 'CAD',
  status TEXT DEFAULT 'pending',  -- pending, paid, shipped, delivered, cancelled
  shipping_address JSONB,  -- {name, line1, line2, city, state, postal_code, country}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

COMMENT ON TABLE orders IS 'Customer orders from Stripe checkout';
COMMENT ON COLUMN orders.items IS 'Array of line items: {product_id, size, quantity, price}';
COMMENT ON COLUMN orders.status IS 'Order status: pending, paid, shipped, delivered, cancelled';

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Products: Public read access
-- ----------------------------------------------------------------------------
CREATE POLICY "products_public_select" ON products
  FOR SELECT
  TO public
  USING (true);

-- Service role can do everything
CREATE POLICY "products_service_all" ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Inventory: Public read access
-- ----------------------------------------------------------------------------
CREATE POLICY "inventory_public_select" ON inventory
  FOR SELECT
  TO public
  USING (true);

-- Service role can do everything
CREATE POLICY "inventory_service_all" ON inventory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Orders: Service role only (no public access)
-- ----------------------------------------------------------------------------
CREATE POLICY "orders_service_only" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Products: Fast lookup by slug for product pages
CREATE INDEX idx_products_slug ON products(slug);

-- Products: Filter by collection
CREATE INDEX idx_products_collection ON products(collection);

-- Inventory: Fast lookup by product
CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Inventory: Composite for product + size lookups
CREATE INDEX idx_inventory_product_size ON inventory(product_id, size);

-- Orders: Fast lookup by Stripe checkout session
CREATE INDEX idx_orders_stripe_checkout_id ON orders(stripe_checkout_id);

-- Orders: Filter by status
CREATE INDEX idx_orders_status ON orders(status);

-- Orders: Filter by customer email
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- ============================================================================
-- 4. REALTIME
-- ============================================================================

-- Enable realtime for inventory table (for live stock updates)
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- decrement_inventory: Safely reduce stock after purchase
-- Uses GREATEST(0, ...) to prevent negative inventory
-- SECURITY DEFINER allows the function to bypass RLS
-- ----------------------------------------------------------------------------
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

COMMENT ON FUNCTION decrement_inventory IS 'Safely decrement inventory after successful payment';

-- ----------------------------------------------------------------------------
-- reserve_inventory: Reserve stock during checkout
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available INTEGER;
BEGIN
  -- Check available stock
  SELECT quantity - reserved INTO available
  FROM inventory
  WHERE product_id = p_product_id AND size = p_size
  FOR UPDATE;  -- Lock the row

  IF available >= p_quantity THEN
    UPDATE inventory
    SET reserved = reserved + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id AND size = p_size;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reserve_inventory IS 'Reserve inventory during checkout process';

-- ----------------------------------------------------------------------------
-- release_inventory: Release reserved stock (checkout abandoned/expired)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_inventory(
  p_product_id UUID,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET reserved = GREATEST(0, reserved - p_quantity),
      updated_at = NOW()
  WHERE product_id = p_product_id AND size = p_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION release_inventory IS 'Release reserved inventory when checkout expires';

-- ----------------------------------------------------------------------------
-- commit_inventory: Finalize purchase (reduce both quantity and reserved)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION commit_inventory(
  p_product_id UUID,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      reserved = GREATEST(0, reserved - p_quantity),
      updated_at = NOW()
  WHERE product_id = p_product_id AND size = p_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION commit_inventory IS 'Finalize inventory reduction after successful payment';

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Insert Products
-- All jackets are $395.00 CAD (39500 cents)
-- ----------------------------------------------------------------------------

-- Libation Rain Parka
INSERT INTO products (slug, name, collection, description, price, currency, images)
VALUES (
  'libation-jacket',
  'Libation Rain Parka',
  'Libation',
  'The Libation Rain Parka celebrates the warmth of gathering spaces with an artistic print inspired by the vibrant energy of neighbourhood pubs. Crafted from recycled materials in Vancouver, this parka features a fleece-lined interior, adjustable hood with drawcord system, and oversized patch pockets.',
  39500,
  'CAD',
  '[
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Libation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-1%20Fleece%20Lining%20Interior%20-%20Libation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-2%20Hood%20with%20Drawcord%20System%20-%20Libation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-9%20Recycled%20Fabric%20Texture%20-%20Libation.png"
  ]'::jsonb
);

-- Money Rain Parka
INSERT INTO products (slug, name, collection, description, price, currency, images)
VALUES (
  'money-jacket',
  'Money Rain Parka',
  'Money',
  'The Money Rain Parka makes a bold statement with its striking currency-inspired print, symbolizing the economic stories of Hogan''s Alley. Crafted from recycled materials in Vancouver, this parka features a fleece-lined interior, adjustable hood with drawcord system, and oversized patch pockets.',
  39500,
  'CAD',
  '[
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Money.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-1%20Fleece%20Lining%20Interior%20-%20Money.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-2%20Hood%20with%20Drawcord%20System%20-%20Money.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-9%20Recycled%20Fabric%20Texture%20-%20Money.png"
  ]'::jsonb
);

-- Transport Rain Parka
INSERT INTO products (slug, name, collection, description, price, currency, images)
VALUES (
  'transport-jacket',
  'Transport Rain Parka',
  'Transport',
  'The Transport Rain Parka celebrates urban mobility with a dynamic print inspired by the porters and railway workers who built Hogan''s Alley. Crafted from recycled materials in Vancouver, this parka features a fleece-lined interior, adjustable hood with drawcord system, and oversized patch pockets.',
  39500,
  'CAD',
  '[
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Transportaion.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-1%20Fleece%20Lining%20Interior%20-%20Transportation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-2%20Hood%20with%20Drawcord%20System%20-%20Transportation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-9%20Recycled%20Fabric%20Texture%20-%20Transportation.png"
  ]'::jsonb
);

-- Sanitation Rain Parka
INSERT INTO products (slug, name, collection, description, price, currency, images)
VALUES (
  'sanitation-jacket',
  'Sanitation Rain Parka',
  'Sanitation',
  'The Sanitation Rain Parka honours the essential workers who kept the city clean, with a print inspired by the sanitation crews of Hogan''s Alley. Crafted from recycled materials in Vancouver, this parka features a fleece-lined interior, adjustable hood with drawcord system, and oversized patch pockets.',
  39500,
  'CAD',
  '[
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/Fabric%20Detail%20Shot%20-%20Sanitation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-1%20Fleece%20Lining%20Interior%20-%20Sanitation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-2%20Hood%20with%20Drawcord%20System%20-%20Sanitation.png",
    "https://res.cloudinary.com/dji0e17gv/image/fetch/f_auto,q_auto,w_800/https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/DETAIL-9%20Recycled%20Fabric%20Texture%20-%20Sanitation.png"
  ]'::jsonb
);

-- ----------------------------------------------------------------------------
-- Insert Inventory
-- 10 units of each size (XS, S, M, L, XL, XXL) for each product = 24 records
-- ----------------------------------------------------------------------------

-- Libation Jacket Inventory
INSERT INTO inventory (product_id, size, quantity)
SELECT p.id, s.size, 10
FROM products p
CROSS JOIN (
  SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']) AS size
) s
WHERE p.slug = 'libation-jacket';

-- Money Jacket Inventory
INSERT INTO inventory (product_id, size, quantity)
SELECT p.id, s.size, 10
FROM products p
CROSS JOIN (
  SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']) AS size
) s
WHERE p.slug = 'money-jacket';

-- Transport Jacket Inventory
INSERT INTO inventory (product_id, size, quantity)
SELECT p.id, s.size, 10
FROM products p
CROSS JOIN (
  SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']) AS size
) s
WHERE p.slug = 'transport-jacket';

-- Sanitation Jacket Inventory
INSERT INTO inventory (product_id, size, quantity)
SELECT p.id, s.size, 10
FROM products p
CROSS JOIN (
  SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']) AS size
) s
WHERE p.slug = 'sanitation-jacket';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm setup)
-- ============================================================================

-- Check products
-- SELECT id, slug, name, collection, price, currency FROM products;

-- Check inventory counts
-- SELECT p.slug, i.size, i.quantity
-- FROM inventory i
-- JOIN products p ON p.id = i.product_id
-- ORDER BY p.slug, i.size;

-- Check total inventory
-- SELECT COUNT(*) as total_inventory_records FROM inventory;
-- Expected: 24 (4 products x 6 sizes)

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('products', 'inventory', 'orders');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
