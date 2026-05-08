-- Migration: Phase 4 - Row-Level Security Policies
-- Description: Enables RLS on sensitive tables (optional, enterprise only)
-- Date: 2026-05-08
-- Status: Optional - uncomment in .env to enable

-- 4.1 Enable RLS on sensitive tables
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- 4.2 Policy: Allow anonymous checkout (insert)
-- Public users can create orders without login
DROP POLICY IF EXISTS "allow_anon_insert_orders" ON pedidos;
CREATE POLICY "allow_anon_insert_orders" ON pedidos
  FOR INSERT WITH CHECK (auth.role() = 'anon');

-- 4.3 Policy: Allow authenticated users to read own orders (optional)
-- Users can see their own orders (by email)
-- Uncomment if implementing customer login feature
-- CREATE POLICY IF NOT EXISTS "allow_users_read_own_orders" ON pedidos
--   FOR SELECT USING (
--     cliente_email = COALESCE(
--       (auth.jwt() ->> 'email'),
--       ''
--     )
--   );

-- 4.4 Policy: Order items visibility
-- Tied to order visibility (users can see items of their orders)
DROP POLICY IF EXISTS "allow_read_order_items" ON pedido_itens;
CREATE POLICY "allow_read_order_items" ON pedido_itens
  FOR SELECT USING (
    pedido_id IN (
      SELECT id FROM pedidos 
      WHERE cliente_email = COALESCE((auth.jwt() ->> 'email'), '')
        OR auth.role() = 'service_role'
    )
  );

-- 4.5 Policy: Allow service_role (admin) to manage all orders
DROP POLICY IF EXISTS "allow_admin_manage_orders" ON pedidos;
CREATE POLICY "allow_admin_manage_orders" ON pedidos
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "allow_admin_manage_order_items" ON pedido_itens;
CREATE POLICY "allow_admin_manage_order_items" ON pedido_itens
  FOR ALL USING (auth.role() = 'service_role');

-- Security notes:
-- ✅ Anonymous users can create orders (checkout flow)
-- ✅ No row-level filtering for public data (categorias, produtos)
-- 🔒 Admin/service_role can manage all records
-- 🔒 Add user login policies if implementing customer order history

-- To test RLS policies:
-- SELECT * FROM pedidos; -- Should show nothing if RLS restricts
-- SELECT count(*) FROM pedidos; -- Should work (no filtering on count)
