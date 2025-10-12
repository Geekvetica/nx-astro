# Configuration Guide

This guide covers how to configure the nx-astro plugin and customize your Astro projects within an Nx workspace.

## Table of Contents

- [Plugin Configuration](#plugin-configuration)
- [Task Inference](#task-inference)
- [Customizing Target Names](#customizing-target-names)
- [Astro Configuration](#astro-configuration)
- [TypeScript Configuration](#typescript-configuration)
- [Project Configuration](#project-configuration)
- [Path Aliases](#path-aliases)
- [Environment Variables](#environment-variables)

---

## Plugin Configuration

The nx-astro plugin is configured in your workspace's `nx.json` file. This configuration controls how the plugin detects and configures Astro projects.

### Basic Setup

After running `nx g @geekvetica/nx-astro:init`, your `nx.json` will include:

```json
{
  "plugins": [
    {
      "plugin": "@geekvetica/nx-astro",
      "options": {}
    }
  ]
}
```

### Plugin Options

The plugin accepts the following configuration options:

```json
{
  "plugins": [
    {
      "plugin": "@geekvetica/nx-astro",
      "options": {
        "devTargetName": "dev",
        "buildTargetName": "build",
        "previewTargetName": "preview",
        "checkTargetName": "check",
        "testTargetName": "test",
        "syncTargetName": "sync"
      }
    }
  ]
}
```

#### Available Options

| Option              | Type     | Default     | Description                           |
| ------------------- | -------- | ----------- | ------------------------------------- |
| `devTargetName`     | `string` | `"dev"`     | Name of the development server target |
| `buildTargetName`   | `string` | `"build"`   | Name of the production build target   |
| `previewTargetName` | `string` | `"preview"` | Name of the preview server target     |
| `checkTargetName`   | `string` | `"check"`   | Name of the type checking target      |
| `testTargetName`    | `string` | `"test"`    | Name of the testing target            |
| `syncTargetName`    | `string` | `"sync"`    | Name of the content sync target       |

### Example: Custom Target Names

If your organization uses different naming conventions:

```json
{
  "plugins": [
    {
      "plugin": "@geekvetica/nx-astro",
      "options": {
        "devTargetName": "serve",
        "buildTargetName": "compile",
        "checkTargetName": "type-check"
      }
    }
  ]
}
```

Now you can run:

```bash
nx serve my-app        # Instead of nx dev my-app
nx compile my-app      # Instead of nx build my-app
nx type-check my-app   # Instead of nx check my-app
```

---

## Task Inference

The nx-astro plugin uses Nx's `createNodesV2` API to automatically infer tasks for your Astro projects. This means you don't need to manually configure targets in `project.json` files.

### How It Works

1. **Detection**: The plugin scans your workspace for files matching `**/astro.config.{mjs,js,ts}`
2. **Configuration Parsing**: For each detected file, the plugin reads and parses the Astro configuration
3. **Task Generation**: Based on the configuration, the plugin creates appropriate Nx targets
4. **Caching Setup**: The plugin configures input/output patterns for optimal caching

### Inferred Tasks

When the plugin detects an Astro project, it automatically creates these targets:

#### Dev Target

```json
{
  "executor": "@geekvetica/nx-astro:dev",
  "options": {
    "port": 4321
  },
  "cache": false
}
```

#### Build Target

```json
{
  "executor": "@geekvetica/nx-astro:build",
  "options": {
    "outputPath": "dist/apps/my-app"
  },
  "outputs": ["{options.outputPath}"],
  "cache": true,
  "dependsOn": ["^build"]
}
```

#### Preview Target

```json
{
  "executor": "@geekvetica/nx-astro:preview",
  "options": {
    "port": 4321
  },
  "cache": false,
  "dependsOn": ["build"]
}
```

#### Check Target

```json
{
  "executor": "@geekvetica/nx-astro:check",
  "cache": true
}
```

#### Test Target

```json
{
  "executor": "@geekvetica/nx-astro:test",
  "cache": true
}
```

#### Sync Target

```json
{
  "executor": "@geekvetica/nx-astro:sync",
  "outputs": ["{projectRoot}/.astro"],
  "cache": true
}
```

### Viewing Inferred Configuration

To see the inferred configuration for a project:

```bash
# View project configuration
nx show project my-app

# View project graph
nx graph
```

### Disabling Task Inference

If you prefer manual configuration, you can remove the plugin from `nx.json` and manually configure targets in `project.json` files.

---

## Customizing Target Names

You can customize the names of inferred targets to match your organization's conventions.

### Workspace-Level Customization

Configure custom names in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "nx-astro",
      "options": {
        "devTargetName": "start",
        "buildTargetName": "bundle",
        "previewTargetName": "serve-prod",
        "checkTargetName": "lint:types",
        "testTargetName": "unit-test",
        "syncTargetName": "generate-types"
      }
    }
  ]
}
```

### Project-Level Overrides

You can override inferred targets on a per-project basis using `project.json`:

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
        "outputPath": "dist/production/my-app",
        "site": "https://example.com",
        "base": "/app"
      },
      "dependsOn": ["sync", "check"]
    }
  }
}
```

When you provide explicit configuration in `project.json`, it takes precedence over inferred configuration.

### Common Customizations

#### Custom Development Port

```json
{
  "targets": {
    "dev": {
      "options": {
        "port": 3000
      }
    }
  }
}
```

#### Custom Build Output

```json
{
  "targets": {
    "build": {
      "options": {
        "outputPath": "build/production",
        "site": "https://example.com"
      }
    }
  }
}
```

#### Add Task Dependencies

```json
{
  "targets": {
    "build": {
      "dependsOn": ["sync", "check", "test", "^build"]
    },
    "deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "command": "netlify deploy --prod --dir=dist/apps/my-app"
      }
    }
  }
}
```

---

## Astro Configuration

Astro is configured via `astro.config.mjs` in your project root. The nx-astro plugin respects all Astro configuration options.

### Basic Configuration

```javascript
// apps/my-app/astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Site URL for SEO and RSS
  site: 'https://example.com',

  // Output mode: 'static' (SSG) or 'server' (SSR)
  output: 'static',

  // Build output directory
  outDir: './dist',

  // Source directory
  srcDir: './src',

  // Public assets directory
  publicDir: './public',
});
```

### SSR Configuration

For server-side rendering:

```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
```

### Integrations

Add framework integrations:

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [react(), tailwind()],
});
```

### Development Server

Configure the dev server:

```javascript
export default defineConfig({
  server: {
    port: 4321,
    host: true, // Listen on all addresses
  },
});
```

### Base Path

For subdirectory deployments (e.g., GitHub Pages):

```javascript
export default defineConfig({
  site: 'https://username.github.io',
  base: '/my-repo',
});
```

### Vite Configuration

Customize Vite (Astro's build tool):

```javascript
export default defineConfig({
  vite: {
    server: {
      fs: {
        strict: false, // Allow serving files outside root
      },
    },
    build: {
      sourcemap: true,
    },
  },
});
```

### Content Collections

For blogs and content-heavy sites:

```javascript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

After defining collections, run:

```bash
nx sync my-app
```

---

## TypeScript Configuration

Configure TypeScript for Astro projects using `tsconfig.json`.

### Basic Configuration

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["astro/client"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", ".astro/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Strict Mode

For maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Framework-Specific Types

#### React

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["astro/client", "@types/react"]
  }
}
```

#### Vue

```json
{
  "compilerOptions": {
    "types": ["astro/client", "@vue/runtime-core"]
  }
}
```

### Extending Workspace TypeScript

In a monorepo, extend the workspace `tsconfig.base.json`:

```json
// tsconfig.base.json (workspace root)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ESNext"],
    "paths": {
      "@shared/*": ["libs/shared/src/*"]
    }
  }
}
```

```json
// apps/my-app/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["astro/client"]
  }
}
```

---

## Project Configuration

Individual projects can be configured via `project.json` or inferred from plugin detection.

### Project.json Structure

```json
{
  "name": "my-app",
  "sourceRoot": "apps/my-app/src",
  "projectType": "application",
  "tags": ["frontend", "astro"],
  "targets": {
    "dev": {
      "executor": "@geekvetica/nx-astro:dev"
    },
    "build": {
      "executor": "@geekvetica/nx-astro:build",
      "outputs": ["{workspaceRoot}/dist/apps/my-app"],
      "dependsOn": ["^build"]
    }
  }
}
```

### Tags

Use tags to organize and filter projects:

```json
{
  "tags": ["frontend", "public-facing", "marketing", "astro"]
}
```

Query by tags:

```bash
# Build all frontend projects
nx run-many --target=build --projects=tag:frontend

# Test all public-facing projects
nx run-many --target=test --projects=tag:public-facing
```

### Implicit Dependencies

Declare dependencies that aren't detected automatically:

```json
{
  "implicitDependencies": ["shared-config", "design-system"]
}
```

### Named Inputs

Define custom input patterns for caching:

```json
{
  "namedInputs": {
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/**/*.test.ts"]
  },
  "targets": {
    "build": {
      "inputs": ["production", "^production"]
    }
  }
}
```

---

## Path Aliases

Configure path aliases for cleaner imports.

### In TypeScript Config

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@layouts/*": ["./src/layouts/*"],
      "@lib/*": ["./src/lib/*"],
      "@shared/*": ["../../libs/shared/src/*"]
    }
  }
}
```

### In Astro Config

Astro respects TypeScript path aliases automatically. No additional configuration needed!

### Usage

```typescript
// Instead of:
import Button from '../../components/ui/Button.astro';
import { formatDate } from '../../../lib/utils';

// Use:
import Button from '@components/ui/Button.astro';
import { formatDate } from '@lib/utils';
```

### Monorepo Path Aliases

In workspace root `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@my-org/shared-ui": ["libs/shared-ui/src/index.ts"],
      "@my-org/utils": ["libs/utils/src/index.ts"]
    }
  }
}
```

Use in any project:

```typescript
import { Button } from '@my-org/shared-ui';
import { formatDate } from '@my-org/utils';
```

---

## Environment Variables

Manage environment variables for different deployment environments.

### Public Variables

Public variables (exposed to the browser) must be prefixed with `PUBLIC_`:

```bash
# .env
PUBLIC_API_URL=https://api.example.com
PUBLIC_ANALYTICS_ID=GA-XXXXXXXXXX
```

Usage in Astro:

```typescript
const apiUrl = import.meta.env.PUBLIC_API_URL;
```

### Server-Only Variables

Variables without `PUBLIC_` prefix are only available on the server:

```bash
# .env
SECRET_API_KEY=abc123
DATABASE_URL=postgresql://...
```

Usage:

```typescript
// Only works in server context (API routes, server components)
const apiKey = import.meta.env.SECRET_API_KEY;
```

### Environment Files

Astro supports environment-specific files:

```
.env                  # Loaded in all cases
.env.local            # Local overrides (gitignored)
.env.production       # Production only
.env.production.local # Production local overrides
```

### Nx Environment Variables

Nx-specific variables:

```bash
# nx.json or .env
NX_CLOUD_ACCESS_TOKEN=your-token
```

### Type Safety

Add types for environment variables:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_ANALYTICS_ID: string;
  readonly SECRET_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Loading Variables

```typescript
// Load at build time
const apiUrl = import.meta.env.PUBLIC_API_URL;

// Validate required variables
if (!import.meta.env.PUBLIC_API_URL) {
  throw new Error('PUBLIC_API_URL is required');
}
```

---

## Advanced Configuration

### Multi-Environment Builds

Build for different environments:

```json
{
  "targets": {
    "build:staging": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "site": "https://staging.example.com",
        "outputPath": "dist/staging"
      }
    },
    "build:production": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "site": "https://example.com",
        "outputPath": "dist/production"
      }
    }
  }
}
```

### Custom Cache Configuration

Fine-tune caching behavior:

```json
{
  "targets": {
    "build": {
      "cache": true,
      "inputs": ["production", "^production", "{projectRoot}/astro.config.mjs", "{projectRoot}/tsconfig.json", "{workspaceRoot}/.env.production"],
      "outputs": ["{workspaceRoot}/dist/{projectRoot}"]
    }
  }
}
```

### Parallel Execution Limits

Control parallel execution:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "options": {
        "parallel": 3,
        "cacheableOperations": ["build", "check", "test", "sync"]
      }
    }
  }
}
```

### Task Pipelines

Define task execution order:

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["sync", "check", "^build"]
    },
    "preview": {
      "dependsOn": ["build"]
    },
    "deploy": {
      "dependsOn": ["build", "test"]
    }
  }
}
```

---

## Configuration Examples

### Blog Project

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.example.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
```

```json
// project.json
{
  "targets": {
    "build": {
      "dependsOn": ["sync", "check"]
    },
    "deploy": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "netlify deploy --prod --dir=dist/apps/blog"
      }
    }
  }
}
```

### Marketing Site with Preview Environments

```javascript
// astro.config.mjs
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  output: 'static',
  integrations: [tailwind(), react()],
});
```

```json
// project.json
{
  "targets": {
    "build:preview": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "site": "https://preview.example.com",
        "outputPath": "dist/preview"
      }
    },
    "build:prod": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "site": "https://example.com",
        "outputPath": "dist/production"
      }
    }
  }
}
```

### SSR Application

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  server: {
    port: 3000,
    host: true,
  },
});
```

---

## Troubleshooting Configuration

### Task Not Found

If Nx can't find a task:

```bash
# Check if the project is detected
nx show projects

# View project configuration
nx show project my-app

# Check plugin is registered
cat nx.json | grep @geekvetica/nx-astro
```

### Configuration Not Applied

If changes aren't taking effect:

```bash
# Clear Nx cache
nx reset

# Restart Nx daemon
nx daemon --stop
nx daemon --start

# Verify configuration
nx show project my-app --web
```

### Path Aliases Not Working

If imports fail:

1. Check `tsconfig.json` has correct paths
2. Ensure `baseUrl` is set
3. Restart TypeScript server in your IDE
4. Clear Nx cache: `nx reset`

---

## Next Steps

- Learn about [Generators](./generators.md) to create projects
- Explore [Executors](./executors.md) for running tasks
- See [Examples](./examples.md) for complete configurations
- Review [API Reference](./api-reference.md) for detailed schemas
