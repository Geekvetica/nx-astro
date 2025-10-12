# Executors

Executors in the nx-astro plugin run tasks for your Astro projects. They wrap Astro CLI commands with Nx integration for caching, task orchestration, and consistent execution across your monorepo.

## Overview

The nx-astro plugin provides six executors:

- **dev** - Run the development server with hot module replacement
- **build** - Build the project for production deployment
- **preview** - Preview a production build locally
- **check** - Run TypeScript type checking and diagnostics
- **test** - Run Vitest tests
- **sync** - Generate TypeScript types for content collections

All executors are automatically configured through task inference when the plugin detects an `astro.config.mjs` file in your project.

---

## Dev Executor

The dev executor runs the Astro development server with Hot Module Replacement (HMR) for rapid development.

### Purpose

Use the dev executor to:

- Start a local development server
- Enable hot module replacement for instant updates
- Preview your site during development
- Test changes in real-time

### Usage

```bash
# Run with default settings
nx dev my-app

# Run on a specific port
nx dev my-app --port=3000

# Run with verbose output
nx dev my-app --verbose
```

### Options

| Option           | Type                | Default              | Description                                                                                   |
| ---------------- | ------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `port`           | `number`            | `4321`               | Development server port                                                                       |
| `host`           | `string \| boolean` | `"localhost"`        | Host address to bind the server to. Use `true` to expose to network, or specify an IP address |
| `open`           | `string \| boolean` | `false`              | Open browser on server start. Use `true` to open default browser, or specify a path           |
| `root`           | `string`            | project root         | Project root path (usually provided by Nx automatically)                                      |
| `config`         | `string`            | `"astro.config.mjs"` | Path to Astro config file                                                                     |
| `site`           | `string`            | -                    | Site URL for absolute URLs in development                                                     |
| `base`           | `string`            | -                    | Base path for deployment (useful for testing subdirectory deployments)                        |
| `verbose`        | `boolean`           | `false`              | Enable verbose output for debugging                                                           |
| `additionalArgs` | `string[]`          | -                    | Additional CLI arguments to pass directly to Astro                                            |

### Examples

#### Basic Development Server

```bash
# Start dev server on default port (4321)
nx dev my-app
```

Access your site at `http://localhost:4321`

#### Custom Port

```bash
# Use a different port
nx dev my-app --port=3000

# Avoid port conflicts in monorepo
nx dev marketing-site --port=4321
nx dev blog --port=4322
nx dev docs --port=4323
```

#### Network Access

```bash
# Expose to network (accessible from other devices)
nx dev my-app --host=true

# Bind to specific IP
nx dev my-app --host=192.168.1.100
```

#### Auto-Open Browser

```bash
# Open default browser automatically
nx dev my-app --open

# Open to specific path
nx dev my-app --open=/blog
```

#### Development with Base Path

```bash
# Test subdirectory deployment
nx dev my-app --base=/subpath

# Access at http://localhost:4321/subpath
```

#### Verbose Mode

```bash
# Enable verbose logging for debugging
nx dev my-app --verbose
```

#### Custom Configuration

```bash
# Use alternative config file
nx dev my-app --config=astro.config.production.mjs

# Pass additional Astro CLI arguments
nx dev my-app --additionalArgs="--experimental-assets"
```

### Running Multiple Dev Servers

In a monorepo, you can run multiple dev servers simultaneously:

```bash
# Start multiple servers in parallel
nx run-many --target=dev --projects=marketing,blog,docs --parallel=3
```

Each project should use a different port to avoid conflicts.

### HMR (Hot Module Replacement)

The dev server includes HMR by default:

- Changes to `.astro` files reload instantly
- Changes to imported components update without full page reload
- CSS changes apply immediately
- TypeScript errors appear in the browser and terminal

### Stopping the Dev Server

Press `Ctrl+C` or `Cmd+C` to stop the development server.

---

## Build Executor

The build executor compiles your Astro project for production deployment, generating optimized static files or server bundles.

### Purpose

Use the build executor to:

- Create production-ready builds
- Generate optimized static files
- Build SSR applications
- Prepare for deployment

### Usage

```bash
# Build with default settings
nx build my-app

# Build with custom output path
nx build my-app --outputPath=dist/production

# Build with source maps
nx build my-app --sourcemap
```

### Options

| Option           | Type       | Default              | Description                                                                                                       |
| ---------------- | ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `outputPath`     | `string`   | from config          | Override the default output directory. By default, uses `dist/{projectRoot}` or the value from `astro.config.mjs` |
| `mode`           | `string`   | -                    | Build mode: `'static'` for SSG or `'server'` for SSR (usually determined by astro.config.mjs)                     |
| `root`           | `string`   | project root         | Project root path (provided by Nx automatically)                                                                  |
| `config`         | `string`   | `"astro.config.mjs"` | Path to Astro config file                                                                                         |
| `site`           | `string`   | -                    | Site URL for absolute URLs in production                                                                          |
| `base`           | `string`   | -                    | Base path for deployment (e.g., `/blog` for subdirectory deployments)                                             |
| `sourcemap`      | `boolean`  | `false`              | Generate source maps for debugging production builds                                                              |
| `clean`          | `boolean`  | `true`               | Clean output directory before build                                                                               |
| `verbose`        | `boolean`  | `false`              | Enable verbose output for debugging                                                                               |
| `additionalArgs` | `string[]` | -                    | Additional CLI arguments to pass to Astro                                                                         |

### Build Output

The build executor generates different outputs based on your project configuration:

#### Static Site (SSG)

```
dist/apps/my-app/
├── _astro/              # Hashed assets (CSS, JS)
│   ├── index.abc123.css
│   └── index.xyz789.js
├── index.html           # Built HTML pages
├── about.html
└── favicon.svg
```

#### Server (SSR)

```
dist/apps/my-app/
├── client/              # Client-side assets
│   └── _astro/
├── server/              # Server bundle
│   └── entry.mjs
└── .astro/              # Build artifacts
```

### Examples

#### Basic Production Build

```bash
# Build for production
nx build my-app

# View output
ls dist/apps/my-app
```

#### Build with Custom Output

```bash
# Specify custom output directory
nx build my-app --outputPath=dist/production/my-app

# Build to workspace root
nx build my-app --outputPath=build
```

#### Build with Base Path

```bash
# For subdirectory deployment (e.g., GitHub Pages project site)
nx build my-app --base=/my-app

# URLs in HTML will be prefixed with /my-app
```

#### Build with Site URL

```bash
# Set site URL for absolute URLs
nx build my-app --site=https://example.com

# Useful for canonical URLs, sitemaps, RSS feeds
```

#### Development Build

```bash
# Build without minification for debugging
nx build my-app --mode=development --sourcemap
```

#### Production Build with Source Maps

```bash
# Include source maps for error tracking
nx build my-app --sourcemap

# Source maps allow you to debug minified production code
```

#### Skip Cleaning

```bash
# Don't clean output directory (incremental build)
nx build my-app --clean=false
```

#### Verbose Build

```bash
# See detailed build output
nx build my-app --verbose

# Useful for debugging build issues
```

### Build Caching

The build executor leverages Nx's computation caching:

```bash
# First build - full compilation
nx build my-app
# Build completed in 12.3s

# Second build (no changes) - cached result
nx build my-app
# Nx read the output from the cache instead of running the command
# Build completed in 0.2s
```

Cache is invalidated when:

- Source files change
- Dependencies change
- Configuration changes
- Astro version changes

### Building Multiple Projects

```bash
# Build all projects
nx run-many --target=build --all

# Build specific projects
nx run-many --target=build --projects=marketing,blog

# Build affected projects (based on git changes)
nx affected --target=build
```

### Build with Dependencies

```bash
# Build with dependencies (topological order)
nx build my-app --with-deps

# If my-app depends on shared-components, both will build
```

### CI/CD Integration

The build executor integrates seamlessly with CI/CD:

```yaml
# GitHub Actions example
- name: Build applications
  run: nx affected --target=build --base=origin/main
```

See the [CI/CD Setup Guide](./ci-cd-setup.md) for complete configuration.

---

## Preview Executor

The preview executor serves your production build locally for testing before deployment.

### Purpose

Use the preview executor to:

- Test production builds locally
- Verify SSR functionality
- Check for production-only issues
- Preview before deploying

### Usage

```bash
# Preview after building
nx build my-app
nx preview my-app

# Or chain commands
nx build my-app && nx preview my-app
```

### Options

| Option           | Type                | Default              | Description                               |
| ---------------- | ------------------- | -------------------- | ----------------------------------------- |
| `port`           | `number`            | `4321`               | Preview server port                       |
| `host`           | `string \| boolean` | `"localhost"`        | Host address to bind the server to        |
| `root`           | `string`            | project root         | Project root path (provided by Nx)        |
| `config`         | `string`            | `"astro.config.mjs"` | Path to Astro config file                 |
| `outputPath`     | `string`            | from config          | Output directory to serve                 |
| `site`           | `string`            | -                    | Site URL for absolute URLs                |
| `base`           | `string`            | -                    | Base path for deployment                  |
| `open`           | `string \| boolean` | `false`              | Open browser on server start              |
| `verbose`        | `boolean`           | `false`              | Enable verbose output                     |
| `additionalArgs` | `string[]`          | -                    | Additional CLI arguments to pass to Astro |

### Examples

#### Basic Preview

```bash
# Build and preview
nx build my-app
nx preview my-app
```

Access at `http://localhost:4321`

#### Custom Port

```bash
# Use different port
nx preview my-app --port=3000
```

#### Network Access

```bash
# Share preview on network
nx preview my-app --host=true

# Access from other devices on same network
```

#### Auto-Open Browser

```bash
# Open browser automatically
nx preview my-app --open
```

#### Preview with Base Path

```bash
# Preview subdirectory deployment
nx build my-app --base=/subpath
nx preview my-app --base=/subpath

# Access at http://localhost:4321/subpath
```

### Preview vs Dev

Key differences between preview and dev executors:

| Feature  | Dev              | Preview                     |
| -------- | ---------------- | --------------------------- |
| Build    | No compilation   | Requires build first        |
| Speed    | Fast startup     | Slower (serves built files) |
| HMR      | Yes              | No                          |
| Accuracy | Development mode | Production-like             |
| Use Case | Development      | Pre-deployment testing      |

### Common Workflow

```bash
# 1. Build for production
nx build my-app

# 2. Preview the build
nx preview my-app

# 3. Test in browser
# Open http://localhost:4321

# 4. If issues found, fix and rebuild
nx build my-app

# 5. Preview again
nx preview my-app
```

---

## Check Executor

The check executor runs Astro's type checking and diagnostics to catch TypeScript errors and type issues.

### Purpose

Use the check executor to:

- Validate TypeScript types in `.astro` files
- Check for type errors before build
- Run type checking in CI/CD
- Enable watch mode for continuous checking

### Usage

```bash
# Run type checking
nx check my-app

# Run in watch mode
nx check my-app --watch

# Run with verbose output
nx check my-app --verbose
```

### Options

| Option           | Type       | Default              | Description                               |
| ---------------- | ---------- | -------------------- | ----------------------------------------- |
| `watch`          | `boolean`  | `false`              | Run in watch mode for continuous checking |
| `tsconfig`       | `string`   | `"tsconfig.json"`    | Path to TypeScript config file            |
| `root`           | `string`   | project root         | Project root path (provided by Nx)        |
| `config`         | `string`   | `"astro.config.mjs"` | Path to Astro config file                 |
| `verbose`        | `boolean`  | `false`              | Enable verbose output                     |
| `additionalArgs` | `string[]` | -                    | Additional CLI arguments to pass to Astro |

### Examples

#### Basic Type Checking

```bash
# Check for type errors
nx check my-app

# Output shows any type errors found
```

Example output:

```
Checking my-app...
✓ No type errors found

# Or if errors exist:
✗ Found 2 type errors:

src/components/Card.astro:5:3 - error TS2322: Type 'string' is not assignable to type 'number'.
src/pages/index.astro:12:7 - error TS2339: Property 'notExist' does not exist on type '{ title: string; }'.
```

#### Watch Mode

```bash
# Continuous type checking
nx check my-app --watch

# Watches for file changes and re-checks automatically
```

Useful during development to catch type errors as you code.

#### Custom TypeScript Config

```bash
# Use alternative tsconfig
nx check my-app --tsconfig=tsconfig.strict.json
```

#### Verbose Mode

```bash
# See detailed checking information
nx check my-app --verbose
```

### Integration with Development Workflow

```bash
# Check before building
nx check my-app && nx build my-app

# Or using Nx task dependencies (automatic)
# In project.json:
{
  "targets": {
    "build": {
      "dependsOn": ["check"]
    }
  }
}

# Now build automatically runs check first
nx build my-app
```

### CI/CD Integration

Type checking is essential in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Type check all projects
  run: nx run-many --target=check --all

# Check only affected projects
- name: Type check affected
  run: nx affected --target=check
```

### Caching

The check executor benefits from Nx caching:

```bash
# First run - performs type checking
nx check my-app
# Completed in 5.2s

# Second run (no changes) - cached
nx check my-app
# Nx read the output from the cache
# Completed in 0.1s
```

---

## Test Executor

The test executor runs Vitest tests for your Astro project, enabling unit and integration testing of components and utilities.

### Purpose

Use the test executor to:

- Run unit tests for components
- Test utility functions
- Generate coverage reports
- Enable watch mode for TDD workflow

### Usage

```bash
# Run tests
nx test my-app

# Run in watch mode
nx test my-app --watch

# Run with coverage
nx test my-app --coverage
```

### Options

| Option            | Type       | Default               | Description                                                    |
| ----------------- | ---------- | --------------------- | -------------------------------------------------------------- |
| `testPathPattern` | `string`   | -                     | Test file pattern to match (regex)                             |
| `watch`           | `boolean`  | `false`               | Watch mode for continuous testing                              |
| `coverage`        | `boolean`  | `false`               | Generate coverage reports                                      |
| `ci`              | `boolean`  | `false`               | CI mode (non-interactive, fails on error)                      |
| `root`            | `string`   | project root          | Project root path (provided by Nx)                             |
| `config`          | `string`   | `"vitest.config.mjs"` | Path to Vitest config file                                     |
| `reporter`        | `string`   | `"default"`           | Reporter to use (`'default'`, `'verbose'`, `'json'`, `'html'`) |
| `run`             | `boolean`  | -                     | Run tests once and exit                                        |
| `verbose`         | `boolean`  | `false`               | Verbose output                                                 |
| `additionalArgs`  | `string[]` | -                     | Additional CLI arguments to pass to Vitest                     |

### Examples

#### Run All Tests

```bash
# Execute all tests
nx test my-app
```

Example output:

```
 ✓ src/components/Card.test.ts (2)
 ✓ src/utils/formatDate.test.ts (5)

Test Files  2 passed (2)
     Tests  7 passed (7)
  Start at  10:30:15
  Duration  1.23s
```

#### Watch Mode

```bash
# Run in watch mode (great for TDD)
nx test my-app --watch

# Tests re-run automatically when files change
```

#### Run Specific Tests

```bash
# Run tests matching pattern
nx test my-app --testPathPattern=Card

# Only runs tests in files containing "Card"
```

#### Coverage Report

```bash
# Generate coverage report
nx test my-app --coverage

# View coverage in terminal and HTML report
```

Example coverage output:

```
-------------|---------|----------|---------|---------|
File         | % Stmts | % Branch | % Funcs | % Lines |
-------------|---------|----------|---------|---------|
All files    |   87.5  |   83.33  |  100    |  87.5   |
 Card.astro  |   100   |   100    |  100    |  100    |
 utils.ts    |   75    |   66.67  |  100    |  75     |
-------------|---------|----------|---------|---------|
```

#### CI Mode

```bash
# Run in CI mode (non-interactive)
nx test my-app --ci

# Exits with error code if tests fail
```

#### Custom Reporter

```bash
# Use verbose reporter
nx test my-app --reporter=verbose

# Use JSON reporter for tooling
nx test my-app --reporter=json

# Use HTML reporter
nx test my-app --reporter=html
```

#### Run Once

```bash
# Run tests once and exit (disable watch by default)
nx test my-app --run
```

### Test File Structure

Vitest looks for test files with these patterns:

```
src/
├── components/
│   ├── Card.astro
│   └── Card.test.ts          # Component test
├── utils/
│   ├── formatDate.ts
│   └── formatDate.test.ts    # Utility test
└── pages/
    └── index.astro
```

### Example Test

```typescript
// src/components/Card.test.ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Card from './Card.astro';

describe('Card component', () => {
  it('renders title correctly', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Card, {
      props: { title: 'Test Title' },
    });

    expect(result).toContain('Test Title');
  });

  it('renders with default variant', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Card, {
      props: { title: 'Test' },
    });

    expect(result).toContain('card--default');
  });
});
```

### Running Tests for Multiple Projects

```bash
# Run tests for all projects
nx run-many --target=test --all

# Run tests for specific projects
nx run-many --target=test --projects=my-app,shared-lib

# Run tests for affected projects
nx affected --target=test
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run tests with coverage
  run: nx affected --target=test --coverage --ci

- name: Upload coverage reports
  uses: codecov/codecov-action@v3
  with:
    directory: ./coverage
```

---

## Sync Executor

The sync executor generates TypeScript types for content collections and other Astro features, enabling type-safe content queries.

### Purpose

Use the sync executor to:

- Generate types for content collections
- Create type definitions for `.astro` files
- Enable TypeScript autocomplete for content
- Update types when content schema changes

### Usage

```bash
# Generate types
nx sync my-app

# With verbose output
nx sync my-app --verbose
```

### Options

| Option           | Type       | Default              | Description                               |
| ---------------- | ---------- | -------------------- | ----------------------------------------- |
| `root`           | `string`   | project root         | Project root path (provided by Nx)        |
| `config`         | `string`   | `"astro.config.mjs"` | Path to Astro config file                 |
| `verbose`        | `boolean`  | `false`              | Enable verbose output                     |
| `additionalArgs` | `string[]` | -                    | Additional CLI arguments to pass to Astro |

### Generated Files

The sync executor creates type definition files:

```
apps/my-app/
├── .astro/
│   └── types.d.ts           # Generated types for content collections
└── src/
    ├── content/
    │   └── config.ts        # Content collection schema
    └── env.d.ts             # Astro environment types
```

### Examples

#### Basic Sync

```bash
# Generate types for content collections
nx sync my-app
```

Output:

```
Generating types...
✓ Types generated in .astro/types.d.ts
```

#### After Schema Changes

```bash
# 1. Update content collection schema
# Edit src/content/config.ts

# 2. Regenerate types
nx sync my-app

# 3. TypeScript now has updated types
```

#### Verbose Mode

```bash
# See detailed sync information
nx sync my-app --verbose
```

### When to Run Sync

Run the sync executor when:

1. **Creating a new blog or content site**

   ```bash
   nx g @geekvetica/nx-astro:application my-blog --template=blog
   nx sync my-blog
   ```

2. **Adding content collections**

   ```bash
   # After creating src/content/config.ts
   nx sync my-app
   ```

3. **Changing content schema**

   ```bash
   # After modifying content collection schema
   nx sync my-app
   ```

4. **After upgrading Astro**

   ```bash
   # Update package.json
   npm install astro@latest

   # Regenerate types
   nx sync my-app
   ```

### Content Collections Example

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

After running `nx sync my-app`, you get type-safe queries:

```typescript
// src/pages/blog/[...slug].astro
---
import { getCollection, getEntry } from 'astro:content';

// Type-safe collection access
const posts = await getCollection('blog');

// TypeScript knows the shape of post.data
const post = posts[0];
const title: string = post.data.title;  // ✓ Type-safe
const tags: string[] | undefined = post.data.tags;  // ✓ Type-safe
---
```

### Automatic Type Generation

You can configure the dev and build executors to automatically run sync:

```json
// project.json
{
  "targets": {
    "dev": {
      "dependsOn": ["sync"]
    },
    "build": {
      "dependsOn": ["sync"]
    }
  }
}
```

Now types are generated automatically before dev and build:

```bash
# Automatically runs sync first
nx dev my-app
nx build my-app
```

### CI/CD Integration

Include sync in your CI pipeline to ensure types are current:

```yaml
# GitHub Actions example
- name: Generate content types
  run: nx run-many --target=sync --all

- name: Type check with fresh types
  run: nx run-many --target=check --all
```

### Caching

The sync executor leverages Nx caching based on content files:

```bash
# First run - generates types
nx sync my-app
# Completed in 1.2s

# Second run (no content changes) - cached
nx sync my-app
# Nx read the output from the cache
# Completed in 0.1s
```

---

## Executor Task Dependencies

Executors can depend on other executors to ensure proper execution order:

```json
// project.json
{
  "targets": {
    "build": {
      "executor": "@geekvetica/nx-astro:build",
      "dependsOn": ["sync", "check", "^build"]
    },
    "preview": {
      "executor": "@geekvetica/nx-astro:preview",
      "dependsOn": ["build"]
    }
  }
}
```

With this configuration:

- `build` runs `sync` and `check` first, plus builds dependencies
- `preview` automatically builds before serving

---

## Common Workflows

### Development Workflow

```bash
# Start development server
nx dev my-app

# In another terminal: continuous type checking
nx check my-app --watch

# In another terminal: continuous testing
nx test my-app --watch
```

### Pre-Deployment Workflow

```bash
# 1. Generate content types
nx sync my-app

# 2. Run type checking
nx check my-app

# 3. Run tests
nx test my-app

# 4. Build for production
nx build my-app

# 5. Preview build locally
nx preview my-app

# 6. Deploy (manual or via CI/CD)
```

### CI/CD Workflow

```bash
# 1. Generate types for affected projects
nx affected --target=sync

# 2. Type check affected projects
nx affected --target=check

# 3. Test affected projects
nx affected --target=test --coverage

# 4. Build affected projects
nx affected --target=build

# 5. Deploy (environment-specific)
```

### Monorepo Parallel Execution

```bash
# Run dev servers for multiple apps
nx run-many --target=dev --projects=app1,app2,app3 --parallel=3

# Build all apps in parallel
nx run-many --target=build --all --parallel=5

# Run all checks in parallel
nx run-many --target=check --all --parallel
```

---

## Performance and Caching

All executors except `dev` and `preview` benefit from Nx caching:

### Cached Executors

- **build** - Caches output files
- **check** - Caches type checking results
- **test** - Caches test results
- **sync** - Caches generated types

### Uncached Executors

- **dev** - Long-running server (not cacheable)
- **preview** - Long-running server (not cacheable)

### Cache Benefits

```bash
# First build (cold)
nx build my-app
# Completed in 15.3s

# Second build (cached)
nx build my-app
# Nx read the output from the cache
# Completed in 0.2s (76x faster!)
```

### Cache Management

```bash
# Clear cache for a project
nx reset

# Clear cache and rebuild
nx reset && nx build my-app

# Skip cache (force execution)
nx build my-app --skip-nx-cache
```

---

## Next Steps

- Configure projects with the [Configuration Guide](./configuration.md)
- Learn about [Generators](./generators.md) to create projects and components
- Explore [Examples](./examples.md) for real-world usage patterns
- See the [API Reference](./api-reference.md) for complete schema documentation
- Set up [CI/CD](./ci-cd-setup.md) for automated builds and deploys
