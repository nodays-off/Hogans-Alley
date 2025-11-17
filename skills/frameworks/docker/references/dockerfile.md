# Dockerfile Reference

Complete reference for Dockerfile instructions, best practices, and optimization techniques.

## Table of Contents

- [Essential Instructions](#essential-instructions)
- [Multi-Stage Builds](#multi-stage-builds)
- [Layer Optimization](#layer-optimization)
- [Security Best Practices](#security-best-practices)
- [Build Arguments and Variables](#build-arguments-and-variables)
- [Language-Specific Examples](#language-specific-examples)

## Essential Instructions

### FROM

Defines the base image for the build. Always use specific versions for reproducibility.

```dockerfile
FROM node:20-alpine            # Recommended: specific version with minimal OS
FROM node:20.11.0-alpine3.19   # Even more specific: exact version
FROM node:latest               # Avoid: unpredictable, changes over time
```

**Best practices**:
- Use official images from Docker Hub
- Prefer Alpine variants for smaller size
- Use slim variants when Alpine lacks needed packages
- Pin exact versions for production

### WORKDIR

Sets the working directory for subsequent instructions. Creates directory if it doesn't exist.

```dockerfile
WORKDIR /app
# All subsequent COPY, RUN, CMD will execute in /app
```

**Best practices**:
- Use absolute paths
- Set early in Dockerfile
- Avoid using `RUN cd /some/path` (use WORKDIR instead)

### COPY

Copies files from build context to container filesystem.

```dockerfile
COPY package*.json ./              # Copy package files
COPY . .                           # Copy all files
COPY --chown=node:node . .         # Copy with ownership
COPY --from=build /app/dist ./dist # Copy from another stage
```

**Best practices**:
- Copy dependency files first (for layer caching)
- Copy application code last
- Use .dockerignore to exclude unnecessary files
- Set ownership with --chown when needed

### ADD

Similar to COPY but with additional features. Prefer COPY unless you need ADD's special features.

```dockerfile
ADD https://example.com/file.tar.gz /tmp/  # Download remote files
ADD archive.tar.gz /app/                    # Auto-extracts archives
```

**Best practices**:
- Use COPY for local files
- Use ADD only for auto-extraction or remote URLs
- Consider RUN curl/wget for better caching control

### RUN

Executes commands during build. Creates a new layer.

```dockerfile
RUN npm install                           # Simple command
RUN npm install && npm cache clean --force # Chained commands

# Multi-line for readability
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

**Best practices**:
- Chain related commands with && to reduce layers
- Clean up in same RUN command (apt cache, tmp files)
- Use multi-line format with backslashes for readability
- Order from least to most frequently changed

### ENV

Sets environment variables available during build and runtime.

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
ENV PATH=/app/bin:$PATH
```

**Best practices**:
- Use for application configuration
- Avoid sensitive data (use runtime secrets instead)
- Can be overridden at runtime with docker run -e

### ARG

Defines build-time variables (not available at runtime).

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

ARG BUILD_DATE
RUN echo "Built on ${BUILD_DATE}"
```

**Best practices**:
- Use for build configuration
- Can be set with docker build --build-arg
- Not available in final image (unlike ENV)

### EXPOSE

Documents which ports the container listens on. Does not publish ports.

```dockerfile
EXPOSE 3000
EXPOSE 8080/tcp
EXPOSE 8080/udp
```

**Best practices**:
- Document all ports your app uses
- Does not actually publish ports (use -p flag at runtime)
- Use for documentation and default port publishing

### USER

Sets the user for subsequent RUN, CMD, ENTRYPOINT instructions.

```dockerfile
USER node                       # Use existing user
USER 1001                       # Use by UID
USER node:node                  # User and group
```

**Best practices**:
- Always run as non-root in production
- Create custom user if needed
- Set after all privileged operations complete

### CMD

Specifies default command when container starts. Can be overridden at runtime.

```dockerfile
CMD ["node", "server.js"]              # Exec form (preferred)
CMD node server.js                     # Shell form
CMD ["npm", "start"]                   # Run npm script
```

**Best practices**:
- Use exec form (JSON array) to avoid shell
- Only one CMD per Dockerfile (last one wins)
- Can be overridden with docker run myimage custom-command

### ENTRYPOINT

Configures container to run as executable. Not easily overridden.

```dockerfile
ENTRYPOINT ["node", "server.js"]       # Exec form
ENTRYPOINT ["/docker-entrypoint.sh"]   # Custom entrypoint script
```

**Best practices**:
- Use for containers that should always run specific command
- Combine with CMD for default arguments
- Use exec form to properly handle signals

### ENTRYPOINT + CMD Pattern

Combine ENTRYPOINT and CMD for flexible configuration.

```dockerfile
ENTRYPOINT ["node"]
CMD ["server.js"]

# Run with default: docker run myimage
# → executes: node server.js

# Override CMD: docker run myimage app.js
# → executes: node app.js
```

### VOLUME

Creates mount point for external volumes.

```dockerfile
VOLUME ["/data"]
VOLUME /app/uploads
```

**Best practices**:
- Use for data that should persist
- Prefer named volumes at runtime over Dockerfile VOLUME
- Document expected volumes in README

### HEALTHCHECK

Defines health check command to test container health.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

HEALTHCHECK --interval=30s \
  CMD node healthcheck.js
```

**Best practices**:
- Always add health checks for production
- Test actual application functionality
- Set appropriate start-period for slow-starting apps
- Return exit code 0 for healthy, 1 for unhealthy

## Multi-Stage Builds

Multi-stage builds separate build environment from runtime environment, reducing image size and improving security.

### Basic Pattern

```dockerfile
# Stage 1: Build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]
```

### Benefits

- **Smaller final image**: No build tools in production image
- **Better security**: Fewer packages = smaller attack surface
- **Faster deployment**: Smaller images transfer faster
- **Cleaner separation**: Build and runtime environments isolated

### Advanced Pattern: Build Dependencies Only

```dockerfile
# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production dependencies only
FROM node:20-alpine AS production-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 4: Final production image
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

### Targeting Specific Stage

```bash
# Build only the build stage
docker build --target build -t myapp:build .

# Build production stage (default: last stage)
docker build -t myapp:prod .
```

## Layer Optimization

Docker caches layers. Order instructions from least to most frequently changed.

### Optimal Ordering

```dockerfile
# 1. Base image (rarely changes)
FROM node:20-alpine

# 2. System packages (rarely changes)
RUN apk add --no-cache curl

# 3. Working directory
WORKDIR /app

# 4. Dependency files (changes occasionally)
COPY package*.json ./

# 5. Install dependencies (changes occasionally)
RUN npm ci --only=production

# 6. Application code (changes frequently)
COPY . .

# 7. Runtime configuration
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

### Cache Busting Example

**Bad** (invalidates cache on any code change):
```dockerfile
COPY . .
RUN npm install
```

**Good** (cache survives code changes):
```dockerfile
COPY package*.json ./
RUN npm install
COPY . .
```

## Security Best Practices

### Run as Non-Root User

**Node.js** (using built-in node user):
```dockerfile
USER node
```

**Python** (create custom user):
```dockerfile
RUN adduser --disabled-password --gecos '' appuser
USER appuser
```

**Alpine Linux** (create custom user):
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### Use Minimal Base Images

| Base Image | Size | Use Case |
|-----------|------|----------|
| `alpine` | ~5MB | Minimal, most packages available |
| `slim` | ~50MB | Debian-based, fewer packages |
| `distroless` | ~20MB | No shell, maximum security |
| `scratch` | 0MB | Compiled binaries only (Go, Rust) |

```dockerfile
FROM alpine:3.19                        # Minimal OS
FROM python:3.11-slim                   # Debian slim
FROM gcr.io/distroless/nodejs:20        # No shell
FROM scratch                            # No OS (Go binaries)
```

### Pin Specific Versions

```dockerfile
# Bad: unpredictable
FROM node:latest

# Better: major version
FROM node:20-alpine

# Best: exact version
FROM node:20.11.0-alpine3.19
```

### Don't Include Secrets

```dockerfile
# Bad: secrets in image
ARG API_KEY=secret123
ENV API_KEY=${API_KEY}

# Good: use runtime secrets
# Pass at runtime: docker run -e API_KEY=secret123 myapp
```

### Minimize Attack Surface

```dockerfile
# Install only needed packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Remove after use if only needed for build
RUN apk add --no-cache --virtual .build-deps gcc musl-dev && \
    pip install mypackage && \
    apk del .build-deps
```

### Scan for Vulnerabilities

```bash
# Using Docker Scout
docker scout cves myapp:1.0
docker scout recommendations myapp:1.0
```

## Build Arguments and Variables

### Build-Time Arguments

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

ARG BUILD_DATE
ARG GIT_COMMIT

LABEL build_date="${BUILD_DATE}"
LABEL git_commit="${GIT_COMMIT}"
```

Build with arguments:
```bash
docker build \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD) \
  -t myapp:1.0 .
```

### Environment Variables

```dockerfile
# Set defaults
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Use in commands
RUN echo "Node environment: ${NODE_ENV}"
```

Override at runtime:
```bash
docker run -e NODE_ENV=development -e PORT=8080 myapp:1.0
```

## Language-Specific Examples

### Java (Spring Boot with Maven)

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### PHP (Laravel)

```dockerfile
FROM php:8.2-fpm-alpine AS production
WORKDIR /app

# Install dependencies
RUN apk add --no-cache nginx composer

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql

# Copy application
COPY . .

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /app

USER www-data
EXPOSE 9000
CMD ["php-fpm"]
```

### .NET

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS production
WORKDIR /app
COPY --from=build /app/out .
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

### Ruby (Rails)

```dockerfile
FROM ruby:3.2-alpine AS build
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

FROM ruby:3.2-alpine AS production
WORKDIR /app
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY . .
RUN adduser -D rails
USER rails
EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]
```

## Best Practices Summary

1. **Use specific versions** - Never use `latest` in production
2. **Order matters** - Least to most frequently changed
3. **Multi-stage builds** - Separate build and runtime
4. **Run as non-root** - Always use USER directive
5. **Minimal base images** - Alpine, slim, or distroless
6. **Chain RUN commands** - Reduce layers
7. **Use .dockerignore** - Exclude unnecessary files
8. **Add health checks** - Enable container health monitoring
9. **Scan for vulnerabilities** - Use Docker Scout
10. **Document with labels** - Add metadata to images
