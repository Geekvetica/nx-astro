# Project Structure

This document provides a detailed overview of the `@geekvetica/nx-astro` project structure for maintainers and core contributors.

## Repository Overview

The `nx-astro` repository is an Nx monorepo containing the plugin package and its end-to-end tests. The workspace uses **pnpm** as the package manager and is configured for optimal development experience.

## Directory Layout

```
nx-astro/
├── .github/                       # GitHub configuration
│   └── workflows/
│       ├── ci.yml                 # Continuous integration pipeline
│       └── release.yml            # Automated release pipeline
│
├── .nx/                           # Nx cache directory (gitignored)
│   └── cache/                     # Task output cache
│
├── docs/                          # Documentation
│   ├── api-reference.md           # API documentation
│   ├── architecture.md            # Architecture overview
│   ├── configuration.md           # Configuration reference
│   ├── executors.md               # Executor documentation
│   ├── generators.md              # Generator documentation
│   ├── examples.md                # Usage examples
│   ├── faq.md                     # Frequently asked questions
│   ├── troubleshooting.md         # Troubleshooting guide
│   ├── ci-cd-setup.md             # CI/CD setup guide
│   ├── consuming-project-ci.md    # Consumer CI/CD guide
│   └── maintenance/               # Maintainer documentation
│       ├── development-setup.md   # Development environment setup
│       ├── release-process.md     # Release process guide
│       └── project-structure.md   # This document
│
├── nx-astro/                      # Main plugin package
│   ├── src/
│   │   ├── executors/             # Nx executors
│   │   ├── generators/            # Nx generators
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── utils/                 # Shared utilities
│   │   ├── index.ts               # Package entry point
│   │   └── plugin.ts              # Nx plugin implementation
│   ├── executors.json             # Executor registry
│   ├── generators.json            # Generator registry
│   ├── plugin-options.json        # Plugin options schema
│   ├── project.json               # Nx project configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── tsconfig.lib.json          # Library-specific TS config
│   ├── tsconfig.spec.json         # Test-specific TS config
│   ├── jest.config.ts             # Jest configuration
│   ├── package.json               # Package metadata
│   └── README.md                  # Package README
│
├── nx-astro-e2e/                  # End-to-end tests
│   ├── src/
│   │   ├── helpers/               # Test helpers
│   │   └── nx-astro.spec.ts       # E2E test suite
│   ├── project.json               # Nx project configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── tsconfig.spec.json         # Test-specific TS config
│   ├── jest.config.ts             # Jest configuration
│   └── README.md                  # E2E test documentation
│
├── dist/                          # Build output (gitignored)
│   └── nx-astro/                  # Built plugin package
│
├── node_modules/                  # Dependencies (gitignored)
│
├── .gitignore                     # Git ignore rules
├── .prettierrc                    # Prettier configuration
├── .prettierignore                # Prettier ignore rules
├── .editorconfig                  # Editor configuration
├── nx.json                        # Nx workspace configuration
├── package.json                   # Workspace dependencies
├── pnpm-lock.yaml                 # Locked dependencies
├── pnpm-workspace.yaml            # pnpm workspace configuration
├── tsconfig.base.json             # Base TypeScript configuration
├── jest.preset.js                 # Jest preset
├── CHANGELOG.md                   # Version history
├── CLAUDE.md                      # AI assistant context
├── CONTRIBUTING.md                # Contribution guidelines
├── LICENSE                        # MIT License
├── README.md                      # Main documentation
└── RELEASE-CHECKLIST.md           # Release checklist
```

## Package: nx-astro

The main plugin package located in `nx-astro/`.

### Package Structure

```
nx-astro/
├── src/
│   ├── executors/                 # Task executors
│   ├── generators/                # Code generators
│   ├── types/                     # Type definitions
│   ├── utils/                     # Utilities
│   ├── index.ts                   # Main exports
│   └── plugin.ts                  # Plugin implementation
├── executors.json                 # Executor registry
├── generators.json                # Generator registry
├── plugin-options.json            # Plugin configuration schema
├── package.json                   # Package manifest
└── project.json                   # Nx configuration
```

### Executors Directory

Located in `nx-astro/src/executors/`:

```
executors/
├── build/                         # Build executor
│   ├── build.impl.ts              # Implementation
│   ├── build.impl.spec.ts         # Unit tests
│   ├── schema.json                # Options schema
│   └── schema.d.ts                # TypeScript types
├── dev/                           # Dev server executor
│   ├── dev.impl.ts
│   ├── dev.impl.spec.ts
│   ├── schema.json
│   └── schema.d.ts
├── preview/                       # Preview executor
├── check/                         # Type-check executor
├── sync/                          # Sync executor
└── test/                          # Test executor
```

**Executor File Responsibilities:**

- `*.impl.ts` - Executor implementation with `execute()` function
- `*.impl.spec.ts` - Unit tests for executor
- `schema.json` - JSON schema defining executor options
- `schema.d.ts` - TypeScript types for options (generated or manual)

### Generators Directory

Located in `nx-astro/src/generators/`:

```
generators/
├── init/                          # Initialize plugin
│   ├── init.ts                    # Implementation
│   ├── init.spec.ts               # Unit tests
│   ├── schema.json                # Options schema
│   └── schema.d.ts                # TypeScript types
├── application/                   # Generate Astro app
│   ├── application.ts
│   ├── application.spec.ts
│   ├── schema.json
│   ├── schema.d.ts
│   └── files/                     # Template files
│       ├── astro.config.mjs__template__
│       ├── package.json__template__
│       └── src/
├── library/                       # Generate library
├── configuration/                 # Add configuration
└── component/                     # Generate component
```

**Generator File Responsibilities:**

- `*.ts` - Generator implementation with generator function
- `*.spec.ts` - Unit tests for generator
- `schema.json` - JSON schema defining generator options
- `schema.d.ts` - TypeScript types for options
- `files/` - Template files for code generation
  - `__template__` suffix indicates EJS template
  - `__name__` tokens are replaced during generation

### Types Directory

Located in `nx-astro/src/types/`:

```
types/
├── astro.ts                       # Astro-specific types
├── plugin.ts                      # Plugin types
└── index.ts                       # Type exports
```

**Purpose:**
- Shared type definitions
- Interfaces for options and configurations
- Type utilities

### Utils Directory

Located in `nx-astro/src/utils/`:

```
utils/
├── astro-config.ts                # Astro config utilities
├── astro-config.spec.ts           # Tests
├── file-utils.ts                  # File operations
├── file-utils.spec.ts             # Tests
├── package-json.ts                # package.json utilities
├── package-json.spec.ts           # Tests
├── versions.ts                    # Dependency versions
└── index.ts                       # Utility exports
```

**Purpose:**
- Shared utilities used by generators and executors
- File system operations
- Configuration parsing and manipulation
- Version management

### Plugin Implementation

Located in `nx-astro/src/plugin.ts`:

```typescript
// Plugin registration and configuration
export const createNodes: CreateNodes = [
  '**/astro.config.{mjs,js,ts}',
  (configFilePath, options, context) => {
    // Infer Nx targets from Astro configuration
    // Register executors for Astro projects
  }
];

export const createNodesV2: CreateNodesV2 = [
  // V2 implementation
];
```

**Purpose:**
- Nx plugin registration
- Automatic target inference
- Project graph integration

### Configuration Files

**executors.json** - Registry of executors:
```json
{
  "executors": {
    "build": {
      "implementation": "./src/executors/build/build.impl",
      "schema": "./src/executors/build/schema.json",
      "description": "Build an Astro application"
    }
  }
}
```

**generators.json** - Registry of generators:
```json
{
  "generators": {
    "application": {
      "factory": "./src/generators/application/application",
      "schema": "./src/generators/application/schema.json",
      "description": "Create an Astro application"
    }
  }
}
```

**plugin-options.json** - Plugin configuration schema:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "type": "object",
  "properties": {
    // Plugin-level options
  }
}
```

## Package: nx-astro-e2e

End-to-end tests located in `nx-astro-e2e/`.

### E2E Structure

```
nx-astro-e2e/
├── src/
│   ├── helpers/
│   │   ├── create-test-workspace.ts  # Workspace creation
│   │   ├── run-nx-command.ts         # Command execution
│   │   └── cleanup.ts                # Cleanup utilities
│   └── nx-astro.spec.ts              # Main test suite
├── project.json                      # Nx configuration
├── jest.config.ts                    # Jest configuration
└── README.md                         # E2E documentation
```

### E2E Test Workflow

1. **Setup** (jest global setup):
   - Start local npm registry (verdaccio)
   - Build `nx-astro` plugin
   - Publish to local registry with `@e2e` tag

2. **Test Execution**:
   - Create temporary Nx workspace
   - Install plugin from local registry
   - Run generators and executors
   - Verify outputs

3. **Teardown** (jest global teardown):
   - Stop verdaccio
   - Clean up temporary workspaces

### E2E Test Categories

```typescript
describe('nx-astro e2e', () => {
  describe('installation', () => {
    // Test plugin installation
  });

  describe('generators', () => {
    describe('application', () => {
      // Test application generator
    });
    describe('library', () => {
      // Test library generator
    });
  });

  describe('executors', () => {
    describe('build', () => {
      // Test build executor
    });
    describe('dev', () => {
      // Test dev executor
    });
  });
});
```

## Build System

### Build Configuration

Located in `nx-astro/project.json`:

```json
{
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/nx-astro",
        "main": "nx-astro/src/index.ts",
        "tsConfig": "nx-astro/tsconfig.lib.json",
        "assets": [
          "nx-astro/*.md",
          {
            "input": "./nx-astro/src",
            "glob": "**/!(*.ts)",
            "output": "./src"
          },
          {
            "input": "./nx-astro",
            "glob": "generators.json",
            "output": "."
          },
          {
            "input": "./nx-astro",
            "glob": "executors.json",
            "output": "."
          }
        ]
      }
    }
  }
}
```

### Build Process

1. **TypeScript Compilation**:
   - Source: `nx-astro/src/**/*.ts`
   - Output: `dist/nx-astro/**/*.js` + `.d.ts` files
   - Compiler: TypeScript via `@nx/js:tsc`

2. **Asset Copying**:
   - Markdown files (`*.md`)
   - JSON schemas (`schema.json`)
   - Template files (`files/`)
   - Registry files (`generators.json`, `executors.json`)

3. **Output Structure**:
   ```
   dist/nx-astro/
   ├── src/
   │   ├── executors/
   │   ├── generators/
   │   ├── types/
   │   ├── utils/
   │   ├── index.js
   │   ├── index.d.ts
   │   ├── plugin.js
   │   └── plugin.d.ts
   ├── executors.json
   ├── generators.json
   ├── package.json
   └── README.md
   ```

### Nx Cache

Nx caches task outputs in `.nx/cache/`:

- Speeds up subsequent builds
- Shared across team members (with Nx Cloud)
- Invalidated when inputs change

**Cache Configuration** (in `nx.json`):

```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["default", "^default"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^default", "{workspaceRoot}/jest.preset.js"]
    }
  }
}
```

## TypeScript Configuration

### Configuration Hierarchy

```
tsconfig.base.json                 # Base configuration
├── nx-astro/tsconfig.json         # Package configuration
│   ├── tsconfig.lib.json          # Library (build)
│   └── tsconfig.spec.json         # Tests
└── nx-astro-e2e/tsconfig.json     # E2E configuration
    └── tsconfig.spec.json         # E2E tests
```

### tsconfig.base.json

Workspace-level configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@geekvetica/nx-astro": ["nx-astro/src/index.ts"]
    }
  }
}
```

### Path Aliases

Configured in `tsconfig.base.json` for monorepo imports:

```typescript
// Instead of:
import { something } from '../../nx-astro/src/utils';

// Use:
import { something } from '@geekvetica/nx-astro/utils';
```

## Testing Infrastructure

### Jest Configuration

**jest.preset.js** - Workspace preset:
```javascript
module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: { '^.+\\.[tj]sx?$': 'ts-jest' },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
```

**nx-astro/jest.config.ts** - Plugin tests:
```typescript
export default {
  displayName: 'nx-astro',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  coverageDirectory: '../coverage/nx-astro',
};
```

### Test Coverage

Coverage reports are generated in `coverage/`:

```
coverage/
└── nx-astro/
    ├── coverage-summary.json      # Coverage metrics
    ├── lcov.info                  # LCOV format
    └── index.html                 # HTML report
```

**Coverage Thresholds** (in CI):
- Statements: 80%+
- Branches: 80%+
- Functions: 80%+
- Lines: 80%+

## CI/CD Configuration

### GitHub Workflows

Located in `.github/workflows/`:

**ci.yml** - Continuous Integration:
- Triggers: Push to main, pull requests
- Jobs: Setup, Lint, Test, Build, E2E
- Duration: ~20 minutes

**release.yml** - Automated Release:
- Triggers: Manual workflow dispatch
- Jobs: Validate, Test, Release, Validate Release
- Duration: ~40 minutes

### Workflow Architecture

```
CI Workflow:
┌─────────┐
│  Setup  │ (Install dependencies, cache)
└────┬────┘
     │
     ├────┬────┬────┬────┐
     │    │    │    │    │
┌────▼──┐ │    │    │    │
│ Lint  │ │    │    │    │
└───────┘ │    │    │    │
     ┌────▼──┐ │    │    │
     │ Test  │ │    │    │
     └───────┘ │    │    │
          ┌────▼──┐ │    │
          │ Build │ │    │
          └────┬──┘ │    │
               │    │    │
          ┌────▼────▼──┐ │
          │    E2E     │ │
          └────────────┘ │
                    ┌────▼──────┐
                    │ CI Success│
                    └───────────┘
```

## Dependency Management

### Workspace Dependencies

Located in root `package.json`:

```json
{
  "devDependencies": {
    "@nx/devkit": "^21.0.0",
    "@nx/jest": "^21.0.0",
    "@nx/js": "^21.0.0",
    "typescript": "~5.6.0",
    "jest": "^29.7.0",
    "@types/node": "^20.0.0"
  }
}
```

### Plugin Dependencies

Located in `nx-astro/package.json`:

```json
{
  "dependencies": {
    "@nx/devkit": "*"
  },
  "peerDependencies": {
    "nx": ">=21.0.0",
    "astro": ">=5.0.0"
  }
}
```

### Version Management

Dependency versions are managed in:
- `nx-astro/src/utils/versions.ts` - Runtime version constraints
- `package.json` files - Build-time dependencies

## Documentation Structure

Located in `docs/`:

### User Documentation

- `README.md` - Getting started
- `generators.md` - Generator reference
- `executors.md` - Executor reference
- `configuration.md` - Configuration options
- `examples.md` - Usage examples
- `faq.md` - Common questions
- `troubleshooting.md` - Issue resolution

### Architecture Documentation

- `architecture.md` - System design
- `architecture-summary.md` - Quick overview
- `api-reference.md` - API documentation

### CI/CD Documentation

- `ci-cd-setup.md` - CI/CD for plugin development
- `consuming-project-ci.md` - CI/CD for plugin users

### Maintainer Documentation

- `maintenance/development-setup.md` - Development environment
- `maintenance/release-process.md` - Release procedures
- `maintenance/project-structure.md` - This document

## Release Artifacts

### Built Package

Located in `dist/nx-astro/` after build:

```
dist/nx-astro/
├── src/                           # Compiled source
├── executors.json                 # Executor registry
├── generators.json                # Generator registry
├── package.json                   # Package manifest
├── README.md                      # Documentation
└── LICENSE                        # License file
```

### Published Package

Published to npm as `@geekvetica/nx-astro`:

- **Registry**: https://registry.npmjs.org
- **Package Page**: https://www.npmjs.com/package/@geekvetica/nx-astro
- **Tarball**: `@geekvetica/nx-astro-{version}.tgz`

## Development Patterns

### Generator Pattern

```typescript
import { Tree, generateFiles, formatFiles } from '@nx/devkit';

export async function myGenerator(tree: Tree, options: Schema) {
  // 1. Normalize options
  const normalizedOptions = normalizeOptions(options);

  // 2. Generate files from templates
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    normalizedOptions
  );

  // 3. Update workspace configuration
  updateProjectConfiguration(tree, options.name, config);

  // 4. Format generated files
  await formatFiles(tree);

  // 5. Return installation task (if needed)
  return () => {
    installPackagesTask(tree);
  };
}
```

### Executor Pattern

```typescript
import { ExecutorContext } from '@nx/devkit';

export async function myExecutor(
  options: Schema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  // 1. Validate options
  validateOptions(options);

  // 2. Execute task
  const result = await executeTask(options, context);

  // 3. Return success status
  return { success: result.success };
}
```

### Utility Pattern

```typescript
// Pure functions with clear responsibilities
export function utilityFunction(input: Input): Output {
  // Single responsibility
  // Well-tested
  // Reusable across generators/executors
  return output;
}
```

## Code Organization Principles

1. **Single Responsibility**: Each file has one clear purpose
2. **Dependency Injection**: Dependencies passed as parameters
3. **Pure Functions**: Utilities are pure, side-effect free
4. **Type Safety**: Strict TypeScript, no `any` types
5. **Testability**: All code is unit testable
6. **Documentation**: JSDoc comments for public APIs

## Next Steps

For further information:

- [Development Setup](./development-setup.md) - Set up your environment
- [Release Process](./release-process.md) - Release procedures
- [Contributing Guidelines](../../CONTRIBUTING.md) - Contribution workflow
