# Docker Image Optimization

Advanced techniques for build caching, layer optimization, multi-platform builds, and CI/CD integration.

## Table of Contents

- [Build Caching](#build-caching)
- [Layer Optimization](#layer-optimization)
- [Image Size Reduction](#image-size-reduction)
- [Multi-Platform Builds](#multi-platform-builds)
- [CI/CD Integration](#cicd-integration)

## Build Caching

Docker caches layers to speed up builds. Understanding cache behavior is critical for fast builds.

### How Layer Caching Works

```dockerfile
FROM node:20-alpine        # Layer 1: Cached if same image
WORKDIR /app              # Layer 2: Cached if same instruction
COPY package*.json ./     # Layer 3: Cached if files unchanged
RUN npm install           # Layer 4: Cached if previous layers cached
COPY . .                  # Layer 5: Invalidated on code changes
```

**Key principle**: Cache invalidates at first changed layer, all subsequent layers rebuild.

### Optimal Cache Strategy

**Bad** (cache invalidated on any code change):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .                  # Copies everything, changes frequently
RUN npm install           # Rebuilds on every code change
```

**Good** (cache survives code changes):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./     # Only changes when dependencies change
RUN npm install           # Cached unless dependencies change
COPY . .                  # Code changes don't affect dependency layer
```

### BuildKit Cache

Docker BuildKit provides advanced caching features.

**Enable BuildKit**:
```bash
export DOCKER_BUILDKIT=1
docker build -t myapp .
```

**Cache from registry**:
```bash
# Build with cache from registry
docker build \
  --cache-from myapp:latest \
  -t myapp:1.0 .

# Push with cache
docker push myapp:1.0
```

**Inline cache** (stores cache in image):
```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t myapp:latest .
```

**External cache** (separate cache storage):
```bash
# Build with external cache
docker build \
  --cache-from type=registry,ref=myapp:buildcache \
  --cache-to type=registry,ref=myapp:buildcache,mode=max \
  -t myapp:1.0 .
```

**Mode options**:
- `mode=min`: Only cache final image layers (default)
- `mode=max`: Cache all layers including intermediate

### RUN --mount for Build Caching

Cache package manager downloads between builds:

```dockerfile
# Syntax for cache mounts
RUN --mount=type=cache,target=/root/.cache \
    pip install -r requirements.txt

RUN --mount=type=cache,target=/root/.npm \
    npm install

RUN --mount=type=cache,target=/go/pkg/mod \
    go build -o app .
```

**Benefits**:
- Package downloads cached across builds
- Faster builds when dependencies change
- Reduced bandwidth usage

### Secret Mounts

Mount secrets during build without leaving them in image:

```dockerfile
RUN --mount=type=secret,id=github_token \
    git config --global url."https://$(cat /run/secrets/github_token)@github.com/".insteadOf "https://github.com/"
```

Build with secret:
```bash
docker build --secret id=github_token,src=$HOME/.github-token -t myapp .
```

### SSH Agent Forwarding

Access private repositories during build:

```dockerfile
RUN --mount=type=ssh \
    git clone git@github.com:private/repo.git
```

Build with SSH:
```bash
docker build --ssh default -t myapp .
```

## Layer Optimization

Minimize layers and optimize layer size.

### Combining RUN Commands

**Bad** (multiple layers):
```dockerfile
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get clean
```

**Good** (single layer):
```dockerfile
RUN apt-get update && \
    apt-get install -y curl git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### Cleanup in Same Layer

**Bad** (cleanup in separate layer doesn't reduce image size):
```dockerfile
RUN apt-get update && apt-get install -y build-tools
RUN apt-get clean  # Doesn't reduce previous layer size!
```

**Good** (cleanup in same RUN):
```dockerfile
RUN apt-get update && \
    apt-get install -y build-tools && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### Package Manager Cleanup

**Alpine (apk)**:
```dockerfile
RUN apk add --no-cache curl git  # --no-cache prevents cache layer
```

**Debian/Ubuntu (apt)**:
```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

**Red Hat (yum/dnf)**:
```dockerfile
RUN yum install -y curl git && \
    yum clean all && \
    rm -rf /var/cache/yum
```

### Build Dependencies Pattern

Install, use, and remove build dependencies in single layer:

```dockerfile
RUN apk add --no-cache --virtual .build-deps \
        gcc \
        musl-dev \
        python3-dev && \
    pip install mypackage && \
    apk del .build-deps
```

## Image Size Reduction

Minimize final image size for faster deployment and lower storage costs.

### Use Minimal Base Images

| Base Image | Size | Use Case |
|-----------|------|----------|
| `scratch` | 0 MB | Static binaries (Go, Rust) |
| `alpine` | ~5 MB | Minimal Linux with package manager |
| `distroless` | ~20 MB | No shell, maximum security |
| `slim` | ~50 MB | Debian-based, fewer packages |
| Full OS | 100+ MB | Full-featured OS |

**Go with scratch**:
```dockerfile
FROM golang:1.21-alpine AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o app

FROM scratch
COPY --from=build /app/app /app
CMD ["/app"]
```

**Node.js with Alpine**:
```dockerfile
FROM node:20-alpine  # ~40MB vs node:20 (~350MB)
```

**Python with slim**:
```dockerfile
FROM python:3.11-slim  # ~50MB vs python:3.11 (~130MB)
```

### Multi-Stage Build for Size

Copy only production artifacts to final image:

```dockerfile
# Build stage: ~500MB with all tools
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage: ~40MB
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]
```

### .dockerignore for Smaller Context

Reduce build context size:

```
# Development files
node_modules
.git
.gitignore
.env
.env.local

# Documentation
README.md
docs/
*.md

# Test files
test/
*.test.js
coverage/

# Build artifacts
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# CI/CD
.github/
.gitlab-ci.yml
Jenkinsfile
```

### Audit Image Size

```bash
# View image size
docker image ls myapp

# View layer sizes
docker image history myapp:1.0

# Detailed analysis with dive
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest myapp:1.0
```

## Multi-Platform Builds

Build images for multiple architectures (amd64, arm64, etc.).

### Setup Buildx

```bash
# Check if buildx is available
docker buildx version

# Create new builder
docker buildx create --name mybuilder --use

# Bootstrap builder
docker buildx inspect --bootstrap
```

### Build for Multiple Platforms

```bash
# Build for amd64 and arm64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:1.0 \
  --push .

# Common platforms
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t myapp:1.0 \
  --push .
```

### Multi-Platform in Dockerfile

```dockerfile
# Use platform-specific base images
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
ARG TARGETPLATFORM
ARG BUILDPLATFORM

RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"

# Build for target platform
FROM node:20-alpine AS production
COPY --from=build /app/dist ./dist
```

### Platform-Specific Logic

```dockerfile
FROM alpine:3.19 AS base
ARG TARGETARCH

RUN if [ "$TARGETARCH" = "arm64" ]; then \
      echo "Installing ARM64-specific packages"; \
    elif [ "$TARGETARCH" = "amd64" ]; then \
      echo "Installing AMD64-specific packages"; \
    fi
```

### Build and Load Locally

```bash
# Build for local architecture and load
docker buildx build \
  --platform linux/amd64 \
  -t myapp:1.0 \
  --load .

# Can't load multiple platforms, use --push instead
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:1.0 \
  --push .
```

## CI/CD Integration

Optimize Docker builds in CI/CD pipelines.

### GitHub Actions

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: user/app:latest,user/app:${{ github.sha }}
          cache-from: type=registry,ref=user/app:buildcache
          cache-to: type=registry,ref=user/app:buildcache,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Run vulnerability scan
        uses: docker/scout-action@v1
        with:
          command: cves
          image: user/app:${{ github.sha }}
```

### GitLab CI

```yaml
docker-build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker buildx create --use
    - docker buildx build
        --cache-from $CI_REGISTRY_IMAGE:buildcache
        --cache-to type=registry,ref=$CI_REGISTRY_IMAGE:buildcache,mode=max
        --platform linux/amd64,linux/arm64
        --push
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
        --tag $CI_REGISTRY_IMAGE:latest
        .
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'myapp'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            steps {
                script {
                    docker.build(
                        "${DOCKER_IMAGE}:${DOCKER_TAG}",
                        "--cache-from ${DOCKER_IMAGE}:latest " +
                        "--build-arg BUILDKIT_INLINE_CACHE=1 ."
                    )
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").inside {
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    docker.withRegistry('https://registry.example.com', 'docker-credentials') {
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push('latest')
                    }
                }
            }
        }
    }
}
```

### CircleCI

```yaml
version: 2.1

orbs:
  docker: circleci/docker@2.2.0

workflows:
  build-and-push:
    jobs:
      - docker/publish:
          image: myapp
          tag: $CIRCLE_SHA1,latest
          dockerfile: Dockerfile
          cache_from: myapp:latest
          extra_build_args: --build-arg BUILDKIT_INLINE_CACHE=1
```

### Optimize CI/CD Builds

**1. Use layer caching**:
```yaml
# GitHub Actions
- uses: docker/build-push-action@v5
  with:
    cache-from: type=registry,ref=user/app:buildcache
    cache-to: type=registry,ref=user/app:buildcache,mode=max
```

**2. Parallel builds**:
```yaml
# Build multiple images in parallel
jobs:
  build-frontend:
    steps:
      - docker build -t frontend ./frontend

  build-backend:
    steps:
      - docker build -t backend ./backend
```

**3. Build only on changes**:
```yaml
# GitHub Actions - conditional build
- name: Check changes
  uses: dorny/paths-filter@v2
  id: changes
  with:
    filters: |
      frontend:
        - 'frontend/**'
      backend:
        - 'backend/**'

- name: Build frontend
  if: steps.changes.outputs.frontend == 'true'
  run: docker build -t frontend ./frontend
```

**4. Multi-stage for testing**:
```dockerfile
FROM base AS test
RUN npm test

FROM base AS production
COPY --from=build /app/dist ./dist
```

```bash
# In CI: Build and run tests
docker build --target test -t myapp:test .
docker run myapp:test

# Then build production
docker build --target production -t myapp:prod .
```

## Advanced Optimization Techniques

### Distroless Images

Google's distroless images contain only application and runtime dependencies.

```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=build /app /app
WORKDIR /app
CMD ["server.js"]
```

**Benefits**:
- Smaller size (~20MB)
- No shell (improved security)
- No package manager
- Minimal attack surface

### Static Binary Compilation

Compile fully static binaries for minimal images.

**Go**:
```dockerfile
FROM golang:1.21-alpine AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o app

FROM scratch
COPY --from=build /app/app /app
ENTRYPOINT ["/app"]
```

**Rust**:
```dockerfile
FROM rust:1.74 AS build
WORKDIR /app
COPY . .
RUN cargo build --release

FROM scratch
COPY --from=build /app/target/release/app /app
ENTRYPOINT ["/app"]
```

### Layer Squashing

Combine all layers into one (use sparingly).

```bash
# Experimental: squash layers
docker build --squash -t myapp .
```

**Note**: Loses cache benefits, use only for final distribution images.

## Best Practices Summary

1. **Order layers** - Least to most frequently changed
2. **Use BuildKit** - Enable for advanced caching
3. **Multi-stage builds** - Separate build and runtime
4. **Minimal base images** - Alpine, slim, or distroless
5. **Combine RUN commands** - Reduce layer count
6. **Cleanup in same layer** - Remove caches immediately
7. **.dockerignore** - Exclude unnecessary files
8. **Cache package installs** - Use --mount=type=cache
9. **Multi-platform** - Build for amd64 and arm64
10. **CI/CD caching** - Use registry cache in pipelines
11. **Scan regularly** - Check for vulnerabilities
12. **Audit with dive** - Analyze layer sizes
