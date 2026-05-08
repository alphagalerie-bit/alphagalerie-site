-- Migration: Phase 2 - FULLTEXT Search Setup
-- Description: Enables Portuguese-language FULLTEXT search on products
-- Date: 2026-05-08
-- Status: Safe - adds column, trigger, and index

-- 2.1 Add search document column (if not exists)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS search_doc tsvector;

-- 2.2 Create function to generate search documents
CREATE OR REPLACE FUNCTION generate_produtos_search_doc() 
RETURNS void AS $$
BEGIN
  UPDATE produtos 
  SET search_doc = to_tsvector('portuguese', 
    COALESCE(nome, '') || ' ' || 
    COALESCE(marca, '') || ' ' ||
    COALESCE(subcategoria, '')
  )
  WHERE search_doc IS NULL OR atualizado_em > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 2.3 Generate initial search docs (for existing products)
SELECT generate_produtos_search_doc();

-- 2.4 Create or replace trigger to auto-update search docs on changes
CREATE OR REPLACE FUNCTION update_produtos_search_doc() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_doc := to_tsvector('portuguese',
    COALESCE(NEW.nome, '') || ' ' || 
    COALESCE(NEW.marca, '') || ' ' ||
    COALESCE(NEW.subcategoria, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2.5 Drop old trigger if exists (to prevent duplicates)
DROP TRIGGER IF EXISTS trg_produtos_search_doc ON produtos;

-- 2.6 Create new trigger
CREATE TRIGGER trg_produtos_search_doc 
BEFORE INSERT OR UPDATE ON produtos
FOR EACH ROW EXECUTE FUNCTION update_produtos_search_doc();

-- 2.7 Create GIN index for fast FULLTEXT search
CREATE INDEX IF NOT EXISTS idx_produtos_search_doc 
ON produtos USING GIN (search_doc);

-- Test FULLTEXT search
-- SELECT id, nome, marca, preco
-- FROM produtos
-- WHERE search_doc @@ plainto_tsquery('portuguese', 'flor')
-- LIMIT 10;

-- Expected improvements:
-- Search (LIKE): 1500ms → 50ms (30x faster)
-- Search ranking: Relevance-based results
-- Portuguese stemming: Handles plurals, verb forms, etc.
