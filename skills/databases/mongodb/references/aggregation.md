# MongoDB Aggregation Pipeline Reference

Complete guide to MongoDB's aggregation framework for data transformation and analysis.

## Table of Contents
- [Pipeline Basics](#pipeline-basics)
- [Core Pipeline Stages](#core-pipeline-stages)
- [Aggregation Operators](#aggregation-operators)
- [Common Patterns](#common-patterns)
- [Performance Optimization](#performance-optimization)

## Pipeline Basics

The aggregation pipeline processes documents through multiple stages, where each stage transforms the documents.

```javascript
db.collection.aggregate([
  { stage1 },
  { stage2 },
  { stage3 }
])
```

**Key Concepts:**
- Each stage receives input from previous stage
- Stages execute sequentially
- Order matters for performance
- Pipeline can be indexed (early stages)

## Core Pipeline Stages

### $match - Filter Documents

**Always use $match early** to reduce documents processed by later stages.

```javascript
// Basic filter
db.orders.aggregate([
  { $match: { status: "completed" } }
]);

// With query operators
db.orders.aggregate([
  { $match: {
    status: "completed",
    total: { $gte: 100 },
    orderDate: { $gte: new Date("2025-01-01") }
  }}
]);

// Multiple $match stages (progressive filtering)
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $match: { total: { $gte: 100 } } }
]);
```

### $project - Reshape Documents

```javascript
// Include/exclude fields
db.users.aggregate([
  { $project: { name: 1, email: 1, _id: 0 } }
]);

// Computed fields
db.orders.aggregate([
  { $project: {
    customer: 1,
    total: 1,
    tax: { $multiply: ["$total", 0.1] },
    grandTotal: { $add: ["$total", { $multiply: ["$total", 0.1] }] }
  }}
]);

// Rename fields
db.users.aggregate([
  { $project: {
    fullName: "$name",
    emailAddress: "$email"
  }}
]);

// Nested field extraction
db.users.aggregate([
  { $project: {
    name: 1,
    city: "$address.city",
    zipcode: "$address.zipcode"
  }}
]);
```

### $group - Aggregate Data

```javascript
// Count by category
db.products.aggregate([
  { $group: {
    _id: "$category",
    count: { $sum: 1 }
  }}
]);

// Sum, average, min, max
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    totalSpent: { $sum: "$total" },
    avgOrder: { $avg: "$total" },
    orderCount: { $sum: 1 },
    maxOrder: { $max: "$total" },
    minOrder: { $min: "$total" }
  }}
]);

// Group by multiple fields
db.orders.aggregate([
  { $group: {
    _id: {
      customerId: "$customerId",
      status: "$status"
    },
    count: { $sum: 1 }
  }}
]);

// Collect values into array
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    orderIds: { $push: "$_id" },
    uniqueStatuses: { $addToSet: "$status" }
  }}
]);

// First/last document values
db.orders.aggregate([
  { $sort: { orderDate: 1 } },
  { $group: {
    _id: "$customerId",
    firstOrder: { $first: "$orderDate" },
    lastOrder: { $last: "$orderDate" }
  }}
]);
```

### $sort - Order Documents

```javascript
// Single field
db.products.aggregate([
  { $sort: { price: 1 } }  // 1 = ascending, -1 = descending
]);

// Multiple fields
db.products.aggregate([
  { $sort: { category: 1, price: -1 } }
]);

// Sort after grouping
db.orders.aggregate([
  { $group: { _id: "$category", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
]);
```

### $limit and $skip

```javascript
// Top 10 results
db.products.aggregate([
  { $sort: { sales: -1 } },
  { $limit: 10 }
]);

// Pagination
db.products.aggregate([
  { $sort: { _id: 1 } },
  { $skip: 20 },
  { $limit: 10 }
]);
```

### $lookup - Join Collections

```javascript
// Basic join
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
    }
  }
]);

// Join with pipeline (more flexible)
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      let: { customerId: "$customerId" },
      pipeline: [
        { $match: {
          $expr: { $eq: ["$_id", "$$customerId"] }
        }},
        { $project: { name: 1, email: 1 } }
      ],
      as: "customer"
    }
  }
]);

// Multiple joins
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
    }
  },
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product"
    }
  }
]);
```

### $unwind - Deconstruct Arrays

```javascript
// Basic unwind
db.orders.aggregate([
  { $unwind: "$items" }
]);

// Preserve documents without array
db.orders.aggregate([
  { $unwind: {
    path: "$items",
    preserveNullAndEmptyArrays: true
  }}
]);

// Include array index
db.orders.aggregate([
  { $unwind: {
    path: "$items",
    includeArrayIndex: "itemIndex"
  }}
]);

// Common pattern: unwind, group, sum
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: {
    _id: "$items.productId",
    totalQuantity: { $sum: "$items.quantity" },
    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
  }}
]);
```

### $addFields / $set - Add New Fields

```javascript
// Add computed fields (keeps all existing fields)
db.products.aggregate([
  { $addFields: {
    discountedPrice: { $multiply: ["$price", 0.9] },
    inStock: { $gt: ["$stock", 0] }
  }}
]);

// $set is alias for $addFields (same functionality)
db.products.aggregate([
  { $set: {
    totalValue: { $multiply: ["$price", "$stock"] }
  }}
]);
```

### $replaceRoot / $replaceWith - Replace Document

```javascript
// Promote nested document to root
db.users.aggregate([
  { $replaceRoot: { newRoot: "$address" } }
]);

// Combine fields into new structure
db.products.aggregate([
  { $replaceWith: {
    name: "$name",
    pricing: {
      current: "$price",
      discounted: { $multiply: ["$price", 0.9] }
    }
  }}
]);
```

### $facet - Multiple Pipelines

```javascript
// Run multiple aggregations simultaneously
db.products.aggregate([
  { $match: { category: "electronics" } },
  {
    $facet: {
      // Price distribution
      priceRanges: [
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 100, 500, 1000, 5000],
            default: "5000+",
            output: { count: { $sum: 1 } }
          }
        }
      ],
      // Top brands
      topBrands: [
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ],
      // Statistics
      stats: [
        {
          $group: {
            _id: null,
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
            totalProducts: { $sum: 1 }
          }
        }
      ]
    }
  }
]);
```

### $bucket - Group by Ranges

```javascript
// Group by price ranges
db.products.aggregate([
  {
    $bucket: {
      groupBy: "$price",
      boundaries: [0, 50, 100, 200, 500],
      default: "500+",
      output: {
        count: { $sum: 1 },
        products: { $push: "$name" }
      }
    }
  }
]);

// Auto-bucket (MongoDB determines boundaries)
db.products.aggregate([
  {
    $bucketAuto: {
      groupBy: "$price",
      buckets: 5,
      output: {
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" }
      }
    }
  }
]);
```

### $out / $merge - Write Results

```javascript
// Replace entire output collection
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $out: "customer_totals" }
]);

// Merge with existing collection
db.orders.aggregate([
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  {
    $merge: {
      into: "customer_totals",
      on: "_id",
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
]);
```

## Aggregation Operators

### Arithmetic Operators

```javascript
db.orders.aggregate([
  { $project: {
    total: 1,
    tax: { $multiply: ["$total", 0.1] },
    discount: { $subtract: ["$total", "$discountedTotal"] },
    average: { $divide: ["$total", "$itemCount"] },
    remainder: { $mod: ["$total", 10] },
    absoluteValue: { $abs: "$balance" },
    ceiling: { $ceil: "$price" },
    floor: { $floor: "$price" },
    rounded: { $round: ["$price", 2] }  // 2 decimal places
  }}
]);
```

### String Operators

```javascript
db.users.aggregate([
  { $project: {
    fullName: { $concat: ["$firstName", " ", "$lastName"] },
    firstName: { $substr: ["$name", 0, 5] },
    upperName: { $toUpper: "$name" },
    lowerEmail: { $toLower: "$email" },
    trimmed: { $trim: { input: "$name" } },
    split: { $split: ["$email", "@"] },  // Returns array
    nameLength: { $strLenCP: "$name" }
  }}
]);

// String search/match
db.users.aggregate([
  { $project: {
    name: 1,
    hasGmail: { $regexMatch: { input: "$email", regex: /@gmail\.com$/ } }
  }}
]);
```

### Array Operators

```javascript
db.posts.aggregate([
  { $project: {
    tags: 1,
    tagCount: { $size: "$tags" },
    firstTag: { $arrayElemAt: ["$tags", 0] },
    lastTag: { $arrayElemAt: ["$tags", -1] },
    first3Tags: { $slice: ["$tags", 3] },
    reversedTags: { $reverse: "$tags" },
    hasMongoTag: { $in: ["mongodb", "$tags"] }
  }}
]);

// $filter - Filter array elements
db.products.aggregate([
  { $project: {
    name: 1,
    positiveReviews: {
      $filter: {
        input: "$reviews",
        as: "review",
        cond: { $gte: ["$$review.rating", 4] }
      }
    }
  }}
]);

// $map - Transform array elements
db.orders.aggregate([
  { $project: {
    itemNames: {
      $map: {
        input: "$items",
        as: "item",
        in: "$$item.name"
      }
    }
  }}
]);

// $reduce - Reduce array to single value
db.orders.aggregate([
  { $project: {
    totalPrice: {
      $reduce: {
        input: "$items",
        initialValue: 0,
        in: { $add: ["$$value", "$$this.price"] }
      }
    }
  }}
]);
```

### Date Operators

```javascript
db.events.aggregate([
  { $project: {
    timestamp: 1,
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" },
    hour: { $hour: "$timestamp" },
    dayOfWeek: { $dayOfWeek: "$timestamp" },

    // Date arithmetic
    nextWeek: { $dateAdd: {
      startDate: "$timestamp",
      unit: "week",
      amount: 1
    }},

    // Date difference
    daysAgo: { $dateDiff: {
      startDate: "$timestamp",
      endDate: new Date(),
      unit: "day"
    }}
  }}
]);

// Parse date string
db.logs.aggregate([
  { $project: {
    parsedDate: { $dateFromString: {
      dateString: "$dateStr",
      format: "%Y-%m-%d"
    }}
  }}
]);
```

### Conditional Operators

```javascript
db.products.aggregate([
  { $project: {
    name: 1,
    price: 1,
    // $cond (if-then-else)
    status: {
      $cond: {
        if: { $gt: ["$stock", 0] },
        then: "In Stock",
        else: "Out of Stock"
      }
    },

    // $switch (multiple conditions)
    category: {
      $switch: {
        branches: [
          { case: { $lt: ["$price", 50] }, then: "Budget" },
          { case: { $lt: ["$price", 200] }, then: "Mid-range" },
          { case: { $gte: ["$price", 200] }, then: "Premium" }
        ],
        default: "Unknown"
      }
    },

    // $ifNull (default value for null)
    displayPrice: { $ifNull: ["$salePrice", "$price"] }
  }}
]);
```

### Type Conversion

```javascript
db.data.aggregate([
  { $project: {
    stringValue: { $toString: "$numericValue" },
    intValue: { $toInt: "$stringValue" },
    doubleValue: { $toDouble: "$stringValue" },
    dateValue: { $toDate: "$timestamp" },
    boolValue: { $toBool: "$flag" }
  }}
]);
```

## Common Patterns

### Time-Based Aggregation

```javascript
// Group by date (day)
db.events.aggregate([
  { $match: {
    timestamp: { $gte: new Date("2025-01-01"), $lt: new Date("2025-02-01") }
  }},
  { $group: {
    _id: {
      year: { $year: "$timestamp" },
      month: { $month: "$timestamp" },
      day: { $dayOfMonth: "$timestamp" }
    },
    count: { $sum: 1 }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
]);

// Group by hour
db.pageViews.aggregate([
  { $group: {
    _id: { $hour: "$timestamp" },
    views: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
]);
```

### Running Totals (Window Functions)

```javascript
db.sales.aggregate([
  { $sort: { date: 1 } },
  {
    $setWindowFields: {
      partitionBy: "$region",
      sortBy: { date: 1 },
      output: {
        runningTotal: {
          $sum: "$amount",
          window: { documents: ["unbounded", "current"] }
        },
        movingAverage: {
          $avg: "$amount",
          window: { documents: [-6, 0] }  // Last 7 days
        },
        rank: { $rank: {} }
      }
    }
  }
]);
```

### Leaderboard/Rankings

```javascript
db.scores.aggregate([
  { $sort: { score: -1 } },
  { $group: {
    _id: null,
    players: { $push: { name: "$playerName", score: "$score" } }
  }},
  { $unwind: { path: "$players", includeArrayIndex: "rank" } },
  { $project: {
    _id: 0,
    rank: { $add: ["$rank", 1] },
    name: "$players.name",
    score: "$players.score"
  }},
  { $limit: 10 }
]);
```

### Pivoting Data

```javascript
// Convert array of { month, value } to object with month keys
db.data.aggregate([
  { $group: {
    _id: "$category",
    data: { $push: { k: "$month", v: "$value" } }
  }},
  { $project: {
    category: "$_id",
    monthlyData: { $arrayToObject: "$data" }
  }}
]);
```

### Text Search Ranking

```javascript
db.articles.aggregate([
  { $match: { $text: { $search: "mongodb database" } } },
  { $project: {
    title: 1,
    body: 1,
    score: { $meta: "textScore" }
  }},
  { $sort: { score: { $meta: "textScore" } } },
  { $limit: 10 }
]);
```

## Performance Optimization

### Best Practices

1. **Filter early with $match**
   ```javascript
   // Good: Filter first
   db.orders.aggregate([
     { $match: { status: "completed" } },  // Reduces documents early
     { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
   ]);

   // Bad: Filter after processing
   db.orders.aggregate([
     { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
     { $match: { total: { $gte: 100 } } }  // Processes all documents first
   ]);
   ```

2. **Use indexes** - Early $match and $sort can use indexes
   ```javascript
   // Create index
   db.orders.createIndex({ status: 1, orderDate: -1 });

   // This pipeline uses index
   db.orders.aggregate([
     { $match: { status: "completed" } },
     { $sort: { orderDate: -1 } },
     { $limit: 10 }
   ]);
   ```

3. **Project early** - Reduce document size
   ```javascript
   // Good: Project before expensive operations
   db.orders.aggregate([
     { $match: { status: "completed" } },
     { $project: { customerId: 1, total: 1 } },  // Only needed fields
     { $group: { _id: "$customerId", total: { $sum: "$total" } } }
   ]);
   ```

4. **Use $limit** after $sort
   ```javascript
   db.products.aggregate([
     { $sort: { sales: -1 } },
     { $limit: 10 }  // MongoDB optimizes this
   ]);
   ```

5. **Avoid $lookup when possible** - Use embedded documents
   ```javascript
   // If possible, embed instead of join
   // Less efficient: $lookup
   // More efficient: Embedded customer data in order
   ```

6. **Use allowDiskUse** for large datasets
   ```javascript
   db.collection.aggregate(
     pipeline,
     { allowDiskUse: true }  // Allows spilling to disk for large operations
   );
   ```

### Explain Aggregation

```javascript
// Analyze pipeline performance
db.collection.explain("executionStats").aggregate(pipeline);
```

### Pipeline Limits

- Result document size: 16MB (use $out or $merge for large results)
- Memory per stage: 100MB (use allowDiskUse: true for larger)
- Max pipeline stages: No hard limit, but impacts performance
