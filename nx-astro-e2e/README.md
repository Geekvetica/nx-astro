# E2E Tests for @geekvetica/nx-astro Plugin

This directory contains end-to-end tests for the @geekvetica/nx-astro plugin. These tests verify the complete functionality of the plugin in a real Nx workspace environment.

## Test Structure

The E2E test suite is organized into the following test groups:

### 1. Plugin Installation

- Verifies the plugin can be installed via pnpm
- Checks that the plugin is properly listed in dependencies

### 2. Init Generator

- Tests the `@geekvetica/nx-astro:init` generator
- Verifies plugin registration in `nx.json`
- Checks that Astro dependencies are added to `package.json`

### 3. Application Generator

- Tests the `@geekvetica/nx-astro:app` generator
- Verifies creation of all required files:
  - `astro.config.mjs`
  - `tsconfig.json`
  - `package.json`
  - Source files (`src/pages/index.astro`, `src/env.d.ts`)
  - Public assets (`public/favicon.svg`)
- Validates file contents and configurations

### 4. Component Generator

- Tests the `@geekvetica/nx-astro:component` generator
- Verifies component creation in the correct directory
- Checks component file structure

### 5. Task Inference (createNodesV2)

- Verifies automatic detection of Astro projects
- Tests inference of all executor targets:
  - `build`
  - `dev`
  - `check`
  - `sync`
  - `preview`
  - `test`
- Validates executor configurations

### 6. Executors

#### Sync Executor

- Tests the `nx-astro:sync` executor
- Verifies it runs without errors

#### Check Executor

- Tests the `nx-astro:check` executor
- Installs `@astrojs/check` as a prerequisite
- Verifies type checking runs successfully

#### Build Executor

- Tests the `nx-astro:build` executor
- Verifies build output is created in `dist/` directory
- Checks for `index.html` in output
- Tests caching functionality (second build should use cache)

#### Test Executor

- Tests the `nx-astro:test` executor
- Creates a sample test file
- Verifies tests run successfully with Vitest

#### Dev Server

- Verifies dev server target is configured
- Checks executor configuration

#### Preview Server

- Verifies preview server target is configured
- Checks executor configuration

## Helper Utilities

The test suite includes helper utilities in `src/helpers/test-utils.ts`:

- `runNxCommand()` - Execute Nx commands in test workspace
- `runPnpmCommand()` - Execute pnpm commands
- `fileExists()` - Check if a file exists
- `readFile()` - Read file contents
- `readJsonFile()` - Read and parse JSON files
- `writeFile()` - Write content to files
- `waitForPort()` - Wait for a port to be available
- `startProcess()` - Start long-running processes
- `killProcess()` - Terminate processes
- `logStep()` - Log test progress

## Running Tests

### Run all E2E tests

```bash
pnpx nx e2e nx-astro-e2e
```

### Run with verbose output

```bash
pnpx nx e2e nx-astro-e2e --verbose
```

## Test Environment

- Tests create a temporary Nx workspace in `tmp/test-project/`
- Uses verdaccio local registry for plugin installation
- Cleans up test workspace after completion
- Timeout: 5 minutes per test suite (configurable in `jest.config.ts`)

## Test Flow

1. **Setup (beforeAll)**

   - Create temporary Nx workspace
   - Install nx-astro plugin from local registry

2. **Test Execution**

   - Run init generator
   - Create Astro application
   - Generate component
   - Verify task inference
   - Run executors (sync, check, build, test)
   - Verify server configurations

3. **Cleanup (afterAll)**
   - Remove temporary workspace

## CI/CD Integration

These tests are designed to run in CI pipelines:

- No manual intervention required
- All interactive prompts are handled automatically
- Proper cleanup ensures no leftover artifacts
- Tests are deterministic and reliable

## Test Coverage

The E2E test suite covers:

- ✅ Plugin installation and initialization
- ✅ All generators (init, application, component)
- ✅ All executors (build, dev, preview, check, test, sync)
- ✅ Task inference via createNodesV2
- ✅ File generation and structure
- ✅ Configuration validation
- ✅ Build caching

## Troubleshooting

### Tests timeout

- Increase timeout in `jest.config.ts`
- Check network connectivity (for package installation)
- Verify verdaccio registry is running

### Tests fail during check executor

- Ensure `@astrojs/check` can be installed
- Check TypeScript version compatibility

### Tests fail during build

- Verify Astro dependencies are installed
- Check for any syntax errors in generated files

## Design Decisions

### Why not test dev/preview servers fully?

Long-running server tests can be flaky and slow. Instead, we:

- Verify the executors are configured correctly
- Test that targets are inferred properly
- Leave actual server startup/shutdown for manual testing

### Why use pnpm?

The project uses pnpm as the package manager, so all tests use pnpm for consistency.

### Why install @astrojs/check in test?

The check executor requires `@astrojs/check` which may not be installed by default. Installing it in the test ensures reliability.

## Future Enhancements

Potential additions to the test suite:

- Test error handling and edge cases
- Test with different Astro configurations (SSR, hybrid)
- Test integration with other frameworks (React, Vue, etc.)
- Test migration scenarios
- Performance benchmarks
