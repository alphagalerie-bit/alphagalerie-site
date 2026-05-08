-- Migration: Phase 1 - Database Indexes for Performance
-- Description: Creates indexes for product list, search, and order lookups
-- Date: 2026-05-08
-- Status: Safe - only creates indexes, no data changes

-- 1.1 Product list optimization (home page, category filters)
CREATE INDEX IF NOT EXISTS idx_produtos_ativo_destaque_id 
ON produtos(ativo DESC, destaque DESC, id DESC);

-- 1.2 Product search optimization
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id 
ON produtos(categoria_id);

-- 1.3 SKU/code lookup
CREATE INDEX IF NOT EXISTS idx_produtos_codigo 
ON produtos(codigo) WHERE codigo IS NOT NULL;

-- 1.4 Category filtering
CREATE INDEX IF NOT EXISTS idx_categorias_ativo_ordem 
ON categorias(ativo, ordem);

-- 1.5 Order lookups by date
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at 
ON pedidos(criado_em DESC);

-- 1.6 Find orders by customer
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_whatsapp 
ON pedidos(cliente_whatsapp) WHERE cliente_whatsapp IS NOT NULL;

-- 1.7 Filter orders by status
CREATE INDEX IF NOT EXISTS idx_pedidos_status 
ON pedidos(status);

-- 1.8 Find order numbers
CREATE INDEX IF NOT EXISTS idx_pedidos_numero 
ON pedidos(numero);

-- 1.9 Order items lookups
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id 
ON pedido_itens(pedido_id);

-- 1.10 Product sales history
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id 
ON pedido_itens(produto_id);

-- Verify indexes were created
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('produtos', 'categorias', 'pedidos', 'pedido_itens')
-- ORDER BY tablename, indexname;

-- Expected improvements:
-- Product list: 800ms → 150ms (5.3x)
-- Category filter: 500ms → 50ms (10x)
-- Order lookups: 600ms → 80ms (7.5x)
