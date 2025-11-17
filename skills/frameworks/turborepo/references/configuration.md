# Turborepo Configuration Reference

Complete reference for `turbo.json` configuration options.

## Table of Contents

- [Basic Structure](#basic-structure)
- [Pipeline Configuration](#pipeline-configuration)
- [Task Properties](#task-properties)
- [Environment Variables](#environment-variables)
- [Global Dependencies](#global-dependencies)
- [Output Modes](#output-modes)
- [Advanced Options](#advanced-options)

## Basic Structure

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.json"],
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    // Task definitions
  }
}
```

**Top-level fields:**
- `$schema`: JSON schema for validation/autocomplete
- `globalDependencies`: Files that affect all tasks
- `globalEnv`: Environment variables that affect all tasks
- `pipeline`: Task definitions
- `cacheDir`: Custom cache directory (default: `.turbo`)
- `cacheSize`: Maximum cache size (e.g., "50gb")

## Pipeline Configuration

The `pipeline` object defines all tasks that can be run in your monorepo.

### Basic Task

```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Task with Dependencies

```json
{
  "pipeline": {
    "test": {
      "dependsOn": ["^build", "lint"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Task Properties

### `dependsOn`

Defines task execution order.

**Topological dependency (`^`):**
```json
{
  "build": {
    "dependsOn": ["^build"]  // Run all dependencies' build tasks first
  }
}
```

**Regular dependency:**
```json
{
  "deploy": {
    "dependsOn": ["build", "test"]  // Run own build and test first
  }
}
```

**Combined:**
```json
{
  "test": {
    "dependsOn": ["^build", "lint"]  // Deps' build, then own lint
  }
}
```

**Empty array (parallel):**
```json
{
  "lint": {
    "dependsOn": []  // Can run immediately, no dependencies
  }
}
```

### `outputs`

Files/directories to cache.

```json
{
  "build": {
    "outputs": [
      "dist/**",              // Include all files in dist
      ".next/**",             // Include .next directory
      "!.next/cache/**",      // Exclude .next/cache
      "*.tsbuildinfo"         // Include TypeScript build info
    ]
  }
}
```

**Common patterns:**
- `dist/**`: Build output directory
- `.next/**`, `!.next/cache/**`: Next.js (exclude cache)
- `build/**`: Create React App
- `coverage/**`: Test coverage
- `*.tsbuildinfo`: TypeScript incremental builds

**Empty array:**
```json
{
  "lint": {
    "outputs": []  // No cacheable outputs
  }
}
```

### `inputs`

Override input detection (advanced).

```json
{
  "build": {
    "inputs": [
      "src/**/*.ts",          // Only TypeScript files in src
      "!src/**/*.test.ts",    // Exclude test files
      "package.json"          // Include package.json
    ]
  }
}
```

**Default behavior**: All tracked files in package directory

### `cache`

Enable/disable caching.

```json
{
  "dev": {
    "cache": false  // Disable for dev servers
  },
  "build": {
    "cache": true   // Enable (default)
  }
}
```

### `persistent`

Keep task running (for dev servers).

```json
{
  "dev": {
    "cache": false,
    "persistent": true  // Don't exit when task completes
  }
}
```

### `env`

Environment variables that affect task output.

```json
{
  "build": {
    "env": [
      "NODE_ENV",
      "NEXT_PUBLIC_API_URL",
      "DATABASE_URL"
    ]
  }
}
```

**Note**: Changes to these env vars invalidate cache

### `passThroughEnv`

Environment variables to pass without affecting cache.

```json
{
  "build": {
    "passThroughEnv": [
      "DEBUG",          // Logging flags
      "CUSTOM_VAR"      // Runtime-only variables
    ]
  }
}
```

### `outputMode`

Control output display.

```json
{
  "build": {
    "outputMode": "full"        // Show all output
  },
  "dev": {
    "outputMode": "hash-only"   // Show cache hash only
  },
  "test": {
    "outputMode": "new-only"    // Show new output only
  },
  "lint": {
    "outputMode": "errors-only" // Show errors only
  }
}
```

**Options:**
- `full`: All output (default)
- `hash-only`: Only cache hash
- `new-only`: Only new output since last run
- `errors-only`: Only errors and warnings
- `none`: No output

## Environment Variables

### Global Environment Variables

Affect all tasks:

```json
{
  "globalEnv": ["NODE_ENV", "CI", "VERCEL"]
}
```

### Per-Task Environment Variables

Affect specific tasks:

```json
{
  "pipeline": {
    "build": {
      "env": ["NEXT_PUBLIC_API_URL"]
    },
    "deploy": {
      "env": ["DEPLOYMENT_TARGET", "AWS_REGION"]
    }
  }
}
```

### Pass-Through Variables

Available but don't affect cache:

```json
{
  "pipeline": {
    "build": {
      "env": ["NODE_ENV"],                    // Affects cache
      "passThroughEnv": ["DEBUG", "VERBOSE"]  // Doesn't affect cache
    }
  }
}
```

## Global Dependencies

Files that invalidate all caches when changed:

```json
{
  "globalDependencies": [
    ".env",
    ".env.local",
    "**/.env.*local",
    "tsconfig.json",
    "package-lock.json"
  ]
}
```

**Use for:**
- Environment files
- Global TypeScript configs
- Lock files (optional)
- Root-level configuration

## Output Modes

### Full Output

Show everything:
```json
{
  "build": {
    "outputMode": "full"
  }
}
```

### Hash Only

Minimal output:
```json
{
  "dev": {
    "outputMode": "hash-only"
  }
}
```

### New Output Only

Show only new output:
```json
{
  "test": {
    "outputMode": "new-only"
  }
}
```

### Errors Only

Show only errors:
```json
{
  "lint": {
    "outputMode": "errors-only"
  }
}
```

## Advanced Options

### Custom Cache Directory

```json
{
  "cacheDir": ".turbo",
  "cacheSize": "50gb"
}
```

### Extending Configurations

You can extend from another turbo.json (experimental):

```json
{
  "extends": ["//"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Complete Example

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    "**/.env.*local",
    "tsconfig.json"
  ],
  "globalEnv": [
    "NODE_ENV",
    "CI"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "*.tsbuildinfo"
      ],
      "env": [
        "NEXT_PUBLIC_API_URL",
        "DATABASE_URL"
      ],
      "outputMode": "full"
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "outputMode": "hash-only"
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "outputMode": "new-only"
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": [],
      "outputMode": "errors-only"
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint"],
      "cache": false
    }
  }
}
```

## Framework-Specific Configurations

### Next.js

```json
{
  "build": {
    "outputs": [".next/**", "!.next/cache/**"]
  },
  "dev": {
    "cache": false,
    "persistent": true
  }
}
```

### Vite

```json
{
  "build": {
    "outputs": ["dist/**"]
  },
  "dev": {
    "cache": false,
    "persistent": true
  }
}
```

### NuxtJS

```json
{
  "build": {
    "outputs": [".output/**", ".nuxt/**"]
  },
  "dev": {
    "cache": false,
    "persistent": true
  }
}
```

### TypeScript

```json
{
  "build": {
    "outputs": ["dist/**", "*.tsbuildinfo"]
  },
  "typecheck": {
    "dependsOn": ["^build"],
    "outputs": []
  }
}
```

### Prisma

```json
{
  "db:generate": {
    "cache": false
  },
  "db:push": {
    "cache": false
  }
}
```

## Validation

Turborepo validates your configuration at runtime. Common validation errors:

**Missing dependsOn task:**
```
Error: Task "test" depends on "^build", but "build" is not defined in pipeline
```

**Invalid output pattern:**
```
Error: Output pattern must not start with "../"
```

**Circular dependency:**
```
Error: Circular dependency detected: build -> test -> build
```

## Best Practices

1. **Use JSON schema**: Include `$schema` for autocomplete
2. **Define global dependencies**: Add files that affect all packages
3. **Cache only outputs**: Don't cache source files
4. **Exclude cache directories**: Use `!` pattern for Next.js cache
5. **Disable cache for dev**: Set `"cache": false` for dev servers
6. **Use persistent for servers**: Add `"persistent": true` for long-running tasks
7. **Specify environment variables**: List all env vars that affect output
8. **Use outputMode wisely**: Reduce noise with `errors-only` or `hash-only`
