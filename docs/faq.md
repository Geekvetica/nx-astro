# Frequently Asked Questions

Common questions about the nx-astro plugin and answers to help you get the most out of it.

## General Questions

### What is nx-astro?

nx-astro is an Nx plugin that integrates Astro framework with Nx monorepos. It provides:

- Generators to create Astro applications and components
- Executors to run dev servers, builds, and tests
- Automatic task inference via `createNodesV2`
- Full TypeScript support and type safety
- Nx caching for faster builds

### Why use Nx with Astro?

Nx provides several advantages for Astro projects:

**Performance Benefits:**

- Intelligent caching - build once, reuse everywhere
- Parallel execution - run multiple tasks simultaneously
- Affected detection - only build/test what changed

**Developer Experience:**

- Consistent commands across all projects
- Code generation with generators
- Dependency graph visualization
- Task orchestration and dependencies

**Monorepo Features:**

- Share components across multiple Astro apps
- Unified dependency management
- Atomic cross-project changes
- Consistent configuration

### Is nx-astro production-ready?

Yes! The plugin has:

- 307+ unit tests with high coverage
- 26 E2E tests for real-world scenarios
- Comprehensive documentation
- Battle-tested in production environments

### Do I need to know Nx to use nx-astro?

Basic Nx knowledge is helpful but not required. If you know these commands, you're good to go:

```bash
nx dev my-app        # Start dev server
nx build my-app      # Build for production
nx test my-app       # Run tests
nx check my-app      # Type check
```

Learn more at [nx.dev](https://nx.dev).

---

## Setup and Installation

### How do I get started?

```bash
# 1. Create Nx workspace
npx create-nx-workspace@latest my-workspace

# 2. Install nx-astro
cd my-workspace
npm install --save-dev nx-astro

# 3. Initialize plugin
nx g @geekvetica/nx-astro:init

# 4. Create first app
nx g @geekvetica/nx-astro:application my-app

# 5. Start development
nx dev my-app
```

### Can I add nx-astro to an existing Nx workspace?

Yes! If you already have an Nx workspace:

```bash
# Install the plugin
npm install --save-dev @geekvetica/nx-astro

# Initialize it
nx g @geekvetica/nx-astro:init

# Create Astro app
nx g @geekvetica/nx-astro:application my-astro-app
```

### Can I import existing Astro projects?

Yes! Use the `--importExisting` flag:

```bash
# Copy your project to apps directory
cp -r /path/to/my-astro-site apps/my-site

# Import it
nx g @geekvetica/nx-astro:application my-site --importExisting

# Verify it works
nx dev my-site
```

See the [Migration Guide](./migration-guide.md) for detailed instructions.

### What versions are supported?

- **Nx**: 21.6.4+
- **Astro**: 5.0.0+
- **Node.js**: 18.0.0+
- **TypeScript**: 5.9.0+

---

## Features and Capabilities

### What generators are available?

The plugin provides three generators:

1. **init** - Initialize the plugin in your workspace
2. **application** - Create or import Astro applications
3. **component** - Generate Astro components

See the [Generators Guide](./generators.md) for details.

### What executors are available?

Six executors cover all Astro CLI commands:

1. **dev** - Development server with HMR
2. **build** - Production builds
3. **preview** - Preview production builds
4. **check** - Type checking and diagnostics
5. **test** - Run Vitest tests
6. **sync** - Generate content collection types

See the [Executors Guide](./executors.md) for details.

### Does it support SSR?

Yes! Configure SSR in `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
```

### Does it support content collections?

Absolutely! Content collections work seamlessly:

```bash
# Generate types for content collections
nx sync my-app

# Types are generated in .astro/types.d.ts
```

### Can I use UI frameworks (React, Vue, etc.)?

Yes! Install the integration and configure it:

```bash
# Install React integration
npm install @astrojs/react react react-dom

# Configure in astro.config.mjs
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()]
});
```

### Does it support Tailwind CSS?

Yes! Install and configure Tailwind:

```bash
# Install Tailwind integration
npm install @astrojs/tailwind tailwindcss

# Configure in astro.config.mjs
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()]
});
```

---

## Task Execution

### How does task inference work?

The plugin automatically detects Astro projects by looking for `astro.config.mjs` files. When found, it creates targets (dev, build, preview, check, test, sync) without manual configuration.

You can view inferred configuration:

```bash
nx show project my-app
```

### Can I override inferred tasks?

Yes! Create a `project.json` file:

```json
{
  "name": "my-app",
  "targets": {
    "dev": {
      "executor": "@geekvetica/nx-astro:dev",
      "options": {
        "port": 3000,
        "host": true
      }
    }
  }
}
```

Explicit configuration overrides inferred configuration.

### Can I customize target names?

Yes! Configure in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "nx-astro",
      "options": {
        "devTargetName": "serve",
        "buildTargetName": "compile"
      }
    }
  ]
}
```

### How do I run multiple projects?

```bash
# Run specific projects
nx run-many --target=dev --projects=app1,app2 --parallel=2

# Run all projects
nx run-many --target=build --all

# Run affected projects only
nx affected --target=build
```

### What is "affected" detection?

Nx detects which projects changed based on git diff:

```bash
# Build only projects affected by changes
nx affected --target=build

# Test only affected projects
nx affected --target=test

# View affected projects
nx affected:graph
```

---

## Monorepo and Code Sharing

### How do I share components between apps?

Create a shared library:

```bash
# Create library
nx g @nx/js:library shared-ui --directory=libs/shared-ui

# Add components
# libs/shared-ui/src/components/Button.astro

# Configure path alias in tsconfig.base.json
{
  "paths": {
    "@my-org/shared-ui/*": ["libs/shared-ui/src/*"]
  }
}

# Use in apps
import Button from '@my-org/shared-ui/components/Button.astro';
```

See [Examples](./examples.md#shared-component-library) for complete guide.

### Can I share configuration across projects?

Yes! Use workspace-level configuration:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true
    // ... shared settings
  }
}

// apps/my-app/tsconfig.json
{
  "extends": "../../tsconfig.base.json"
}
```

### How do project dependencies work?

Nx automatically detects dependencies:

```typescript
// apps/app1 imports from apps/app2
import { helper } from '@my-org/app2';

// Nx knows app1 depends on app2
// nx build app1 will build app2 first
```

View the dependency graph:

```bash
nx graph
```

---

## Performance and Caching

### How does Nx caching work?

Nx caches task outputs based on inputs:

```bash
# First build (cold)
nx build my-app  # Takes 15s

# Second build (no changes)
nx build my-app  # Takes 0.2s (cached!)
```

Cache is invalidated when:

- Source files change
- Dependencies change
- Configuration changes
- Astro version changes

### What tasks are cached?

These executors benefit from caching:

- **build** - Caches output files
- **check** - Caches type checking results
- **test** - Caches test results
- **sync** - Caches generated types

These are not cached (long-running servers):

- **dev** - Development server
- **preview** - Preview server

### Can I clear the cache?

```bash
# Clear all Nx caches
nx reset

# Force rebuild without cache
nx build my-app --skip-nx-cache
```

### Is there remote caching?

Yes! [Nx Cloud](https://nx.app) provides:

- Remote cache shared across team
- Distributed task execution
- CI analytics and insights

```bash
# Enable Nx Cloud
nx connect-to-nx-cloud
```

---

## TypeScript and Type Safety

### How is TypeScript configured?

The plugin sets up TypeScript automatically:

```json
// apps/my-app/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["astro/client"]
  },
  "include": ["src/**/*", ".astro/**/*"]
}
```

### Are .astro files type-checked?

Yes! Use the check executor:

```bash
nx check my-app
```

This runs Astro's type checker which understands `.astro` files.

### How do I get types for content collections?

```bash
# Generate types
nx sync my-app

# Types are generated in:
# - .astro/types.d.ts
# - src/env.d.ts

# Now you have autocomplete:
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
// posts is fully typed!
```

### Do path aliases work?

Yes! Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  }
}
```

Use in code:

```typescript
import Button from '@components/Button.astro';
import { formatDate } from '@/lib/utils';
```

---

## Testing

### How do I test Astro components?

Use Vitest with Astro container:

```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Button from './Button.astro';

test('renders button', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Button, {
    slots: { default: 'Click me' },
  });
  expect(result).toContain('Click me');
});
```

### Does it support E2E testing?

Yes! See the [E2E Testing Guide](./e2e-testing-guide.md) for Playwright/Cypress examples.

### How do I run tests?

```bash
# Run tests
nx test my-app

# Run with coverage
nx test my-app --coverage

# Run in watch mode
nx test my-app --watch

# Run affected tests only
nx affected --target=test
```

---

## Deployment

### How do I deploy Astro apps from Nx?

Build your app, then deploy the output:

```bash
# Build for production
nx build my-app

# Output is in dist/apps/my-app
# Deploy this directory to your hosting provider
```

### What deployment platforms are supported?

All platforms that support Astro:

- **Netlify** - Static or SSR
- **Vercel** - Static or SSR
- **Cloudflare Pages** - Static or SSR
- **GitHub Pages** - Static only
- **AWS** - S3 (static) or Lambda (SSR)
- **Docker** - Custom deployments

See [Examples](./examples.md#deployment-examples) for configurations.

### Can I deploy multiple apps?

Yes! Build and deploy each:

```bash
# Build all apps
nx run-many --target=build --all

# Deploy individually
cd dist/apps/marketing && netlify deploy
cd dist/apps/blog && netlify deploy
```

Or use a monorepo deployment strategy:

```bash
# Deploy only affected apps in CI
nx affected --target=deploy
```

---

## CI/CD

### How do I set up CI/CD?

Use Nx affected commands in your CI:

```yaml
# GitHub Actions example
- name: Build affected
  run: nx affected --target=build --base=origin/main

- name: Test affected
  run: nx affected --target=test --base=origin/main
```

See the [CI/CD Setup Guide](./ci-cd-setup.md) for complete examples.

### What about Nx Cloud?

Nx Cloud provides:

- Remote caching for CI
- Distributed task execution
- CI analytics

```bash
# Connect to Nx Cloud
nx connect-to-nx-cloud

# CI runs are now much faster!
```

---

## Common Issues

### Build is slow

```bash
# Check if cache is working
nx build my-app
# Change nothing
nx build my-app  # Should be instant

# If not cached, check configuration
nx show project my-app
```

### Changes not reflected in dev mode

```bash
# Clear caches
nx reset
rm -rf node_modules/.cache

# Restart dev server
nx dev my-app
```

### Type errors in .astro files

```bash
# Generate types
nx sync my-app

# Run type checking
nx check my-app

# Restart TypeScript in IDE
```

See [Troubleshooting Guide](./troubleshooting.md) for more solutions.

---

## Best Practices

### Project Organization

```
workspace/
├── apps/              # Applications
│   ├── marketing/
│   ├── blog/
│   └── docs/
├── libs/              # Shared libraries
│   ├── shared-ui/
│   └── utils/
└── tools/             # Build tools
```

### Naming Conventions

- Use kebab-case for project names: `my-app`
- Use PascalCase for components: `Button.astro`
- Use camelCase for utilities: `formatDate.ts`

### Git Workflow

```bash
# Make changes
git add .
git commit -m "Add new feature"

# Test affected projects
nx affected --target=test

# Build affected projects
nx affected --target=build

# Push changes
git push
```

---

## Getting More Help

### Documentation

- [Generators Guide](./generators.md) - Create projects and components
- [Executors Guide](./executors.md) - Run tasks
- [Configuration Guide](./configuration.md) - Configure the plugin
- [Examples](./examples.md) - Real-world examples
- [Troubleshooting](./troubleshooting.md) - Common issues

### Community

- [GitHub Issues](https://github.com/geekvetica/nx-astro/issues) - Report bugs
- [Nx Discord](https://discord.gg/nx) - Get help from Nx community
- [Astro Discord](https://astro.build/chat) - Astro-specific questions

### Contributing

Want to contribute? See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## Still Have Questions?

If your question isn't answered here:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Search [GitHub Issues](https://github.com/geekvetica/nx-astro/issues)
3. Ask in [Discord](https://discord.gg/nx)
4. Create a new issue with your question

We're here to help!
