# Migration Guide

Guide for migrating to Turborepo from other monorepo tools.

## Table of Contents

- [Migration from Lerna](#migration-from-lerna)
- [Migration from Nx](#migration-from-nx)
- [Migration from Yarn Workspaces](#migration-from-yarn-workspaces)
- [Migration from Rush](#migration-from-rush)
- [General Migration Strategy](#general-migration-strategy)
- [Common Challenges](#common-challenges)

## Migration from Lerna

Lerna is a popular monorepo tool that Turborepo can replace or complement.

### Step 1: Install Turborepo

```bash
npm install turbo --save-dev
```

### Step 2: Convert Configuration

**Before (lerna.json):**
```json
{
  "packages": ["packages/*"],
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "publish": {
      "ignoreChanges": ["*.md"]
    }
  }
}
```

**After (turbo.json):**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Step 3: Update Package Scripts

**Before (package.json):**
```json
{
  "scripts": {
    "build": "lerna run build",
    "test": "lerna run test",
    "publish": "lerna publish"
  }
}
```

**After (package.json):**
```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "publish": "lerna publish"  // Keep Lerna for publishing
  }
}
```

### Step 4: Migrate Commands

| Lerna Command | Turborepo Equivalent |
|---------------|---------------------|
| `lerna run build` | `turbo run build` |
| `lerna run test --scope=pkg` | `turbo run test --filter=pkg` |
| `lerna run build --since main` | `turbo run build --filter='...[origin/main]'` |
| `lerna bootstrap` | `npm install` (use native workspaces) |
| `lerna publish` | Keep using Lerna or use Changesets |

### Step 5: Optional - Keep Lerna for Publishing

Turborepo handles builds, Lerna handles publishing:

```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "publish": "lerna publish",
    "version": "lerna version"
  }
}
```

### Complete Example

**Directory structure:**
```
my-monorepo/
├── packages/
│   ├── ui/
│   ├── utils/
│   └── app/
├── lerna.json          # Keep for publishing (optional)
├── turbo.json          # Add for builds
└── package.json
```

**package.json:**
```json
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "publish": "lerna publish"
  },
  "devDependencies": {
    "lerna": "^7.0.0",
    "turbo": "latest"
  }
}
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

## Migration from Nx

Nx is a powerful monorepo tool with different design principles.

### Key Differences

| Feature | Nx | Turborepo |
|---------|-----|-----------|
| Configuration | project.json + nx.json | turbo.json |
| Caching | Built-in | Built-in |
| Code generation | Built-in | Minimal |
| Plugins | Extensive | Minimal |
| Task graph | Implicit | Explicit |

### Step 1: Install Turborepo

```bash
npm install turbo --save-dev
```

### Step 2: Convert nx.json to turbo.json

**Before (nx.json):**
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

**After (turbo.json):**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

### Step 3: Migrate project.json

**Before (apps/web/project.json):**
```json
{
  "name": "web",
  "targets": {
    "build": {
      "executor": "@nrwl/next:build",
      "outputs": ["{projectRoot}/.next"],
      "options": {
        "outputPath": "dist/apps/web"
      }
    }
  }
}
```

**After (apps/web/package.json):**
```json
{
  "name": "web",
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start"
  }
}
```

**And in turbo.json:**
```json
{
  "pipeline": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

### Step 4: Update Commands

| Nx Command | Turborepo Equivalent |
|------------|---------------------|
| `nx run web:build` | `turbo run build --filter=web` |
| `nx run-many --target=build` | `turbo run build` |
| `nx affected --target=test` | `turbo run test --filter='...[origin/main]'` |
| `nx graph` | No direct equivalent |

### Step 5: Remove Nx-Specific Files

```bash
# Remove Nx configuration
rm nx.json
rm -rf tools/

# Remove project.json files (if using package.json)
find . -name "project.json" -delete
```

### Migration Checklist

- [ ] Install Turborepo
- [ ] Create turbo.json from nx.json
- [ ] Convert project.json to package.json scripts
- [ ] Update CI/CD scripts
- [ ] Test all tasks work with turbo
- [ ] Remove Nx dependencies (optional)
- [ ] Update documentation

## Migration from Yarn Workspaces

Simple migration if you're only using Yarn Workspaces without a task runner.

### Step 1: Install Turborepo

```bash
yarn add turbo --dev
```

### Step 2: Create turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

### Step 3: Update Root Scripts

**Before:**
```json
{
  "scripts": {
    "build": "yarn workspaces run build",
    "test": "yarn workspaces run test"
  }
}
```

**After:**
```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "dev": "turbo run dev"
  }
}
```

### Step 4: Keep Workspace Configuration

```json
{
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev"
  }
}
```

## Migration from Rush

Rush is Microsoft's monorepo manager.

### Step 1: Install Turborepo

```bash
npm install turbo --save-dev
```

### Step 2: Convert rush.json to turbo.json

**Before (rush.json):**
```json
{
  "projects": [
    {
      "packageName": "web",
      "projectFolder": "apps/web"
    }
  ]
}
```

**After (turbo.json + package.json workspaces):**
```json
// package.json
{
  "workspaces": ["apps/*", "packages/*"]
}

// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Step 3: Convert Commands

| Rush Command | Turborepo Equivalent |
|--------------|---------------------|
| `rush build` | `turbo run build` |
| `rush rebuild` | `turbo run build --force` |
| `rush test` | `turbo run test` |

## General Migration Strategy

Follow this approach for any tool:

### Phase 1: Assessment (1-2 days)

1. **Audit current setup:**
   - List all tasks (build, test, lint, etc.)
   - Document task dependencies
   - Identify cacheable outputs
   - Review CI/CD configuration

2. **Plan migration:**
   - Map old commands to Turborepo
   - Identify breaking changes
   - Plan rollout strategy

### Phase 2: Setup (1-2 days)

1. **Install Turborepo:**
```bash
npm install turbo --save-dev
```

2. **Create initial turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

3. **Test locally:**
```bash
turbo run build
turbo run test
```

### Phase 3: Parallel Run (1 week)

1. **Keep both systems:**
```json
{
  "scripts": {
    "build:old": "lerna run build",
    "build:new": "turbo run build",
    "build": "npm run build:new"
  }
}
```

2. **Compare results:**
```bash
# Run both, compare outputs
npm run build:old
npm run build:new
diff -r dist-old/ dist-new/
```

3. **Validate caching:**
```bash
# First run
turbo run build --force

# Second run (should be cached)
turbo run build
```

### Phase 4: CI/CD Integration (2-3 days)

1. **Update CI configuration:**
```yaml
# Before
- run: lerna run build

# After
- run: turbo run build
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

2. **Test CI builds:**
   - Verify caching works
   - Check build times
   - Ensure all outputs correct

### Phase 5: Cleanup (1 day)

1. **Remove old tool:**
```bash
npm uninstall lerna
# or
npm uninstall nx
```

2. **Remove old configuration:**
```bash
rm lerna.json
# or
rm nx.json
```

3. **Update documentation:**
   - Update README
   - Update team guides
   - Document new commands

## Common Challenges

### Challenge 1: Different Output Structures

**Problem:** Old tool outputs to different directories

**Solution:** Update turbo.json outputs
```json
{
  "build": {
    "outputs": ["dist/**", "lib/**", "build/**"]
  }
}
```

### Challenge 2: Complex Task Dependencies

**Problem:** Circular or complex dependencies

**Solution:** Simplify dependency graph
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]  // Simple, clear
    },
    "test": {
      "dependsOn": ["build"]   // Sequential
    }
  }
}
```

### Challenge 3: Custom Scripts

**Problem:** Old tool had custom executors/plugins

**Solution:** Convert to npm scripts
```json
{
  "scripts": {
    "build": "tsc && webpack",
    "custom-task": "node scripts/custom.js"
  }
}
```

### Challenge 4: Different Package Managers

**Problem:** Switching from pnpm to npm or vice versa

**Solution:** Update workspace configuration
```json
// For npm/yarn
{
  "workspaces": ["packages/*"]
}

// For pnpm (pnpm-workspace.yaml)
packages:
  - 'packages/*'
```

### Challenge 5: Environment Variables

**Problem:** Different env var handling

**Solution:** Use turbo.json env configuration
```json
{
  "pipeline": {
    "build": {
      "env": ["NODE_ENV", "API_URL"],
      "passThroughEnv": ["DEBUG"]
    }
  }
}
```

## Migration Checklist

**Pre-migration:**
- [ ] Document current task structure
- [ ] List all tasks and dependencies
- [ ] Identify cacheable outputs
- [ ] Review team workflow
- [ ] Plan rollout timeline

**Migration:**
- [ ] Install Turborepo
- [ ] Create turbo.json
- [ ] Configure pipeline
- [ ] Test all tasks locally
- [ ] Verify caching works
- [ ] Update CI/CD configuration
- [ ] Test CI builds
- [ ] Document new commands

**Post-migration:**
- [ ] Remove old tool (if applicable)
- [ ] Clean up old configuration files
- [ ] Update team documentation
- [ ] Train team on new commands
- [ ] Monitor performance improvements
- [ ] Set up remote caching
- [ ] Optimize pipeline based on usage

## Performance Comparison

After migration, measure improvements:

```bash
# Before (with old tool)
time <old-command> build

# After (with Turborepo)
time turbo run build --force  # First run
time turbo run build          # Cached run
```

**Expected improvements:**
- 50-90% faster with cache hits
- Better parallel execution
- Reduced CI/CD costs
- Improved developer experience

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Migration Examples](https://github.com/vercel/turbo/tree/main/examples)
- [Discord Community](https://turbo.build/discord)
