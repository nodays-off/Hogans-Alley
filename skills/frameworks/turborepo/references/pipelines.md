# Task Pipelines and Dependencies

Advanced patterns for orchestrating tasks in Turborepo.

## Table of Contents

- [Pipeline Basics](#pipeline-basics)
- [Dependency Patterns](#dependency-patterns)
- [Execution Order](#execution-order)
- [Parallel Execution](#parallel-execution)
- [Common Patterns](#common-patterns)
- [Advanced Use Cases](#advanced-use-cases)
- [Performance Optimization](#performance-optimization)

## Pipeline Basics

A pipeline defines how tasks are executed across your monorepo.

### Simple Pipeline

```json
{
  "pipeline": {
    "build": {},
    "test": {},
    "lint": {}
  }
}
```

**Result**: All tasks run independently, no ordering

### Pipeline with Dependencies

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Result**: Dependencies' build → own build → own test

## Dependency Patterns

### Topological Dependencies (^)

**Pattern**: `^taskName`

**Meaning**: Run this task in all dependencies first

```json
{
  "build": {
    "dependsOn": ["^build"]
  }
}
```

**Example scenario:**
```
packages/
├── ui/           # No dependencies
├── utils/        # No dependencies
└── app/          # Depends on ui and utils

# Running: turbo run build --filter=app

Execution order:
1. ui:build (dependency)
2. utils:build (dependency)
3. app:build (current package)
```

### Regular Dependencies

**Pattern**: `taskName`

**Meaning**: Run this task in the current package first

```json
{
  "deploy": {
    "dependsOn": ["build", "test"]
  }
}
```

**Example:**
```bash
# Running: turbo run deploy --filter=app

Execution order:
1. app:build
2. app:test
3. app:deploy
```

### Combined Dependencies

```json
{
  "test": {
    "dependsOn": ["^build", "lint"]
  }
}
```

**Meaning**:
1. Run dependencies' build tasks
2. Run own lint task
3. Run own test task

### Empty Dependencies

```json
{
  "lint": {
    "dependsOn": []
  }
}
```

**Meaning**: Can run immediately, no prerequisites

### No dependsOn (Implicit)

```json
{
  "lint": {}
}
```

**Meaning**: Same as empty array, runs independently

## Execution Order

### Sequential Execution

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "deploy": {
      "dependsOn": ["test"]
    }
  }
}
```

**Running**: `turbo run deploy`

**Order**:
1. All dependencies' builds
2. Current package build
3. Current package test
4. Current package deploy

### Parallel Execution

```json
{
  "pipeline": {
    "lint": {},
    "typecheck": {},
    "format": {}
  }
}
```

**Running**: `turbo run lint typecheck format`

**Result**: All three tasks run in parallel (no dependencies)

### Mixed Parallel and Sequential

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Running**: `turbo run test lint typecheck`

**Order**:
1. Parallel: lint, typecheck, and dependencies' build
2. Sequential: build
3. Sequential: test

## Parallel Execution

### Default Behavior

Turborepo runs tasks in parallel when possible:

```bash
# All independent builds run in parallel
turbo run build
```

### Controlling Concurrency

```bash
# Limit to 2 tasks at a time
turbo run build --concurrency=2

# Use percentage of CPU cores
turbo run build --concurrency=50%

# No limit (default)
turbo run build --concurrency=100%
```

### Persistent Tasks

Long-running tasks (dev servers):

```json
{
  "dev": {
    "cache": false,
    "persistent": true
  }
}
```

**Behavior**: Task keeps running, doesn't block other tasks

## Common Patterns

### Pattern 1: Standard Build Pipeline

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint"],
      "cache": false
    }
  }
}
```

**Use case**: Standard CI/CD pipeline

### Pattern 2: Development Workflow

```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {},
    "typecheck": {}
  }
}
```

**Use case**: Local development

### Pattern 3: Monorepo with Shared Libraries

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.tsbuildinfo"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

**Use case**: Apps depend on built libraries

### Pattern 4: Database Migrations

```json
{
  "pipeline": {
    "db:generate": {
      "cache": false
    },
    "build": {
      "dependsOn": ["^build", "db:generate"],
      "outputs": ["dist/**"]
    }
  }
}
```

**Use case**: Generate Prisma client before build

### Pattern 5: Code Generation

```json
{
  "pipeline": {
    "codegen": {
      "dependsOn": ["^build"],
      "outputs": ["generated/**"]
    },
    "build": {
      "dependsOn": ["^build", "codegen"],
      "outputs": ["dist/**"]
    }
  }
}
```

**Use case**: GraphQL codegen, OpenAPI generation

### Pattern 6: Multiple Build Targets

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "build:cjs": {
      "dependsOn": ["^build"],
      "outputs": ["dist/cjs/**"]
    },
    "build:esm": {
      "dependsOn": ["^build"],
      "outputs": ["dist/esm/**"]
    }
  }
}
```

**Use case**: Multiple output formats

### Pattern 7: Storybook Integration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "build-storybook": {
      "dependsOn": ["build"],
      "outputs": ["storybook-static/**"]
    },
    "storybook": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

**Use case**: Component documentation

## Advanced Use Cases

### Conditional Dependencies

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "e2e": {
      "dependsOn": ["build", "^build"],
      "outputs": []
    }
  }
}
```

**Use case**: E2E tests need all packages built

### Cross-Package Dependencies

```json
{
  "pipeline": {
    "integration-test": {
      "dependsOn": ["^build", "build"],
      "outputs": ["test-results/**"]
    }
  }
}
```

**Use case**: Integration tests across packages

### Environment-Specific Builds

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["NODE_ENV"]
    },
    "build:production": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["NODE_ENV", "API_URL", "CDN_URL"]
    }
  }
}
```

**Use case**: Different builds for different environments

### Pre/Post Hooks

```json
{
  "pipeline": {
    "prebuild": {
      "outputs": []
    },
    "build": {
      "dependsOn": ["^build", "prebuild"],
      "outputs": ["dist/**"]
    },
    "postbuild": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

**Use case**: Setup/cleanup tasks

### Workspace-Specific Overrides

```json
// Root turbo.json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}

// apps/web/turbo.json
{
  "extends": ["//"],
  "pipeline": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

**Use case**: Override configuration per package

## Performance Optimization

### Optimize Dependency Graph

**Before (sequential):**
```json
{
  "test": {
    "dependsOn": ["build"]
  },
  "lint": {
    "dependsOn": ["build"]
  }
}
```

**After (parallel):**
```json
{
  "build": {
    "dependsOn": ["^build"]
  },
  "test": {
    "dependsOn": ["build"]
  },
  "lint": {
    "dependsOn": ["^build"]  // Can run parallel with build
  }
}
```

### Minimize Dependencies

**Avoid:**
```json
{
  "lint": {
    "dependsOn": ["build"]  // Lint doesn't need build
  }
}
```

**Prefer:**
```json
{
  "lint": {
    "dependsOn": ["^build"]  // Only need dependencies built
  }
}
```

### Use Filters Effectively

```bash
# Only test affected packages
turbo run test --filter='...[origin/main]'

# Only build specific app and dependencies
turbo run build --filter='...web'

# Only run in changed packages
turbo run lint --filter='[HEAD^1]'
```

### Parallel Task Execution

```bash
# Run multiple independent tasks
turbo run lint typecheck format

# All run in parallel (no dependencies)
```

### Concurrency Tuning

```bash
# Find optimal concurrency
for i in 1 2 4 8 16; do
  echo "Testing with $i concurrent tasks"
  time turbo run build --concurrency=$i --force
done
```

## Debugging Pipelines

### Visualize Execution Order

```bash
# Dry run shows execution plan
turbo run build test --dry-run

# JSON output for analysis
turbo run build test --dry-run=json
```

### Check Task Dependencies

```bash
# See what tasks will run
turbo run deploy --dry-run

# Shows:
# - All tasks to execute
# - Execution order
# - Cache status
```

### Trace Execution

```bash
# Verbose output
turbo run build --output-logs=full

# See task timing
time turbo run build
```

## Best Practices

1. **Use topological dependencies** (`^build`) for package dependencies
2. **Use regular dependencies** for task ordering within package
3. **Keep pipelines simple**: Avoid complex dependency chains
4. **Run independent tasks in parallel**: Don't add unnecessary dependencies
5. **Cache when possible**: Only disable for dev servers and deploys
6. **Use filters in CI**: Only run affected tasks
7. **Test pipelines with dry-run**: Verify execution order
8. **Document complex pipelines**: Help team understand dependencies
9. **Optimize for common workflows**: Prioritize dev and build speed
10. **Monitor execution time**: Identify slow tasks and optimize

## Pipeline Examples

### Full-Stack Monorepo

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build", "^build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint"],
      "cache": false
    }
  }
}
```

### Component Library

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.tsbuildinfo"]
    },
    "build:watch": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "storybook": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["build"],
      "outputs": ["storybook-static/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Microservices

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build", "db:generate"],
      "outputs": ["dist/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test:integration": {
      "dependsOn": ["build", "^build"],
      "cache": false
    },
    "deploy": {
      "dependsOn": ["build", "test:integration"],
      "cache": false
    }
  }
}
```
