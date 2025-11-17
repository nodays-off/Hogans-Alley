# Docker Compose Reference

Complete guide for Docker Compose including file structure, commands, and multi-environment configurations.

## Table of Contents

- [Compose File Structure](#compose-file-structure)
- [Service Configuration](#service-configuration)
- [Compose Commands](#compose-commands)
- [Multi-Environment Setup](#multi-environment-setup)
- [Advanced Patterns](#advanced-patterns)

## Compose File Structure

### Basic Structure

```yaml
version: '3.8'

services:
  # Service definitions
  web:
    build: .
    ports:
      - "3000:3000"

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  # Named volume definitions
  postgres_data:

networks:
  # Network definitions
  app-network:
    driver: bridge
```

### Complete Example

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    image: myapp:latest
    container_name: myapp-web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src          # Development: live reload
      - node_modules:/app/node_modules
    networks:
      - frontend
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      start_period: 40s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:15-alpine
    container_name: myapp-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  node_modules:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

## Service Configuration

### Build Configuration

```yaml
services:
  web:
    build: .                    # Simple: use Dockerfile in current directory

    build:
      context: .                # Directory containing Dockerfile
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
        API_VERSION: v2
      target: production        # Multi-stage build target
      cache_from:
        - myapp:latest
```

### Image Configuration

```yaml
services:
  web:
    image: nginx:alpine         # Use existing image

  app:
    build: .
    image: myapp:latest         # Tag built image
```

### Port Mapping

```yaml
services:
  web:
    ports:
      - "8080:80"               # HOST:CONTAINER
      - "443:443"
      - "127.0.0.1:8080:80"     # Bind to specific interface
      - "8080-8090:8080-8090"   # Range of ports
```

### Environment Variables

```yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - DEBUG=false
      - API_KEY=${API_KEY}      # From host environment

    env_file:
      - .env                    # Load from file
      - .env.production
```

### Volumes

```yaml
services:
  web:
    volumes:
      # Named volume
      - app_data:/app/data

      # Bind mount (absolute path)
      - /host/path:/container/path

      # Bind mount (relative to compose file)
      - ./src:/app/src

      # Read-only
      - ./config:/app/config:ro

      # tmpfs (in-memory)
      - type: tmpfs
        target: /app/cache

volumes:
  app_data:
```

### Networks

```yaml
services:
  web:
    networks:
      - frontend
      - backend

  db:
    networks:
      backend:
        aliases:
          - database          # Additional hostname

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true            # No internet access
```

### Dependencies

```yaml
services:
  web:
    depends_on:
      - db                    # Simple dependency

    depends_on:
      db:
        condition: service_healthy    # Wait for health check
      redis:
        condition: service_started
```

### Health Checks

```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s           # Check every 30s
      timeout: 3s             # Timeout after 3s
      start_period: 40s       # Grace period on startup
      retries: 3              # Mark unhealthy after 3 failures

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Restart Policies

```yaml
services:
  web:
    restart: "no"             # Never restart (default)
    restart: always           # Always restart
    restart: on-failure       # Restart on non-zero exit
    restart: unless-stopped   # Always restart unless manually stopped
```

### Resource Limits

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '0.5'         # 50% of one CPU
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

    # Alternative syntax (Docker Compose v2.4+)
    mem_limit: 512m
    cpus: 0.5
```

### Logging

```yaml
services:
  web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"       # Rotate after 10MB
        max-file: "3"         # Keep 3 files

    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://logs.example.com:514"
```

## Compose Commands

### Starting Services

```bash
# Start all services
docker compose up

# Start in background (detached)
docker compose up -d

# Rebuild images before starting
docker compose up --build

# Force recreate containers
docker compose up --force-recreate

# Start specific services
docker compose up web db

# Scale specific service
docker compose up -d --scale web=3
```

### Stopping Services

```bash
# Stop all services (keeps containers)
docker compose stop

# Stop specific service
docker compose stop web

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes
docker compose down --volumes

# Stop and remove containers + images
docker compose down --rmi all
```

### Viewing Status

```bash
# List running services
docker compose ps

# List all services (including stopped)
docker compose ps -a

# View service logs
docker compose logs

# Follow logs
docker compose logs -f

# Follow logs for specific service
docker compose logs -f web

# View last 100 lines
docker compose logs --tail 100 web
```

### Executing Commands

```bash
# Execute command in service
docker compose exec web sh

# Execute as specific user
docker compose exec -u root web sh

# Execute without TTY
docker compose exec -T web npm test

# Run one-off command (creates new container)
docker compose run web npm test

# Run without dependencies
docker compose run --no-deps web npm test
```

### Managing Services

```bash
# Restart service
docker compose restart web

# Pause service
docker compose pause web

# Unpause service
docker compose unpause web

# Pull latest images
docker compose pull

# Build images
docker compose build

# Build without cache
docker compose build --no-cache
```

### Validation and Inspection

```bash
# Validate compose file
docker compose config

# View resolved configuration
docker compose config --services

# View images used by services
docker compose images

# View top processes
docker compose top
```

## Multi-Environment Setup

### Base Configuration (compose.yml)

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Development Overrides (compose.override.yml)

Automatically loaded in development:

```yaml
version: '3.8'

services:
  web:
    build:
      target: development
    volumes:
      - ./src:/app/src        # Live code reload
    environment:
      - NODE_ENV=development
      - DEBUG=true
    command: npm run dev

  db:
    ports:
      - "5432:5432"           # Expose for debugging
```

### Production Overrides (compose.prod.yml)

Explicitly loaded in production:

```yaml
version: '3.8'

services:
  web:
    image: registry.example.com/myapp:1.0
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  db:
    restart: always
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}  # From secrets
```

### Using Multiple Files

```bash
# Development (automatic)
docker compose up

# Production (explicit)
docker compose -f compose.yml -f compose.prod.yml up -d

# Testing (explicit)
docker compose -f compose.yml -f compose.test.yml run web npm test
```

### Environment-Specific .env Files

**.env.development**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/dev
API_KEY=dev-key-123
DEBUG=true
```

**.env.production**:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-db:5432/app
API_KEY=${SECRET_API_KEY}
DEBUG=false
```

Load specific env file:
```bash
docker compose --env-file .env.production up -d
```

## Advanced Patterns

### Service Profiles

Enable/disable services based on profiles:

```yaml
services:
  web:
    build: .

  db:
    image: postgres:15-alpine
    profiles:
      - full-stack          # Only starts with --profile

  redis:
    image: redis:7-alpine
    profiles:
      - full-stack
```

Usage:
```bash
# Start only web
docker compose up

# Start web, db, redis
docker compose --profile full-stack up
```

### Service Dependencies with Health Checks

```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
```

### Sharing Configuration with Anchors

```yaml
x-common-config: &common
  restart: unless-stopped
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"

services:
  web:
    <<: *common               # Reuse common config
    build: .

  api:
    <<: *common
    build: ./api
```

### Named Volumes with Drivers

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/data/postgres

  nfs_data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=10.0.0.1,rw
      device: ":/path/to/dir"
```

### External Networks and Volumes

```yaml
services:
  web:
    networks:
      - shared-network

networks:
  shared-network:
    external: true            # Use existing network

volumes:
  shared-data:
    external: true            # Use existing volume
```

### Custom Network Configuration

```yaml
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1

  backend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: br-backend
```

## Common Use Cases

### Full-Stack Application

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Microservices

```yaml
version: '3.8'

services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "80:80"
    depends_on:
      - user-service
      - product-service

  user-service:
    build: ./services/user
    networks:
      - backend

  product-service:
    build: ./services/product
    networks:
      - backend

  db:
    image: postgres:15-alpine
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

## Best Practices

1. **Use specific versions** - Pin image versions for reproducibility
2. **Health checks** - Always add health checks for critical services
3. **Named volumes** - Use named volumes for persistent data
4. **Environment files** - Keep secrets in .env (not in compose.yml)
5. **Resource limits** - Set memory and CPU limits for production
6. **Restart policies** - Use `unless-stopped` or `always` for production
7. **Multi-environment** - Use override files for different environments
8. **Service dependencies** - Use `depends_on` with health check conditions
9. **Network segmentation** - Separate frontend and backend networks
10. **Logging configuration** - Configure log rotation to prevent disk fills
