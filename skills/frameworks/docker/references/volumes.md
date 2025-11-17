# Docker Volume Management

Complete guide to persistent storage, bind mounts, tmpfs mounts, and volume backup/restore.

## Table of Contents

- [Volume Types](#volume-types)
- [Named Volumes](#named-volumes)
- [Bind Mounts](#bind-mounts)
- [tmpfs Mounts](#tmpfs-mounts)
- [Volume Management](#volume-management)
- [Backup and Restore](#backup-and-restore)

## Volume Types

Docker provides three types of storage:

| Type | Managed By | Persistence | Use Case |
|------|-----------|-------------|----------|
| **Named Volume** | Docker | Survives container deletion | Production data |
| **Bind Mount** | User | Host filesystem | Development, config files |
| **tmpfs Mount** | Docker | In-memory only | Temporary data, secrets |

### When to Use Each Type

**Named Volumes** (Recommended for Production):
- Database data
- Application uploads
- Cache that should persist
- Data shared between containers

**Bind Mounts** (Development):
- Live code reload during development
- Configuration files from host
- Build artifacts
- Sharing data with host

**tmpfs Mounts** (Temporary):
- Sensitive data (passwords, tokens)
- Temporary cache
- Build cache
- Session data

## Named Volumes

Docker-managed persistent storage. Data survives container deletion.

### Creating and Using Volumes

```bash
# Create named volume
docker volume create mydata

# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Use volume with container
docker run -v mydata:/app/data myapp:1.0

# Volume will be created automatically if doesn't exist
docker run -v app-data:/app/data myapp:1.0
```

### Volume with Options

```bash
# Create with driver options
docker volume create --driver local \
  --opt type=none \
  --opt device=/mnt/storage \
  --opt o=bind \
  myvolume

# Create with labels
docker volume create --label env=production mydata
```

### Docker Compose Volumes

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  web:
    build: .
    volumes:
      - uploads:/app/uploads
      - cache:/app/cache

volumes:
  postgres_data:
    driver: local
  uploads:
    driver: local
  cache:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
```

### Volume Drivers

**Local Driver** (default):
```yaml
volumes:
  mydata:
    driver: local
```

**NFS Volume**:
```yaml
volumes:
  nfs_data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=10.0.0.1,rw
      device: ":/path/to/dir"
```

**Cloud Storage** (requires plugin):
```bash
# Install plugin (example: AWS EBS)
docker plugin install rexray/ebs

# Use in volume
docker volume create --driver rexray/ebs mydata
```

## Bind Mounts

Direct mapping of host filesystem paths into containers.

### Basic Bind Mounts

```bash
# Absolute path (Linux/macOS)
docker run -v /host/path:/container/path myapp

# Absolute path (Windows)
docker run -v C:\host\path:/container/path myapp

# Relative path (relative to current directory)
docker run -v $(pwd)/src:/app/src myapp

# Read-only bind mount
docker run -v $(pwd)/config:/app/config:ro myapp
```

### Development Workflow

```bash
# Live code reload during development
docker run -d -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  myapp:dev
```

### Docker Compose Bind Mounts

```yaml
services:
  web:
    build: .
    volumes:
      # Relative path bind mount
      - ./src:/app/src

      # Absolute path bind mount
      - /host/config:/app/config

      # Read-only bind mount
      - ./nginx.conf:/etc/nginx/nginx.conf:ro

      # Bind mount with specific options
      - type: bind
        source: ./src
        target: /app/src
        read_only: false
```

### Bind Mount Options

```yaml
services:
  web:
    volumes:
      - type: bind
        source: ./app
        target: /app
        bind:
          propagation: shared  # rprivate, private, shared, slave, rslave
        consistency: cached    # consistent, cached, delegated (macOS)
```

**Consistency modes** (macOS/Windows only):
- `consistent`: Perfect consistency (slow)
- `cached`: Host authoritative (faster reads)
- `delegated`: Container authoritative (faster writes)

### Anonymous Volumes

Prevent bind mount from overwriting container data:

```yaml
services:
  web:
    volumes:
      - ./src:/app/src           # Bind mount source code
      - /app/node_modules        # Anonymous volume (preserves node_modules)
```

This prevents host's empty `node_modules` from overwriting container's.

## tmpfs Mounts

In-memory storage. Data lost when container stops.

### Using tmpfs

```bash
# Create tmpfs mount
docker run --tmpfs /tmp myapp

# With size limit
docker run --tmpfs /tmp:size=100m myapp

# With options
docker run --tmpfs /tmp:rw,noexec,nosuid,size=100m myapp
```

### Docker Compose tmpfs

```yaml
services:
  web:
    tmpfs:
      - /tmp
      - /run

    # With options
    tmpfs:
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 100000000  # bytes
          mode: 1777       # permissions
```

### Use Cases for tmpfs

**Sensitive data**:
```yaml
services:
  app:
    tmpfs:
      - /app/secrets:mode=700,size=10m
```

**Build cache**:
```yaml
services:
  builder:
    tmpfs:
      - /tmp/build-cache:size=1g
```

**Session storage**:
```yaml
services:
  web:
    tmpfs:
      - /app/sessions:size=100m
```

## Volume Management

### List Volumes

```bash
# List all volumes
docker volume ls

# Filter volumes
docker volume ls --filter dangling=true
docker volume ls --filter name=postgres
docker volume ls --filter label=env=production
```

### Inspect Volume

```bash
docker volume inspect mydata

# Output:
# [
#     {
#         "Driver": "local",
#         "Labels": {},
#         "Mountpoint": "/var/lib/docker/volumes/mydata/_data",
#         "Name": "mydata",
#         "Options": {},
#         "Scope": "local"
#     }
# ]
```

### Remove Volumes

```bash
# Remove specific volume
docker volume rm mydata

# Remove multiple volumes
docker volume rm vol1 vol2 vol3

# Remove all unused volumes
docker volume prune

# Remove all volumes (dangerous!)
docker volume rm $(docker volume ls -q)
```

### Volume Cleanup

```bash
# Remove dangling volumes (not used by any container)
docker volume prune

# Remove all unused volumes (not just dangling)
docker volume prune -a

# Force remove without confirmation
docker volume prune -f
```

## Backup and Restore

### Backup Named Volume

```bash
# Backup volume to tar.gz
docker run --rm \
  -v mydata:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/mydata-backup.tar.gz -C /data .

# With timestamp
docker run --rm \
  -v mydata:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/mydata-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

### Restore Volume from Backup

```bash
# Restore from tar.gz
docker run --rm \
  -v mydata:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/mydata-backup.tar.gz -C /data

# Create new volume and restore
docker volume create mydata-restored
docker run --rm \
  -v mydata-restored:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/mydata-backup.tar.gz -C /data
```

### Backup Database Volume

**PostgreSQL**:
```bash
# Backup PostgreSQL data
docker run --rm \
  -v postgres_data:/var/lib/postgresql/data \
  -v $(pwd):/backup \
  postgres:15-alpine \
  tar czf /backup/postgres-backup.tar.gz -C /var/lib/postgresql/data .

# Better: Use pg_dump
docker exec postgres pg_dump -U user dbname > backup.sql

# Restore
docker exec -i postgres psql -U user dbname < backup.sql
```

**MongoDB**:
```bash
# Backup MongoDB data
docker exec mongodb mongodump --out /backup

# Restore MongoDB data
docker exec mongodb mongorestore /backup
```

**MySQL**:
```bash
# Backup MySQL data
docker exec mysql mysqldump -u root -p dbname > backup.sql

# Restore MySQL data
docker exec -i mysql mysql -u root -p dbname < backup.sql
```

### Copy Data Between Volumes

```bash
# Copy from one volume to another
docker run --rm \
  -v source_volume:/source \
  -v target_volume:/target \
  alpine \
  sh -c "cp -av /source/. /target/"
```

### Migrate Volume to Another Host

```bash
# On source host: backup volume
docker run --rm \
  -v mydata:/data \
  alpine \
  tar czf - /data > mydata.tar.gz

# Transfer to target host (scp, rsync, etc.)
scp mydata.tar.gz user@target-host:/tmp/

# On target host: create volume and restore
docker volume create mydata
docker run --rm \
  -v mydata:/data \
  -v /tmp:/backup \
  alpine \
  tar xzf /backup/mydata.tar.gz -C /
```

## Common Patterns

### Development Setup

```yaml
version: '3.8'

services:
  web:
    build: .
    volumes:
      # Source code (live reload)
      - ./src:/app/src
      - ./public:/app/public

      # Preserve node_modules
      - node_modules:/app/node_modules

      # Configuration
      - ./config:/app/config:ro

volumes:
  node_modules:
```

### Production Setup

```yaml
version: '3.8'

services:
  web:
    image: myapp:1.0
    volumes:
      # Persistent data only
      - uploads:/app/uploads
      - logs:/app/logs

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  uploads:
    driver: local
  logs:
    driver: local
  postgres_data:
    driver: local
```

### Shared Volume Between Services

```yaml
services:
  web:
    volumes:
      - shared_data:/app/data

  worker:
    volumes:
      - shared_data:/app/data

  backup:
    volumes:
      - shared_data:/backup/source:ro

volumes:
  shared_data:
```

### Multi-Environment Volumes

**Development** (compose.override.yml):
```yaml
services:
  web:
    volumes:
      - ./src:/app/src
```

**Production** (compose.prod.yml):
```yaml
services:
  web:
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs

volumes:
  uploads:
    driver: rexray/ebs
  logs:
    driver: local
```

## Troubleshooting

### Permission Issues

```bash
# Check volume permissions
docker run --rm -v mydata:/data alpine ls -la /data

# Fix permissions
docker run --rm -v mydata:/data alpine chown -R 1000:1000 /data

# Run container as specific user
docker run --user 1000:1000 -v mydata:/data myapp
```

### Volume Not Mounting

```bash
# Verify volume exists
docker volume ls | grep mydata

# Inspect volume
docker volume inspect mydata

# Check container mounts
docker inspect container_name | grep Mounts -A 20

# Recreate volume
docker volume rm mydata
docker volume create mydata
```

### Volume is Full

```bash
# Check volume size
docker exec container_name df -h /data

# Find large files
docker exec container_name du -sh /data/*

# Clean up files
docker exec container_name rm -rf /data/old-logs/*
```

### Cannot Delete Volume

```bash
# Check which containers use volume
docker ps -a --filter volume=mydata

# Stop and remove containers
docker stop container_name
docker rm container_name

# Then remove volume
docker volume rm mydata
```

## Security Best Practices

1. **Read-only mounts** - Use `:ro` for configuration files
2. **Minimize bind mounts** - Use named volumes when possible
3. **Sensitive data** - Use tmpfs for secrets and passwords
4. **File permissions** - Set appropriate permissions on volumes
5. **Volume drivers** - Use encrypted volume drivers for sensitive data
6. **Regular backups** - Automate volume backups
7. **Access control** - Limit which containers can access volumes
8. **Volume labels** - Tag volumes for easier management
9. **Cleanup unused** - Regularly prune unused volumes
10. **Audit access** - Monitor volume access in production

## Best Practices

1. **Named volumes for data** - Always use named volumes for persistent data
2. **Bind mounts for development** - Use bind mounts for live code reload
3. **Anonymous volumes** - Prevent bind mounts from overwriting data
4. **Read-only when possible** - Mark configuration files as read-only
5. **Backup regularly** - Automate volume backups
6. **Version backups** - Keep multiple backup versions
7. **Test restores** - Regularly test backup restoration
8. **Document volumes** - Maintain documentation of volume purposes
9. **Use tmpfs for secrets** - Store sensitive data in memory
10. **Clean up volumes** - Remove unused volumes to free disk space
