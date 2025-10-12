# Nx-Astro Plugin Architecture

## Executive Summary

The Nx-Astro plugin provides seamless integration between Astro framework and Nx monorepos. This architecture document defines a modular, extensible plugin structure that leverages Nx's task caching, project graph integration, and code generation capabilities while preserving Astro's developer experience.

### Key Architectural Decisions

- **Inference-based task discovery** via `createNodesV2` for automatic project detection
- **Schema-driven generators and executors** for type-safe configuration
- **Minimal abstraction over Astro CLI** to preserve native capabilities
- **Comprehensive caching strategy** leveraging Nx's computation memoization
- **TypeScript-first** approach with complete type definitions

### Expected Benefits

- Zero-configuration task inference for Astro projects
- Optimal build caching and incremental builds
- Seamless integration with Nx dependency graph
- Type-safe configuration and code generation
- Cross-platform compatibility

### Trade-offs

- Slight overhead for simple Astro projects (offset by caching benefits)
- Requires maintaining compatibility with Astro CLI changes
- Additional complexity for edge cases in configuration parsing

## 1. Plugin File Structure

```
nx-astro/
├── src/
│   ├── index.ts                          # Main plugin export
│   ├── plugin.ts                          # createNodesV2 implementation
│   ├── plugin.spec.ts                    # Plugin tests
│   │
│   ├── generators/                       # Code generation templates
│   │   ├── init/
│   │   │   ├── init.ts                   # Generator implementation
│   │   │   ├── init.spec.ts              # Generator tests
│   │   │   ├── schema.d.ts               # TypeScript schema
│   │   │   ├── schema.json               # JSON schema
│   │   │   └── files/                    # Template files
│   │   │
│   │   ├── application/
│   │   │   ├── application.ts
│   │   │   ├── application.spec.ts
│   │   │   ├── schema.d.ts
│   │   │   ├── schema.json
│   │   │   └── files/
│   │   │       ├── astro.config.mjs__template__
│   │   │       ├── src/
│   │   │       │   ├── pages/
│   │   │       │   │   └── index.astro__template__
│   │   │       │   ├── components/
│   │   │       │   └── layouts/
│   │   │       ├── public/
│   │   │       ├── .gitignore__template__
│   │   │       ├── package.json__template__
│   │   │       ├── tsconfig.json__template__
│   │   │       └── README.md__template__
│   │   │
│   │   └── component/
│   │       ├── component.ts
│   │       ├── component.spec.ts
│   │       ├── schema.d.ts
│   │       ├── schema.json
│   │       └── files/
│   │           └── __fileName__.astro__template__
│   │
│   ├── executors/                        # Task runners
│   │   ├── dev/
│   │   │   ├── dev.impl.ts               # Executor implementation
│   │   │   ├── dev.impl.spec.ts          # Executor tests
│   │   │   ├── schema.d.ts               # TypeScript schema
│   │   │   └── schema.json               # JSON schema
│   │   │
│   │   ├── build/
│   │   │   ├── build.impl.ts
│   │   │   ├── build.impl.spec.ts
│   │   │   ├── schema.d.ts
│   │   │   └── schema.json
│   │   │
│   │   ├── preview/
│   │   │   ├── preview.impl.ts
│   │   │   ├── preview.impl.spec.ts
│   │   │   ├── schema.d.ts
│   │   │   └── schema.json
│   │   │
│   │   ├── check/
│   │   │   ├── check.impl.ts
│   │   │   ├── check.impl.spec.ts
│   │   │   ├── schema.d.ts
│   │   │   └── schema.json
│   │   │
│   │   ├── test/
│   │   │   ├── test.impl.ts
│   │   │   ├── test.impl.spec.ts
│   │   │   ├── schema.d.ts
│   │   │   └── schema.json
│   │   │
│   │   └── sync/
│   │       ├── sync.impl.ts
│   │       ├── sync.impl.spec.ts
│   │       ├── schema.d.ts
│   │       └── schema.json
│   │
│   ├── utils/                            # Shared utilities
│   │   ├── astro-config.ts               # Astro config parsing
│   │   ├── astro-config.spec.ts
│   │   ├── project-configuration.ts      # Nx project config helpers
│   │   ├── project-configuration.spec.ts
│   │   ├── versions.ts                   # Package version management
│   │   ├── ast-utils.ts                  # AST manipulation utilities
│   │   ├── ast-utils.spec.ts
│   │   └── executor-utils.ts             # Common executor functions
│   │
│   └── migrations/                       # Plugin version migrations
│       └── update-1.0.0/
│           └── update-astro-config.ts
│
├── generators.json                       # Generator registry
├── executors.json                        # Executor registry
├── migrations.json                       # Migration registry
├── package.json
├── README.md
├── jest.config.ts
├── tsconfig.json
├── tsconfig.lib.json
└── tsconfig.spec.json
```

## 2. Generator Schemas

### 2.1 Init Generator

Registers the Nx-Astro plugin in the workspace and installs required dependencies.

```typescript
// generators/init/schema.d.ts
export interface InitGeneratorSchema {
  /**
   * Skip adding plugin to nx.json
   * @default false
   */
  skipNxJson?: boolean;

  /**
   * Skip package installation
   * @default false
   */
  skipPackageJson?: boolean;

  /**
   * Astro version to install
   * @default "latest"
   */
  astroVersion?: string;

  /**
   * Additional Astro integrations to install globally
   */
  integrations?: Array<'react' | 'vue' | 'svelte' | 'solid' | 'preact' | 'tailwind' | 'mdx'>;

  /**
   * Package manager to use
   * @default "pnpm"
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}
```

```json
// generators/init/schema.json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "NxAstroInit",
  "title": "Initialize Nx-Astro Plugin",
  "type": "object",
  "properties": {
    "skipNxJson": {
      "type": "boolean",
      "default": false,
      "description": "Skip adding plugin to nx.json"
    },
    "skipPackageJson": {
      "type": "boolean",
      "default": false,
      "description": "Skip package installation"
    },
    "astroVersion": {
      "type": "string",
      "default": "latest",
      "description": "Astro version to install"
    },
    "integrations": {
      "type": "array",
      "description": "Additional Astro integrations to install",
      "items": {
        "type": "string",
        "enum": ["react", "vue", "svelte", "solid", "preact", "tailwind", "mdx"]
      }
    },
    "packageManager": {
      "type": "string",
      "enum": ["npm", "yarn", "pnpm"],
      "default": "pnpm",
      "description": "Package manager to use"
    }
  },
  "required": []
}
```

### 2.2 Application Generator

Creates new Astro applications or imports existing ones into the Nx workspace.

```typescript
// generators/application/schema.d.ts
export interface ApplicationGeneratorSchema {
  /**
   * Application name
   */
  name: string;

  /**
   * Directory where the application will be placed
   */
  directory?: string;

  /**
   * Tags to add to the project
   */
  tags?: string;

  /**
   * Port for development server
   * @default 4321
   */
  port?: number;

  /**
   * Astro output mode
   * @default "static"
   */
  output?: 'static' | 'server' | 'hybrid';

  /**
   * Server adapter for SSR/hybrid mode
   */
  adapter?: 'node' | 'netlify' | 'vercel' | 'cloudflare' | 'deno';

  /**
   * UI framework integrations
   */
  integrations?: Array<'react' | 'vue' | 'svelte' | 'solid' | 'preact'>;

  /**
   * Styling solution
   * @default "css"
   */
  style?: 'css' | 'scss' | 'tailwind';

  /**
   * Include MDX support
   * @default false
   */
  mdx?: boolean;

  /**
   * TypeScript configuration
   * @default "strict"
   */
  tsconfig?: 'strict' | 'strictest' | 'relaxed';

  /**
   * Include example pages
   * @default true
   */
  includeExamples?: boolean;

  /**
   * Initialize git repository (for importing existing projects)
   * @default false
   */
  initGit?: boolean;

  /**
   * Path to existing Astro project to import
   */
  importPath?: string;

  /**
   * Configure for unit testing with Vitest
   * @default false
   */
  unitTestRunner?: 'vitest' | 'none';

  /**
   * Configure for e2e testing
   * @default "none"
   */
  e2eTestRunner?: 'playwright' | 'cypress' | 'none';

  /**
   * Set up project for linting
   * @default true
   */
  linter?: boolean;

  /**
   * Skip format files with Prettier
   * @default false
   */
  skipFormat?: boolean;

  /**
   * Generate project in standalone mode (own package.json)
   * @default false
   */
  standalone?: boolean;
}
```

### 2.3 Component Generator

Generates Astro components with various options.

```typescript
// generators/component/schema.d.ts
export interface ComponentGeneratorSchema {
  /**
   * Component name
   */
  name: string;

  /**
   * Project where component will be created
   */
  project: string;

  /**
   * Directory within project (relative to src/components)
   */
  directory?: string;

  /**
   * Component type
   * @default "astro"
   */
  type?: 'astro' | 'react' | 'vue' | 'svelte' | 'solid' | 'preact';

  /**
   * Include client directive for framework components
   */
  clientDirective?: 'load' | 'idle' | 'visible' | 'media' | 'only' | 'none';

  /**
   * Generate TypeScript props interface
   * @default false
   */
  withProps?: boolean;

  /**
   * Props interface definition (when withProps is true)
   */
  props?: Array<{
    name: string;
    type: string;
    required?: boolean;
    default?: string;
  }>;

  /**
   * Include component styles
   * @default true
   */
  withStyles?: boolean;

  /**
   * Style scope
   * @default "scoped"
   */
  styleScope?: 'scoped' | 'global';

  /**
   * Generate test file
   * @default false
   */
  withTest?: boolean;

  /**
   * Generate story file for Storybook
   * @default false
   */
  withStory?: boolean;

  /**
   * Export component from index file
   * @default false
   */
  export?: boolean;

  /**
   * Skip format files with Prettier
   * @default false
   */
  skipFormat?: boolean;
}
```

## 3. Executor Schemas

### 3.1 Dev Executor

Runs Astro development server with hot module replacement.

```typescript
// executors/dev/schema.d.ts
export interface DevExecutorSchema {
  /**
   * Port to run dev server on
   * @default 4321
   */
  port?: number;

  /**
   * Host to bind server to
   * @default "localhost"
   */
  host?: string | boolean;

  /**
   * Path to Astro config file
   * @default "astro.config.mjs"
   */
  config?: string;

  /**
   * Project root directory
   * @default project root
   */
  root?: string;

  /**
   * Site URL for absolute URLs
   */
  site?: string;

  /**
   * Base path for deployment
   */
  base?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Disable HMR
   * @default false
   */
  disableHmr?: boolean;

  /**
   * Open browser on server start
   * @default false
   */
  open?: boolean;

  /**
   * Force quit on SIGTERM
   * @default false
   */
  force?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];
}
```

### 3.2 Build Executor

Builds Astro application for production deployment.

```typescript
// executors/build/schema.d.ts
export interface BuildExecutorSchema {
  /**
   * Output directory
   * @default "dist"
   */
  outputPath?: string;

  /**
   * Path to Astro config file
   * @default "astro.config.mjs"
   */
  config?: string;

  /**
   * Project root directory
   * @default project root
   */
  root?: string;

  /**
   * Site URL for absolute URLs
   */
  site?: string;

  /**
   * Base path for deployment
   */
  base?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Build mode
   * @default "production"
   */
  mode?: 'development' | 'production';

  /**
   * Force quit on SIGTERM
   * @default false
   */
  force?: boolean;

  /**
   * Generate source maps
   * @default false
   */
  sourcemap?: boolean;

  /**
   * Clean output directory before build
   * @default true
   */
  clean?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];

  /**
   * Generate stats.json for bundle analysis
   * @default false
   */
  stats?: boolean;
}
```

### 3.3 Preview Executor

Serves the built application locally for testing.

```typescript
// executors/preview/schema.d.ts
export interface PreviewExecutorSchema {
  /**
   * Port to run preview server on
   * @default 3000
   */
  port?: number;

  /**
   * Host to bind server to
   * @default "localhost"
   */
  host?: string | boolean;

  /**
   * Path to Astro config file
   * @default "astro.config.mjs"
   */
  config?: string;

  /**
   * Project root directory
   * @default project root
   */
  root?: string;

  /**
   * Output directory to serve
   * @default "dist"
   */
  outputPath?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Open browser on server start
   * @default false
   */
  open?: boolean;

  /**
   * Force quit on SIGTERM
   * @default false
   */
  force?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];
}
```

### 3.4 Check Executor

Performs type checking and diagnostics on Astro project.

```typescript
// executors/check/schema.d.ts
export interface CheckExecutorSchema {
  /**
   * Path to Astro config file
   * @default "astro.config.mjs"
   */
  config?: string;

  /**
   * Project root directory
   * @default project root
   */
  root?: string;

  /**
   * Path to TypeScript config
   * @default "tsconfig.json"
   */
  tsconfig?: string;

  /**
   * Minimum diagnostic level to report
   * @default "hint"
   */
  minimumSeverity?: 'hint' | 'warning' | 'error';

  /**
   * Minimum diagnostic level to fail on
   * @default "error"
   */
  minimumFailingSeverity?: 'hint' | 'warning' | 'error';

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Force quit on SIGTERM
   * @default false
   */
  force?: boolean;

  /**
   * Watch mode for continuous checking
   * @default false
   */
  watch?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];
}
```

### 3.5 Test Executor

Runs Vitest tests for Astro project.

```typescript
// executors/test/schema.d.ts
export interface TestExecutorSchema {
  /**
   * Project root directory
   * @default project root
   */
  root?: string;

  /**
   * Vitest config file
   * @default "vitest.config.mjs"
   */
  config?: string;

  /**
   * Run tests in watch mode
   * @default false
   */
  watch?: boolean;

  /**
   * Generate coverage report
   * @default false
   */
  coverage?: boolean;

  /**
   * Coverage reporter
   * @default ["text", "html"]
   */
  coverageReporters?: string[];

  /**
   * Update snapshots
   * @default false
   */
  updateSnapshots?: boolean;

  /**
   * Run tests in UI mode
   * @default false
   */
  ui?: boolean;

  /**
   * Test file pattern
   */
  testPattern?: string;

  /**
   * Test name pattern
   */
  testNamePattern?: string;

  /**
   * Bail after N test failures
   */
  bail?: number;

  /**
   * Maximum worker threads
   */
  maxWorkers?: number;

  /**
   * Minimum worker threads
   */
  minWorkers?: number;

  /**
   * Additional CLI arguments to pass to Vitest
   */
  additionalArgs?: string[];
}
```

### 3.6 Sync Executor

Generates TypeScript types for content collections.

```typescript
// executors/sync/schema.d.ts
export interface SyncExecutorSchema {
  /**
   * Path to Astro config file
   * @default "astro.config.mjs"
   */
  config?: string;

  /**
   * Project root directory
   * @default project root
   */
  root?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Force quit on SIGTERM
   * @default false
   */
  force?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];
}
```

## 4. createNodesV2 Implementation Strategy

The plugin will use Nx's `createNodesV2` API to automatically infer tasks from Astro projects without requiring manual configuration.

### 4.1 Detection Pattern

```typescript
// plugin.ts
export const createNodesV2: CreateNodesV2<AstroPluginOptions> = [
  '**/astro.config.{mjs,js,ts}', // Glob pattern to detect Astro projects
  async (configFiles, options, context) => {
    // Process each detected Astro config file
    return await createNodesFromFiles(configFiles, options, context);
  },
];
```

### 4.2 Configuration Parsing

The plugin will parse `astro.config.mjs` to extract:

```typescript
interface ParsedAstroConfig {
  // Build configuration
  output: 'static' | 'server' | 'hybrid';
  outDir: string;
  build: {
    format: 'file' | 'directory';
    client: string;
    server: string;
    assets: string;
  };

  // Development configuration
  server: {
    port: number;
    host: string | boolean;
  };

  // Source configuration
  srcDir: string;
  publicDir: string;

  // Site configuration
  site?: string;
  base?: string;

  // Integrations
  integrations: Array<{
    name: string;
    hooks?: Record<string, unknown>;
  }>;

  // Vite configuration
  vite?: {
    build?: Record<string, unknown>;
    server?: Record<string, unknown>;
  };
}
```

### 4.3 Task Inference

Based on the configuration, the plugin will infer these tasks:

```typescript
interface InferredTasks {
  dev: {
    executor: '@geekvetica/nx-astro:dev';
    options: {
      port: number;
      host: string | boolean;
    };
    inputs: ['default', '^production'];
    cache: false;
  };

  build: {
    executor: '@geekvetica/nx-astro:build';
    options: {
      outputPath: string;
    };
    inputs: ['production', '^production'];
    outputs: ['{options.outputPath}'];
    cache: true;
    dependsOn: ['^build'];
  };

  preview: {
    executor: '@geekvetica/nx-astro:preview';
    options: {
      outputPath: string;
    };
    inputs: [];
    cache: false;
    dependsOn: ['build'];
  };

  check: {
    executor: '@geekvetica/nx-astro:check';
    options: {};
    inputs: ['default'];
    outputs: [];
    cache: true;
  };

  sync: {
    executor: '@geekvetica/nx-astro:sync';
    options: {};
    inputs: ['{projectRoot}/src/content/**/*'];
    outputs: ['{projectRoot}/.astro'];
    cache: true;
  };

  test?: {
    executor: '@geekvetica/nx-astro:test';
    options: {};
    inputs: ['default', '{projectRoot}/**/*.{test,spec}.{js,ts,mjs,mts}'];
    outputs: ['{workspaceRoot}/coverage/{projectRoot}'];
    cache: true;
  };
}
```

### 4.4 Plugin Options

Users can configure the plugin behavior in `nx.json`:

```typescript
interface AstroPluginOptions {
  /**
   * Enable/disable specific task inference
   */
  inferredTasks?: {
    dev?: boolean;
    build?: boolean;
    preview?: boolean;
    check?: boolean;
    sync?: boolean;
    test?: boolean;
  };

  /**
   * Override build output path pattern
   * @default "dist/{projectRoot}"
   */
  buildOutputPath?: string;

  /**
   * Additional file patterns to include in build inputs
   */
  additionalBuildInputs?: string[];

  /**
   * Additional file patterns to exclude from build inputs
   */
  excludeBuildInputs?: string[];

  /**
   * Default port offset for dev server
   * Used to prevent port conflicts in monorepo
   * @default 0
   */
  devPortOffset?: number;

  /**
   * Automatically detect and configure test runner
   * @default true
   */
  detectTestRunner?: boolean;

  /**
   * Cache directory for Astro
   * @default "{workspaceRoot}/node_modules/.cache/astro"
   */
  cacheDir?: string;
}
```

## 5. Task Input/Output Patterns

### 5.1 Dev Task

```typescript
{
  inputs: [
    '{projectRoot}/**/*.{astro,js,ts,mjs,mts,jsx,tsx,css,scss,sass,less,html,md,mdx}',
    '{projectRoot}/astro.config.{mjs,js,ts}',
    '{projectRoot}/tsconfig.json',
    '{projectRoot}/package.json',
    '{workspaceRoot}/package.json',
    { externalDependencies: ['astro'] }
  ],
  outputs: [],  // Dev server has no outputs
  cache: false  // Never cache dev server
}
```

### 5.2 Build Task

```typescript
{
  inputs: [
    'production',  // Named input excluding tests and config
    '^production', // Dependencies' production files
    '{projectRoot}/astro.config.{mjs,js,ts}',
    '{projectRoot}/tsconfig.json',
    {
      runtime: 'node --version',  // Node version affects build
      externalDependencies: ['astro']
    }
  ],
  outputs: [
    '{options.outputPath}',
    '{projectRoot}/.astro'  // Type generation cache
  ],
  cache: true
}
```

### 5.3 Preview Task

```typescript
{
  inputs: [
    '{options.outputPath}/**/*'  // Built files
  ],
  outputs: [],  // Preview server has no outputs
  cache: false  // Never cache preview server
}
```

### 5.4 Check Task

```typescript
{
  inputs: [
    '{projectRoot}/src/**/*.{astro,ts,js,tsx,jsx}',
    '{projectRoot}/astro.config.{mjs,js,ts}',
    '{projectRoot}/tsconfig.json',
    { externalDependencies: ['typescript', 'astro'] }
  ],
  outputs: [],  // Type checking has no outputs
  cache: true   // Cache based on source files
}
```

### 5.5 Test Task

```typescript
{
  inputs: [
    'default',  // All project files
    '{projectRoot}/**/*.{test,spec}.{js,ts,mjs,mts,jsx,tsx}',
    '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
    { externalDependencies: ['vitest', '@astrojs/test'] }
  ],
  outputs: [
    '{workspaceRoot}/coverage/{projectRoot}'
  ],
  cache: true
}
```

### 5.6 Sync Task

```typescript
{
  inputs: [
    '{projectRoot}/src/content/**/*',
    '{projectRoot}/src/content/config.{js,ts,mjs,mts}',
    '{projectRoot}/astro.config.{mjs,js,ts}',
    { externalDependencies: ['astro'] }
  ],
  outputs: [
    '{projectRoot}/.astro/types.d.ts',
    '{projectRoot}/src/env.d.ts'
  ],
  cache: true
}
```

## 6. Integration with Nx Project Graph

### 6.1 Project Representation

Astro projects will be represented in the Nx graph as standard projects with specific metadata:

```typescript
interface AstroProjectNode {
  name: string;
  type: 'app' | 'lib';
  data: {
    root: string;
    sourceRoot: string;
    projectType: 'application';
    targets: Record<string, Target>;
    tags: string[];
    metadata: {
      technologies: ['astro'];
      astroConfig: {
        output: 'static' | 'server' | 'hybrid';
        integrations: string[];
      };
    };
  };
}
```

### 6.2 Dependency Detection

The plugin will detect dependencies by analyzing:

1. **Import statements** in Astro components
2. **Package.json** dependencies
3. **Content collections** that reference other projects
4. **Shared components** imported across projects

```typescript
function detectDependencies(projectRoot: string): string[] {
  const dependencies: Set<string> = new Set();

  // Parse import statements
  const importPatterns = [
    /from ['"]@org\/(.+?)['"]/g, // Workspace packages
    /import\(['"]@org\/(.+?)['"]\)/g, // Dynamic imports
  ];

  // Scan Astro components
  const astroFiles = glob.sync(`${projectRoot}/**/*.astro`);
  for (const file of astroFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const pattern of importPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        dependencies.add(match[1]);
      }
    }
  }

  return Array.from(dependencies);
}
```

### 6.3 Task Dependencies

```typescript
const taskDependencies = {
  build: {
    dependsOn: ['^build', 'sync'], // Build deps first, sync types
    topological: true,
  },
  preview: {
    dependsOn: ['build'], // Must build before preview
  },
  test: {
    dependsOn: ['^build'], // Test may import built packages
  },
  dev: {
    dependsOn: [], // No dependencies for dev
  },
  check: {
    dependsOn: ['sync', '^build'], // Need types and built deps
  },
  sync: {
    dependsOn: [], // Sync is independent
  },
};
```

### 6.4 Shared Component Libraries

Support for shared Astro component libraries:

```typescript
interface AstroLibraryProject {
  name: string;
  type: 'lib';
  data: {
    root: string;
    sourceRoot: string;
    projectType: 'library';
    targets: {
      build: {
        executor: '@nx/js:tsc';
        options: {
          outputPath: string;
          main: string;
          tsConfig: string;
          assets: Array<{
            glob: string;
            input: string;
            output: string;
          }>;
        };
      };
    };
  };
}
```

## 7. TypeScript Type Definitions

### 7.1 Plugin Options

```typescript
// src/utils/types.ts
export interface AstroPluginOptions {
  inferredTasks?: {
    dev?: boolean;
    build?: boolean;
    preview?: boolean;
    check?: boolean;
    sync?: boolean;
    test?: boolean;
  };
  buildOutputPath?: string;
  additionalBuildInputs?: string[];
  excludeBuildInputs?: string[];
  devPortOffset?: number;
  detectTestRunner?: boolean;
  cacheDir?: string;
}
```

### 7.2 Astro Configuration Types

```typescript
// src/utils/astro-config.types.ts
export interface AstroConfig {
  root?: string;
  srcDir?: string;
  publicDir?: string;
  outDir?: string;
  cacheDir?: string;
  site?: string;
  base?: string;
  trailingSlash?: 'always' | 'never' | 'ignore';
  output?: 'static' | 'server' | 'hybrid';
  adapter?: AstroAdapter;
  integrations?: AstroIntegration[];
  server?: {
    host?: string | boolean;
    port?: number;
    open?: string | boolean;
  };
  build?: {
    format?: 'file' | 'directory';
    client?: string;
    server?: string;
    assets?: string;
    assetsPrefix?: string;
    serverEntry?: string;
    redirects?: boolean;
    inlineStylesheets?: 'always' | 'auto' | 'never';
  };
  vite?: Record<string, unknown>;
  markdown?: Record<string, unknown>;
  experimental?: Record<string, unknown>;
}

export interface AstroAdapter {
  name: string;
  hooks?: Record<string, Function>;
}

export interface AstroIntegration {
  name: string;
  hooks?: Record<string, Function>;
}
```

### 7.3 Executor Context Types

```typescript
// src/utils/executor.types.ts
import { ExecutorContext } from '@nx/devkit';

export interface AstroExecutorContext extends ExecutorContext {
  projectConfig: {
    root: string;
    sourceRoot: string;
    astroConfig?: Partial<AstroConfig>;
  };
}

export interface ExecutorOutput {
  success: boolean;
  error?: string;
  baseUrl?: string;
  port?: number;
  stats?: {
    duration: number;
    filesProcessed: number;
    outputSize?: number;
  };
}
```

### 7.4 Generator Types

```typescript
// src/utils/generator.types.ts
export interface NormalizedSchema<T> {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  originalSchema: T;
}

export interface FileTemplate {
  path: string;
  content: string;
  substitutions: Record<string, string>;
}
```

### 7.5 Shared Utility Types

```typescript
// src/utils/common.types.ts
export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface DependencyVersion {
  package: string;
  version: string;
  dev?: boolean;
}

export interface ProjectMetadata {
  astroVersion: string;
  hasTypeScript: boolean;
  hasTests: boolean;
  integrations: string[];
  outputMode: 'static' | 'server' | 'hybrid';
}

export interface CommandOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  silent?: boolean;
  color?: boolean;
}

export interface ParseError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
}
```

## 8. Testing Strategy

### 8.1 Unit Tests

Each component will have comprehensive unit tests:

```typescript
// Example: utils/astro-config.spec.ts
describe('parseAstroConfig', () => {
  it('should parse basic static config', () => {
    const config = parseAstroConfig(`
      export default {
        output: 'static',
        outDir: './dist'
      }
    `);
    expect(config.output).toBe('static');
    expect(config.outDir).toBe('./dist');
  });

  it('should handle defineConfig wrapper', () => {
    const config = parseAstroConfig(`
      import { defineConfig } from 'astro/config';
      export default defineConfig({
        output: 'server'
      });
    `);
    expect(config.output).toBe('server');
  });

  it('should extract integrations', () => {
    const config = parseAstroConfig(`
      import react from '@astrojs/react';
      export default {
        integrations: [react()]
      }
    `);
    expect(config.integrations).toContainEqual(expect.objectContaining({ name: 'react' }));
  });
});
```

### 8.2 Integration Tests

Test generators and executors with the Nx testing utilities:

```typescript
// Example: generators/application/application.spec.ts
describe('application generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create application files', async () => {
    await applicationGenerator(tree, {
      name: 'my-app',
      style: 'css',
    });

    expect(tree.exists('apps/my-app/astro.config.mjs')).toBe(true);
    expect(tree.exists('apps/my-app/src/pages/index.astro')).toBe(true);
    expect(tree.exists('apps/my-app/tsconfig.json')).toBe(true);
  });

  it('should update workspace configuration', async () => {
    await applicationGenerator(tree, {
      name: 'my-app',
    });

    const config = readProjectConfiguration(tree, 'my-app');
    expect(config.targets.build).toBeDefined();
    expect(config.targets.dev).toBeDefined();
  });
});
```

### 8.3 E2E Tests

Complete workflow tests in `nx-astro-e2e`:

```typescript
// Example: e2e/nx-astro.spec.ts
describe('nx-astro e2e', () => {
  let workspace: string;

  beforeAll(() => {
    workspace = newProject();
  });

  it('should create and build Astro app', async () => {
    // Generate application
    const createResult = await runNxCommand(`generate @geekvetica/nx-astro:application my-app`);
    expect(createResult).toContain('Successfully generated');

    // Build application
    const buildResult = await runNxCommand(`build my-app`);
    expect(buildResult).toContain('Successfully built');

    // Check output exists
    expect(existsSync(`${workspace}/dist/apps/my-app`)).toBe(true);
  });

  it('should run dev server', async () => {
    const devProcess = runNxCommandAsync(`dev my-app`);

    // Wait for server to start
    await waitForPort(4321);

    // Test server response
    const response = await fetch('http://localhost:4321');
    expect(response.ok).toBe(true);

    // Cleanup
    devProcess.kill();
  });
});
```

### 8.4 Mocking Strategy

Mock Astro CLI for unit tests:

```typescript
// utils/testing/mock-astro-cli.ts
export function mockAstroCLI() {
  const mock = {
    dev: jest.fn().mockResolvedValue({ success: true }),
    build: jest.fn().mockResolvedValue({ success: true }),
    preview: jest.fn().mockResolvedValue({ success: true }),
    check: jest.fn().mockResolvedValue({ success: true }),
    sync: jest.fn().mockResolvedValue({ success: true }),
  };

  jest.mock('child_process', () => ({
    spawn: jest.fn((cmd, args) => {
      const command = args[0];
      if (mock[command]) {
        return mock[command](args.slice(1));
      }
      throw new Error(`Unknown command: ${command}`);
    }),
  }));

  return mock;
}
```

### 8.5 Test Coverage Requirements

- **Unit tests**: Minimum 80% coverage for utilities and parsers
- **Integration tests**: Cover all generator and executor options
- **E2E tests**: Test complete workflows and edge cases
- **Performance tests**: Ensure caching works correctly

## Implementation Roadmap

### Phase 1: Foundation (Estimated: 2-3 days)

- Set up basic plugin structure
- Implement core utilities (config parsing, AST utils)
- Create TypeScript type definitions
- Set up testing infrastructure

### Phase 2: Plugin Infrastructure (Estimated: 3-4 days)

- Implement createNodesV2 for task inference
- Create project graph integration
- Implement caching strategies
- Add plugin configuration options

### Phase 3: Generators (Estimated: 4-5 days)

- Implement init generator
- Implement application generator
- Implement component generator
- Create template files
- Add generator tests

### Phase 4: Executors (Estimated: 4-5 days)

- Implement dev executor
- Implement build executor
- Implement preview executor
- Implement check executor
- Implement test executor
- Implement sync executor
- Add executor tests

### Phase 5: Integration & Polish (Estimated: 2-3 days)

- E2E test suite
- Documentation
- Example projects
- Performance optimization
- Bug fixes and refinements

## Risk Assessment

### Technical Risks

1. **Astro Config Parsing Complexity**

   - Risk: Complex configurations with dynamic imports
   - Mitigation: Use AST parsing with fallback to regex patterns
   - Fallback: Require explicit configuration for complex cases

2. **Cross-platform Compatibility**

   - Risk: Path handling differences between OS
   - Mitigation: Use Node.js path utilities consistently
   - Fallback: Platform-specific implementations where needed

3. **Astro Version Compatibility**

   - Risk: Breaking changes in Astro CLI
   - Mitigation: Version detection and compatibility layer
   - Fallback: Support matrix for Astro versions

4. **Performance Impact**

   - Risk: Slow config parsing affecting Nx performance
   - Mitigation: Aggressive caching of parsed configurations
   - Fallback: Opt-in inference with manual configuration option

5. **Integration Conflicts**
   - Risk: Conflicts between Astro integrations and Nx
   - Mitigation: Careful dependency management
   - Fallback: Documentation of known conflicts

### Mitigation Strategies

1. **Comprehensive Testing**

   - Unit tests for all utilities
   - Integration tests for all features
   - E2E tests for complete workflows
   - Compatibility tests with multiple Astro versions

2. **Graceful Degradation**

   - Fallback to manual configuration when inference fails
   - Clear error messages with actionable solutions
   - Debug mode with detailed logging

3. **Documentation**

   - Complete API documentation
   - Migration guides from vanilla Astro
   - Troubleshooting guide
   - Examples for common scenarios

4. **Community Feedback Loop**
   - Beta releases for early feedback
   - GitHub discussions for feature requests
   - Regular updates based on usage patterns

## Conclusion

This architecture provides a robust foundation for the Nx-Astro plugin that:

- Seamlessly integrates Astro projects into Nx monorepos
- Provides zero-configuration setup through intelligent inference
- Leverages Nx's powerful caching and task orchestration
- Maintains compatibility with the Astro ecosystem
- Offers extensibility for future enhancements

The modular design ensures maintainability while the comprehensive testing strategy guarantees reliability. The plugin will deliver significant developer experience improvements for teams using Astro in monorepo environments.
