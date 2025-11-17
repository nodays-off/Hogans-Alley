# PostgreSQL SQL Basics

Core SQL operations for creating, reading, updating, and deleting data in PostgreSQL.

## Table of Contents
- [Creating Objects](#creating-objects)
- [Query Execution](#query-execution)
- [Data Manipulation](#data-manipulation)
- [Transaction Management](#transaction-management)
- [Data Types](#data-types)

## Creating Objects

### Database and Schema

```sql
-- Create database
CREATE DATABASE myapp_db;

-- Create schema
CREATE SCHEMA app_schema;

-- Set search path (default schema)
SET search_path TO app_schema, public;
```

### Tables

```sql
-- Basic table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table with constraints
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total DECIMAL(10,2) CHECK (total >= 0),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Table with composite primary key
CREATE TABLE order_items (
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
```

### Views

```sql
-- Simple view
CREATE VIEW active_users AS
SELECT id, name, email
FROM users
WHERE active = true;

-- View with complex query
CREATE VIEW order_summary AS
SELECT
    o.id,
    u.name AS customer_name,
    o.total,
    o.status,
    COUNT(oi.product_id) AS item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, o.total, o.status;

-- Materialized view (cached results)
CREATE MATERIALIZED VIEW daily_sales AS
SELECT
    DATE(created_at) AS sale_date,
    COUNT(*) AS order_count,
    SUM(total) AS total_revenue
FROM orders
GROUP BY DATE(created_at);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW daily_sales;
```

## Query Execution

### SELECT Statements

```sql
-- Basic select
SELECT * FROM users;

-- Select specific columns
SELECT id, name, email FROM users;

-- With WHERE clause
SELECT * FROM users WHERE active = true;

-- Multiple conditions
SELECT * FROM products
WHERE price > 100 AND stock > 0;

-- Pattern matching
SELECT * FROM users
WHERE email LIKE '%@example.com';

-- Case-insensitive pattern matching
SELECT * FROM users
WHERE email ILIKE '%EXAMPLE%';

-- IN operator
SELECT * FROM products
WHERE category IN ('electronics', 'computers');

-- BETWEEN operator
SELECT * FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- IS NULL / IS NOT NULL
SELECT * FROM users
WHERE last_login IS NULL;
```

### Sorting and Limiting

```sql
-- ORDER BY
SELECT * FROM users
ORDER BY created_at DESC;

-- Multiple sort columns
SELECT * FROM products
ORDER BY category ASC, price DESC;

-- LIMIT and OFFSET (pagination)
SELECT * FROM users
ORDER BY id
LIMIT 10 OFFSET 20;

-- FETCH (SQL standard alternative to LIMIT)
SELECT * FROM users
ORDER BY id
FETCH FIRST 10 ROWS ONLY;
```

### Aggregate Functions

```sql
-- COUNT
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT email) FROM users;

-- SUM, AVG, MIN, MAX
SELECT
    COUNT(*) AS total_orders,
    SUM(total) AS total_revenue,
    AVG(total) AS avg_order_value,
    MIN(total) AS smallest_order,
    MAX(total) AS largest_order
FROM orders;

-- GROUP BY
SELECT
    status,
    COUNT(*) AS count,
    AVG(total) AS avg_total
FROM orders
GROUP BY status;

-- HAVING (filter after grouping)
SELECT
    user_id,
    COUNT(*) AS order_count
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5;
```

### DISTINCT and UNION

```sql
-- DISTINCT
SELECT DISTINCT category FROM products;

-- DISTINCT ON (PostgreSQL-specific)
SELECT DISTINCT ON (user_id)
    user_id, created_at, total
FROM orders
ORDER BY user_id, created_at DESC;

-- UNION (removes duplicates)
SELECT name FROM customers
UNION
SELECT name FROM suppliers;

-- UNION ALL (keeps duplicates)
SELECT email FROM users
UNION ALL
SELECT email FROM archived_users;
```

## Data Manipulation

### INSERT

```sql
-- Insert single row
INSERT INTO users (name, email)
VALUES ('John Doe', 'john@example.com');

-- Insert multiple rows
INSERT INTO users (name, email) VALUES
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com');

-- Insert with SELECT (copy data)
INSERT INTO users_backup
SELECT * FROM users;

-- Insert with RETURNING
INSERT INTO users (name, email)
VALUES ('Alice', 'alice@example.com')
RETURNING id, name, created_at;

-- Insert with ON CONFLICT (upsert)
INSERT INTO users (id, name, email)
VALUES (1, 'John', 'john@example.com')
ON CONFLICT (id)
DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- Insert or do nothing on conflict
INSERT INTO users (email, name)
VALUES ('john@example.com', 'John')
ON CONFLICT (email) DO NOTHING;
```

### UPDATE

```sql
-- Basic update
UPDATE users
SET active = false
WHERE id = 1;

-- Update multiple columns
UPDATE users
SET
    name = 'John Smith',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Update with calculation
UPDATE products
SET price = price * 1.1
WHERE category = 'electronics';

-- Update with subquery
UPDATE orders
SET total = (
    SELECT SUM(price * quantity)
    FROM order_items
    WHERE order_items.order_id = orders.id
);

-- Update with RETURNING
UPDATE users
SET status = 'active'
WHERE id = 1
RETURNING id, name, status;

-- Update with FROM clause
UPDATE products p
SET stock = stock - oi.quantity
FROM order_items oi
WHERE p.id = oi.product_id
AND oi.order_id = 123;
```

### DELETE

```sql
-- Basic delete
DELETE FROM users WHERE id = 1;

-- Delete with condition
DELETE FROM orders
WHERE status = 'cancelled'
AND created_at < CURRENT_DATE - INTERVAL '1 year';

-- Delete with RETURNING
DELETE FROM users
WHERE id = 1
RETURNING id, name, email;

-- Delete all rows (careful!)
DELETE FROM temp_table;

-- TRUNCATE (faster for deleting all rows)
TRUNCATE TABLE temp_table;

-- TRUNCATE with cascade
TRUNCATE TABLE users CASCADE;
```

## Transaction Management

### Basic Transactions

```sql
-- Begin transaction
BEGIN;

-- Execute statements
INSERT INTO accounts (name, balance) VALUES ('Alice', 1000);
INSERT INTO accounts (name, balance) VALUES ('Bob', 1000);

-- Commit
COMMIT;

-- Rollback (undo changes)
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
ROLLBACK;
```

### Savepoints

```sql
BEGIN;
    INSERT INTO users (name) VALUES ('User 1');

    SAVEPOINT sp1;
    INSERT INTO users (name) VALUES ('User 2');

    SAVEPOINT sp2;
    INSERT INTO users (name) VALUES ('User 3');

    -- Rollback to sp2 (undoes User 3)
    ROLLBACK TO sp2;

    -- Rollback to sp1 (undoes User 2)
    ROLLBACK TO sp1;

    -- Release savepoint
    RELEASE sp1;
COMMIT;
```

### Transaction Isolation Levels

```sql
-- Read uncommitted (not enforced in PostgreSQL, acts like READ COMMITTED)
BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Read committed (default)
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Repeatable read
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable (strictest)
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- View current isolation level
SHOW transaction_isolation;
```

### Transaction Best Practices

```sql
-- Set transaction to read-only
BEGIN TRANSACTION READ ONLY;
SELECT * FROM users;
COMMIT;

-- Deferrable transactions (for serializable)
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE, DEFERRABLE;

-- Transaction with explicit lock
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
```

## Data Types

### Numeric Types

```sql
-- Integer types
SMALLINT        -- -32768 to 32767
INTEGER or INT  -- -2147483648 to 2147483647
BIGINT          -- -9223372036854775808 to 9223372036854775807

-- Auto-incrementing
SMALLSERIAL     -- Auto-incrementing SMALLINT
SERIAL          -- Auto-incrementing INTEGER
BIGSERIAL       -- Auto-incrementing BIGINT

-- Decimal types
DECIMAL(precision, scale)
NUMERIC(precision, scale)  -- Same as DECIMAL

-- Floating point
REAL            -- 6 decimal digits precision
DOUBLE PRECISION -- 15 decimal digits precision
```

### String Types

```sql
-- Character types
CHAR(n)         -- Fixed-length, padded
VARCHAR(n)      -- Variable-length with limit
TEXT            -- Variable unlimited length

-- Example
CREATE TABLE example (
    code CHAR(5),           -- Always 5 characters
    name VARCHAR(255),      -- Up to 255 characters
    description TEXT        -- Unlimited
);
```

### Date and Time Types

```sql
-- Date/Time types
DATE                        -- Date only
TIME                        -- Time only
TIMESTAMP                   -- Date and time
TIMESTAMP WITH TIME ZONE    -- Timestamp with timezone (TIMESTAMPTZ)
INTERVAL                    -- Time interval

-- Examples
SELECT CURRENT_DATE;                    -- 2024-01-15
SELECT CURRENT_TIME;                    -- 14:30:45.123456-05
SELECT CURRENT_TIMESTAMP;               -- 2024-01-15 14:30:45.123456-05
SELECT NOW();                           -- Same as CURRENT_TIMESTAMP

-- Date arithmetic
SELECT CURRENT_DATE + INTERVAL '7 days';
SELECT CURRENT_TIMESTAMP - INTERVAL '1 hour';
SELECT AGE(TIMESTAMP '2024-01-01', TIMESTAMP '2023-01-01');
```

### Boolean Type

```sql
-- Boolean
BOOLEAN or BOOL  -- TRUE, FALSE, NULL

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    active BOOLEAN DEFAULT TRUE,
    verified BOOL DEFAULT FALSE
);

-- Query with boolean
SELECT * FROM users WHERE active = TRUE;
SELECT * FROM users WHERE active;  -- Shorthand for = TRUE
SELECT * FROM users WHERE NOT active;  -- Shorthand for = FALSE
```

### JSON Types

```sql
-- JSON types
JSON      -- Text-based, preserves formatting
JSONB     -- Binary, faster, supports indexing

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    data JSONB
);

-- Insert JSON
INSERT INTO documents (data)
VALUES ('{"name": "Alice", "age": 30, "city": "NYC"}');

-- Query JSON (covered in advanced-queries.md)
```

### Array Types

```sql
-- Arrays
INTEGER[]
TEXT[]
VARCHAR(255)[]

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT,
    tags TEXT[]
);

-- Insert array
INSERT INTO posts (title, tags)
VALUES ('PostgreSQL Guide', ARRAY['database', 'sql', 'postgres']);

-- Alternative syntax
INSERT INTO posts (title, tags)
VALUES ('MongoDB Guide', '{"database", "nosql", "mongodb"}');

-- Query arrays
SELECT * FROM posts WHERE 'database' = ANY(tags);
SELECT * FROM posts WHERE tags @> ARRAY['sql'];
```

### Other Common Types

```sql
-- UUID
UUID

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Binary data
BYTEA

-- Network addresses
INET        -- IPv4 or IPv6 network address
CIDR        -- IPv4 or IPv6 network specification
MACADDR     -- MAC address

-- Geometric types
POINT
LINE
CIRCLE
POLYGON

-- Range types
INT4RANGE
INT8RANGE
NUMRANGE
TSRANGE
TSTZRANGE
DATERANGE
```

## Type Casting

```sql
-- CAST function
SELECT CAST('123' AS INTEGER);
SELECT CAST(123.45 AS INTEGER);
SELECT CAST('2024-01-15' AS DATE);

-- :: operator (PostgreSQL-specific)
SELECT '123'::INTEGER;
SELECT 123.45::INTEGER;
SELECT '2024-01-15'::DATE;

-- Type conversion in queries
SELECT * FROM orders
WHERE created_at::DATE = '2024-01-15';
```

## NULL Handling

```sql
-- NULL checks
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE email IS NOT NULL;

-- COALESCE (return first non-null value)
SELECT COALESCE(middle_name, '') AS middle_name FROM users;
SELECT COALESCE(discount, 0) AS discount FROM products;

-- NULLIF (return NULL if values are equal)
SELECT NULLIF(status, 'unknown') FROM orders;

-- NULL in expressions (NULL propagates)
SELECT 1 + NULL;        -- Returns NULL
SELECT NULL = NULL;     -- Returns NULL (use IS NULL instead)
```
