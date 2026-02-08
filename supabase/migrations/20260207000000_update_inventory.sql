-- ============================================================================
-- Update Inventory - Money Print Only
-- Only Money jacket in stock: 4 Medium, 10 Large
-- All other products sold out
-- ============================================================================

-- Set all inventory to 0 first
UPDATE inventory SET quantity = 0, reserved = 0;

-- Update Money jacket inventory
-- 4 Medium, 10 Large
UPDATE inventory
SET quantity = 4, updated_at = NOW()
FROM products p
WHERE inventory.product_id = p.id
  AND p.slug = 'money-jacket'
  AND inventory.size = 'M';

UPDATE inventory
SET quantity = 10, updated_at = NOW()
FROM products p
WHERE inventory.product_id = p.id
  AND p.slug = 'money-jacket'
  AND inventory.size = 'L';

-- Verify inventory update
SELECT p.slug, i.size, i.quantity, i.reserved
FROM inventory i
JOIN products p ON p.id = i.product_id
ORDER BY p.slug, i.size;
