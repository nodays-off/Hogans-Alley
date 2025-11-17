# MongoDB CRUD Operations Reference

Complete reference for Create, Read, Update, and Delete operations in MongoDB.

## Table of Contents
- [Read Operations](#read-operations)
- [Write Operations](#write-operations)
- [Query Operators](#query-operators)
- [Update Operators](#update-operators)
- [Atomic Operations](#atomic-operations)

## Read Operations

### Basic Queries

```javascript
// Find all documents
db.collection.find()

// Find with filter
db.collection.find({ status: "active" })

// Find one document
db.collection.findOne({ _id: ObjectId("...") })

// Find with multiple conditions
db.collection.find({
  status: "active",
  age: { $gte: 18 }
})
```

### Projection (Field Selection)

```javascript
// Include specific fields (1 = include)
db.users.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 }  // _id: 0 excludes _id
)

// Exclude specific fields (0 = exclude)
db.users.find(
  { status: "active" },
  { password: 0, internalData: 0 }
)
```

### Cursor Operations

```javascript
// Sort (1 = ascending, -1 = descending)
db.posts.find().sort({ createdAt: -1 })

// Limit results
db.posts.find().limit(10)

// Skip results (for pagination)
db.posts.find().skip(20).limit(10)

// Chain operations
db.posts.find({ status: "published" })
  .sort({ createdAt: -1 })
  .limit(10)
  .skip(0)

// Count documents
db.posts.countDocuments({ status: "published" })

// Distinct values
db.posts.distinct("category")
```

### Cursor-Based Pagination (Recommended)

```javascript
// First page
const firstPage = await db.posts.find()
  .sort({ _id: 1 })
  .limit(20)
  .toArray();

// Next page (using last _id from previous page)
const lastId = firstPage[firstPage.length - 1]._id;
const nextPage = await db.posts.find({ _id: { $gt: lastId } })
  .sort({ _id: 1 })
  .limit(20)
  .toArray();
```

## Write Operations

### Insert Operations

```javascript
// Insert one document
const result = await db.users.insertOne({
  name: "Alice",
  email: "alice@example.com",
  createdAt: new Date()
});
console.log(result.insertedId);  // ObjectId of inserted document

// Insert many documents
const result = await db.users.insertMany([
  { name: "Bob", email: "bob@example.com" },
  { name: "Charlie", email: "charlie@example.com" }
]);
console.log(result.insertedIds);  // Array of inserted ObjectIds

// Insert with custom _id
await db.users.insertOne({
  _id: "custom-id-123",
  name: "Alice"
});
```

### Update Operations

```javascript
// Update one document
await db.users.updateOne(
  { email: "alice@example.com" },  // Filter
  { $set: { status: "verified" } }  // Update
);

// Update many documents
await db.users.updateMany(
  { status: "pending" },
  { $set: { status: "active" } }
);

// Replace entire document (keeps same _id)
await db.users.replaceOne(
  { email: "alice@example.com" },
  {
    name: "Alice Smith",
    email: "alice@example.com",
    status: "active"
  }
);

// Upsert (update if exists, insert if not)
await db.users.updateOne(
  { email: "alice@example.com" },
  { $set: { name: "Alice", lastSeen: new Date() } },
  { upsert: true }
);
```

### Delete Operations

```javascript
// Delete one document
await db.users.deleteOne({ email: "alice@example.com" });

// Delete many documents
await db.users.deleteMany({ status: "inactive" });

// Delete all documents in collection (use with caution!)
await db.users.deleteMany({});
```

### Find and Modify (Atomic)

```javascript
// Find and update (returns old document by default)
const result = await db.users.findOneAndUpdate(
  { email: "alice@example.com" },
  { $set: { status: "verified" } }
);

// Find and update (return new document)
const result = await db.users.findOneAndUpdate(
  { email: "alice@example.com" },
  { $set: { status: "verified" } },
  { returnDocument: "after" }
);

// Find and replace
const result = await db.users.findOneAndReplace(
  { email: "alice@example.com" },
  { name: "Alice Smith", email: "alice@example.com" }
);

// Find and delete
const result = await db.users.findOneAndDelete(
  { email: "alice@example.com" }
);
```

## Query Operators

### Comparison Operators

```javascript
// $eq - Equal
db.products.find({ price: { $eq: 99.99 } })
// Shorthand:
db.products.find({ price: 99.99 })

// $ne - Not equal
db.products.find({ status: { $ne: "discontinued" } })

// $gt, $gte - Greater than, Greater than or equal
db.products.find({ price: { $gt: 100 } })
db.products.find({ price: { $gte: 100 } })

// $lt, $lte - Less than, Less than or equal
db.products.find({ price: { $lt: 50 } })
db.products.find({ price: { $lte: 50 } })

// $in - Match any value in array
db.products.find({ category: { $in: ["electronics", "computers"] } })

// $nin - Not in array
db.products.find({ status: { $nin: ["discontinued", "deleted"] } })

// Range query
db.products.find({
  price: { $gte: 50, $lte: 100 }
})
```

### Logical Operators

```javascript
// $and - All conditions must be true
db.products.find({
  $and: [
    { price: { $gte: 100 } },
    { stock: { $gt: 0 } }
  ]
});
// Shorthand (implicit $and):
db.products.find({ price: { $gte: 100 }, stock: { $gt: 0 } })

// $or - At least one condition must be true
db.products.find({
  $or: [
    { category: "electronics" },
    { price: { $lt: 50 } }
  ]
});

// $not - Negates condition
db.products.find({ price: { $not: { $gt: 100 } } })

// $nor - None of the conditions are true
db.products.find({
  $nor: [
    { status: "discontinued" },
    { stock: { $lte: 0 } }
  ]
});

// Complex nested query
db.products.find({
  $or: [
    { $and: [{ category: "electronics" }, { price: { $lt: 100 } }] },
    { $and: [{ category: "books" }, { price: { $lt: 20 } }] }
  ]
});
```

### Element Operators

```javascript
// $exists - Field exists
db.users.find({ phoneNumber: { $exists: true } })
db.users.find({ phoneNumber: { $exists: false } })

// $type - Field has specific type
db.data.find({ value: { $type: "string" } })
db.data.find({ value: { $type: "number" } })
db.data.find({ value: { $type: ["string", "number"] } })  // Multiple types

// BSON types
// "double", "string", "object", "array", "binData", "objectId",
// "bool", "date", "null", "regex", "int", "timestamp", "long", "decimal"
```

### Array Operators

```javascript
// $all - Array contains all specified values
db.posts.find({ tags: { $all: ["mongodb", "database"] } })

// $elemMatch - Array element matches all conditions
db.products.find({
  reviews: {
    $elemMatch: { rating: { $gte: 4 }, verified: true }
  }
});

// $size - Array has exact size
db.posts.find({ tags: { $size: 3 } })

// Match array element by index
db.products.find({ "reviews.0.rating": 5 })  // First review has 5 stars

// $firstN, $lastN (aggregation only)
// See aggregation.md for array aggregation operators
```

### String Operators

```javascript
// Regular expression
db.users.find({ name: /^Alice/ })  // Starts with "Alice"
db.users.find({ email: /@gmail\.com$/ })  // Ends with "@gmail.com"

// Case-insensitive regex
db.users.find({ name: { $regex: "alice", $options: "i" } })

// Text search (requires text index)
db.articles.createIndex({ title: "text", body: "text" })
db.articles.find({ $text: { $search: "mongodb database" } })

// Text search with score
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

## Update Operators

### Field Update Operators

```javascript
// $set - Set field value
await db.users.updateOne(
  { _id: userId },
  { $set: { status: "verified", updatedAt: new Date() } }
);

// $unset - Remove field
await db.users.updateOne(
  { _id: userId },
  { $unset: { tempField: "" } }  // Value doesn't matter
);

// $rename - Rename field
await db.users.updateOne(
  { _id: userId },
  { $rename: { "name": "fullName" } }
);

// $inc - Increment/decrement numeric value
await db.posts.updateOne(
  { _id: postId },
  { $inc: { views: 1, likes: 1 } }
);
await db.accounts.updateOne(
  { _id: accountId },
  { $inc: { balance: -50 } }  // Decrement
);

// $mul - Multiply numeric value
await db.products.updateOne(
  { _id: productId },
  { $mul: { price: 1.1 } }  // Increase by 10%
);

// $min - Update only if new value is less than current
await db.scores.updateOne(
  { _id: scoreId },
  { $min: { lowestScore: 85 } }
);

// $max - Update only if new value is greater than current
await db.scores.updateOne(
  { _id: scoreId },
  { $max: { highestScore: 95 } }
);

// $currentDate - Set to current date
await db.users.updateOne(
  { _id: userId },
  { $currentDate: { lastModified: true } }
);
```

### Array Update Operators

```javascript
// $push - Add element to array
await db.posts.updateOne(
  { _id: postId },
  { $push: { comments: { author: "Alice", text: "Great!" } } }
);

// $push with $each (multiple elements)
await db.posts.updateOne(
  { _id: postId },
  { $push: { tags: { $each: ["mongodb", "database", "nosql"] } } }
);

// $push with $slice (limit array size)
await db.posts.updateOne(
  { _id: postId },
  { $push: {
    recentViews: {
      $each: [{ userId, timestamp: new Date() }],
      $slice: -10  // Keep only last 10
    }
  }}
);

// $push with $sort
await db.posts.updateOne(
  { _id: postId },
  { $push: {
    scores: {
      $each: [{ player: "Alice", score: 95 }],
      $sort: { score: -1 },  // Sort descending
      $slice: 10  // Keep top 10
    }
  }}
);

// $addToSet - Add to array if not exists (no duplicates)
await db.users.updateOne(
  { _id: userId },
  { $addToSet: { interests: "mongodb" } }
);

// $addToSet with $each
await db.users.updateOne(
  { _id: userId },
  { $addToSet: { interests: { $each: ["mongodb", "nodejs"] } } }
);

// $pop - Remove first or last element
await db.posts.updateOne(
  { _id: postId },
  { $pop: { comments: 1 } }  // Remove last element
);
await db.posts.updateOne(
  { _id: postId },
  { $pop: { comments: -1 } }  // Remove first element
);

// $pull - Remove all matching elements
await db.posts.updateOne(
  { _id: postId },
  { $pull: { tags: "outdated" } }
);

// $pull with condition
await db.posts.updateOne(
  { _id: postId },
  { $pull: { comments: { rating: { $lt: 3 } } } }
);

// $pullAll - Remove all specified values
await db.posts.updateOne(
  { _id: postId },
  { $pullAll: { tags: ["old", "deprecated", "legacy"] } }
);

// Update array element by position
await db.posts.updateOne(
  { _id: postId },
  { $set: { "comments.0.text": "Updated first comment" } }
);

// Update array element with $ (positional operator)
await db.posts.updateOne(
  { _id: postId, "comments.author": "Alice" },
  { $set: { "comments.$.approved": true } }
);

// Update all array elements with $[] (all positional)
await db.posts.updateOne(
  { _id: postId },
  { $set: { "comments.$[].approved": false } }
);

// Update filtered array elements with $[identifier]
await db.posts.updateOne(
  { _id: postId },
  { $set: { "comments.$[elem].approved": true } },
  { arrayFilters: [{ "elem.rating": { $gte: 4 } }] }
);
```

## Atomic Operations

### Counter Pattern

```javascript
// Atomic counter increment
const result = await db.counters.findOneAndUpdate(
  { _id: "sequence" },
  { $inc: { value: 1 } },
  { returnDocument: "after", upsert: true }
);
const nextId = result.value;
```

### Stock Management Pattern

```javascript
// Atomic stock decrement with validation
const result = await db.products.updateOne(
  { _id: productId, stock: { $gte: quantity } },  // Only if enough stock
  { $inc: { stock: -quantity } }
);

if (result.modifiedCount === 0) {
  throw new Error("Insufficient stock");
}
```

### Like/Unlike Pattern

```javascript
// Like (add user to likes array if not already there)
await db.posts.updateOne(
  { _id: postId },
  {
    $addToSet: { likedBy: userId },
    $inc: { likeCount: 1 }
  }
);

// Unlike (remove user from likes array)
await db.posts.updateOne(
  { _id: postId, likedBy: userId },
  {
    $pull: { likedBy: userId },
    $inc: { likeCount: -1 }
  }
);
```

### Soft Delete Pattern

```javascript
// Mark as deleted
await db.users.updateOne(
  { _id: userId },
  {
    $set: {
      deleted: true,
      deletedAt: new Date()
    }
  }
);

// Query only active records
db.users.find({ deleted: { $ne: true } })

// Create partial index for active users (better performance)
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { deleted: { $ne: true } } }
);
```

## Bulk Operations

```javascript
// Bulk write (ordered by default)
const operations = [
  {
    insertOne: {
      document: { name: "Alice", age: 30 }
    }
  },
  {
    updateOne: {
      filter: { name: "Bob" },
      update: { $set: { age: 25 } },
      upsert: true
    }
  },
  {
    updateMany: {
      filter: { status: "pending" },
      update: { $set: { status: "active" } }
    }
  },
  {
    deleteOne: {
      filter: { name: "Charlie" }
    }
  },
  {
    replaceOne: {
      filter: { name: "David" },
      replacement: { name: "David Smith", age: 35 }
    }
  }
];

const result = await db.users.bulkWrite(operations);
console.log({
  insertedCount: result.insertedCount,
  matchedCount: result.matchedCount,
  modifiedCount: result.modifiedCount,
  deletedCount: result.deletedCount,
  upsertedCount: result.upsertedCount
});

// Unordered bulk write (parallel execution, better performance)
const result = await db.users.bulkWrite(operations, { ordered: false });
```

## Best Practices

1. **Use projection** - Only fetch fields you need
2. **Use updateOne/deleteOne** when you expect single document
3. **Check result.modifiedCount** - Verify updates succeeded
4. **Use atomic operations** - Avoid race conditions
5. **Use bulk operations** - For multiple writes
6. **Use upsert carefully** - Ensure proper indexes
7. **Avoid $where** - Use query operators instead (much faster)
8. **Use cursor pagination** - Better than skip() for large datasets
9. **Index query fields** - Especially for frequently used queries
10. **Use soft deletes** - For data you might need to recover
