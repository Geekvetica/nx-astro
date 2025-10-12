# API Reference

Complete technical reference for the nx-astro plugin including all schemas, types, and configuration options.

## Table of Contents

- [Generator Schemas](#generator-schemas)
- [Executor Schemas](#executor-schemas)
- [Plugin Options Schema](#plugin-options-schema)
- [TypeScript Types](#typescript-types)

---

## Generator Schemas

### Init Generator

Initialize the nx-astro plugin in an Nx workspace.

**Schema ID**: `NxAstroInit`

#### Properties

| Property          | Type      | Default | Required | Description                                    |
| ----------------- | --------- | ------- | -------- | ---------------------------------------------- |
| `skipPackageJson` | `boolean` | `false` | No       | Skip adding Astro dependencies to package.json |

#### Usage

```bash
nx g @geekvetica/nx-astro:init
nx g @geekvetica/nx-astro:init --skipPackageJson
```

#### JSON Schema

```json
{
  "$schema": "https://json-schema.org/schema",
  "$id": "NxAstroInit",
  "title": "Initialize the nx-astro plugin",
  "description": "Initialize the nx-astro plugin in an Nx workspace by registering the plugin and installing dependencies.",
  "type": "object",
  "properties": {
    "skipPackageJson": {
      "type": "boolean",
      "description": "Skip adding Astro dependencies to package.json",
      "default": false
    }
  },
  "additionalProperties": false
}
```

---

### Application Generator

Create or import an Astro application.

**Schema ID**: `NxAstroApplication`

#### Properties

| Property         | Type      | Default     | Required | Description                                                          |
| ---------------- | --------- | ----------- | -------- | -------------------------------------------------------------------- |
| `name`           | `string`  | -           | **Yes**  | Application name (must match pattern: `^[a-zA-Z][a-zA-Z0-9-]*$`)     |
| `directory`      | `string`  | -           | No       | Directory where the application will be placed (e.g., 'apps/my-app') |
| `tags`           | `string`  | -           | No       | Tags to add to the project (comma-separated)                         |
| `importExisting` | `boolean` | `false`     | No       | Import an existing Astro project into the workspace                  |
| `template`       | `string`  | `"minimal"` | No       | Starter template: `minimal`, `blog`, or `portfolio`                  |
| `skipFormat`     | `boolean` | `false`     | No       | Skip formatting files after generation                               |

#### Template Options

- **minimal**: Basic starter with essential files
- **blog**: Blog template with content collections
- **portfolio**: Portfolio template with project showcase

#### Usage

```bash
# Create minimal app
nx g @geekvetica/nx-astro:application my-app

# Create blog
nx g @geekvetica/nx-astro:application my-blog --template=blog

# Import existing project
nx g @geekvetica/nx-astro:application existing-app --importExisting

# Custom directory
nx g @geekvetica/nx-astro:application my-app --directory=apps/sites/my-app
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "NxAstroApplication",
  "title": "Create or import an Astro application",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Application name",
      "$default": { "$source": "argv", "index": 0 },
      "x-prompt": "What name would you like to use for the application?",
      "pattern": "^[a-zA-Z][a-zA-Z0-9-]*$"
    },
    "directory": {
      "type": "string",
      "description": "Directory where the application will be placed (e.g., 'apps/my-app')"
    },
    "tags": {
      "type": "string",
      "description": "Tags to add to the project (comma-separated)"
    },
    "importExisting": {
      "type": "boolean",
      "description": "Import an existing Astro project into the workspace",
      "default": false
    },
    "template": {
      "type": "string",
      "description": "Starter template to use",
      "enum": ["minimal", "blog", "portfolio"],
      "default": "minimal",
      "x-prompt": {
        "message": "Which template would you like to use?",
        "type": "list",
        "items": [
          { "value": "minimal", "label": "Minimal - A basic starter template" },
          { "value": "blog", "label": "Blog - A blog template with content collections" },
          { "value": "portfolio", "label": "Portfolio - A portfolio template" }
        ]
      }
    },
    "skipFormat": {
      "type": "boolean",
      "description": "Skip formatting files after generation",
      "default": false
    }
  },
  "required": ["name"]
}
```

---

### Component Generator

Generate an Astro component.

**Schema ID**: `NxAstroComponent`

#### Properties

| Property     | Type      | Default | Required | Description                                                  |
| ------------ | --------- | ------- | -------- | ------------------------------------------------------------ |
| `name`       | `string`  | -       | **Yes**  | Component name (pattern: `^[a-zA-Z][a-zA-Z0-9-_]*$`)         |
| `project`    | `string`  | -       | **Yes**  | The name of the Astro project                                |
| `directory`  | `string`  | -       | No       | Directory path within `src/components` (e.g., 'ui', 'forms') |
| `export`     | `boolean` | `false` | No       | Add an export to `src/components/index.ts`                   |
| `skipFormat` | `boolean` | `false` | No       | Skip formatting files after generation                       |

#### Usage

```bash
# Create component
nx g @geekvetica/nx-astro:component Button --project=my-app

# Create in subdirectory
nx g @geekvetica/nx-astro:component Card --project=my-app --directory=ui

# Create and export
nx g @geekvetica/nx-astro:component Button --project=my-app --export
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "NxAstroComponent",
  "title": "Create an Astro component",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Component name",
      "$default": { "$source": "argv", "index": 0 },
      "x-prompt": "What name would you like to use for the component?",
      "pattern": "^[a-zA-Z][a-zA-Z0-9-_]*$"
    },
    "project": {
      "type": "string",
      "description": "The name of the Astro project",
      "$default": { "$source": "projectName" },
      "x-prompt": "What is the name of the Astro project?",
      "x-dropdown": "projects"
    },
    "directory": {
      "type": "string",
      "description": "Directory path within src/components where the component will be placed (e.g., 'ui', 'forms', 'ui/buttons')"
    },
    "export": {
      "type": "boolean",
      "description": "Add an export to src/components/index.ts",
      "default": false
    },
    "skipFormat": {
      "type": "boolean",
      "description": "Skip formatting files after generation",
      "default": false
    }
  },
  "required": ["name", "project"]
}
```

---

## Executor Schemas

### Dev Executor

Run Astro development server with Hot Module Replacement (HMR).

**Schema ID**: `NxAstroDev`

#### Properties

| Property         | Type                | Default              | Description                                |
| ---------------- | ------------------- | -------------------- | ------------------------------------------ |
| `port`           | `number`            | `4321`               | Development server port                    |
| `host`           | `string \| boolean` | `"localhost"`        | Host address to bind the server to         |
| `open`           | `string \| boolean` | `false`              | Open browser on server start               |
| `root`           | `string`            | project root         | Project root path (usually provided by Nx) |
| `config`         | `string`            | `"astro.config.mjs"` | Path to Astro config file                  |
| `site`           | `string`            | -                    | Site URL for absolute URLs                 |
| `base`           | `string`            | -                    | Base path for deployment                   |
| `verbose`        | `boolean`           | `false`              | Enable verbose output                      |
| `additionalArgs` | `string[]`          | -                    | Additional CLI arguments to pass to Astro  |

#### Usage

```bash
nx dev my-app
nx dev my-app --port=3000
nx dev my-app --host=true --open
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "NxAstroDev",
  "title": "Run Astro development server",
  "description": "Runs the Astro development server with Hot Module Replacement (HMR) using the `astro dev` command",
  "type": "object",
  "properties": {
    "port": {
      "type": "number",
      "description": "Development server port",
      "default": 4321
    },
    "host": {
      "oneOf": [{ "type": "string" }, { "type": "boolean" }],
      "description": "Host address to bind the server to (default: localhost)"
    },
    "open": {
      "oneOf": [{ "type": "string" }, { "type": "boolean" }],
      "description": "Open browser on server start",
      "default": false
    },
    "root": {
      "type": "string",
      "description": "Project root path (usually provided by Nx)"
    },
    "config": {
      "type": "string",
      "description": "Path to Astro config file",
      "default": "astro.config.mjs"
    },
    "site": {
      "type": "string",
      "description": "Site URL for absolute URLs"
    },
    "base": {
      "type": "string",
      "description": "Base path for deployment"
    },
    "verbose": {
      "type": "boolean",
      "description": "Enable verbose output",
      "default": false
    },
    "additionalArgs": {
      "type": "array",
      "description": "Additional CLI arguments to pass to Astro",
      "items": { "type": "string" }
    }
  },
  "required": []
}
```

---

### Build Executor

Build an Astro project for production.

**Schema ID**: `NxAstroBuild`

#### Properties

| Property         | Type       | Default              | Description                           |
| ---------------- | ---------- | -------------------- | ------------------------------------- |
| `outputPath`     | `string`   | from config          | Override the default output directory |
| `mode`           | `string`   | -                    | Build mode: 'static' or 'server'      |
| `root`           | `string`   | project root         | Project root path                     |
| `config`         | `string`   | `"astro.config.mjs"` | Path to Astro config file             |
| `site`           | `string`   | -                    | Site URL for absolute URLs            |
| `base`           | `string`   | -                    | Base path for deployment              |
| `sourcemap`      | `boolean`  | `false`              | Generate source maps                  |
| `clean`          | `boolean`  | `true`               | Clean output directory before build   |
| `verbose`        | `boolean`  | `false`              | Enable verbose output                 |
| `additionalArgs` | `string[]` | -                    | Additional CLI arguments              |

#### Usage

```bash
nx build my-app
nx build my-app --outputPath=dist/custom
nx build my-app --sourcemap --verbose
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "NxAstroBuild",
  "title": "Build an Astro project for production",
  "description": "Builds an Astro project using the `astro build` command",
  "type": "object",
  "properties": {
    "outputPath": {
      "type": "string",
      "description": "Override the default output directory (default from astro.config)"
    },
    "mode": {
      "type": "string",
      "enum": ["static", "server"],
      "description": "Build mode: 'static' for static site generation, 'server' for SSR"
    },
    "root": {
      "type": "string",
      "description": "Project root path (usually provided by Nx)"
    },
    "config": {
      "type": "string",
      "description": "Path to Astro config file",
      "default": "astro.config.mjs"
    },
    "site": {
      "type": "string",
      "description": "Site URL for absolute URLs"
    },
    "base": {
      "type": "string",
      "description": "Base path for deployment"
    },
    "sourcemap": {
      "type": "boolean",
      "description": "Generate source maps",
      "default": false
    },
    "clean": {
      "type": "boolean",
      "description": "Clean output directory before build",
      "default": true
    },
    "verbose": {
      "type": "boolean",
      "description": "Enable verbose output",
      "default": false
    },
    "additionalArgs": {
      "type": "array",
      "description": "Additional CLI arguments to pass to Astro",
      "items": { "type": "string" }
    }
  },
  "required": []
}
```

---

### Preview Executor

Preview a built Astro project.

**Schema ID**: `NxAstroPreview`

#### Properties

| Property         | Type                | Default              | Description               |
| ---------------- | ------------------- | -------------------- | ------------------------- |
| `port`           | `number`            | `4321`               | Preview server port       |
| `host`           | `string \| boolean` | `"localhost"`        | Host address              |
| `root`           | `string`            | project root         | Project root path         |
| `config`         | `string`            | `"astro.config.mjs"` | Path to Astro config      |
| `outputPath`     | `string`            | from config          | Output directory to serve |
| `site`           | `string`            | -                    | Site URL                  |
| `base`           | `string`            | -                    | Base path                 |
| `open`           | `string \| boolean` | `false`              | Open browser              |
| `verbose`        | `boolean`           | `false`              | Verbose output            |
| `additionalArgs` | `string[]`          | -                    | Additional arguments      |

#### Usage

```bash
nx preview my-app
nx preview my-app --port=3000 --open
```

---

### Check Executor

Run Astro type checking and diagnostics.

**Schema ID**: `NxAstroCheck`

#### Properties

| Property         | Type       | Default              | Description                               |
| ---------------- | ---------- | -------------------- | ----------------------------------------- |
| `watch`          | `boolean`  | `false`              | Run in watch mode for continuous checking |
| `tsconfig`       | `string`   | `"tsconfig.json"`    | Path to TypeScript config                 |
| `root`           | `string`   | project root         | Project root path                         |
| `config`         | `string`   | `"astro.config.mjs"` | Path to Astro config                      |
| `verbose`        | `boolean`  | `false`              | Verbose output                            |
| `additionalArgs` | `string[]` | -                    | Additional arguments                      |

#### Usage

```bash
nx check my-app
nx check my-app --watch
nx check my-app --verbose
```

---

### Test Executor

Run tests using Vitest for an Astro project.

**Schema ID**: `NxAstroTest`

#### Properties

| Property          | Type       | Default               | Description                        |
| ----------------- | ---------- | --------------------- | ---------------------------------- |
| `testPathPattern` | `string`   | -                     | Test file pattern to match (regex) |
| `watch`           | `boolean`  | `false`               | Watch mode for continuous testing  |
| `coverage`        | `boolean`  | `false`               | Generate coverage reports          |
| `ci`              | `boolean`  | `false`               | CI mode (non-interactive)          |
| `root`            | `string`   | project root          | Project root path                  |
| `config`          | `string`   | `"vitest.config.mjs"` | Path to Vitest config              |
| `reporter`        | `string`   | `"default"`           | Reporter to use                    |
| `run`             | `boolean`  | -                     | Run tests once and exit            |
| `verbose`         | `boolean`  | `false`               | Verbose output                     |
| `additionalArgs`  | `string[]` | -                     | Additional arguments               |

#### Usage

```bash
nx test my-app
nx test my-app --coverage
nx test my-app --watch
nx test my-app --ci
```

---

### Sync Executor

Generate TypeScript types for Content Collections and Astro features.

**Schema ID**: `NxAstroSync`

#### Properties

| Property         | Type       | Default              | Description          |
| ---------------- | ---------- | -------------------- | -------------------- |
| `root`           | `string`   | project root         | Project root path    |
| `config`         | `string`   | `"astro.config.mjs"` | Path to Astro config |
| `verbose`        | `boolean`  | `false`              | Verbose output       |
| `additionalArgs` | `string[]` | -                    | Additional arguments |

#### Usage

```bash
nx sync my-app
nx sync my-app --verbose
```

---

## Plugin Options Schema

Configuration options for the nx-astro plugin in `nx.json`.

### Properties

| Property            | Type     | Default     | Description                           |
| ------------------- | -------- | ----------- | ------------------------------------- |
| `devTargetName`     | `string` | `"dev"`     | Name of the development server target |
| `buildTargetName`   | `string` | `"build"`   | Name of the production build target   |
| `previewTargetName` | `string` | `"preview"` | Name of the preview server target     |
| `checkTargetName`   | `string` | `"check"`   | Name of the type checking target      |
| `testTargetName`    | `string` | `"test"`    | Name of the testing target            |
| `syncTargetName`    | `string` | `"sync"`    | Name of the content sync target       |

### Usage

```json
{
  "plugins": [
    {
      "plugin": "nx-astro",
      "options": {
        "devTargetName": "serve",
        "buildTargetName": "compile",
        "checkTargetName": "type-check"
      }
    }
  ]
}
```

### TypeScript Interface

```typescript
export interface AstroPluginOptions {
  devTargetName?: string;
  buildTargetName?: string;
  previewTargetName?: string;
  checkTargetName?: string;
  testTargetName?: string;
  syncTargetName?: string;
}
```

---

## TypeScript Types

### Plugin Options

```typescript
// src/types/plugin-options.ts

export interface AstroPluginOptions {
  /**
   * Name of the target for running the Astro development server.
   * @default "dev"
   */
  devTargetName?: string;

  /**
   * Name of the target for building the Astro project for production.
   * @default "build"
   */
  buildTargetName?: string;

  /**
   * Name of the target for previewing the built Astro project.
   * @default "preview"
   */
  previewTargetName?: string;

  /**
   * Name of the target for running Astro type checking.
   * @default "check"
   */
  checkTargetName?: string;

  /**
   * Name of the target for running tests.
   * @default "test"
   */
  testTargetName?: string;

  /**
   * Name of the target for syncing content collections.
   * @default "sync"
   */
  syncTargetName?: string;
}
```

### Generator Schemas

```typescript
// Init Generator
export interface InitGeneratorSchema {
  skipPackageJson?: boolean;
}

// Application Generator
export interface ApplicationGeneratorSchema {
  name: string;
  directory?: string;
  tags?: string;
  importExisting?: boolean;
  template?: 'minimal' | 'blog' | 'portfolio';
  skipFormat?: boolean;
}

// Component Generator
export interface ComponentGeneratorSchema {
  name: string;
  project: string;
  directory?: string;
  export?: boolean;
  skipFormat?: boolean;
}
```

### Executor Schemas

```typescript
// Dev Executor
export interface DevExecutorSchema {
  port?: number;
  host?: string | boolean;
  open?: string | boolean;
  root?: string;
  config?: string;
  site?: string;
  base?: string;
  verbose?: boolean;
  additionalArgs?: string[];
}

// Build Executor
export interface BuildExecutorSchema {
  outputPath?: string;
  mode?: 'static' | 'server';
  root?: string;
  config?: string;
  site?: string;
  base?: string;
  sourcemap?: boolean;
  clean?: boolean;
  verbose?: boolean;
  additionalArgs?: string[];
}

// Preview Executor
export interface PreviewExecutorSchema {
  port?: number;
  host?: string | boolean;
  root?: string;
  config?: string;
  outputPath?: string;
  site?: string;
  base?: string;
  open?: string | boolean;
  verbose?: boolean;
  additionalArgs?: string[];
}

// Check Executor
export interface CheckExecutorSchema {
  watch?: boolean;
  tsconfig?: string;
  root?: string;
  config?: string;
  verbose?: boolean;
  additionalArgs?: string[];
}

// Test Executor
export interface TestExecutorSchema {
  testPathPattern?: string;
  watch?: boolean;
  coverage?: boolean;
  ci?: boolean;
  root?: string;
  config?: string;
  reporter?: string;
  run?: boolean;
  verbose?: boolean;
  additionalArgs?: string[];
}

// Sync Executor
export interface SyncExecutorSchema {
  root?: string;
  config?: string;
  verbose?: boolean;
  additionalArgs?: string[];
}
```

---

## Task Inference

The plugin uses `createNodesV2` to automatically infer tasks.

### Detection Pattern

```typescript
export const ASTRO_CONFIG_GLOB = '**/astro.config.{mjs,js,ts}';
```

### Inferred Target Structure

```typescript
interface InferredTarget {
  executor: string;
  options?: Record<string, any>;
  inputs?: string[];
  outputs?: string[];
  cache?: boolean;
  dependsOn?: string[];
}
```

### Example Inferred Configuration

```typescript
const inferredTasks = {
  dev: {
    executor: '@geekvetica/nx-astro:dev',
    options: { port: 4321 },
    cache: false,
  },
  build: {
    executor: '@geekvetica/nx-astro:build',
    outputs: ['{options.outputPath}'],
    cache: true,
    dependsOn: ['^build'],
  },
  preview: {
    executor: '@geekvetica/nx-astro:preview',
    cache: false,
    dependsOn: ['build'],
  },
  check: {
    executor: '@geekvetica/nx-astro:check',
    cache: true,
  },
  test: {
    executor: '@geekvetica/nx-astro:test',
    cache: true,
  },
  sync: {
    executor: '@geekvetica/nx-astro:sync',
    outputs: ['{projectRoot}/.astro'],
    cache: true,
  },
};
```

---

## Next Steps

- [Configuration Guide](./configuration.md) - Configure your projects
- [Generators Guide](./generators.md) - Use generators
- [Executors Guide](./executors.md) - Run tasks
- [Examples](./examples.md) - See real-world usage
