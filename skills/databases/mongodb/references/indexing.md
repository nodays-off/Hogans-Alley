# MongoDB Indexing Guide

Complete guide to MongoDB indexing strategies for query optimization.

## Table of Contents
- [Index Fundamentals](#index-fundamentals)
- [Index Types](#index-types)
- [Index Management](#index-management)
- [Query Optimization](#query-optimization)
- [Best Practices](#best-practices)

## Index Fundamentals

Indexes are data structures that improve query performance by reducing the amount of data MongoDB needs to scan.

**Without index:** Full collection scan (COLLSCAN)
**With index:** Index scan (IXSCAN) - much faster

### Basic Index Creation

```javascript
// Create single field index
db.users.createIndex({ email: 1 })  // 1 = ascending, -1 = descending

// Create compound index
db.orders.createIndex({ status: 1, createdAt: -1 })

// Create index with options
db.users.createIndex(
  { email: 1 },
  {
    unique: true,
    name: "email_unique_idx",
    background: true  // Non-blocking (use sparse instead in modern versions)
  }
);
```

### Index Order

For single-field indexes, order doesn't matter for query performance.
For compound indexes, order is critical.

```javascript
// Index: { status: 1, createdAt: -1 }
// Efficiently supports:
db.orders.find({ status: "active" })
db.orders.find({ status: "active" }).sort({ createdAt: -1 })
db.orders.find({ status: "active", createdAt: { $gte: date } })

// Does NOT efficiently support:
db.orders.find({ createdAt: { $gte: date } })  // Missing status prefix
```

## Index Types

### 1. Single Field Index

```javascript
// Ascending index
db.users.createIndex({ email: 1 })

// Descending index (order matters for sorting)
db.posts.createIndex({ createdAt: -1 })

// Nested field index
db.users.createIndex({ "address.zipcode": 1 })
```

### 2. Compound Index

Indexes on multiple fields. Field order matters!

```javascript
// Create compound index
db.orders.createIndex({ customerId: 1, orderDate: -1 })

// Supports queries with prefix fields
db.orders.find({ customerId: 123 })  // Uses index
db.orders.find({ customerId: 123, orderDate: { $gte: date } })  // Uses index
db.orders.find({ orderDate: { $gte: date } })  // Does NOT use index efficiently
```

**ESR Rule (Equality, Sort, Range):**
```javascript
// Optimal compound index order:
// 1. Equality fields first
// 2. Sort fields next
// 3. Range fields last

// Query:
db.orders.find({
  status: "active",           // Equality
  total: { $gte: 100 }        // Range
}).sort({ orderDate: -1 })    // Sort

// Optimal index:
db.orders.createIndex({
  status: 1,      // Equality
  orderDate: -1,  // Sort
  total: 1        // Range
})
```

### 3. Text Index

Full-text search on string fields.

```javascript
// Create text index
db.articles.createIndex({ title: "text", body: "text" })

// Search
db.articles.find({ $text: { $search: "mongodb database" } })

// Search with score
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })

// Text index with weights
db.articles.createIndex(
  { title: "text", body: "text" },
  {
    weights: {
      title: 10,  // Title matches scored 10x higher
      body: 1
    },
    name: "article_text_idx"
  }
)

// Limitations:
// - Only one text index per collection
// - Cannot use text index with other query operators efficiently
```

### 4. Geospatial Indexes

#### 2dsphere (Earth-like geometry)

```javascript
// Create 2dsphere index
db.places.createIndex({ location: "2dsphere" })

// Store location (GeoJSON)
db.places.insertOne({
  name: "Central Park",
  location: {
    type: "Point",
    coordinates: [-73.965355, 40.782865]  // [longitude, latitude]
  }
})

// Find nearby
db.places.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-73.9667, 40.78]
      },
      $maxDistance: 1000  // meters
    }
  }
})

// Find within polygon
db.places.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.97, 40.77],
          [-73.96, 40.77],
          [-73.96, 40.78],
          [-73.97, 40.78],
          [-73.97, 40.77]  // Close the polygon
        ]]
      }
    }
  }
})
```

#### 2d (Flat plane geometry)

```javascript
// Create 2d index
db.locations.createIndex({ coordinates: "2d" })

// Store location [x, y]
db.locations.insertOne({
  name: "Point A",
  coordinates: [100, 200]
})

// Find nearby (flat)
db.locations.find({
  coordinates: { $near: [100, 200], $maxDistance: 10 }
})
```

### 5. Wildcard Index

Index all fields or all fields under a path.

```javascript
// Index all fields
db.collection.createIndex({ "$**": 1 })

// Index all fields under a path
db.products.createIndex({ "attributes.$**": 1 })

// Supports queries on any field under attributes
db.products.find({ "attributes.color": "red" })
db.products.find({ "attributes.size": "large" })

// Exclude specific fields
db.products.createIndex(
  { "$**": 1 },
  { wildcardProjection: { "internalField": 0 } }
)

// Use cases:
// - Highly dynamic schemas
// - Unpredictable query patterns
// - Prototyping

// Limitations:
// - Larger index size
// - Not as efficient as specific indexes
```

### 6. Hashed Index

For even distribution in sharding.

```javascript
// Create hashed index
db.users.createIndex({ userId: "hashed" })

// Use as shard key
sh.shardCollection("myDatabase.users", { userId: "hashed" })

// Limitations:
// - Only supports equality queries
// - No range queries
// - No sorting
```

### 7. TTL Index (Time-To-Live)

Automatically delete documents after a time period.

```javascript
// Delete documents 24 hours after createdAt
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }  // 24 hours
)

// Delete at specific date
db.events.createIndex(
  { expireAt: 1 },
  { expireAfterSeconds: 0 }
)

db.events.insertOne({
  data: "...",
  expireAt: new Date("2025-12-31")  // Delete on this date
})

// TTL thread runs every 60 seconds
// Deletion may take time on large collections
```

### 8. Unique Index

Prevent duplicate values.

```javascript
// Unique single field
db.users.createIndex({ email: 1 }, { unique: true })

// Unique compound index (combination must be unique)
db.orders.createIndex(
  { orderId: 1, version: 1 },
  { unique: true }
)

// Unique with null values
// Only one document can have null (unless using sparse)
db.users.createIndex({ phoneNumber: 1 }, { unique: true })

// Unique + sparse (allows multiple nulls)
db.users.createIndex(
  { phoneNumber: 1 },
  { unique: true, sparse: true }
)
```

### 9. Partial Index

Index only documents matching a filter.

```javascript
// Index only active users
db.users.createIndex(
  { email: 1 },
  {
    partialFilterExpression: { status: "active" }
  }
)

// Query uses index only if filter matches
db.users.find({ email: "user@example.com", status: "active" })  // Uses index
db.users.find({ email: "user@example.com" })  // Does NOT use index

// Use cases:
// - Save space (smaller index)
// - Improve performance (fewer index entries)
// - Unique constraint on subset

// Unique partial index example
db.users.createIndex(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { deleted: { $ne: true } }
  }
)
// Allows duplicate emails if deleted = true
```

### 10. Sparse Index

Index only documents that have the indexed field.

```javascript
// Sparse index
db.users.createIndex({ phoneNumber: 1 }, { sparse: true })

// Only indexes documents where phoneNumber exists
// Documents without phoneNumber won't appear in index

// Use cases:
// - Optional fields
// - Combined with unique (allows multiple nulls)
```

### 11. Covered Query

Query fully satisfied by index (no document fetch).

```javascript
// Create index
db.users.createIndex({ email: 1, name: 1, status: 1 })

// Covered query (only uses index)
db.users.find(
  { email: "user@example.com" },
  { _id: 0, email: 1, name: 1, status: 1 }  // Must exclude _id or include in index
)

// Verify it's covered (explain shows totalDocsExamined: 0)
db.users.find(
  { email: "user@example.com" },
  { _id: 0, email: 1, name: 1, status: 1 }
).explain("executionStats")
```

## Index Management

### List Indexes

```javascript
// List all indexes on collection
db.collection.getIndexes()

// Result:
[
  { v: 2, key: { _id: 1 }, name: "_id_" },  // Default index
  { v: 2, key: { email: 1 }, name: "email_1", unique: true }
]
```

### Drop Indexes

```javascript
// Drop specific index by name
db.collection.dropIndex("email_1")

// Drop by index specification
db.collection.dropIndex({ email: 1 })

// Drop all indexes except _id
db.collection.dropIndexes()

// Drop multiple specific indexes
db.collection.dropIndexes(["index1", "index2"])
```

### Hide/Unhide Indexes

Test impact before dropping.

```javascript
// Hide index (index not used, but still maintained)
db.collection.hideIndex("email_1")

// Unhide index
db.collection.unhideIndex("email_1")

// Use case: Test if index is needed before dropping
```

### Rebuild Indexes

```javascript
// Rebuild all indexes (compact and optimize)
db.collection.reIndex()

// Warning: Locks collection, use carefully in production
// Consider rolling index rebuild for replica sets
```

### Index Statistics

```javascript
// Index usage statistics
db.collection.aggregate([{ $indexStats: {} }])

// Shows:
// - Index name
// - Number of operations using index
// - Last access time
// - Size

// Identify unused indexes for removal
```

## Query Optimization

### Explain Query Plans

```javascript
// Basic explain
db.users.find({ email: "user@example.com" }).explain()

// Execution statistics
db.users.find({ email: "user@example.com" }).explain("executionStats")

// All plans (shows rejected plans)
db.users.find({ email: "user@example.com" }).explain("allPlansExecution")
```

### Key Metrics

```javascript
// Good query:
{
  executionStats: {
    executionTimeMillis: 5,        // Low execution time
    totalKeysExamined: 1,          // Examined few index entries
    totalDocsExamined: 1,          // Examined few documents
    nReturned: 1,                  // Returned 1 result
    executionStages: {
      stage: "IXSCAN"              // Used index scan (not COLLSCAN)
    }
  }
}

// Bad query:
{
  executionStats: {
    executionTimeMillis: 2500,     // HIGH execution time
    totalKeysExamined: 0,
    totalDocsExamined: 1000000,    // Scanned entire collection
    nReturned: 1,                  // Only returned 1 result (inefficient!)
    executionStages: {
      stage: "COLLSCAN"            // Full collection scan (BAD)
    }
  }
}
```

### Index Hints

Force specific index usage.

```javascript
// Force specific index
db.users.find({ status: "active", city: "NYC" })
  .hint({ status: 1, createdAt: -1 })

// Force collection scan (testing)
db.users.find({ status: "active" }).hint({ $natural: 1 })

// Use case: Query planner choosing wrong index
```

### Index Intersection

MongoDB can use multiple indexes for a single query.

```javascript
// Indexes:
db.users.createIndex({ status: 1 })
db.users.createIndex({ city: 1 })

// Query can use both indexes
db.users.find({ status: "active", city: "NYC" })

// However, a compound index is usually better:
db.users.createIndex({ status: 1, city: 1 })
```

## Best Practices

### 1. Index Strategy

```javascript
// Analyze query patterns first
// Create indexes matching your queries

// Example query patterns:
// - Find active users by email
// - List orders by customer, sorted by date
// - Search products by category

// Create matching indexes:
db.users.createIndex({ status: 1, email: 1 })
db.orders.createIndex({ customerId: 1, orderDate: -1 })
db.products.createIndex({ category: 1 })
```

### 2. Monitor and Optimize

```javascript
// Enable slow query logging
db.setProfilingLevel(1, { slowms: 100 })  // Log queries > 100ms

// Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10)

// Analyze slow query
db.system.profile.find({ millis: { $gt: 100 } }).forEach(doc => {
  print(`Query: ${JSON.stringify(doc.command)}`);
  print(`Time: ${doc.millis}ms`);
  print(`Plan: ${doc.planSummary}`);
})
```

### 3. Index Maintenance

```javascript
// Regular tasks:

// 1. Check index usage
db.collection.aggregate([{ $indexStats: {} }])

// 2. Drop unused indexes
db.collection.dropIndex("unused_index")

// 3. Monitor index size
db.collection.stats().indexSizes

// 4. Rebuild fragmented indexes (rarely needed)
db.collection.reIndex()  // Use with caution
```

### 4. Index Limits and Costs

**Limits:**
- Max 64 indexes per collection
- Max 32 fields in compound index
- Index key limit: 1024 bytes

**Costs:**
- Storage space (indexes can be larger than data)
- Write performance (indexes must be updated)
- Memory usage (active indexes cached in RAM)

**Guidelines:**
- Favor compound indexes over multiple single-field indexes
- Remove unused indexes
- Use partial indexes to reduce size
- Monitor write performance impact

### 5. Sharding Considerations

```javascript
// Shard key must be indexed
sh.shardCollection("db.collection", { userId: "hashed" })

// Compound shard key
sh.shardCollection("db.collection", { region: 1, userId: 1 })

// Queries should include shard key (targeted vs scatter-gather)
// Targeted (fast):
db.collection.find({ userId: "123" })

// Scatter-gather (slow):
db.collection.find({ email: "user@example.com" })
```

### 6. Common Mistakes

```javascript
// ❌ Wrong: Index not matching query order
db.users.createIndex({ createdAt: 1, status: 1 })
db.users.find({ status: "active" })  // Inefficient prefix

// ✓ Right: Index matches query prefix
db.users.createIndex({ status: 1, createdAt: 1 })
db.users.find({ status: "active" })  // Efficient

// ❌ Wrong: Too many indexes
// Every index slows down writes
// Keep only necessary indexes

// ✓ Right: Compound index serves multiple queries
db.users.createIndex({ status: 1, city: 1, createdAt: -1 })
// Supports:
// - { status }
// - { status, city }
// - { status, city, createdAt }

// ❌ Wrong: Not excluding _id in covered query
db.users.find({ email: "..." }, { email: 1, name: 1 })  // Fetches document

// ✓ Right: Exclude _id for covered query
db.users.find({ email: "..." }, { _id: 0, email: 1, name: 1 })  // Index only
```

### 7. Testing Indexes

```javascript
// Before creating index:
// 1. Test query performance
const before = db.users.find({ email: "..." }).explain("executionStats")
console.log(`Before: ${before.executionStats.executionTimeMillis}ms`)

// 2. Create index
db.users.createIndex({ email: 1 })

// 3. Test again
const after = db.users.find({ email: "..." }).explain("executionStats")
console.log(`After: ${after.executionStats.executionTimeMillis}ms`)

// 4. Verify improvement
// Should see:
// - Lower executionTimeMillis
// - stage: "IXSCAN" instead of "COLLSCAN"
// - Lower totalDocsExamined
```

## Index Selection Algorithm

MongoDB query planner selects indexes based on:

1. **Index coverage**: Does index cover query fields?
2. **Cardinality**: How selective is the index?
3. **Sort order**: Does index match sort direction?
4. **Historical performance**: Cached plan performance

**Plan cache:**
- MongoDB caches query plans
- Cached for ~1000 writes or plan eviction
- Can clear with: `db.collection.getPlanCache().clear()`

## Summary Checklist

- [ ] Create indexes for frequently queried fields
- [ ] Use compound indexes following ESR rule (Equality, Sort, Range)
- [ ] Monitor slow queries (>100ms)
- [ ] Remove unused indexes (check with $indexStats)
- [ ] Use partial indexes for subset constraints
- [ ] Use covered queries when possible
- [ ] Test index impact with explain()
- [ ] Consider write performance cost
- [ ] Monitor index size vs data size
- [ ] Use TTL indexes for expiring data
