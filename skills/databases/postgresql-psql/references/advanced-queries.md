# PostgreSQL Advanced Queries

Advanced querying techniques including JOINs, subqueries, CTEs, window functions, and JSON operations.

## Table of Contents
- [JOINs](#joins)
- [Subqueries](#subqueries)
- [Common Table Expressions (CTEs)](#common-table-expressions-ctes)
- [Window Functions](#window-functions)
- [JSON Operations](#json-operations)
- [Full-Text Search](#full-text-search)
- [Advanced Patterns](#advanced-patterns)

## JOINs

### Basic JOIN Types

```sql
-- INNER JOIN (only matching rows)
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN (all rows from left table)
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- RIGHT JOIN (all rows from right table)
SELECT u.name, o.total
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;

-- FULL OUTER JOIN (all rows from both tables)
SELECT u.name, o.total
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- CROSS JOIN (cartesian product)
SELECT c1.name, c2.name
FROM colors c1
CROSS JOIN colors c2;
```

### Multiple JOINs

```sql
-- Three table join
SELECT
    u.name AS customer_name,
    o.id AS order_id,
    p.name AS product_name,
    oi.quantity,
    oi.price
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;

-- Mixed join types
SELECT
    c.name AS category,
    p.name AS product,
    s.quantity AS stock
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN stock s ON p.id = s.product_id;
```

### Self JOIN

```sql
-- Find employees and their managers
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Find pairs of users in same city
SELECT
    u1.name AS user1,
    u2.name AS user2,
    u1.city
FROM users u1
JOIN users u2 ON u1.city = u2.city AND u1.id < u2.id;
```

### JOIN with Conditions

```sql
-- Join with additional conditions
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
    AND o.status = 'completed'
    AND o.created_at > '2024-01-01';

-- LATERAL JOIN (correlated join)
SELECT u.name, recent_orders.*
FROM users u
LEFT JOIN LATERAL (
    SELECT id, total, created_at
    FROM orders
    WHERE user_id = u.id
    ORDER BY created_at DESC
    LIMIT 5
) recent_orders ON TRUE;
```

## Subqueries

### Scalar Subqueries

```sql
-- Subquery returning single value
SELECT
    name,
    (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
FROM users;

-- Subquery in WHERE clause
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

### IN Subqueries

```sql
-- Find users who placed orders
SELECT * FROM users
WHERE id IN (SELECT DISTINCT user_id FROM orders);

-- Find users who never ordered
SELECT * FROM users
WHERE id NOT IN (
    SELECT user_id FROM orders WHERE user_id IS NOT NULL
);
```

### EXISTS Subqueries

```sql
-- Check if related records exist
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_id = u.id
    AND o.status = 'completed'
);

-- NOT EXISTS
SELECT * FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.product_id = p.id
);
```

### Correlated Subqueries

```sql
-- Find products more expensive than category average
SELECT p1.name, p1.price, p1.category_id
FROM products p1
WHERE p1.price > (
    SELECT AVG(p2.price)
    FROM products p2
    WHERE p2.category_id = p1.category_id
);

-- Find latest order for each user
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at = (
    SELECT MAX(created_at)
    FROM orders o2
    WHERE o2.user_id = u.id
);
```

## Common Table Expressions (CTEs)

### Basic CTEs

```sql
-- Simple CTE
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE active = true
)
SELECT * FROM active_users
WHERE created_at > '2024-01-01';

-- Multiple CTEs
WITH
orders_2024 AS (
    SELECT * FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = 2024
),
customer_totals AS (
    SELECT
        user_id,
        COUNT(*) AS order_count,
        SUM(total) AS total_spent
    FROM orders_2024
    GROUP BY user_id
)
SELECT
    u.name,
    ct.order_count,
    ct.total_spent
FROM users u
JOIN customer_totals ct ON u.id = ct.user_id
ORDER BY ct.total_spent DESC;
```

### Recursive CTEs

```sql
-- Hierarchical data traversal
WITH RECURSIVE category_tree AS (
    -- Base case: root categories
    SELECT id, name, parent_id, 0 AS level, name AS path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive case: child categories
    SELECT
        c.id,
        c.name,
        c.parent_id,
        ct.level + 1,
        ct.path || ' > ' || c.name
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY path;

-- Calculate factorial
WITH RECURSIVE factorial AS (
    SELECT 1 AS n, 1 AS result
    UNION ALL
    SELECT n + 1, result * (n + 1)
    FROM factorial
    WHERE n < 10
)
SELECT * FROM factorial;

-- Generate series (alternative to generate_series)
WITH RECURSIVE date_series AS (
    SELECT DATE '2024-01-01' AS date
    UNION ALL
    SELECT date + INTERVAL '1 day'
    FROM date_series
    WHERE date < DATE '2024-12-31'
)
SELECT * FROM date_series;
```

### CTE for Data Modification

```sql
-- Modifying CTE (INSERT, UPDATE, DELETE with RETURNING)
WITH deleted_orders AS (
    DELETE FROM orders
    WHERE status = 'cancelled'
    AND created_at < CURRENT_DATE - INTERVAL '1 year'
    RETURNING *
)
INSERT INTO archived_orders
SELECT * FROM deleted_orders;

-- Update and return
WITH updated AS (
    UPDATE products
    SET price = price * 1.1
    WHERE category = 'electronics'
    RETURNING id, name, price
)
SELECT * FROM updated;
```

## Window Functions

### ROW_NUMBER, RANK, DENSE_RANK

```sql
-- Row number
SELECT
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;

-- Rank (leaves gaps for ties)
SELECT
    name,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- Dense rank (no gaps)
SELECT
    name,
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;

-- Partition by department
SELECT
    name,
    department,
    salary,
    ROW_NUMBER() OVER (
        PARTITION BY department
        ORDER BY salary DESC
    ) AS dept_rank
FROM employees;
```

### Aggregate Window Functions

```sql
-- Running totals
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;

-- Running average
SELECT
    date,
    amount,
    AVG(amount) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7_days
FROM daily_sales;

-- Cumulative percentage
SELECT
    name,
    salary,
    SUM(salary) OVER (ORDER BY salary) AS cumulative_salary,
    100.0 * SUM(salary) OVER (ORDER BY salary) / SUM(salary) OVER () AS cumulative_pct
FROM employees;
```

### LEAD and LAG

```sql
-- Next and previous values
SELECT
    date,
    amount,
    LAG(amount) OVER (ORDER BY date) AS prev_day,
    LEAD(amount) OVER (ORDER BY date) AS next_day,
    amount - LAG(amount) OVER (ORDER BY date) AS day_over_day_change
FROM daily_sales;

-- Compare to same period last year
SELECT
    date,
    revenue,
    LAG(revenue, 365) OVER (ORDER BY date) AS revenue_last_year,
    revenue - LAG(revenue, 365) OVER (ORDER BY date) AS yoy_change
FROM daily_revenue;
```

### FIRST_VALUE and LAST_VALUE

```sql
-- First and last values in window
SELECT
    name,
    department,
    salary,
    FIRST_VALUE(salary) OVER (
        PARTITION BY department
        ORDER BY salary DESC
    ) AS highest_dept_salary,
    LAST_VALUE(salary) OVER (
        PARTITION BY department
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_dept_salary
FROM employees;
```

### NTH_VALUE and NTILE

```sql
-- Nth value in window
SELECT
    name,
    salary,
    NTH_VALUE(salary, 2) OVER (
        ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS second_highest_salary
FROM employees;

-- Divide into buckets
SELECT
    name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

## JSON Operations

### JSONB vs JSON

```sql
-- JSONB is recommended (binary format, faster, supports indexing)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    data JSONB
);

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    metadata JSON  -- Use only if you need to preserve exact formatting
);
```

### Storing JSON

```sql
-- Insert JSON
INSERT INTO documents (data)
VALUES ('{"name": "Alice", "age": 30, "city": "NYC"}');

-- Insert with jsonb_build_object
INSERT INTO documents (data)
VALUES (jsonb_build_object(
    'name', 'Bob',
    'age', 25,
    'tags', jsonb_build_array('developer', 'postgres')
));
```

### Querying JSON

```sql
-- Access with -> (returns JSON)
SELECT data -> 'name' AS name_json FROM documents;

-- Access with ->> (returns text)
SELECT data ->> 'name' AS name_text FROM documents;

-- Nested access
SELECT data -> 'address' -> 'city' AS city FROM documents;
SELECT data #>> '{address,city}' AS city FROM documents;  -- Text result

-- Array access
SELECT data -> 'tags' -> 0 AS first_tag FROM documents;
```

### JSON Operators

```sql
-- Check if key exists
SELECT * FROM documents WHERE data ? 'name';
SELECT * FROM documents WHERE data ?& ARRAY['name', 'age'];  -- Has all keys
SELECT * FROM documents WHERE data ?| ARRAY['email', 'phone'];  -- Has any key

-- Contains (@>)
SELECT * FROM documents WHERE data @> '{"city": "NYC"}';
SELECT * FROM documents WHERE data @> '{"tags": ["postgres"]}';

-- Contained by (<@)
SELECT * FROM documents WHERE '{"name": "Alice"}' <@ data;

-- JSON path operators
SELECT * FROM documents WHERE data @? '$.age ? (@ > 25)';
SELECT * FROM documents WHERE data @@ '$.city == "NYC"';
```

### JSON Functions

```sql
-- Array length
SELECT jsonb_array_length(data -> 'tags') FROM documents;

-- Get object keys
SELECT jsonb_object_keys(data) FROM documents;

-- Extract all values
SELECT * FROM jsonb_each(data) FROM documents;
SELECT * FROM jsonb_each_text(data) FROM documents;

-- Aggregate to JSON
SELECT jsonb_agg(name) AS names FROM users;
SELECT jsonb_object_agg(id, name) AS id_name_map FROM users;

-- Build JSON
SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'orders', (
        SELECT jsonb_agg(jsonb_build_object('id', id, 'total', total))
        FROM orders
        WHERE user_id = users.id
    )
) FROM users;
```

### Modifying JSON

```sql
-- Set value
UPDATE documents
SET data = jsonb_set(data, '{age}', '31')
WHERE id = 1;

-- Set nested value
UPDATE documents
SET data = jsonb_set(data, '{address,city}', '"Boston"')
WHERE id = 1;

-- Insert value
UPDATE documents
SET data = jsonb_insert(data, '{tags,0}', '"featured"')
WHERE id = 1;

-- Delete key
UPDATE documents
SET data = data - 'temp_field'
WHERE id = 1;

-- Delete nested key
UPDATE documents
SET data = data #- '{address,zipcode}'
WHERE id = 1;

-- Concatenate
UPDATE documents
SET data = data || '{"verified": true}'
WHERE id = 1;
```

### JSON Indexing

```sql
-- GIN index for containment queries
CREATE INDEX idx_documents_data ON documents USING GIN (data);

-- Index on specific JSON field
CREATE INDEX idx_documents_city ON documents ((data ->> 'city'));

-- Index on JSON path
CREATE INDEX idx_documents_age ON documents ((CAST(data ->> 'age' AS INTEGER)));
```

## Full-Text Search

### Basic Full-Text Search

```sql
-- Create tsvector column
ALTER TABLE documents ADD COLUMN search_vector tsvector;

-- Populate search vector
UPDATE documents
SET search_vector = to_tsvector('english',
    coalesce(title, '') || ' ' || coalesce(content, '')
);

-- Create GIN index for fast search
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- Search documents
SELECT * FROM documents
WHERE search_vector @@ to_tsquery('english', 'database & tutorial');

-- Search with OR
SELECT * FROM documents
WHERE search_vector @@ to_tsquery('english', 'database | tutorial');

-- Phrase search
SELECT * FROM documents
WHERE search_vector @@ phraseto_tsquery('english', 'database tutorial');
```

### Search Ranking

```sql
-- Rank results by relevance
SELECT
    id,
    title,
    ts_rank(search_vector, query) AS rank
FROM documents, to_tsquery('english', 'database') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- Weighted ranking
SELECT
    id,
    title,
    ts_rank_cd(
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', content), 'B'),
        query
    ) AS rank
FROM documents, to_tsquery('english', 'postgresql') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

### Search Highlighting

```sql
-- Highlight matching terms
SELECT
    title,
    ts_headline('english', content, query, 'MaxWords=50, MinWords=25') AS snippet
FROM documents, to_tsquery('english', 'database') AS query
WHERE search_vector @@ query;
```

## Advanced Patterns

### Pivot Tables

```sql
-- Pivot with CASE
SELECT
    category,
    SUM(CASE WHEN EXTRACT(QUARTER FROM created_at) = 1 THEN total ELSE 0 END) AS q1,
    SUM(CASE WHEN EXTRACT(QUARTER FROM created_at) = 2 THEN total ELSE 0 END) AS q2,
    SUM(CASE WHEN EXTRACT(QUARTER FROM created_at) = 3 THEN total ELSE 0 END) AS q3,
    SUM(CASE WHEN EXTRACT(QUARTER FROM created_at) = 4 THEN total ELSE 0 END) AS q4
FROM orders
GROUP BY category;

-- Using crosstab (requires tablefunc extension)
CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT * FROM crosstab(
    'SELECT category, EXTRACT(QUARTER FROM created_at), SUM(total)
     FROM orders
     GROUP BY category, EXTRACT(QUARTER FROM created_at)
     ORDER BY 1, 2',
    'SELECT generate_series(1, 4)'
) AS ct(category TEXT, q1 NUMERIC, q2 NUMERIC, q3 NUMERIC, q4 NUMERIC);
```

### Dynamic Queries

```sql
-- Using EXECUTE for dynamic SQL
DO $$
DECLARE
    table_name TEXT := 'users';
    column_name TEXT := 'email';
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I IS NOT NULL', table_name, column_name);
END $$;
```

### Array Aggregation

```sql
-- Aggregate related records into arrays
SELECT
    u.id,
    u.name,
    ARRAY_AGG(o.id ORDER BY o.created_at DESC) AS order_ids,
    ARRAY_AGG(o.total ORDER BY o.created_at DESC) AS order_totals
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

### FILTER Clause

```sql
-- Conditional aggregation with FILTER
SELECT
    department,
    COUNT(*) AS total_employees,
    COUNT(*) FILTER (WHERE salary > 100000) AS high_earners,
    AVG(salary) FILTER (WHERE hired_date > '2023-01-01') AS avg_new_hire_salary
FROM employees
GROUP BY department;
```

### GROUPING SETS

```sql
-- Multiple grouping levels in one query
SELECT
    department,
    job_title,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY GROUPING SETS (
    (department, job_title),
    (department),
    ()
);

-- ROLLUP (hierarchical grouping)
SELECT
    department,
    job_title,
    COUNT(*) AS count
FROM employees
GROUP BY ROLLUP (department, job_title);

-- CUBE (all combinations)
SELECT
    department,
    job_title,
    COUNT(*) AS count
FROM employees
GROUP BY CUBE (department, job_title);
```
