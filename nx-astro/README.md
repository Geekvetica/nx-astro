# nx-astro

> Nx plugin for Astro - Build fast websites with Astro in an Nx monorepo

[![npm version](https://img.shields.io/npm/v/@geekvetica/nx-astro)](https://www.npmjs.com/package/@geekvetica/nx-astro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Automatic Task Inference** - Detects Astro projects and configures tasks automatically
- **Code Generators** - Scaffold applications and components with ease
- **Full TypeScript Support** - Type-safe configuration and development
- **Nx Caching** - Lightning-fast builds with intelligent caching
- **Content Collections** - First-class support for Astro content collections
- **SSR Support** - Build static sites or server-rendered applications
- **Testing Integration** - Built-in Vitest support for unit and integration tests

## Quick Start

### Installation

```bash
# Create a new Nx workspace
npx create-nx-workspace@latest my-workspace

# Install nx-astro
cd my-workspace
npm install --save-dev @geekvetica/nx-astro

# Initialize the plugin
nx g @geekvetica/nx-astro:init
```

### Create Your First Application

```bash
# Generate an Astro application
nx g @geekvetica/nx-astro:application my-app

# Start development server
nx dev my-app

# Build for production
nx build my-app
```

### Create Components

```bash
# Generate a component
nx g @geekvetica/nx-astro:component Button --project=my-app

# Generate a component in a subdirectory
nx g @geekvetica/nx-astro:component Card --project=my-app --directory=ui
```

## Available Commands

Once you have an Astro application in your workspace, you can run these commands:

```bash
# Development
nx dev my-app              # Start dev server with HMR
nx dev my-app --port=3000  # Custom port

# Building
nx build my-app            # Production build
nx build my-app --verbose  # Verbose output

# Preview
nx preview my-app          # Preview production build

# Type Checking
nx check my-app            # Run type checking
nx check my-app --watch    # Watch mode

# Testing
nx test my-app             # Run tests
nx test my-app --coverage  # With coverage

# Content Collections
nx sync my-app             # Generate content types
```

## Monorepo Workflows

The plugin integrates seamlessly with Nx monorepo features:

```bash
# Run tasks for multiple projects
nx run-many --target=build --projects=app1,app2,app3

# Build all projects
nx run-many --target=build --all

# Build only affected projects (based on git changes)
nx affected --target=build

# View project graph
nx graph
```

## Templates

Choose from starter templates when creating applications:

- **minimal** - Basic starter with essential files
- **blog** - Blog template with content collections
- **portfolio** - Portfolio template for showcasing projects

```bash
nx g @geekvetica/nx-astro:application my-blog --template=blog
nx g @geekvetica/nx-astro:application my-portfolio --template=portfolio
```

## Importing Existing Projects

Migrate existing Astro projects into your Nx workspace with the `import` generator:

```bash
# Import from a local path
nx g @geekvetica/nx-astro:import --source=../my-astro-app

# Import with custom name and directory
nx g @geekvetica/nx-astro:import --source=./external/astro-site --name=my-site --directory=apps/websites

# Import with tags for organization
nx g @geekvetica/nx-astro:import --source=/path/to/app --tags=astro,web,public-facing

# Import with custom TypeScript path alias
nx g @geekvetica/nx-astro:import --source=../app --name=my-app --importPath=@myorg/my-app
```

The import generator automatically:

- Validates the source is a valid Astro project
- Copies all project files (excluding node_modules, build outputs, etc.)
- Creates Nx project configuration with all standard targets (dev, build, preview, check, sync)
- Updates TypeScript path mappings in tsconfig.base.json
- Registers the project in your workspace

After importing:

```bash
# Install dependencies
pnpm install

# Start development
nx dev my-site

# Build for production
nx build my-site
```

## Configuration

### Plugin Configuration

Configure the plugin in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@geekvetica/nx-astro",
      "options": {
        "devTargetName": "dev",
        "buildTargetName": "build",
        "checkTargetName": "check"
      }
    }
  ]
}
```

### Project Configuration

The plugin automatically infers tasks from `astro.config.mjs`. To customize, create a `project.json`:

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
    },
    "build": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "outputPath": "dist/apps/my-app",
        "site": "https://example.com"
      }
    }
  }
}
```

## Shared Libraries

Create shared component libraries for use across multiple Astro apps:

```bash
# Create shared library
nx g @nx/js:library shared-ui --directory=libs/shared-ui

# Configure path aliases in tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@my-org/shared-ui/*": ["libs/shared-ui/src/*"]
    }
  }
}

# Use in any Astro app
import Button from '@my-org/shared-ui/components/Button.astro';
```

## Content Collections

Full support for Astro content collections with type generation:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
  }),
});

export const collections = { blog };
```

```bash
# Generate types
nx sync my-app

# Types are now available
import { getCollection } from 'astro:content';
const posts = await getCollection('blog'); // Fully typed!
```

## SSR Support

Build server-rendered applications:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
```

```bash
nx build my-app
node dist/apps/my-app/server/entry.mjs
```

## Testing

The plugin includes Vitest configuration for testing:

```typescript
// src/components/Button.test.ts
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

```bash
nx test my-app
nx test my-app --coverage
nx test my-app --watch
```

## Performance

Nx caching dramatically improves build times:

```bash
# First build (cold)
nx build my-app
# ✓ Built in 15.3s

# Second build (cached)
nx build my-app
# ✓ Nx read the output from the cache (0.2s)
```

## CI/CD Integration

Optimize your CI pipeline with affected detection:

```yaml
# .github/workflows/ci.yml
- name: Build affected projects
  run: nx affected --target=build --base=origin/main

- name: Test affected projects
  run: nx affected --target=test --base=origin/main
```

## Documentation

### Guides

- **[Generators Guide](../docs/generators.md)** - Create projects and components
- **[Executors Guide](../docs/executors.md)** - Run dev servers, builds, and tests
- **[Configuration Guide](../docs/configuration.md)** - Configure the plugin and projects
- **[Migration Guide](../docs/migration-guide.md)** - Migrate existing Astro projects
- **[Examples](../docs/examples.md)** - Real-world usage examples

### Reference

- **[API Reference](../docs/api-reference.md)** - Complete schemas and types
- **[FAQ](../docs/faq.md)** - Frequently asked questions
- **[Troubleshooting](../docs/troubleshooting.md)** - Common issues and solutions

### Setup

- **[CI/CD Setup Guide](../docs/ci-cd-setup.md)** - Configure continuous integration
- **[E2E Testing Guide](../docs/e2e-testing-guide.md)** - End-to-end testing setup
- **[Architecture](../docs/architecture.md)** - Technical architecture overview

## Requirements

- **Nx**: 21.6.4 or higher
- **Astro**: 5.0.0 or higher
- **Node.js**: 18.0.0 or higher
- **TypeScript**: 5.9.0 or higher

## Generators

| Generator     | Description                                     |
| ------------- | ----------------------------------------------- |
| `init`        | Initialize the nx-astro plugin                  |
| `application` | Create a new Astro application from a template  |
| `import`      | Import an existing Astro project into workspace |
| `component`   | Generate an Astro component                     |

## Executors

| Executor  | Description                       |
| --------- | --------------------------------- |
| `dev`     | Run development server with HMR   |
| `build`   | Build for production              |
| `preview` | Preview production build          |
| `check`   | Run TypeScript type checking      |
| `test`    | Run Vitest tests                  |
| `sync`    | Generate content collection types |

## Examples

### Monorepo with Multiple Sites

```
my-workspace/
├── apps/
│   ├── marketing/      # Main website
│   ├── blog/           # Company blog
│   └── docs/           # Documentation
└── libs/
    └── shared-ui/      # Shared components
```

```bash
# Build all sites
nx run-many --target=build --all

# Run dev servers with different ports
nx dev marketing  # port 4321
nx dev blog       # port 4322
nx dev docs       # port 4323
```

### Blog with Content Collections

```bash
# Create blog
nx g @geekvetica/nx-astro:application my-blog --template=blog

# Generate types for content
nx sync my-blog

# Add posts to src/content/blog/
# Types are automatically updated
```

### Shared Component Library

```bash
# Create library
nx g @nx/js:library shared-ui

# Add components
# libs/shared-ui/src/components/Button.astro
# libs/shared-ui/src/components/Card.astro

# Use in apps
import { Button, Card } from '@my-org/shared-ui';
```

## Community

- **GitHub**: [Report issues](https://github.com/geekvetica/nx-astro/issues)
- **Discussions**: [Ask questions](https://github.com/geekvetica/nx-astro/discussions)
- **Nx Community**: [Join Discord](https://discord.gg/nx)
- **Astro Community**: [Join Discord](https://astro.build/chat)

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT © Geekvetica Paweł Wojciechowski

---

## Support

Having issues? Check the [Troubleshooting Guide](../docs/troubleshooting.md) or [open an issue](https://github.com/geekvetica/nx-astro/issues).

## Changelog

See [releases](https://github.com/geekvetica/nx-astro/releases) for version history.
