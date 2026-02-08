-- ============================================================================
-- Waitlist Table - Back In Stock Notifications
-- Stores email addresses for customers wanting restock notifications
-- ============================================================================

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate signups
  UNIQUE (email, product_id, size)
);

COMMENT ON TABLE waitlist IS 'Customer waitlist for back-in-stock notifications';
COMMENT ON COLUMN waitlist.notified IS 'Whether customer has been notified of restock';

-- Create indexes
CREATE INDEX idx_waitlist_product_size ON waitlist(product_id, size);
CREATE INDEX idx_waitlist_notified ON waitlist(notified) WHERE notified = FALSE;
CREATE INDEX idx_waitlist_email ON waitlist(email);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can insert their own email
CREATE POLICY "waitlist_public_insert" ON waitlist
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "waitlist_service_all" ON waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for waitlist updates
ALTER PUBLICATION supabase_realtime ADD TABLE waitlist;

-- ============================================================================
-- Function: Get Waitlist Count for Product/Size
-- ============================================================================
CREATE OR REPLACE FUNCTION get_waitlist_count(
  p_product_id UUID,
  p_size TEXT
)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM waitlist
  WHERE product_id = p_product_id
    AND size = p_size
    AND notified = FALSE;

  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_waitlist_count IS 'Get count of unnotified waitlist entries for a product/size';

-- ============================================================================
-- Function: Notify Waitlist (mark as notified)
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_waitlist(
  p_product_id UUID,
  p_size TEXT
)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE waitlist
  SET notified = TRUE,
      notified_at = NOW()
  WHERE product_id = p_product_id
    AND size = p_size
    AND notified = FALSE;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_waitlist IS 'Mark waitlist entries as notified when product is back in stock';
