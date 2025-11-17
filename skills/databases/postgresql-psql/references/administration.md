# PostgreSQL Administration

Guide to database administration including backup, restore, replication, security, and user management.

## Table of Contents
- [User and Role Management](#user-and-role-management)
- [Permissions and Security](#permissions-and-security)
- [Backup and Restore](#backup-and-restore)
- [Replication and High Availability](#replication-and-high-availability)
- [Maintenance Tasks](#maintenance-tasks)
- [Database Management](#database-management)

## User and Role Management

### Creating Users and Roles

```sql
-- Create user with password
CREATE USER appuser WITH PASSWORD 'secure_password';

-- Create role (no login by default)
CREATE ROLE admin_role;

-- Create user with specific attributes
CREATE USER poweruser WITH
    PASSWORD 'password'
    CREATEDB           -- Can create databases
    CREATEROLE         -- Can create roles
    LOGIN              -- Can login (default for USER)
    CONNECTION LIMIT 10;  -- Max 10 concurrent connections

-- Create superuser
CREATE USER superadmin WITH PASSWORD 'password' SUPERUSER;

-- Create role with inheritance
CREATE ROLE base_role;
CREATE ROLE child_role INHERITS base_role;
```

### Modifying Users

```sql
-- Change password
ALTER USER appuser WITH PASSWORD 'new_password';

-- Add/remove attributes
ALTER USER appuser WITH CREATEDB;
ALTER USER appuser WITH NOCREATEDB;

-- Rename user
ALTER USER oldname RENAME TO newname;

-- Set connection limit
ALTER USER appuser CONNECTION LIMIT 5;

-- Set default configuration for user
ALTER USER appuser SET work_mem = '256MB';
ALTER USER appuser SET default_transaction_isolation = 'read committed';

-- Reset to defaults
ALTER USER appuser RESET work_mem;
```

### Dropping Users

```sql
-- Drop user
DROP USER appuser;

-- Drop if exists
DROP USER IF EXISTS appuser;

-- Drop role
DROP ROLE IF EXISTS admin_role;

-- Note: Can't drop user that owns objects or has privileges
-- Must first reassign ownership and revoke privileges
REASSIGN OWNED BY appuser TO postgres;
DROP OWNED BY appuser;
DROP USER appuser;
```

### Role Membership

```sql
-- Grant role to user
GRANT admin_role TO appuser;

-- Grant multiple roles
GRANT admin_role, editor_role TO appuser;

-- Revoke role
REVOKE admin_role FROM appuser;

-- Grant with ADMIN option (can grant role to others)
GRANT admin_role TO appuser WITH ADMIN OPTION;

-- Set default role
SET ROLE admin_role;

-- Reset to original role
RESET ROLE;
```

### Viewing Users and Roles

```sql
-- List all roles
\du
-- or
SELECT rolname, rolsuper, rolcreatedb, rolcanlogin
FROM pg_roles;

-- List role memberships
SELECT
    r.rolname AS role_name,
    m.rolname AS member_name
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member;

-- View current user
SELECT current_user;

-- View session user (original login)
SELECT session_user;
```

## Permissions and Security

### Database Permissions

```sql
-- Grant database connection
GRANT CONNECT ON DATABASE mydb TO appuser;

-- Grant create schema
GRANT CREATE ON DATABASE mydb TO appuser;

-- Revoke permissions
REVOKE CONNECT ON DATABASE mydb FROM appuser;

-- Grant to all databases
GRANT CONNECT ON DATABASE ALL TO appuser;
```

### Schema Permissions

```sql
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO appuser;

-- Grant create objects in schema
GRANT CREATE ON SCHEMA public TO appuser;

-- Grant all privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO appuser;

-- Revoke permissions
REVOKE CREATE ON SCHEMA public FROM appuser;
```

### Table Permissions

```sql
-- Grant SELECT on specific table
GRANT SELECT ON users TO appuser;

-- Grant multiple privileges
GRANT SELECT, INSERT, UPDATE ON users TO appuser;

-- Grant all privileges on table
GRANT ALL PRIVILEGES ON users TO appuser;

-- Grant on all tables in schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO appuser;

-- Grant with GRANT option (can grant to others)
GRANT SELECT ON users TO appuser WITH GRANT OPTION;

-- Revoke permissions
REVOKE INSERT, UPDATE ON users FROM appuser;
REVOKE ALL PRIVILEGES ON users FROM appuser;
```

### Column-Level Permissions

```sql
-- Grant SELECT on specific columns
GRANT SELECT (id, email, name) ON users TO appuser;

-- Grant UPDATE on specific columns
GRANT UPDATE (name, email) ON users TO appuser;
```

### Sequence Permissions

```sql
-- Grant usage on sequence (for auto-increment)
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO appuser;

-- Grant on all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO appuser;
```

### Function Permissions

```sql
-- Grant execute on function
GRANT EXECUTE ON FUNCTION get_user(INTEGER) TO appuser;

-- Grant on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO appuser;
```

### Default Privileges

Set default permissions for future objects.

```sql
-- Default table privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO appuser;

-- Default sequence privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO appuser;

-- Default function privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO appuser;

-- For specific role's objects
ALTER DEFAULT PRIVILEGES FOR ROLE dataowner IN SCHEMA public
GRANT SELECT ON TABLES TO readonly_role;
```

### Row Level Security (RLS)

```sql
-- Enable RLS on table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy (users can only see their own data)
CREATE POLICY user_policy ON users
    USING (id = current_setting('app.current_user_id')::INTEGER);

-- Policy with INSERT check
CREATE POLICY user_insert_policy ON users
    WITH CHECK (id = current_setting('app.current_user_id')::INTEGER);

-- Policy for SELECT only
CREATE POLICY user_select_policy ON users
    FOR SELECT
    USING (active = true);

-- Policy for specific role
CREATE POLICY admin_policy ON users
    TO admin_role
    USING (true);  -- Admins see all rows

-- View policies
\d+ users

-- Drop policy
DROP POLICY user_policy ON users;

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Viewing Permissions

```sql
-- View table permissions
\dp users
-- or
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'users';

-- View column permissions
SELECT grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_name = 'users';

-- View schema permissions
\dn+
```

### SSL/TLS Configuration

Configure in postgresql.conf:

```conf
# postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
ssl_ca_file = '/path/to/ca.crt'
```

Configure client authentication in pg_hba.conf:

```conf
# pg_hba.conf
# TYPE  DATABASE  USER      ADDRESS         METHOD
hostssl all       all       0.0.0.0/0       md5
hostssl all       all       ::/0            md5
```

Connect with SSL:

```bash
psql "postgresql://user@host/db?sslmode=require"
psql "postgresql://user@host/db?sslmode=verify-full&sslcert=client.crt&sslkey=client.key"
```

## Backup and Restore

### pg_dump (Logical Backup)

```bash
# Dump entire database
pg_dump -U postgres -d mydb > mydb_backup.sql

# Dump with custom format (compressed, allows selective restore)
pg_dump -U postgres -d mydb -Fc > mydb_backup.dump

# Dump with directory format (parallel backup)
pg_dump -U postgres -d mydb -Fd -j 4 -f backup_dir

# Dump specific table
pg_dump -U postgres -d mydb -t users > users_backup.sql

# Dump multiple tables
pg_dump -U postgres -d mydb -t users -t orders > tables_backup.sql

# Dump schema only (no data)
pg_dump -U postgres -d mydb -s > schema_backup.sql

# Dump data only (no schema)
pg_dump -U postgres -d mydb -a > data_backup.sql

# Dump with compression
pg_dump -U postgres -d mydb -Fc -Z 9 > mydb_backup.dump

# Exclude table
pg_dump -U postgres -d mydb -T temp_table > mydb_backup.sql

# Dump with inserts (easier to read/edit)
pg_dump -U postgres -d mydb --inserts > mydb_backup.sql

# Dump specific schema
pg_dump -U postgres -d mydb -n public > public_schema.sql
```

### pg_restore

```bash
# Restore from custom format
pg_restore -U postgres -d mydb_restored mydb_backup.dump

# Restore specific table
pg_restore -U postgres -d mydb -t users mydb_backup.dump

# List contents of dump
pg_restore -l mydb_backup.dump

# Restore with jobs (parallel)
pg_restore -U postgres -d mydb -j 4 mydb_backup.dump

# Restore to existing database (clean first)
pg_restore -U postgres -d mydb --clean mydb_backup.dump

# Restore if exists (no errors)
pg_restore -U postgres -d mydb --if-exists mydb_backup.dump

# Restore schema only
pg_restore -U postgres -d mydb -s mydb_backup.dump

# Restore data only
pg_restore -U postgres -d mydb -a mydb_backup.dump
```

### pg_dumpall

Backup all databases including roles and tablespaces.

```bash
# Dump all databases
pg_dumpall -U postgres > all_databases.sql

# Dump only globals (roles, tablespaces)
pg_dumpall -U postgres -g > globals.sql

# Dump only roles
pg_dumpall -U postgres -r > roles.sql

# Restore
psql -U postgres -f all_databases.sql
```

### Point-in-Time Recovery (PITR)

Enable WAL archiving in postgresql.conf:

```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
max_wal_senders = 3
wal_keep_size = 1GB
```

Create base backup:

```bash
# Create base backup
pg_basebackup -U postgres -D /backup/base -Ft -z -P

# With WAL files
pg_basebackup -U postgres -D /backup/base -Ft -z -P -X stream
```

Restore from PITR:

```bash
# 1. Stop PostgreSQL
systemctl stop postgresql

# 2. Restore base backup
tar -xzf /backup/base/base.tar.gz -C /var/lib/postgresql/data

# 3. Create recovery signal
touch /var/lib/postgresql/data/recovery.signal

# 4. Configure recovery (postgresql.conf or recovery.conf)
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00'

# 5. Start PostgreSQL
systemctl start postgresql
```

### Backup Best Practices

```bash
#!/bin/bash
# Automated backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DATABASE="mydb"
RETENTION_DAYS=7

# Create backup
pg_dump -U postgres -d $DATABASE -Fc > $BACKUP_DIR/$DATABASE_$DATE.dump

# Compress (if not using -Fc)
# gzip $BACKUP_DIR/$DATABASE_$DATE.sql

# Remove old backups
find $BACKUP_DIR -name "$DATABASE_*.dump" -mtime +$RETENTION_DAYS -delete

# Upload to remote storage (optional)
# aws s3 cp $BACKUP_DIR/$DATABASE_$DATE.dump s3://my-bucket/backups/

# Log
echo "$DATE: Backup completed successfully" >> $BACKUP_DIR/backup.log
```

Schedule with cron:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup_script.sh
```

## Replication and High Availability

### Streaming Replication

**Primary server configuration (postgresql.conf):**

```conf
# postgresql.conf (primary)
listen_addresses = '*'
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
hot_standby = on
```

**Primary authentication (pg_hba.conf):**

```conf
# pg_hba.conf (primary)
host    replication     replication_user    standby_ip/32    md5
```

**Create replication user:**

```sql
-- On primary
CREATE USER replication_user WITH REPLICATION PASSWORD 'password';
```

**Setup standby server:**

```bash
# Stop standby PostgreSQL
systemctl stop postgresql

# Remove existing data
rm -rf /var/lib/postgresql/data/*

# Create base backup from primary
pg_basebackup -h primary_ip -U replication_user -D /var/lib/postgresql/data -P -R -X stream

# Start standby
systemctl start postgresql
```

**Standby configuration (postgresql.conf):**

```conf
# postgresql.conf (standby) - created by pg_basebackup with -R
primary_conninfo = 'host=primary_ip port=5432 user=replication_user password=password'
hot_standby = on
```

### Monitoring Replication

```sql
-- On primary: View replication status
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    sync_state
FROM pg_stat_replication;

-- On standby: View replication lag
SELECT
    now() - pg_last_xact_replay_timestamp() AS replication_lag,
    pg_is_in_recovery() AS is_standby;

-- On standby: View replay status
SELECT pg_last_xact_replay_timestamp() AS last_replay;
```

### Failover

```sql
-- Promote standby to primary
-- On standby server:
SELECT pg_promote();

-- Or using pg_ctl
pg_ctl promote -D /var/lib/postgresql/data
```

### Logical Replication

Replicate specific tables or databases.

**Publisher (source) setup:**

```sql
-- On publisher
CREATE PUBLICATION my_publication FOR ALL TABLES;

-- Or specific tables
CREATE PUBLICATION my_publication FOR TABLE users, orders;

-- View publications
\dRp+
```

**Subscriber (destination) setup:**

```sql
-- On subscriber
CREATE SUBSCRIPTION my_subscription
CONNECTION 'host=publisher_ip dbname=mydb user=replication_user password=password'
PUBLICATION my_publication;

-- View subscriptions
\dRs+

-- Monitor replication
SELECT * FROM pg_stat_subscription;
```

### High Availability Solutions

- **Patroni**: Automated failover using etcd/Consul/Zookeeper
- **repmgr**: Replication management and failover
- **pgpool-II**: Connection pooling and load balancing
- **PgBouncer**: Lightweight connection pooler
- **Stolon**: Cloud-native HA for PostgreSQL

## Maintenance Tasks

### VACUUM

Reclaim storage and update statistics.

```sql
-- VACUUM specific table
VACUUM users;

-- VACUUM with ANALYZE (update statistics)
VACUUM ANALYZE users;

-- VERBOSE output
VACUUM VERBOSE users;

-- FULL (locks table, rewrites completely)
VACUUM FULL users;

-- VACUUM all databases
VACUUM;
```

### ANALYZE

Update query planner statistics.

```sql
-- ANALYZE specific table
ANALYZE users;

-- ANALYZE specific columns
ANALYZE users (email, name);

-- ANALYZE all tables
ANALYZE;

-- View last analyze time
SELECT
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables;
```

### REINDEX

Rebuild indexes.

```sql
-- Reindex specific index
REINDEX INDEX idx_users_email;

-- Reindex table (all indexes)
REINDEX TABLE users;

-- Reindex schema
REINDEX SCHEMA public;

-- Reindex database
REINDEX DATABASE mydb;

-- Reindex concurrently (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
```

### Auto-Vacuum Configuration

Configure in postgresql.conf:

```conf
# postgresql.conf
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min

# Vacuum threshold
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2

# Analyze threshold
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1

# Cost-based vacuum delay
autovacuum_vacuum_cost_delay = 20ms
autovacuum_vacuum_cost_limit = 200
```

Per-table auto-vacuum settings:

```sql
-- Customize auto-vacuum for specific table
ALTER TABLE large_table SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- Disable auto-vacuum for table
ALTER TABLE temp_table SET (
    autovacuum_enabled = false
);
```

### CLUSTER

Physically reorder table based on index.

```sql
-- Cluster table by index
CLUSTER users USING idx_users_email;

-- Cluster all previously clustered tables
CLUSTER;

-- View clustered tables
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
        SELECT indexrelid::regclass::text
        FROM pg_index
        WHERE indisclustered
    );
```

## Database Management

### Creating Databases

```sql
-- Create database
CREATE DATABASE mydb;

-- Create with owner
CREATE DATABASE mydb OWNER appuser;

-- Create with template
CREATE DATABASE mydb_test TEMPLATE mydb;

-- Create with encoding
CREATE DATABASE mydb
    ENCODING 'UTF8'
    LC_COLLATE 'en_US.UTF-8'
    LC_CTYPE 'en_US.UTF-8';

-- Create with connection limit
CREATE DATABASE mydb CONNECTION LIMIT 50;
```

### Modifying Databases

```sql
-- Rename database
ALTER DATABASE oldname RENAME TO newname;

-- Change owner
ALTER DATABASE mydb OWNER TO newowner;

-- Set connection limit
ALTER DATABASE mydb CONNECTION LIMIT 100;

-- Set default parameters
ALTER DATABASE mydb SET work_mem = '256MB';
```

### Dropping Databases

```sql
-- Drop database
DROP DATABASE mydb;

-- Drop if exists
DROP DATABASE IF EXISTS mydb;

-- Force drop (disconnect users)
-- PostgreSQL 13+
DROP DATABASE mydb WITH (FORCE);

-- Pre-13: Disconnect users first
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'mydb';

DROP DATABASE mydb;
```

### Tablespaces

Create tablespace for custom storage locations.

```sql
-- Create tablespace
CREATE TABLESPACE fast_storage LOCATION '/mnt/ssd/pg_tablespace';

-- Create table in tablespace
CREATE TABLE fast_table (
    id SERIAL PRIMARY KEY,
    data TEXT
) TABLESPACE fast_storage;

-- Move table to different tablespace
ALTER TABLE mytable SET TABLESPACE new_tablespace;

-- View tablespaces
\db+
SELECT * FROM pg_tablespace;
```

### Extensions

```sql
-- List available extensions
SELECT * FROM pg_available_extensions;

-- Install extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- View installed extensions
\dx
SELECT * FROM pg_extension;

-- Drop extension
DROP EXTENSION pg_trgm;
```

### Monitoring Database Size

```sql
-- Database size
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Top 10 largest tables
SELECT
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Security Best Practices

1. **Use strong passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

2. **Principle of least privilege**
   - Grant minimum necessary permissions
   - Use roles for permission management
   - Avoid SUPERUSER unless necessary

3. **Enable SSL/TLS**
   - Always use encrypted connections in production
   - Require SSL in pg_hba.conf

4. **Regular security updates**
   - Keep PostgreSQL up to date
   - Monitor security advisories

5. **Secure pg_hba.conf**
   - Use md5 or scram-sha-256 authentication
   - Restrict host access
   - Never use "trust" in production

6. **Audit logging**
   - Enable logging in postgresql.conf
   - Log connections, disconnections, and statements
   - Regularly review logs

7. **Backup encryption**
   - Encrypt backups at rest
   - Encrypt transmission to remote storage

8. **Row Level Security**
   - Use RLS for multi-tenant applications
   - Limit data access at row level

9. **Regular security audits**
   - Review user permissions
   - Check for unused accounts
   - Monitor failed login attempts

10. **Network security**
    - Use firewalls
    - Limit database server exposure
    - Use VPN for remote access
