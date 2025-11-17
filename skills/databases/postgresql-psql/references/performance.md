# PostgreSQL Performance Optimization

Guide to query optimization, performance analysis, and monitoring PostgreSQL databases.

## Table of Contents
- [Query Analysis with EXPLAIN](#query-analysis-with-explain)
- [Query Optimization Techniques](#query-optimization-techniques)
- [Monitoring Performance](#monitoring-performance)
- [Configuration Tuning](#configuration-tuning)
- [Common Performance Issues](#common-performance-issues)

## Query Analysis with EXPLAIN

### Basic EXPLAIN

```sql
-- Show query execution plan
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- Output shows:
-- - Seq Scan or Index Scan
-- - Estimated rows
-- - Estimated cost
```

### EXPLAIN ANALYZE

Executes the query and shows actual performance.

```sql
-- Run query and show actual times
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'user@example.com';

-- Shows:
-- - Actual execution time
-- - Actual rows returned
-- - Planning time vs execution time
```

### EXPLAIN Options

```sql
-- Verbose output (more details)
EXPLAIN (VERBOSE, ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE created_at > '2024-01-01';

-- Available options:
EXPLAIN (
    ANALYZE,        -- Actually execute query
    VERBOSE,        -- Show column list, schema
    COSTS,          -- Show cost estimates (default: on)
    BUFFERS,        -- Show buffer usage
    TIMING,         -- Show timing info (default: on with ANALYZE)
    SUMMARY,        -- Show summary info (default: on with ANALYZE)
    FORMAT JSON     -- JSON output (also: TEXT, XML, YAML)
)
SELECT ...;
```

### Reading EXPLAIN Output

```sql
EXPLAIN ANALYZE
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';

-- Sample output:
-- Hash Join  (cost=123.45..678.90 rows=100 width=64) (actual time=5.234..12.567 rows=95 loops=1)
--   Hash Cond: (o.user_id = u.id)
--   ->  Seq Scan on orders o  (cost=0.00..123.45 rows=100 width=32) (actual time=0.012..1.234 rows=100 loops=1)
--         Filter: (status = 'completed'::text)
--   ->  Hash  (cost=100.00..100.00 rows=1000 width=32) (actual time=2.345..2.345 rows=1000 loops=1)
--         ->  Seq Scan on users u  (cost=0.00..100.00 rows=1000 width=32) (actual time=0.010..1.234 rows=1000 loops=1)
-- Planning Time: 0.234 ms
-- Execution Time: 12.890 ms

-- Key metrics:
-- - cost=start..total: Estimated cost units
-- - rows=N: Estimated rows
-- - width=N: Average row size in bytes
-- - actual time=start..end: Actual time in milliseconds
-- - rows=N: Actual rows returned
-- - loops=N: Number of times node was executed
```

### Common Execution Nodes

```sql
-- Seq Scan (Sequential Scan)
-- Scans entire table, slow for large tables
Seq Scan on users  (cost=0.00..100.00 rows=1000 width=32)

-- Index Scan
-- Uses index to find rows, then fetches from table
Index Scan using idx_users_email on users  (cost=0.29..8.30 rows=1 width=32)

-- Index Only Scan
-- Gets all data from index, doesn't access table (fastest)
Index Only Scan using idx_users_email_covering on users  (cost=0.29..4.30 rows=1 width=20)

-- Bitmap Index Scan + Bitmap Heap Scan
-- Used for multiple rows, more efficient than multiple Index Scans
Bitmap Heap Scan on orders  (cost=12.34..56.78 rows=100 width=32)
  Recheck Cond: (status = 'completed')
  ->  Bitmap Index Scan on idx_orders_status  (cost=0.00..12.34 rows=100 width=0)

-- Hash Join
-- Builds hash table from smaller table, probes with larger table
Hash Join  (cost=123.45..678.90 rows=100 width=64)
  Hash Cond: (o.user_id = u.id)

-- Nested Loop
-- For each row in outer table, scan inner table
Nested Loop  (cost=0.29..100.50 rows=10 width=64)

-- Merge Join
-- Both inputs sorted, then merged
Merge Join  (cost=123.45..234.56 rows=100 width=64)
  Merge Cond: (o.user_id = u.id)
```

## Query Optimization Techniques

### Use Indexes Effectively

```sql
-- ✗ Bad: No index, full table scan
SELECT * FROM users WHERE email = 'user@example.com';

-- ✓ Good: Create index
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'user@example.com';

-- ✗ Bad: Function prevents index use
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- ✓ Good: Create functional index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';
```

### Limit Result Sets

```sql
-- ✗ Bad: Return all rows
SELECT * FROM orders ORDER BY created_at DESC;

-- ✓ Good: Limit results
SELECT * FROM orders ORDER BY created_at DESC LIMIT 100;

-- ✓ Better: Add index for ORDER BY
CREATE INDEX idx_orders_created_desc ON orders(created_at DESC);
SELECT * FROM orders ORDER BY created_at DESC LIMIT 100;
```

### Select Only Needed Columns

```sql
-- ✗ Bad: Select all columns
SELECT * FROM users;

-- ✓ Good: Select specific columns
SELECT id, name, email FROM users;

-- ✓ Better: Enable index-only scan
CREATE INDEX idx_users_covering ON users(id) INCLUDE (name, email);
SELECT id, name, email FROM users WHERE id = 123;
```

### Optimize JOINs

```sql
-- ✗ Bad: No indexes on join columns
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- ✓ Good: Index join columns
CREATE INDEX idx_orders_user_id ON orders(user_id);
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- ✗ Bad: Large join result then filter
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';

-- ✓ Good: Filter before join
SELECT u.name, o.total
FROM users u
JOIN (
    SELECT user_id, total
    FROM orders
    WHERE status = 'completed'
) o ON u.id = o.user_id;

-- ✓ Better: Use WHERE clause (planner optimizes)
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id AND o.status = 'completed';
```

### Use EXISTS Instead of IN

```sql
-- ✗ Slower: IN with subquery
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders);

-- ✓ Faster: EXISTS
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_id = u.id
);

-- ✓ Alternative: JOIN with DISTINCT
SELECT DISTINCT u.*
FROM users u
JOIN orders o ON u.id = o.user_id;
```

### Optimize Aggregate Queries

```sql
-- ✗ Bad: Count all rows
SELECT COUNT(*) FROM orders;

-- ✓ Good: Use estimated count for approximate results
SELECT reltuples::BIGINT AS estimate
FROM pg_class
WHERE relname = 'orders';

-- ✗ Bad: GROUP BY with large result set
SELECT user_id, COUNT(*)
FROM orders
GROUP BY user_id;

-- ✓ Good: Add index for GROUP BY
CREATE INDEX idx_orders_user_id ON orders(user_id);
SELECT user_id, COUNT(*)
FROM orders
GROUP BY user_id;
```

### Use Materialized Views

```sql
-- Create materialized view for expensive query
CREATE MATERIALIZED VIEW daily_sales AS
SELECT
    DATE(created_at) AS sale_date,
    COUNT(*) AS order_count,
    SUM(total) AS total_revenue
FROM orders
GROUP BY DATE(created_at);

-- Create index on materialized view
CREATE INDEX idx_daily_sales_date ON daily_sales(sale_date);

-- Query materialized view (fast)
SELECT * FROM daily_sales
WHERE sale_date > CURRENT_DATE - INTERVAL '7 days';

-- Refresh when needed
REFRESH MATERIALIZED VIEW daily_sales;

-- Refresh without locking (concurrent)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
```

### Avoid N+1 Queries

```sql
-- ✗ Bad: N+1 queries (one query per user)
-- SELECT * FROM users;
-- for each user:
--   SELECT * FROM orders WHERE user_id = ?

-- ✓ Good: Single query with JOIN
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- ✓ Good: Two queries with IN clause
-- SELECT * FROM users;
-- SELECT * FROM orders WHERE user_id IN (1, 2, 3, ...);
```

### Use UNION ALL Instead of UNION

```sql
-- ✗ Slower: UNION removes duplicates
SELECT name FROM customers
UNION
SELECT name FROM suppliers;

-- ✓ Faster: UNION ALL keeps duplicates
SELECT name FROM customers
UNION ALL
SELECT name FROM suppliers;

-- Use UNION only if you need to remove duplicates
```

## Monitoring Performance

### Current Queries

```sql
-- View all active queries
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Find long-running queries
SELECT
    pid,
    usename,
    NOW() - query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
    AND NOW() - query_start > INTERVAL '5 minutes'
ORDER BY duration DESC;

-- Cancel long-running query
SELECT pg_cancel_backend(pid);

-- Terminate query (force kill)
SELECT pg_terminate_backend(pid);
```

### Blocking Queries

```sql
-- Find blocking queries
SELECT
    blocked.pid AS blocked_pid,
    blocked.usename AS blocked_user,
    blocking.pid AS blocking_pid,
    blocking.usename AS blocking_user,
    blocked.query AS blocked_query,
    blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.pid != blocking.pid;

-- Find locks
SELECT
    l.pid,
    l.mode,
    l.granted,
    l.relation::regclass AS table_name,
    a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation IS NOT NULL;
```

### Table Statistics

```sql
-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Sequential scans vs index scans
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / NULLIF(seq_scan, 0) AS avg_seq_read,
    idx_tup_fetch / NULLIF(idx_scan, 0) AS avg_idx_fetch
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_tup_read DESC;
```

### Cache Hit Ratio

```sql
-- Buffer cache hit ratio (should be > 99%)
SELECT
    SUM(heap_blks_read) AS heap_read,
    SUM(heap_blks_hit) AS heap_hit,
    SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Index cache hit ratio
SELECT
    SUM(idx_blks_read) AS idx_read,
    SUM(idx_blks_hit) AS idx_hit,
    SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit) + SUM(idx_blks_read), 0) AS idx_cache_hit_ratio
FROM pg_statio_user_indexes;
```

### Slow Query Log

Enable slow query logging in postgresql.conf:

```conf
# postgresql.conf
log_min_duration_statement = 1000  # Log queries slower than 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'all'  # Or 'ddl', 'mod', 'all'
```

Query slow queries from logs:

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slowest queries
SELECT
    calls,
    total_exec_time / 1000 AS total_sec,
    mean_exec_time / 1000 AS avg_sec,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

## Configuration Tuning

### Memory Settings

```conf
# postgresql.conf

# Shared buffers (25% of RAM for dedicated server)
shared_buffers = 4GB

# Work memory (for sorts, joins per operation)
work_mem = 256MB

# Maintenance work memory (for VACUUM, CREATE INDEX)
maintenance_work_mem = 1GB

# Effective cache size (OS + PostgreSQL cache, ~75% of RAM)
effective_cache_size = 12GB
```

### Connection Settings

```conf
# Maximum connections
max_connections = 100

# Connection pooling recommended (use pgBouncer)
```

### Write Performance

```conf
# WAL settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 2GB

# Synchronous commit (trade durability for speed)
synchronous_commit = on  # off for async writes (faster, less durable)
```

### Query Planner

```conf
# Random page cost (lower for SSD)
random_page_cost = 1.1  # Default: 4.0, SSD: 1.1, HDD: 4.0

# Effective I/O concurrency
effective_io_concurrency = 200  # SSD: 200, HDD: 2

# Enable parallel queries
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

### Apply Configuration Changes

```sql
-- Reload configuration (doesn't restart)
SELECT pg_reload_conf();

-- Check current settings
SHOW shared_buffers;
SHOW work_mem;

-- View all settings
SELECT name, setting, unit, context
FROM pg_settings
WHERE name LIKE '%mem%';
```

## Common Performance Issues

### Issue: Full Table Scans

**Symptom:** Queries are slow, EXPLAIN shows "Seq Scan"

**Solution:**
```sql
-- Create appropriate indexes
CREATE INDEX idx_users_email ON users(email);

-- Or use partial index
CREATE INDEX idx_active_users ON users(email) WHERE active = true;
```

### Issue: Index Not Used

**Symptom:** Index exists but EXPLAIN shows "Seq Scan"

**Causes & Solutions:**

```sql
-- 1. Function on indexed column
-- ✗ Bad
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- ✓ Good: Create functional index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- 2. Type mismatch
-- ✗ Bad: user_id is INTEGER, but comparing to string
SELECT * FROM orders WHERE user_id = '123';

-- ✓ Good: Match types
SELECT * FROM orders WHERE user_id = 123;

-- 3. OR conditions
-- ✗ Bad: Can't use single index efficiently
SELECT * FROM users WHERE name = 'John' OR email = 'john@example.com';

-- ✓ Good: Use UNION
SELECT * FROM users WHERE name = 'John'
UNION
SELECT * FROM users WHERE email = 'john@example.com';

-- 4. Small table (seq scan is faster)
-- Solution: Accept it, or force index scan
SET enable_seqscan = off;  -- Force index scan (testing only)
```

### Issue: Slow JOINs

**Symptom:** JOIN queries are slow

**Solution:**
```sql
-- Index foreign key columns
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Consider join order
-- PostgreSQL usually optimizes, but you can hint with subqueries
SELECT u.name, o.total
FROM users u
JOIN (
    SELECT user_id, total
    FROM orders
    WHERE status = 'completed'
) o ON u.id = o.user_id;
```

### Issue: Slow Aggregations

**Symptom:** COUNT, SUM, AVG queries are slow

**Solution:**
```sql
-- 1. Use indexes for GROUP BY
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 2. Use partial aggregation
-- Instead of counting all, filter first
SELECT COUNT(*) FROM orders WHERE created_at > '2024-01-01';
CREATE INDEX idx_orders_created ON orders(created_at);

-- 3. Use materialized views
CREATE MATERIALIZED VIEW order_stats AS
SELECT user_id, COUNT(*), SUM(total)
FROM orders
GROUP BY user_id;
```

### Issue: Lock Contention

**Symptom:** Queries waiting for locks

**Solution:**
```sql
-- Use shorter transactions
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;  -- Don't keep transaction open

-- Use FOR UPDATE SKIP LOCKED for queue-like patterns
BEGIN;
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

UPDATE jobs SET status = 'processing' WHERE id = ?;
COMMIT;
```

### Issue: Bloated Tables/Indexes

**Symptom:** Tables/indexes larger than expected

**Solution:**
```sql
-- VACUUM to reclaim space
VACUUM VERBOSE table_name;

-- VACUUM FULL to compact table (locks table)
VACUUM FULL table_name;

-- Auto-vacuum settings (postgresql.conf)
autovacuum = on
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1

-- Reindex if bloated
REINDEX INDEX CONCURRENTLY idx_name;
```

### Issue: Connection Exhaustion

**Symptom:** "too many connections" errors

**Solution:**
```conf
# Increase max_connections (postgresql.conf)
max_connections = 200

# Better: Use connection pooling (pgBouncer, pgpool-II)
```

## Performance Testing

### Benchmarking Queries

```sql
-- Enable timing
\timing on

-- Run query multiple times
SELECT * FROM users WHERE email = 'user@example.com';
-- Time: 1.234 ms

-- Test with different parameters
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE id = 1000;

-- Compare with and without index
DROP INDEX idx_users_email;
SELECT * FROM users WHERE email = 'user@example.com';
-- Time: 45.678 ms (slower)

CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'user@example.com';
-- Time: 1.234 ms (faster)
```

### Load Testing

Use pgbench for load testing:

```bash
# Initialize test database
pgbench -i -s 50 mydb

# Run benchmark (10 clients, 1000 transactions)
pgbench -c 10 -t 1000 mydb

# Custom benchmark script
pgbench -c 10 -t 1000 -f custom_benchmark.sql mydb
```

## Performance Monitoring Tools

- **pg_stat_statements**: Track query performance
- **pgBadger**: Log analyzer
- **pg_stat_activity**: Real-time query monitoring
- **EXPLAIN ANALYZE**: Query execution analysis
- **pgAdmin**: GUI with performance monitoring
- **DataDog, New Relic**: APM tools with PostgreSQL support
