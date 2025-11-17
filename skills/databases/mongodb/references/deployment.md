# MongoDB Deployment Reference

Complete guide to deploying MongoDB in production environments including replication, sharding, and deployment options.

## Table of Contents
- [Replication and High Availability](#replication-and-high-availability)
- [Sharding and Horizontal Scaling](#sharding-and-horizontal-scaling)
- [Deployment Options](#deployment-options)
- [Production Configuration](#production-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Replication and High Availability

### Replica Set Architecture

A replica set provides redundancy and high availability:

**Components:**
- **Primary**: Accepts all write operations
- **Secondary**: Replicates primary's oplog, can serve reads
- **Arbiter**: Participates in elections, holds no data (optional, not recommended)

**Minimum recommendation:** 3 data-bearing nodes (no arbiter)

### Configure Replica Set

```javascript
// 1. Start mongod instances with --replSet
mongod --replSet myReplicaSet --port 27017 --dbpath /data/db1
mongod --replSet myReplicaSet --port 27018 --dbpath /data/db2
mongod --replSet myReplicaSet --port 27019 --dbpath /data/db3

// 2. Connect to one instance
mongosh --port 27017

// 3. Initiate replica set
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongodb1.example.com:27017" },
    { _id: 1, host: "mongodb2.example.com:27017" },
    { _id: 2, host: "mongodb3.example.com:27017" }
  ]
})

// 4. Check status
rs.status()

// 5. Check configuration
rs.conf()
```

### Replica Set Management

```javascript
// Add member
rs.add("mongodb4.example.com:27017")

// Add member with options
rs.add({
  host: "mongodb4.example.com:27017",
  priority: 0,  // Never becomes primary
  hidden: true  // Hidden from application
})

// Remove member
rs.remove("mongodb4.example.com:27017")

// Step down primary (force election)
rs.stepDown()

// Reconfigure replica set
cfg = rs.conf()
cfg.members[0].priority = 2  // Higher priority to become primary
rs.reconfig(cfg)

// Freeze member (prevent becoming primary)
rs.freeze(120)  // 120 seconds
```

### Member Configurations

```javascript
// Priority member (preferred primary)
{
  _id: 0,
  host: "mongodb1.example.com:27017",
  priority: 2  // Higher priority (default: 1)
}

// Hidden member (for backups, analytics)
{
  _id: 1,
  host: "mongodb2.example.com:27017",
  priority: 0,
  hidden: true  // Not visible to applications
}

// Delayed member (disaster recovery)
{
  _id: 2,
  host: "mongodb3.example.com:27017",
  priority: 0,
  hidden: true,
  secondaryDelaySecs: 3600  // 1 hour delay
}

// Arbiter (voting only, no data)
{
  _id: 3,
  host: "mongodb4.example.com:27017",
  arbiterOnly: true
}
// Note: Arbiters not recommended in modern deployments
```

### Write Concern

Controls acknowledgment of write operations.

```javascript
// w: 1 - Primary acknowledges (default, fast but less durable)
await collection.insertOne(
  { data: "..." },
  { writeConcern: { w: 1 } }
)

// w: "majority" - Majority of nodes acknowledge (recommended)
await collection.insertOne(
  { data: "..." },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
)

// w: <number> - Specific number of nodes
await collection.insertOne(
  { data: "..." },
  { writeConcern: { w: 3 } }
)

// w: 0 - Fire and forget (fastest, no acknowledgment)
await collection.insertOne(
  { data: "..." },
  { writeConcern: { w: 0 } }
)

// j: true - Wait for journal commit (most durable)
await collection.insertOne(
  { data: "..." },
  { writeConcern: { w: "majority", j: true } }
)
```

### Read Preference

Controls where reads are served from.

```javascript
// primary (default) - Read from primary only
db.collection.find().readPref("primary")

// primaryPreferred - Primary if available, else secondary
db.collection.find().readPref("primaryPreferred")

// secondary - Read from secondary only
db.collection.find().readPref("secondary")

// secondaryPreferred - Secondary if available, else primary
db.collection.find().readPref("secondaryPreferred")

// nearest - Lowest network latency
db.collection.find().readPref("nearest")

// With tags (read from specific members)
db.collection.find().readPref("secondary", [{ datacenter: "west" }])
```

### Read Concern

Controls consistency of read operations.

```javascript
// local - Default, may return data not yet majority-committed
db.collection.find().readConcern("local")

// majority - Only returns data acknowledged by majority
db.collection.find().readConcern("majority")

// linearizable - Strongest consistency (slower)
db.collection.find().readConcern("linearizable")

// snapshot - Reads from consistent snapshot (transactions)
session.withTransaction(async () => {
  await collection.find().readConcern("snapshot")
})
```

### Transactions

Multi-document ACID transactions.

```javascript
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    // All operations in transaction
    await accounts.updateOne(
      { _id: fromAccount },
      { $inc: { balance: -amount } },
      { session }
    );

    await accounts.updateOne(
      { _id: toAccount },
      { $inc: { balance: amount } },
      { session }
    );

    // Automatic commit if no error
  });
} finally {
  await session.endSession();
}

// Manual transaction control
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" }
});

try {
  await collection1.updateOne({ ... }, { ... }, { session });
  await collection2.insertOne({ ... }, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

### Monitoring Replication

```javascript
// Replica set status
rs.status()

// Replication lag
rs.printSecondaryReplicationInfo()

// Oplog status
rs.printReplicationInfo()

// Check if member is primary
db.isMaster()

// Watch for state changes
while (true) {
  const status = rs.status();
  status.members.forEach(member => {
    if (member.stateStr !== "PRIMARY" && member.stateStr !== "SECONDARY") {
      console.log(`Alert: ${member.name} is ${member.stateStr}`);
    }
  });
  sleep(5000);  // Check every 5 seconds
}
```

## Sharding and Horizontal Scaling

### Sharded Cluster Architecture

**Components:**
- **Shards**: Replica sets holding data subsets
- **Config Servers**: Replica set storing cluster metadata
- **Mongos**: Query routers directing operations to shards

### Set Up Sharded Cluster

```javascript
// 1. Start config servers (replica set)
mongod --configsvr --replSet configRS --port 27019 --dbpath /data/configdb1
mongod --configsvr --replSet configRS --port 27020 --dbpath /data/configdb2
mongod --configsvr --replSet configRS --port 27021 --dbpath /data/configdb3

// Initiate config replica set
rs.initiate({
  _id: "configRS",
  configsvr: true,
  members: [
    { _id: 0, host: "cfg1.example.com:27019" },
    { _id: 1, host: "cfg2.example.com:27019" },
    { _id: 2, host: "cfg3.example.com:27019" }
  ]
})

// 2. Start shard replica sets
// Shard 1
mongod --shardsvr --replSet shard1RS --port 27018 --dbpath /data/shard1
// (repeat for all shard members)

// Shard 2
mongod --shardsvr --replSet shard2RS --port 27018 --dbpath /data/shard2
// (repeat for all shard members)

// 3. Start mongos
mongos --configdb configRS/cfg1.example.com:27019,cfg2.example.com:27019,cfg3.example.com:27019 --port 27017

// 4. Connect to mongos and add shards
mongosh --port 27017
sh.addShard("shard1RS/shard1a.example.com:27018,shard1b.example.com:27018,shard1c.example.com:27018")
sh.addShard("shard2RS/shard2a.example.com:27018,shard2b.example.com:27018,shard2c.example.com:27018")

// 5. Enable sharding on database
sh.enableSharding("myDatabase")

// 6. Shard collection
sh.shardCollection("myDatabase.users", { userId: "hashed" })
```

### Shard Key Selection

**Critical decision** - Cannot be changed after sharding.

**Good shard key characteristics:**
- High cardinality (many unique values)
- Even distribution (no hotspots)
- Query-aligned (queries include shard key)

```javascript
// Hashed shard key (good for even distribution)
sh.shardCollection("myDatabase.users", { userId: "hashed" })

// Range-based shard key
sh.shardCollection("myDatabase.orders", { customerId: 1, orderDate: 1 })

// Compound shard key
sh.shardCollection("myDatabase.events", { region: 1, timestamp: 1 })

// Bad shard key examples:
// - Monotonically increasing (_id, timestamp) - all writes to one shard
// - Low cardinality (status, category) - uneven distribution
// - Not in queries - scatter-gather queries
```

### Refine Shard Key (MongoDB 5.0+)

```javascript
// Add field to existing shard key
db.adminCommand({
  refineCollectionShardKey: "myDatabase.users",
  key: { userId: 1, accountType: 1 }  // Add accountType to existing userId key
})
```

### Zone Sharding

Assign data ranges to specific shards.

```javascript
// Add shard tags
sh.addShardTag("shard1", "US-EAST")
sh.addShardTag("shard2", "US-WEST")
sh.addShardTag("shard3", "EU")

// Assign ranges to zones
sh.addTagRange(
  "myDatabase.users",
  { zipcode: "00000" },
  { zipcode: "50000" },
  "US-EAST"
)

sh.addTagRange(
  "myDatabase.users",
  { zipcode: "50000" },
  { zipcode: "99999" },
  "US-WEST"
)

// MongoDB automatically moves chunks to match zones
```

### Query Routing

```javascript
// Targeted query (includes shard key) - fast
db.users.find({ userId: "12345" })

// Scatter-gather (no shard key) - slow, queries all shards
db.users.find({ email: "user@example.com" })

// Create secondary index for scatter-gather queries
db.users.createIndex({ email: 1 })
// Still scatter-gather, but uses index on each shard
```

### Monitoring Sharding

```javascript
// Cluster status
sh.status()

// Balancer status
sh.getBalancerState()
sh.isBalancerRunning()

// Enable/disable balancer
sh.startBalancer()
sh.stopBalancer()

// Chunk distribution
db.getSiblingDB("config").chunks.aggregate([
  { $group: { _id: "$shard", count: { $sum: 1 } } }
])

// Move chunk manually (if needed)
sh.moveChunk("myDatabase.users", { userId: "12345" }, "shard2")
```

## Deployment Options

### 1. MongoDB Atlas (Cloud - Recommended)

**Advantages:**
- Fully managed
- Auto-scaling
- Automated backups
- Multi-region/cloud
- Built-in security
- Atlas Search, Vector Search
- Free tier available

**Quick Start:**
```javascript
// 1. Create cluster at mongodb.com/atlas
// 2. Whitelist IP
// 3. Create database user
// 4. Get connection string

const uri = "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority";
const client = new MongoClient(uri);
```

**Atlas Cluster Tiers:**
- M0 (Free): 512MB, shared
- M10 (Dev): 2GB, dedicated, starts at $0.08/hour
- M30 (Prod): 8GB, dedicated, auto-scaling
- M50+: High performance, multi-region

### 2. Self-Managed

**Installation (Ubuntu/Debian):**
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

**Configuration (mongod.conf):**
```yaml
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

net:
  port: 27017
  bindIp: 127.0.0.1,10.0.0.5

security:
  authorization: enabled
  keyFile: /path/to/keyfile

replication:
  replSetName: "myReplicaSet"

# For sharded cluster
sharding:
  clusterRole: shardsvr
```

### 3. Kubernetes Deployment

**MongoDB Kubernetes Operator:**

```yaml
# Install operator
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/crd/bases/mongodbcommunity.mongodb.com_mongodbcommunity.yaml
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/manager/manager.yaml

# Deploy MongoDB replica set
apiVersion: mongodbcommunity.mongodb.com/v1
kind: MongoDBCommunity
metadata:
  name: mongodb-replica-set
spec:
  members: 3
  type: ReplicaSet
  version: "8.0"
  security:
    authentication:
      modes: ["SCRAM"]
  users:
    - name: admin
      db: admin
      passwordSecretRef:
        name: mongodb-admin-password
      roles:
        - name: root
          db: admin
      scramCredentialsSecretName: mongodb-admin-scram
  statefulSet:
    spec:
      volumeClaimTemplates:
        - metadata:
            name: data-volume
          spec:
            accessModes: ["ReadWriteOnce"]
            resources:
              requests:
                storage: 10Gi
            storageClassName: fast-ssd

# Apply
kubectl apply -f mongodb-replica-set.yaml

# Connect
kubectl get secret mongodb-admin-password -o jsonpath='{.data.password}' | base64 --decode
kubectl port-forward mongodb-replica-set-0 27017:27017
```

### 4. Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb1:
    image: mongo:8.0
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo1-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  mongodb2:
    image: mongo:8.0
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo2-data:/data/db

  mongodb3:
    image: mongo:8.0
    command: mongod --replSet myReplicaSet --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo3-data:/data/db

volumes:
  mongo1-data:
  mongo2-data:
  mongo3-data:
```

## Production Configuration

### System Limits

```bash
# /etc/security/limits.conf
mongodb soft nofile 64000
mongodb hard nofile 64000
mongodb soft nproc 64000
mongodb hard nproc 64000
```

### File System

```bash
# Use XFS or EXT4 (not EXT3)
# Disable atime
# /etc/fstab
/dev/sdb1 /data xfs noatime 0 0

# Format and mount
sudo mkfs.xfs /dev/sdb1
sudo mkdir /data
sudo mount /dev/sdb1 /data
```

### Memory Configuration

```yaml
# mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8  # 50% of RAM, max
```

### Network Configuration

```yaml
net:
  maxIncomingConnections: 65536
  compression:
    compressors: snappy,zstd
```

### Backup Strategy

```bash
# Atlas: Automatic continuous backups

# Self-managed options:

# 1. mongodump (logical backup)
mongodump --uri="mongodb://localhost:27017/myDatabase" --out=/backup/

# 2. File system snapshot (preferred for large datasets)
# - Snapshot volume containing dbPath
# - Requires replica set or sharded cluster for consistency

# 3. Cloud provider snapshots (AWS EBS, GCP Persistent Disk)

# Restore
mongorestore --uri="mongodb://localhost:27017" /backup/
```

## Monitoring and Maintenance

### Monitoring Tools

```javascript
// Server status
db.serverStatus()

// Database stats
db.stats()

// Collection stats
db.collection.stats()

// Current operations
db.currentOp()

// Kill operation
db.killOp(opId)

// Profiling
db.setProfilingLevel(1, { slowms: 100 })  // Log slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### Monitoring Services

- **MongoDB Atlas**: Built-in monitoring
- **MongoDB Ops Manager**: Enterprise on-premise monitoring
- **MongoDB Cloud Manager**: Cloud monitoring for self-managed
- **Prometheus + Grafana**: Open-source monitoring
- **Datadog, New Relic**: Third-party APM

### Maintenance Windows

```javascript
// Check replica set status
rs.status()

// Step down primary (for maintenance)
rs.stepDown(60)  // 60 seconds

// Perform maintenance on secondary
// - Update MongoDB version
// - Update OS patches
// - Hardware maintenance

// Wait for member to catch up
rs.status().members.find(m => m.name === "mongodb2:27017").optimeDate

// Repeat for each member
```

### Upgrade Process

```bash
# Replica set upgrade (rolling)
# 1. Upgrade secondaries one at a time
sudo systemctl stop mongod
sudo apt-get install -y mongodb-org=8.0.0
sudo systemctl start mongod

# 2. Step down primary
rs.stepDown()

# 3. Upgrade old primary
sudo systemctl stop mongod
sudo apt-get install -y mongodb-org=8.0.0
sudo systemctl start mongod

# Sharded cluster upgrade:
# 1. Upgrade config servers
# 2. Upgrade shards
# 3. Upgrade mongos
```

### Performance Tuning

```javascript
// Index optimization
db.collection.aggregate([{ $indexStats: {} }])  // Check index usage
db.collection.dropIndex("unused_index")

// Query optimization
db.collection.find({ ... }).explain("executionStats")

// Connection pooling
const client = new MongoClient(uri, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000
});

// Write concern tuning
// - Use w: 1 for non-critical data (faster)
// - Use w: "majority" for critical data (safer)
```

## Best Practices Summary

1. **Use replica sets** (minimum 3 members)
2. **Set write concern to "majority"** for critical data
3. **Monitor replication lag** continuously
4. **Choose shard key carefully** (cannot change easily)
5. **Use Atlas** for simplified management
6. **Configure proper backups** (test restore process)
7. **Monitor slow queries** and optimize indexes
8. **Set up alerts** for critical metrics
9. **Use connection pooling** in applications
10. **Plan for maintenance windows** and upgrades
