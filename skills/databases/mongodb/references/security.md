# MongoDB Security Reference

Complete guide to MongoDB security including authentication, authorization, and encryption.

## Table of Contents
- [Authentication](#authentication)
- [Authorization (RBAC)](#authorization-rbac)
- [Encryption](#encryption)
- [Network Security](#network-security)
- [Security Checklist](#security-checklist)

## Authentication

Authentication verifies the identity of users and applications connecting to MongoDB.

### Authentication Methods

1. **SCRAM (Default)** - Username/Password
2. **X.509 Certificates** - Mutual TLS
3. **LDAP** (Enterprise) - External directory
4. **Kerberos** (Enterprise) - Single sign-on
5. **AWS IAM** - Cloud-native
6. **OIDC** - OpenID Connect

### Enable Authentication

```javascript
// 1. Start MongoDB without auth
mongod --port 27017 --dbpath /data/db

// 2. Connect and create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "strongPassword123!",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

// 3. Shutdown and restart with auth
mongod --auth --port 27017 --dbpath /data/db

// 4. Connect with authentication
mongosh --authenticationDatabase admin -u admin -p
```

### Create Users

```javascript
// Admin user (all databases)
use admin
db.createUser({
  user: "admin",
  pwd: "strongPassword",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

// Database-specific user
use myDatabase
db.createUser({
  user: "appUser",
  pwd: "appPassword",
  roles: [
    { role: "readWrite", db: "myDatabase" }
  ]
})

// Read-only user
use myDatabase
db.createUser({
  user: "reportUser",
  pwd: "reportPassword",
  roles: [
    { role: "read", db: "myDatabase" }
  ]
})

// Multi-database user
use admin
db.createUser({
  user: "multiDbUser",
  pwd: "password",
  roles: [
    { role: "readWrite", db: "database1" },
    { role: "read", db: "database2" },
    { role: "dbAdmin", db: "database3" }
  ]
})
```

### Manage Users

```javascript
// List users
db.getUsers()

// Change password
db.changeUserPassword("username", "newPassword")

// Update user roles
db.updateUser("username", {
  roles: [
    { role: "readWrite", db: "myDatabase" },
    { role: "dbAdmin", db: "myDatabase" }
  ]
})

// Grant additional role
db.grantRolesToUser("username", [
  { role: "read", db: "anotherDatabase" }
])

// Revoke role
db.revokeRolesFromUser("username", [
  { role: "dbAdmin", db: "myDatabase" }
])

// Drop user
db.dropUser("username")
```

### Connection Strings with Authentication

```javascript
// Basic authentication
mongodb://username:password@localhost:27017/database

// With options
mongodb://username:password@localhost:27017/database?authSource=admin

// Replica set with authentication
mongodb://username:password@host1:27017,host2:27017,host3:27017/database?replicaSet=myReplicaSet&authSource=admin

// MongoDB Atlas
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

// Connection in Node.js
const { MongoClient } = require('mongodb');
const uri = "mongodb://username:password@localhost:27017/database?authSource=admin";
const client = new MongoClient(uri);
```

### X.509 Certificate Authentication

```javascript
// mongod.conf
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /path/to/mongodb.pem
    CAFile: /path/to/ca.pem

security:
  authorization: enabled

// Create X.509 user
use $external
db.createUser({
  user: "C=US,ST=NY,L=NYC,O=Example,OU=IT,CN=client",
  roles: [
    { role: "readWrite", db: "myDatabase" }
  ]
})

// Connect with X.509
mongosh --tls \
  --tlsCertificateKeyFile /path/to/client.pem \
  --tlsCAFile /path/to/ca.pem \
  --authenticationDatabase '$external' \
  --authenticationMechanism MONGODB-X509
```

## Authorization (RBAC)

Role-Based Access Control defines what authenticated users can do.

### Built-in Roles

#### Database User Roles

```javascript
// read - Read data from all non-system collections
{ role: "read", db: "myDatabase" }

// readWrite - Read and write data to all non-system collections
{ role: "readWrite", db: "myDatabase" }
```

#### Database Admin Roles

```javascript
// dbAdmin - Manage database (indexes, stats, compaction)
{ role: "dbAdmin", db: "myDatabase" }

// userAdmin - Create and modify users and roles
{ role: "userAdmin", db: "myDatabase" }

// dbOwner - Full database access (read, write, admin)
{ role: "dbOwner", db: "myDatabase" }
```

#### Cluster Admin Roles

```javascript
// clusterAdmin - Full cluster management
{ role: "clusterAdmin", db: "admin" }

// clusterManager - Manage and monitor cluster
{ role: "clusterManager", db: "admin" }

// clusterMonitor - Read-only cluster monitoring
{ role: "clusterMonitor", db: "admin" }

// hostManager - Monitor and manage servers
{ role: "hostManager", db: "admin" }
```

#### Backup and Restore Roles

```javascript
// backup - Backup database
{ role: "backup", db: "admin" }

// restore - Restore database
{ role: "restore", db: "admin" }
```

#### All-Database Roles

```javascript
// readAnyDatabase - Read all databases
{ role: "readAnyDatabase", db: "admin" }

// readWriteAnyDatabase - Read/write all databases
{ role: "readWriteAnyDatabase", db: "admin" }

// userAdminAnyDatabase - Manage users on all databases
{ role: "userAdminAnyDatabase", db: "admin" }

// dbAdminAnyDatabase - Administer all databases
{ role: "dbAdminAnyDatabase", db: "admin" }
```

#### Superuser Role

```javascript
// root - Full system access (use carefully!)
{ role: "root", db: "admin" }
```

### Custom Roles

```javascript
// Create custom role
use myDatabase
db.createRole({
  role: "customRole",
  privileges: [
    {
      resource: { db: "myDatabase", collection: "users" },
      actions: ["find", "insert", "update"]
    },
    {
      resource: { db: "myDatabase", collection: "orders" },
      actions: ["find"]
    }
  ],
  roles: []  // Can inherit from other roles
})

// Grant custom role to user
db.grantRolesToUser("username", ["customRole"])

// Create role with inherited roles
db.createRole({
  role: "appRole",
  privileges: [
    {
      resource: { db: "myDatabase", collection: "logs" },
      actions: ["insert"]
    }
  ],
  roles: [
    { role: "read", db: "myDatabase" }  // Inherit read access
  ]
})

// Update role
db.updateRole("customRole", {
  privileges: [
    {
      resource: { db: "myDatabase", collection: "users" },
      actions: ["find", "insert", "update", "remove"]
    }
  ]
})

// Drop role
db.dropRole("customRole")
```

### Privilege Actions

Common actions for privileges:

```javascript
// CRUD operations
"find", "insert", "update", "remove"

// Database management
"createCollection", "dropCollection"
"createIndex", "dropIndex"
"viewRole", "viewUser"

// Administrative
"killCursors", "killAnySession"
"serverStatus", "dbStats", "collStats"

// Replication
"replSetGetStatus", "replSetConfigure"

// Sharding
"addShard", "removeShard"
```

### View User Privileges

```javascript
// View current user's privileges
db.runCommand({ usersInfo: { user: "username", db: "myDatabase" }, showPrivileges: true })

// View all privileges for current user
db.runCommand({ connectionStatus: 1, showPrivileges: true })
```

## Encryption

### Encryption at Rest

Encrypts data files on disk.

```yaml
# mongod.conf
security:
  enableEncryption: true
  encryptionKeyFile: /path/to/keyfile

# Or use KMIP (Enterprise)
security:
  enableEncryption: true
  kmip:
    serverName: kmip.example.com
    port: 5696
    clientCertificateFile: /path/to/client.pem
```

### Encryption in Transit (TLS/SSL)

Encrypts network communication.

```yaml
# mongod.conf
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /path/to/mongodb.pem
    CAFile: /path/to/ca.pem
    allowConnectionsWithoutCertificates: false  # Require client certs

# Connect with TLS
mongosh --tls \
  --tlsCertificateKeyFile /path/to/client.pem \
  --tlsCAFile /path/to/ca.pem \
  --host mongodb.example.com

# Connection string with TLS
mongodb://username:password@host:27017/database?tls=true&tlsCAFile=/path/to/ca.pem
```

### Client-Side Field Level Encryption (CSFLE)

Encrypt specific fields before sending to MongoDB.

```javascript
// 1. Create master key in KMS (AWS, Azure, GCP, local)
const { ClientEncryption } = require('mongodb-client-encryption');

// 2. Create data encryption key
const clientEncryption = new ClientEncryption(keyVaultClient, {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
});

const dataKeyId = await clientEncryption.createDataKey('aws', {
  masterKey: {
    region: 'us-east-1',
    key: 'arn:aws:kms:us-east-1:...'
  }
});

// 3. Configure auto-encryption
const encryptedClient = new MongoClient(uri, {
  autoEncryption: {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders: {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    },
    schemaMap: {
      'myDatabase.users': {
        bsonType: 'object',
        properties: {
          ssn: {
            encrypt: {
              keyId: [dataKeyId],
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
              bsonType: 'string'
            }
          },
          salary: {
            encrypt: {
              keyId: [dataKeyId],
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
              bsonType: 'int'
            }
          }
        }
      }
    }
  }
});

// 4. Use normally - encryption is automatic
await encryptedClient.db('myDatabase').collection('users').insertOne({
  name: 'Alice',
  ssn: '123-45-6789',  // Automatically encrypted
  salary: 100000       // Automatically encrypted
});

// Data stored encrypted in MongoDB
// Only clients with decryption key can read plaintext
```

### Queryable Encryption (New in MongoDB 6.0)

Encrypt fields while maintaining queryability.

```javascript
const encryptedClient = new MongoClient(uri, {
  autoEncryption: {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders: { /* ... */ },
    encryptedFieldsMap: {
      'myDatabase.users': {
        fields: [
          {
            path: 'ssn',
            bsonType: 'string',
            queries: { queryType: 'equality' }  // Enable equality queries
          }
        ]
      }
    }
  }
});

// Can query encrypted fields
await encryptedClient.db('myDatabase').collection('users')
  .find({ ssn: '123-45-6789' });  // Works with encrypted data!
```

## Network Security

### IP Whitelisting

```yaml
# mongod.conf
net:
  bindIp: 127.0.0.1,10.0.0.5  # Only accept connections from these IPs
  port: 27017

# MongoDB Atlas: Configure in Network Access settings
# - Add specific IPs
# - Add CIDR blocks
# - Add AWS/GCP/Azure security groups
```

### Firewall Configuration

```bash
# Ubuntu/Debian with UFW
sudo ufw allow from 10.0.0.0/24 to any port 27017
sudo ufw enable

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-rich-rule='
  rule family="ipv4"
  source address="10.0.0.0/24"
  port protocol="tcp" port="27017" accept'
sudo firewall-cmd --reload
```

### VPC Peering (Atlas)

```javascript
// Connect through VPC peering (private network)
// No public internet exposure

// 1. Set up VPC peering in Atlas
// 2. Configure route tables
// 3. Connect using private IP

mongodb://username:password@10.0.1.5:27017/database
```

### SSH Tunnel

```bash
# Create SSH tunnel
ssh -L 27017:localhost:27017 user@mongodb-server.com

# Connect to localhost (tunnels to remote server)
mongosh mongodb://localhost:27017/database
```

## Security Checklist

### Production Security Checklist

- [ ] **Enable authentication** (`--auth`)
- [ ] **Create admin user** with strong password
- [ ] **Use role-based access control** (least privilege)
- [ ] **Enable TLS/SSL** for network encryption
- [ ] **Enable encryption at rest** (if sensitive data)
- [ ] **Bind to specific IPs** (not 0.0.0.0)
- [ ] **Configure firewall** (restrict port 27017)
- [ ] **Use IP whitelisting** (Atlas or manual)
- [ ] **Disable HTTP status interface** (security.javascriptEnabled: false)
- [ ] **Audit system events** (Enterprise feature)
- [ ] **Rotate passwords regularly**
- [ ] **Use certificate authentication** for production
- [ ] **Enable CSFLE** for sensitive fields (SSN, credit cards)
- [ ] **Monitor security logs**
- [ ] **Keep MongoDB updated** (security patches)

### MongoDB Atlas Security Features

Atlas includes many security features by default:

- TLS/SSL encryption (required)
- Encryption at rest
- IP whitelisting
- VPC peering
- Private endpoints
- Automated backups
- Auditing
- Security advisories

### Audit Configuration (Enterprise)

```yaml
# mongod.conf
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.json
  filter: '{
    atype: { $in: ["authenticate", "createUser", "dropUser"] }
  }'
```

### Security Best Practices

1. **Principle of Least Privilege**
   - Grant minimum required permissions
   - Use specific roles, not root

2. **Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Use password manager

3. **Regular Audits**
   - Review user accounts monthly
   - Remove unused accounts
   - Check privilege escalation

4. **Network Isolation**
   - Use private networks (VPC)
   - Limit public exposure
   - Use VPN for remote access

5. **Monitoring**
   - Monitor failed authentication attempts
   - Alert on privilege changes
   - Track database access patterns

6. **Backup Security**
   - Encrypt backups
   - Secure backup storage
   - Test restore process

7. **Compliance**
   - GDPR: Data encryption, access controls
   - HIPAA: Audit logs, encryption
   - PCI DSS: Network isolation, encryption

### Common Security Mistakes

```javascript
// ❌ Wrong: No authentication
mongod --dbpath /data/db

// ✓ Right: Authentication enabled
mongod --auth --dbpath /data/db

// ❌ Wrong: Bind to all interfaces
mongod --bind_ip 0.0.0.0

// ✓ Right: Bind to specific IPs
mongod --bind_ip 127.0.0.1,10.0.0.5

// ❌ Wrong: Root role for application
db.createUser({
  user: "app",
  pwd: "password",
  roles: ["root"]
})

// ✓ Right: Specific permissions
db.createUser({
  user: "app",
  pwd: "password",
  roles: [{ role: "readWrite", db: "myDatabase" }]
})

// ❌ Wrong: Hardcoded credentials
const uri = "mongodb://admin:password123@localhost:27017/db";

// ✓ Right: Environment variables
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@localhost:27017/db`;

// ❌ Wrong: No TLS in production
mongodb://host:27017/database

// ✓ Right: TLS enabled
mongodb://host:27017/database?tls=true
```

### Emergency Security Response

If security breach suspected:

1. **Immediate Actions**
   ```javascript
   // 1. Change all passwords
   db.changeUserPassword("admin", "newStrongPassword")

   // 2. Review user accounts
   db.getUsers()

   // 3. Check for unauthorized users
   db.dropUser("suspiciousUser")

   // 4. Review recent operations
   db.system.profile.find().sort({ ts: -1 }).limit(100)
   ```

2. **Network Isolation**
   - Enable IP whitelist
   - Restrict firewall rules
   - Enable VPN requirement

3. **Audit and Investigation**
   - Review audit logs
   - Check authentication logs
   - Identify compromised credentials

4. **Recovery**
   - Restore from backup if data compromised
   - Update security policies
   - Implement additional monitoring

## Summary

**Security Layers:**
1. **Network**: Firewall, IP whitelist, VPC
2. **Transport**: TLS/SSL encryption
3. **Authentication**: User verification
4. **Authorization**: Role-based access
5. **Data**: Encryption at rest, CSFLE
6. **Audit**: Logging and monitoring

**Minimum Production Setup:**
- Authentication enabled
- TLS/SSL for network traffic
- IP whitelisting
- Specific user roles (not root)
- Regular security updates
