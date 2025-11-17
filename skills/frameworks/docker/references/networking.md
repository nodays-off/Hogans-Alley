# Docker Networking

Complete guide to Docker networking modes, container communication, and port publishing.

## Table of Contents

- [Network Drivers](#network-drivers)
- [Container Communication](#container-communication)
- [Port Publishing](#port-publishing)
- [Network Management](#network-management)
- [Common Patterns](#common-patterns)

## Network Drivers

Docker supports multiple network drivers for different use cases.

### Bridge Network (Default)

Default network driver. Containers on same bridge network can communicate.

```bash
# Create custom bridge network
docker network create my-bridge

# Run containers on bridge network
docker run -d --name web --network my-bridge nginx
docker run -d --name api --network my-bridge node-app

# Containers can communicate via container name
# web can access: http://api:3000
```

**Characteristics**:
- Isolated from other networks
- Built-in DNS resolution (use container names as hostnames)
- Best for single-host applications
- Default for Docker Compose

**Use cases**:
- Multi-container applications on single host
- Development environments
- Isolated application stacks

### Host Network

Removes network isolation. Container uses host's network directly.

```bash
docker run --network host nginx
```

**Characteristics**:
- No port mapping needed (uses host ports directly)
- Best network performance
- No network isolation
- Container port conflicts with host ports

**Use cases**:
- High-performance networking requirements
- Containers needing direct access to host network
- Monitoring or network tools

**Warning**: Security risk - container has full network access

### None Network

Disables networking completely.

```bash
docker run --network none alpine
```

**Characteristics**:
- No network interfaces except loopback
- Complete network isolation
- Maximum security

**Use cases**:
- Batch processing jobs
- Applications that don't need network
- Security-sensitive workloads

### Overlay Network

Multi-host networking for Docker Swarm.

```bash
docker network create --driver overlay my-overlay
```

**Characteristics**:
- Spans multiple Docker hosts
- Encrypted by default
- Requires Docker Swarm or Kubernetes
- Enables service discovery across hosts

**Use cases**:
- Multi-host deployments
- Docker Swarm services
- Distributed applications

### MACVLAN Network

Assigns MAC address to container, making it appear as physical device on network.

```bash
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 my-macvlan
```

**Characteristics**:
- Container appears as physical device
- Gets IP from physical network
- Direct layer 2 access
- No port mapping needed

**Use cases**:
- Legacy applications expecting physical network
- Network monitoring tools
- Applications requiring specific MAC addresses

## Container Communication

### DNS Resolution

Containers on same custom bridge network can resolve each other by name.

```bash
# Create network
docker network create app-network

# Start database
docker run -d --name postgres --network app-network postgres:15-alpine

# Start application (can connect to postgres:5432)
docker run -d --name web --network app-network \
  -e DATABASE_URL=postgresql://user:pass@postgres:5432/db \
  myapp:1.0
```

**Important**: Default bridge network does NOT support DNS resolution (use custom bridge).

### Container Links (Legacy)

Old method of linking containers. Use custom networks instead.

```bash
# Legacy (avoid)
docker run -d --name db postgres
docker run -d --link db:database web

# Modern (recommended)
docker network create my-network
docker run -d --name db --network my-network postgres
docker run -d --name web --network my-network web
```

### Network Aliases

Assign additional hostnames to containers.

```bash
docker run -d --name db --network app-network \
  --network-alias database \
  --network-alias postgres \
  postgres:15-alpine

# Now accessible as: db, database, or postgres
```

In Docker Compose:
```yaml
services:
  db:
    image: postgres:15-alpine
    networks:
      app-network:
        aliases:
          - database
          - postgres

networks:
  app-network:
```

### Connect Container to Multiple Networks

```bash
docker network create frontend
docker network create backend

# Web server on both networks
docker run -d --name web \
  --network frontend \
  nginx

docker network connect backend web
```

In Docker Compose:
```yaml
services:
  web:
    networks:
      - frontend
      - backend

  api:
    networks:
      - backend

  db:
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true  # No internet access
```

## Port Publishing

### Basic Port Mapping

```bash
# Format: -p HOST_PORT:CONTAINER_PORT
docker run -p 8080:80 nginx

# Multiple ports
docker run -p 8080:80 -p 8443:443 nginx

# All interfaces
docker run -p 8080:80 nginx

# Specific interface
docker run -p 127.0.0.1:8080:80 nginx

# Random host port
docker run -P nginx  # Maps all EXPOSE ports to random high ports
```

### Port Ranges

```bash
# Map range of ports
docker run -p 8080-8090:8080-8090 myapp
```

### UDP Ports

```bash
# TCP (default)
docker run -p 8080:80/tcp nginx

# UDP
docker run -p 5353:53/udp dns-server

# Both TCP and UDP
docker run -p 8080:80/tcp -p 8080:80/udp myapp
```

### View Port Mappings

```bash
# List port mappings
docker ps

# Detailed port info
docker port myapp

# Output: 80/tcp -> 0.0.0.0:8080
```

### Docker Compose Port Mapping

```yaml
services:
  web:
    ports:
      - "8080:80"                    # Simple mapping
      - "127.0.0.1:8080:80"          # Bind to localhost
      - "8080-8090:8080-8090"        # Range
      - "8080:80/tcp"                # Explicit protocol
      - "5353:53/udp"                # UDP

    # Expose ports to other services (not to host)
    expose:
      - "3000"
      - "8080"
```

## Network Management

### Create Network

```bash
# Basic bridge network
docker network create my-network

# Bridge with custom subnet
docker network create --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  my-network

# Overlay network (Swarm)
docker network create --driver overlay my-overlay

# MACVLAN network
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 my-macvlan
```

### List Networks

```bash
docker network ls

# Output:
# NETWORK ID     NAME      DRIVER    SCOPE
# abc123         bridge    bridge    local
# def456         host      host      local
# ghi789         none      null      local
```

### Inspect Network

```bash
docker network inspect my-network

# Shows: subnet, gateway, connected containers, etc.
```

### Connect/Disconnect Containers

```bash
# Connect running container to network
docker network connect my-network myapp

# Connect with alias
docker network connect --alias db my-network postgres

# Connect with static IP
docker network connect --ip 172.20.0.10 my-network myapp

# Disconnect from network
docker network disconnect my-network myapp
```

### Remove Network

```bash
# Remove network (must disconnect all containers first)
docker network rm my-network

# Remove all unused networks
docker network prune
```

## Common Patterns

### Frontend-Backend Separation

Separate public-facing and internal services.

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - frontend
      - backend

  web:
    build: .
    networks:
      - backend
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No internet access
```

### Service Mesh Pattern

Multiple services communicating on same network.

```yaml
services:
  api-gateway:
    ports:
      - "80:80"
    networks:
      - service-mesh

  user-service:
    networks:
      - service-mesh

  product-service:
    networks:
      - service-mesh

  order-service:
    networks:
      - service-mesh

  database:
    networks:
      - database-only

  user-service:
    networks:
      - service-mesh
      - database-only

networks:
  service-mesh:
  database-only:
    internal: true
```

### Reverse Proxy Pattern

Single entry point for multiple backend services.

```yaml
services:
  proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - proxy-network
    depends_on:
      - app1
      - app2

  app1:
    build: ./app1
    networks:
      - proxy-network

  app2:
    build: ./app2
    networks:
      - proxy-network

networks:
  proxy-network:
    internal: true
```

**nginx.conf**:
```nginx
http {
    upstream app1 {
        server app1:3000;
    }

    upstream app2 {
        server app2:4000;
    }

    server {
        listen 80;

        location /app1/ {
            proxy_pass http://app1/;
        }

        location /app2/ {
            proxy_pass http://app2/;
        }
    }
}
```

### Multi-Tier Application

Layered architecture with network segmentation.

```yaml
services:
  # Presentation tier
  web:
    ports:
      - "80:80"
    networks:
      - presentation

  # Application tier
  api:
    networks:
      - presentation
      - application

  worker:
    networks:
      - application

  # Data tier
  database:
    networks:
      - data

  cache:
    networks:
      - data

  # Bridge tiers
  api:
    networks:
      - application
      - data

networks:
  presentation:
  application:
    internal: true
  data:
    internal: true
```

## Troubleshooting

### Cannot Connect Between Containers

```bash
# Check if containers are on same network
docker inspect container1 | grep NetworkID
docker inspect container2 | grep NetworkID

# Verify DNS resolution
docker exec container1 ping container2

# Check firewall rules
docker exec container1 curl container2:port

# Verify network configuration
docker network inspect my-network
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8080          # macOS/Linux
netstat -ano | find "8080"  # Windows

# Use different host port
docker run -p 8081:80 nginx

# Stop conflicting container
docker ps
docker stop container-name
```

### DNS Resolution Not Working

Default bridge network doesn't support DNS. Solution:

```bash
# Create custom bridge network
docker network create my-network

# Run containers on custom network
docker run --network my-network --name db postgres
docker run --network my-network --name web myapp
```

### Network Isolation Issues

```bash
# Check if network is internal (no internet)
docker network inspect my-network | grep internal

# Connect to external network
docker network connect bridge myapp

# Verify connectivity
docker exec myapp ping 8.8.8.8
```

## Security Best Practices

1. **Use custom networks** - Don't rely on default bridge
2. **Network segmentation** - Separate frontend/backend/data tiers
3. **Internal networks** - Use `internal: true` for backend networks
4. **Minimal exposure** - Only publish necessary ports
5. **Bind to localhost** - Use `127.0.0.1:port` for local-only services
6. **No host network** - Avoid `--network host` unless necessary
7. **Firewall rules** - Configure host firewall properly
8. **Encrypted overlay** - Use encrypted overlay for multi-host
9. **Network policies** - Implement network policies in orchestrators
10. **Monitor traffic** - Log and monitor network connections

## Best Practices

1. **Custom bridge networks** - Always create custom networks (not default bridge)
2. **DNS resolution** - Use container names as hostnames
3. **Network aliases** - Provide meaningful aliases for services
4. **Multiple networks** - Connect containers to multiple networks when needed
5. **Internal networks** - Mark backend networks as internal
6. **Explicit ports** - Document all exposed ports
7. **Localhost binding** - Bind development ports to localhost only
8. **Network cleanup** - Regularly prune unused networks
9. **Inspect regularly** - Use `docker network inspect` to verify configuration
10. **Document networking** - Maintain network diagram for complex setups
