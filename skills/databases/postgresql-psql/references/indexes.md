# PostgreSQL Indexes

Guide to creating and optimizing indexes for query performance.

## Table of Contents
- [Index Basics](#index-basics)
- [Index Types](#index-types)
- [Creating Indexes](#creating-indexes)
- [Index Strategies](#index-strategies)
- [Index Maintenance](#index-maintenance)
- [Monitoring Indexes](#monitoring-indexes)

## Index Basics

### What Are Indexes?

Indexes are database objects that improve query performance by allowing faster data retrieval. They work like a book index - instead of scanning every page, you can look up specific information quickly.

**Trade-offs:**
- Faster SELECT queries
- Slower INSERT, UPDATE, DELETE operations
- Additional storage space
- Maintenance overhead

### When to Create Indexes

**Create indexes for:**
- Columns frequently used in WHERE clauses
- Columns used in JOIN conditions
- Columns used in ORDER BY
- Foreign key columns
- Columns with high selectivity (many unique values)

**Don't create indexes for:**
- Small tables (full scan is faster)
- Columns with low selectivity (few unique values like boolean)
- Columns rarely used in queries
- Tables with frequent writes and rare reads

## Index Types

### B-tree Index (Default)

Most common index type, good for equality and range queries.

```sql
-- Automatically created for PRIMARY KEY and UNIQUE constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,        -- B-tree index created
    email VARCHAR(255) UNIQUE     -- B-tree index created
);

-- Manual B-tree index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_date ON orders(created_at);

-- Good for:
-- = equality: WHERE email = 'user@example.com'
-- < > <= >= comparisons: WHERE price > 100
-- BETWEEN: WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
-- IN: WHERE status IN ('active', 'pending')
-- IS NULL / IS NOT NULL
-- ORDER BY: ORDER BY created_at DESC
-- LIKE 'prefix%': WHERE name LIKE 'John%' (prefix matching only)
```

### Hash Index

Optimized for equality comparisons only.

```sql
-- Create hash index
CREATE INDEX idx_users_email_hash ON users USING HASH (email);

-- Good for:
-- = equality only: WHERE email = 'user@example.com'

-- Not good for:
-- Range queries, ORDER BY, LIKE
```

### GiST Index (Generalized Search Tree)

Supports full-text search, geometric types, and custom data types.

```sql
-- Full-text search
CREATE INDEX idx_documents_search ON documents USING GIST(search_vector);

-- Geometric types
CREATE INDEX idx_locations_point ON locations USING GIST(coordinates);

-- Range types
CREATE INDEX idx_bookings_period ON bookings USING GIST(period);

-- Good for:
-- Full-text search: WHERE search_vector @@ to_tsquery('database')
-- Geometric queries: WHERE coordinates <-> point '(0,0)' < 10
-- Range overlaps: WHERE period && daterange('2024-01-01', '2024-12-31')
```

### GIN Index (Generalized Inverted Index)

Optimized for composite values like arrays, JSONB, and full-text search.

```sql
-- JSONB
CREATE INDEX idx_documents_data ON documents USING GIN(data);

-- Array
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Full-text search (preferred over GiST for large text)
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- Good for:
-- JSONB containment: WHERE data @> '{"city": "NYC"}'
-- Array containment: WHERE tags @> ARRAY['postgres']
-- Full-text search: WHERE search_vector @@ to_tsquery('database')
```

### BRIN Index (Block Range Index)

Efficient for very large tables with natural ordering.

```sql
-- Create BRIN index
CREATE INDEX idx_logs_timestamp ON logs USING BRIN(created_at);

-- Good for:
-- Large tables (100+ GB)
-- Naturally ordered data (timestamps, sequential IDs)
-- Low cardinality in clustered order

-- Trade-offs:
-- Very small size (100-1000x smaller than B-tree)
-- Fast creation
-- Lower query performance than B-tree
-- Best for range queries on clustered data
```

### SP-GiST Index (Space-Partitioned GiST)

For data with non-balanced tree structures.

```sql
-- Create SP-GiST index
CREATE INDEX idx_ips_network ON ip_addresses USING SPGIST(ip_address inet_ops);

-- Good for:
-- IP addresses
-- Phone numbers
-- Geometrics with non-uniform distribution
```

## Creating Indexes

### Basic Index Creation

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Multi-column (composite) index
CREATE INDEX idx_users_name_email ON users(last_name, first_name);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Partial index (filtered)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Index with sort order
CREATE INDEX idx_orders_date_desc ON orders(created_at DESC);

-- Index with NULLS ordering
CREATE INDEX idx_users_last_login ON users(last_login DESC NULLS LAST);
```

### Partial Indexes

Indexes for subset of rows, saves space and improves performance.

```sql
-- Index only active users
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Index recent orders
CREATE INDEX idx_recent_orders ON orders(user_id)
WHERE created_at > '2024-01-01';

-- Index non-null values
CREATE INDEX idx_users_phone ON users(phone_number)
WHERE phone_number IS NOT NULL;

-- Index specific statuses
CREATE INDEX idx_pending_orders ON orders(id, created_at)
WHERE status IN ('pending', 'processing');
```

### Expression Indexes

Indexes on computed values or transformations.

```sql
-- Case-insensitive search
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Extract from timestamp
CREATE INDEX idx_orders_year_month ON orders(
    EXTRACT(YEAR FROM created_at),
    EXTRACT(MONTH FROM created_at)
);

-- JSON field extraction
CREATE INDEX idx_documents_user_id ON documents((data->>'user_id'));

-- Concatenation
CREATE INDEX idx_users_full_name ON users((first_name || ' ' || last_name));
```

### Concurrent Index Creation

Create indexes without locking the table (allows reads and writes).

```sql
-- Regular CREATE INDEX locks the table
CREATE INDEX idx_users_email ON users(email);

-- CONCURRENTLY allows table access during creation
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Note: CONCURRENTLY takes longer and can't run in transaction
```

### Index Options

```sql
-- Set fillfactor (percentage of space used per page)
-- Lower values leave room for updates, reducing page splits
CREATE INDEX idx_users_email ON users(email) WITH (fillfactor = 80);

-- Specify tablespace
CREATE INDEX idx_users_email ON users(email) TABLESPACE fast_storage;

-- Multiple options
CREATE INDEX idx_orders_date ON orders(created_at)
WITH (fillfactor = 90)
TABLESPACE archive_storage;
```

## Index Strategies

### Composite Index Column Order

Column order matters! Most selective column first.

```sql
-- If querying by last_name often, and last_name + first_name sometimes:
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- This index can be used for:
-- WHERE last_name = 'Smith'                           ✓ (uses index)
-- WHERE last_name = 'Smith' AND first_name = 'John'   ✓ (uses full index)
-- WHERE first_name = 'John'                           ✗ (can't use index)

-- Order by selectivity (most selective first)
-- Bad: low selectivity first
CREATE INDEX idx_orders_bad ON orders(status, user_id, created_at);

-- Good: high selectivity first
CREATE INDEX idx_orders_good ON orders(user_id, created_at, status);
```

### Covering Indexes (Index-Only Scans)

Include all columns needed by query to avoid table access.

```sql
-- Query needs id, email, name
CREATE INDEX idx_users_covering ON users(email) INCLUDE (id, name);

-- This query can be answered entirely from the index
SELECT id, name FROM users WHERE email = 'user@example.com';

-- Another example
CREATE INDEX idx_orders_covering ON orders(user_id, created_at)
INCLUDE (total, status);

SELECT created_at, total, status
FROM orders
WHERE user_id = 123
ORDER BY created_at DESC;
```

### Index for Sorting

Indexes can eliminate sort operations.

```sql
-- Frequent query: recent orders
CREATE INDEX idx_orders_date_desc ON orders(created_at DESC);

-- This avoids sorting in memory
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Multi-column sort
CREATE INDEX idx_users_sort ON users(last_name, first_name, id);

-- Matches this query exactly
SELECT * FROM users ORDER BY last_name, first_name, id;
```

### Index for LIKE Queries

```sql
-- Standard B-tree for prefix matching
CREATE INDEX idx_users_name ON users(name);

-- Works: WHERE name LIKE 'John%'
-- Doesn't work: WHERE name LIKE '%John%'

-- For pattern matching anywhere, use trigram index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_users_name_trgm ON users USING GIN(name gin_trgm_ops);

-- Now works: WHERE name LIKE '%John%'
-- Also works: WHERE name % 'Jon'  (similarity search)
```

### Index for JSON Queries

```sql
-- GIN index for containment
CREATE INDEX idx_documents_data ON documents USING GIN(data);

-- For specific JSON paths
CREATE INDEX idx_documents_city ON documents((data->>'city'));

-- For JSON arrays
CREATE INDEX idx_documents_tags ON documents USING GIN((data->'tags'));

-- With jsonb_path_ops (faster, smaller, but only @> operator)
CREATE INDEX idx_documents_data_path ON documents
USING GIN(data jsonb_path_ops);
```

## Index Maintenance

### Rebuilding Indexes

Over time, indexes can become bloated and less efficient.

```sql
-- Rebuild index (locks table)
REINDEX INDEX idx_users_email;

-- Rebuild all indexes on table
REINDEX TABLE users;

-- Rebuild all indexes in database
REINDEX DATABASE mydb;

-- Rebuild concurrently (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
```

### Dropping Indexes

```sql
-- Drop index
DROP INDEX idx_users_email;

-- Drop if exists (no error)
DROP INDEX IF EXISTS idx_users_email;

-- Drop concurrently (doesn't block queries)
DROP INDEX CONCURRENTLY idx_users_email;
```

### Renaming Indexes

```sql
-- Rename index
ALTER INDEX idx_old_name RENAME TO idx_new_name;
```

### Index Size

```sql
-- Get index size
SELECT pg_size_pretty(pg_relation_size('idx_users_email'));

-- Get all indexes sizes for a table
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY pg_relation_size(indexrelid::regclass) DESC;
```

## Monitoring Indexes

### Index Usage Statistics

```sql
-- Check if indexes are being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND schemaname = 'public'
    AND indexrelid::regclass::text NOT LIKE '%_pkey'  -- Keep primary keys
ORDER BY pg_relation_size(indexrelid::regclass) DESC;
```

### Index Health

```sql
-- Check index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid::regclass) DESC;

-- Check duplicate indexes (same columns)
SELECT
    pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS size,
    (array_agg(idx))[1] AS idx1,
    (array_agg(idx))[2] AS idx2,
    (array_agg(idx))[3] AS idx3,
    (array_agg(idx))[4] AS idx4
FROM (
    SELECT
        indexrelid::regclass AS idx,
        (indrelid::text ||E'\n'|| indclass::text ||E'\n'||
         indkey::text ||E'\n'|| COALESCE(indexprs::text,'')||E'\n' ||
         COALESCE(indpred::text,'')) AS key
    FROM pg_index
) sub
GROUP BY key
HAVING COUNT(*) > 1
ORDER BY SUM(pg_relation_size(idx)) DESC;
```

### Missing Indexes

```sql
-- Tables with sequential scans but no index scans
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan AS avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
    AND idx_scan = 0
    AND schemaname = 'public'
ORDER BY seq_tup_read DESC;

-- Foreign keys without indexes
SELECT
    c.conrelid::regclass AS table_name,
    a.attname AS column_name,
    c.conname AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
            AND a.attnum = ANY(i.indkey)
    )
ORDER BY c.conrelid::regclass::text, a.attnum;
```

## Index Best Practices

### General Guidelines

1. **Start without indexes, add based on actual usage**
   - Profile queries first
   - Add indexes for slow queries
   - Monitor index usage

2. **Index selectivity matters**
   - High selectivity (many unique values): Good for indexing
   - Low selectivity (few unique values): Often not worth indexing
   - Rule of thumb: > 10% unique values

3. **Composite index column order**
   - Most selective column first
   - Columns used in WHERE before ORDER BY
   - Consider query patterns

4. **Don't over-index**
   - Each index slows down writes
   - Indexes consume storage
   - Too many indexes confuse the query planner

5. **Use partial indexes when possible**
   - Index subset of rows
   - Saves space
   - Faster index scans

6. **Consider covering indexes**
   - Include columns to enable index-only scans
   - Balance: size vs performance gain

7. **Maintain indexes**
   - VACUUM regularly (automatic by default)
   - REINDEX if bloated
   - Monitor unused indexes

### Index Naming Conventions

```sql
-- Good naming pattern: idx_table_column(s)_type
idx_users_email                  -- Single column
idx_users_last_first             -- Composite
idx_users_email_active           -- Partial index indicator
idx_users_lower_email            -- Expression index
idx_documents_data_gin           -- Include index type for non-default
```

### Testing Index Effectiveness

```sql
-- Check if index is used
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- If you see "Seq Scan" instead of "Index Scan", index might not be optimal

-- Compare with and without index
-- Drop index temporarily in dev/staging
DROP INDEX idx_users_email;
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Recreate index
CREATE INDEX idx_users_email ON users(email);
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Compare execution times
```

### Index Anti-Patterns

```sql
-- ✗ Index on every column
CREATE INDEX idx_users_id ON users(id);          -- Unnecessary (PK)
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
-- Too many indexes!

-- ✗ Index on low cardinality columns
CREATE INDEX idx_users_active ON users(active);  -- Only TRUE/FALSE
CREATE INDEX idx_orders_status ON orders(status); -- 3-4 values

-- ✗ Wrong composite index order
-- Query: WHERE user_id = 123 ORDER BY created_at
CREATE INDEX idx_bad ON orders(created_at, user_id);  -- Wrong order!
CREATE INDEX idx_good ON orders(user_id, created_at); -- Correct order

-- ✗ Duplicate indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_active ON users(email, active);
-- Second index covers first, first is redundant

-- ✗ Index without monitoring
-- Create indexes and never check if they're used
-- Solution: Regularly query pg_stat_user_indexes
```
