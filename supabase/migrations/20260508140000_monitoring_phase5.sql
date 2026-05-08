-- Migration: Phase 5 - Monitoring & Diagnostics Setup
-- Description: Creates monitoring functions and views for performance tracking
-- Date: 2026-05-08
-- Status: Optional - for ongoing performance monitoring

-- 5.1 Create function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms INT DEFAULT 100)
RETURNS TABLE(
  calls BIGINT,
  mean_time NUMERIC,
  max_time NUMERIC,
  query TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.calls,
    ps.mean_time::NUMERIC,
    ps.max_time::NUMERIC,
    ps.query
  FROM pg_stat_statements ps
  WHERE ps.mean_time > threshold_ms
  ORDER BY ps.mean_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Create function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
  table_name TEXT,
  size_bytes BIGINT,
  size_pretty TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pstat.tablename::TEXT,
    pg_total_relation_size(pstat.schemaname||'.'||pstat.tablename)::BIGINT,
    pg_size_pretty(pg_total_relation_size(pstat.schemaname||'.'||pstat.tablename))::TEXT,
    pstat.n_live_tup::BIGINT
  FROM pg_stat_user_tables pstat
  ORDER BY pg_total_relation_size(pstat.schemaname||'.'||pstat.tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- 5.3 Create function to check index efficiency
CREATE OR REPLACE FUNCTION get_index_efficiency()
RETURNS TABLE(
  table_name TEXT,
  index_name TEXT,
  scans BIGINT,
  tuples_read BIGINT,
  tuples_fetched BIGINT,
  size_bytes BIGINT,
  size_pretty TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pstat.tablename::TEXT,
    pstat.indexname::TEXT,
    pstat.idx_scan,
    pstat.idx_tup_read,
    pstat.idx_tup_fetch,
    pg_relation_size(pstat.indexrelid)::BIGINT,
    pg_size_pretty(pg_relation_size(pstat.indexrelid))::TEXT
  FROM pg_stat_user_indexes pstat
  ORDER BY pstat.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- 5.4 Create function to check database health
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
  metric TEXT,
  value TEXT,
  status TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- Check cache hit ratio
  RETURN QUERY
  SELECT 
    'Cache Hit Ratio' AS metric,
    ROUND(
      100 * SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read)), 2
    )::TEXT || '%' AS value,
    CASE 
      WHEN SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read)) > 0.99 THEN '✅ Excellent'
      WHEN SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read)) > 0.95 THEN '⚠️ Good'
      ELSE '❌ Needs optimization'
    END::TEXT,
    'Target: >99% for optimal performance' AS recommendation
  FROM pg_statio_user_tables;

  -- Check unused indexes
  RETURN QUERY
  SELECT 
    'Unused Indexes' AS metric,
    COUNT(*)::TEXT AS value,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ None'
      ELSE '⚠️ Consider dropping'
    END::TEXT,
    'Remove indexes with 0 scans to save space' AS recommendation
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0;

  -- Check table bloat
  RETURN QUERY
  SELECT 
    'Tables with Bloat' AS metric,
    COUNT(*)::TEXT AS value,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ None detected'
      ELSE '⚠️ Run VACUUM'
    END::TEXT,
    'Run VACUUM FULL to reclaim space' AS recommendation
  FROM pg_stat_user_tables
  WHERE last_vacuum IS NULL OR last_vacuum < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_slow_queries TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_table_sizes TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_index_efficiency TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION database_health_check TO authenticated, service_role;

-- Usage examples:
-- SELECT * FROM get_slow_queries(100);
-- SELECT * FROM get_table_sizes();
-- SELECT * FROM get_index_efficiency();
-- SELECT * FROM database_health_check();

-- Monitoring schedule:
-- Daily: Check slow queries
-- Weekly: Review table sizes and index efficiency
-- Monthly: Run full health check
