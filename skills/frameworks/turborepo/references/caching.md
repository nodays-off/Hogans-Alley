# Caching Strategies

Deep dive into Turborepo's intelligent caching system.

## Table of Contents

- [How Caching Works](#how-caching-works)
- [Local Caching](#local-caching)
- [Remote Caching](#remote-caching)
- [Cache Keys](#cache-keys)
- [Cache Invalidation](#cache-invalidation)
- [Optimization Strategies](#optimization-strategies)
- [Debugging Cache Issues](#debugging-cache-issues)

## How Caching Works

Turborepo caches task outputs based on inputs:

1. **Calculate hash**: Based on file contents, dependencies, env vars
2. **Check cache**: Look for matching hash in local/remote cache
3. **Cache hit**: Restore outputs, skip execution
4. **Cache miss**: Execute task, store outputs

**Benefits:**
- Instant task completion from cache
- Share builds across team and CI
- Reduce redundant work
- Speed up development and deployment

## Local Caching

### Default Behavior

Enabled automatically for all tasks:

```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"],
      "cache": true  // Default
    }
  }
}
```

### Cache Location

```bash
# Default location
./node_modules/.cache/turbo

# Custom location
{
  "cacheDir": ".turbo"
}
```

### Cache Structure

```
node_modules/.cache/turbo/
├── <hash-1>.tar.zst    # Compressed task output
├── <hash-2>.tar.zst
└── meta.json           # Cache metadata
```

### Clear Local Cache

```bash
# Delete cache directory
rm -rf ./node_modules/.cache/turbo

# Force re-run (skip cache)
turbo run build --force
```

### Disable Caching

For specific tasks:

```json
{
  "pipeline": {
    "dev": {
      "cache": false  // Dev servers shouldn't cache
    }
  }
}
```

## Remote Caching

Share cache across team and CI.

### Setup with Vercel (Recommended)

**Step 1: Authenticate**
```bash
turbo login
```

**Step 2: Link repository**
```bash
turbo link
```

**Step 3: Run tasks**
```bash
turbo run build  # Automatically uses remote cache
```

### Custom Remote Cache

Create `.turbo/config.json`:

```json
{
  "teamid": "team_FkLNJjBQvXZSReVfqL4BQ2Ky",
  "apiurl": "https://cache.example.com",
  "token": "your-authentication-token"
}
```

### Remote Cache in CI/CD

**GitHub Actions:**
```yaml
- name: Build
  run: turbo run build
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**GitLab CI:**
```yaml
build:
  script:
    - turbo run build
  variables:
    TURBO_TOKEN: $TURBO_TOKEN
    TURBO_TEAM: $TURBO_TEAM
```

### Benefits of Remote Caching

1. **Team collaboration**: Share builds across developers
2. **CI acceleration**: Skip builds already done locally
3. **Consistent builds**: Same inputs = same outputs
4. **Cost reduction**: Less compute time in CI
5. **Faster onboarding**: New developers get cached builds

### Remote Cache Behavior

**Write to cache:**
```bash
# Runs task, writes to remote cache
turbo run build
```

**Read from cache:**
```bash
# If hash matches, restores from remote
turbo run build
# Output: "cache hit, replaying logs"
```

**Verify remote cache:**
```bash
turbo run build --output-logs=hash-only
# Shows: FULL TURBO (remote cache hit)
```

## Cache Keys

Cache key (hash) is calculated from:

### 1. File Inputs

**Default**: All tracked files in package directory

**Custom inputs:**
```json
{
  "build": {
    "inputs": ["src/**/*.ts", "!src/**/*.test.ts"]
  }
}
```

### 2. Task Configuration

Changes to `turbo.json` invalidate cache:
- Task `outputs`
- Task `dependsOn`
- Task `env`
- Any other task property

### 3. Environment Variables

**Specified in task:**
```json
{
  "build": {
    "env": ["NODE_ENV", "API_URL"]  // These affect cache key
  }
}
```

**Pass-through (don't affect cache):**
```json
{
  "build": {
    "passThroughEnv": ["DEBUG"]  // Available but doesn't affect hash
  }
}
```

### 4. Global Dependencies

```json
{
  "globalDependencies": [".env", "tsconfig.json"]
}
```

### 5. Package Dependencies

- Changes in `package.json` dependencies
- Changes in workspace dependencies
- Lock file changes (if included)

### 6. External Dependencies

- Outputs from dependency tasks (via `dependsOn`)
- Changes in internal package dependencies

## Cache Invalidation

Cache is invalidated when:

### Source Code Changes

```bash
# Edit src/index.ts
# Next build will be cache miss
turbo run build
```

### Dependencies Change

```bash
# Update package.json
npm install new-package

# Cache invalidated
turbo run build
```

### Environment Variables Change

```json
{
  "build": {
    "env": ["API_URL"]
  }
}
```

```bash
# Change API_URL
export API_URL=https://new-api.com

# Cache invalidated
turbo run build
```

### Global Dependencies Change

```bash
# Edit .env file (if in globalDependencies)
# All caches invalidated
turbo run build
```

### Task Configuration Change

```json
{
  "build": {
    "outputs": ["dist/**", "types/**"]  // Adding "types/**"
  }
}
```

## Optimization Strategies

### 1. Optimize Cache Outputs

**Good: Specific outputs**
```json
{
  "build": {
    "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
  }
}
```

**Bad: Too broad**
```json
{
  "build": {
    "outputs": ["**"]  // Caches everything, inefficient
  }
}
```

### 2. Use Proper Exclusions

```json
{
  "build": {
    "outputs": [
      ".next/**",
      "!.next/cache/**",      // Exclude Next.js internal cache
      "!.next/server/vendor-chunks/**"  // Exclude large vendor files
    ]
  }
}
```

### 3. Minimize Global Dependencies

```json
{
  "globalDependencies": [
    ".env",           // Only root .env
    // Don't include frequently changing files
  ]
}
```

### 4. Use Input Patterns

```json
{
  "build": {
    "inputs": [
      "src/**/*.ts",
      "src/**/*.tsx",
      "!src/**/*.test.ts",    // Exclude tests
      "!src/**/*.stories.tsx" // Exclude stories
    ]
  }
}
```

### 5. Separate Dev and Build Tasks

```json
{
  "dev": {
    "cache": false,          // Don't cache dev servers
    "persistent": true
  },
  "build": {
    "cache": true,           // Cache production builds
    "outputs": ["dist/**"]
  }
}
```

### 6. Cache Size Management

```json
{
  "cacheDir": ".turbo",
  "cacheSize": "50gb"  // Limit cache size
}
```

### 7. Use Remote Cache in CI

```yaml
# Always enable in CI
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

## Debugging Cache Issues

### Check Cache Status

**Dry run:**
```bash
turbo run build --dry-run

# Shows:
# - Tasks to run
# - Cache status (HIT/MISS)
# - Dependencies
```

**JSON output:**
```bash
turbo run build --dry-run=json > analysis.json
```

### Identify Cache Misses

**Check hash:**
```bash
turbo run build --output-logs=hash-only

# Shows:
# - Cache hash
# - Cache hit/miss status
# - Where cache was found (local/remote)
```

### Debug Hash Differences

**Compare runs:**
```bash
# First run
turbo run build --dry-run=json > run1.json

# Change something
# Second run
turbo run build --dry-run=json > run2.json

# Compare hashes
diff run1.json run2.json
```

### Common Cache Miss Causes

**1. Environment variable changes:**
```bash
# Check current env vars
env | grep NODE_ENV
env | grep API_URL
```

**2. Unstable file modifications:**
```bash
# Check for files with changing timestamps
git status
git diff
```

**3. Non-deterministic builds:**
- Generated timestamps in output
- Random values in builds
- Machine-specific paths

**Fix:** Ensure builds are deterministic

**4. Missing outputs configuration:**
```json
{
  "build": {
    "outputs": ["dist/**"]  // Make sure all outputs are listed
  }
}
```

### Verify Cache Contents

```bash
# List cached items
ls -lh node_modules/.cache/turbo/

# Extract cache to inspect
tar -xzf node_modules/.cache/turbo/<hash>.tar.zst
```

### Force Cache Refresh

```bash
# Clear cache
rm -rf node_modules/.cache/turbo

# Force rebuild
turbo run build --force

# Verify new cache
turbo run build  # Should be instant
```

## Performance Metrics

### Measure Cache Effectiveness

**Cache hit rate:**
```bash
# Track hits vs misses over time
turbo run build --output-logs=hash-only
```

**Time savings:**
```bash
# Without cache
time turbo run build --force

# With cache
time turbo run build
```

**Remote cache usage:**
```bash
# Check remote cache stats in Vercel dashboard
# or custom analytics
```

### Benchmarking

```bash
# Benchmark cache performance
hyperfine \
  'turbo run build --force' \
  'turbo run build'
```

## Best Practices

1. **Always use remote cache**: Enable for all team members and CI
2. **Specify outputs explicitly**: Don't rely on defaults
3. **Exclude internal caches**: Use `!` patterns for framework caches
4. **List env vars that matter**: Only include vars that affect output
5. **Keep builds deterministic**: Avoid timestamps, random values
6. **Monitor cache hit rate**: Track effectiveness over time
7. **Use pass-through for debug vars**: Don't invalidate cache for logging
8. **Limit global dependencies**: Only critical root files
9. **Test cache locally first**: Verify before enabling in CI
10. **Document cache behavior**: Help team understand what affects cache

## Cache Troubleshooting Checklist

- [ ] Check `turbo.json` configuration
- [ ] Verify `outputs` includes all build artifacts
- [ ] Check environment variables (`env` vs `passThroughEnv`)
- [ ] Review `globalDependencies`
- [ ] Ensure builds are deterministic
- [ ] Verify remote cache authentication
- [ ] Check cache directory permissions
- [ ] Review file input patterns
- [ ] Inspect cache with `--dry-run`
- [ ] Compare hashes between runs
