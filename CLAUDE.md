# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Nx plugin for integrating Astro-based projects into Nx monorepos**. The plugin provides generators and executors to seamlessly work with Astro applications within an Nx workspace, enabling code sharing, task orchestration, and dependency management across Astro and other project types.

**Package name:** `@geekvetica/nx-astro`
**Author:** Geekvetica Paweł Wojciechowski
**Repository:** geekvetica/nx-astro

The repository contains:

- **nx-astro** - The Nx plugin package (published as `@geekvetica/nx-astro`)
- **nx-astro-e2e** - End-to-end tests for the plugin

This workspace uses pnpm as the package manager.

## Architecture

### Workspace Structure

- **nx-astro/** - The main plugin library

  - Currently empty (`src/index.ts` has no content)
  - Configured as a buildable library with TypeScript compilation
  - Contains placeholder configuration for generators and executors

- **nx-astro-e2e/** - End-to-end tests for the plugin
  - Tests plugin installation in a freshly created Nx workspace
  - Uses a local npm registry (verdaccio) for testing published packages

### Build System

- **Executor**: Uses `@nx/js:tsc` for TypeScript compilation
- **Output**: Builds to `dist/nx-astro`
- **Assets copied during build**:
  - `*.md` files
  - Non-TypeScript files from src
  - `.d.ts` files
  - `generators.json` and `executors.json` (plugin configuration files)

### Release Configuration

- Version management via `nx release`
- Uses git tags for current version resolution with disk fallback
- Pre-version command: `pnpm dlx nx run-many -t build`

## Common Commands

### Building

```sh
npx nx build nx-astro
```

### Testing

Run unit tests:

```sh
npx nx test nx-astro
```

Run e2e tests (requires building and publishing to local registry first):

```sh
npx nx e2e nx-astro-e2e
```

Run tests in CI mode with coverage:

```sh
npx nx test nx-astro --configuration=ci
```

### Linting

```sh
npx nx lint nx-astro
npx nx lint nx-astro-e2e
```

### Running Multiple Tasks

Build all projects:

```sh
pnpm dlx nx run-many -t build
```

### Graph Visualization

Visualize project dependencies:

```sh
npx nx graph
```

## Development Notes

### Plugin Development

This plugin integrates Astro projects with Nx monorepos. When developing plugin features, you'll need to:

1. **Generators** - Define in `generators.json` to scaffold Astro applications, libraries, or components

   - Example: `nx g nx-astro:app my-astro-app` to create a new Astro application
   - Example: `nx g nx-astro:component my-component` to create Astro components

2. **Executors** - Define in `executors.json` to run Astro-specific tasks

   - Example: Build executor to run `astro build`
   - Example: Dev server executor to run `astro dev`
   - Example: Preview executor to run `astro preview`

3. Implement generator/executor code in the appropriate directories
4. These JSON files are copied to the build output as assets

The goal is to make Astro projects first-class citizens in Nx monorepos with proper caching, dependency graph integration, and task orchestration.

### E2E Testing Workflow

The e2e tests:

1. Create a temporary Nx workspace using `create-nx-workspace`
2. Install the `nx-astro` plugin from a local registry (tagged as `@e2e`)
3. Verify installation and functionality
4. Clean up the temporary workspace

This requires the plugin to be built and published to a local registry (verdaccio) in the jest global setup.

### Package Manager

This workspace uses **pnpm**. Always use `pnpm` commands, not `npm` or `yarn`.

### TypeScript Configuration

- Base config: `tsconfig.base.json`
- Library-specific configs in each project directory
- Path alias: `"nx-astro"` maps to `"nx-astro/src/index.ts"`
