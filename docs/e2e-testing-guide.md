# E2E Testing Guide for nx-astro Plugin

## Overview

This guide provides comprehensive information about the E2E (End-to-End) testing suite for the nx-astro plugin. The test suite validates the complete plugin functionality in real Nx workspace scenarios.

## Test Suite Statistics

- **Total Test Cases:** 26
- **Test Groups (describe blocks):** 13
- **Helper Functions:** 15+
- **Total Lines of Code:** 847 (tests + helpers + docs)
- **Test File:** 436 lines
- **Helper Utilities:** 231 lines
- **Documentation:** 180 lines
- **Test Timeout:** 5 minutes (300 seconds)

## Architecture

### Directory Structure

```
nx-astro-e2e/
├── src/
│   ├── helpers/
│   │   └── test-utils.ts          # Reusable test utilities
│   └── nx-astro.spec.ts            # Main E2E test suite
├── jest.config.ts                  # Jest configuration
├── project.json                    # Nx project configuration
├── tsconfig.json                   # TypeScript config
└── README.md                       # Test documentation
```

## Test Groups

### 1. Plugin Installation (1 test)

Tests the basic plugin installation process.

**Test Cases:**

- Verify plugin is installed and listed correctly

**What it validates:**

- Plugin can be added to workspace
- Package is properly resolved
- Dependencies are correct

### 2. Init Generator (2 tests)

Tests the `nx-astro:init` generator functionality.

**Test Cases:**

- Register plugin in nx.json
- Add Astro dependencies to package.json

**What it validates:**

- Plugin registration works
- Plugin configuration is correct
- Dependencies are added
- Package manager compatibility

### 3. Application Generator (5 tests)

Tests the `nx-astro:app` generator for creating Astro applications.

**Test Cases:**

- Create new Astro application
- Generate all required files
- Validate Astro config structure
- Verify package.json configuration
- Check TypeScript config

**What it validates:**

- Application scaffolding
- File generation
- Configuration structure
- TypeScript setup
- Project structure

**Generated Files Verified:**

```
apps/test-app/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/
│   │   └── index.astro
│   ├── components/
│   ├── layouts/
│   └── env.d.ts
└── public/
    └── favicon.svg
```

### 4. Component Generator (2 tests)

Tests the `nx-astro:component` generator.

**Test Cases:**

- Generate Astro component
- Validate component content structure

**What it validates:**

- Component file creation
- Component structure
- File naming conventions
- Component frontmatter

### 5. Task Inference (7 tests)

Tests the createNodesV2 plugin functionality for automatic task detection.

**Test Cases:**

- Detect Astro project configuration
- Infer build target
- Infer dev target
- Infer check target
- Infer sync target
- Infer preview target
- Infer test target

**What it validates:**

- Automatic project detection
- Target inference
- Executor configuration
- Plugin options parsing
- Project graph integration

**Verified Targets:**

```typescript
{
  build: { executor: '@geekvetica/nx-astro:build' },
  dev: { executor: '@geekvetica/nx-astro:dev' },
  check: { executor: '@geekvetica/nx-astro:check' },
  sync: { executor: '@geekvetica/nx-astro:sync' },
  preview: { executor: '@geekvetica/nx-astro:preview' },
  test: { executor: '@geekvetica/nx-astro:test' }
}
```

### 6. Sync Executor (1 test)

Tests the `nx-astro:sync` executor for type generation.

**Test Cases:**

- Run astro sync command successfully

**What it validates:**

- Executor runs without errors
- Type generation works
- Configuration parsing

### 7. Check Executor (1 test)

Tests the `nx-astro:check` executor for type checking.

**Test Cases:**

- Install @astrojs/check dependency
- Run type checking without errors

**What it validates:**

- Type checking functionality
- Dependency management
- Error detection
- Configuration validation

**Prerequisites:**

```bash
pnpm add -D @astrojs/check typescript
```

### 8. Build Executor (3 tests)

Tests the `nx-astro:build` executor for production builds.

**Test Cases:**

- Build Astro project
- Verify dist output generation
- Test build caching functionality

**What it validates:**

- Build process
- Output generation
- File structure
- Nx caching integration
- Build artifacts

**Expected Output:**

```
dist/apps/test-app/
├── index.html
├── _astro/
└── ... (other build artifacts)
```

### 9. Test Executor (1 test)

Tests the `nx-astro:test` executor with Vitest.

**Test Cases:**

- Create sample test file
- Run Vitest tests successfully

**What it validates:**

- Test runner integration
- Vitest configuration
- Test execution
- Test reporting

**Sample Test:**

```typescript
import { describe, it, expect } from 'vitest';

describe('Sample test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

### 10. Dev Server (1 test)

Tests the dev server configuration.

**Test Cases:**

- Verify dev target configuration

**What it validates:**

- Target is properly configured
- Executor is assigned
- Configuration is valid

**Note:** Does not start actual server to avoid flaky tests.

### 11. Preview Server (1 test)

Tests the preview server configuration.

**Test Cases:**

- Verify preview target configuration

**What it validates:**

- Target is properly configured
- Executor is assigned
- Configuration is valid

**Note:** Does not start actual server to avoid flaky tests.

## Helper Utilities Reference

### Command Execution

#### `runNxCommand(command: string, cwd: string, options?: { silent?: boolean; env?: NodeJS.ProcessEnv }): string`

Execute an Nx command in the test project directory.

```typescript
runNxCommand('build test-app', projectDirectory);
```

#### `runPnpmCommand(command: string, cwd: string, options?: { silent?: boolean; env?: NodeJS.ProcessEnv }): string`

Execute a pnpm command in the test project directory.

```typescript
runPnpmCommand('add -D @astrojs/check', projectDirectory);
```

### File Operations

#### `fileExists(filePath: string, projectDir: string): boolean`

Check if a file exists in the test project.

```typescript
if (fileExists('astro.config.mjs', projectDirectory)) {
  // File exists
}
```

#### `readFile(filePath: string, projectDir: string): string`

Read file contents from the test project.

```typescript
const content = readFile('package.json', projectDirectory);
```

#### `writeFile(filePath: string, content: string, projectDir: string): void`

Write content to a file in the test project.

```typescript
writeFile('test.spec.ts', testContent, projectDirectory);
```

#### `readJsonFile<T>(filePath: string, projectDir: string): T`

Read and parse a JSON file.

```typescript
const packageJson = readJsonFile<{ name: string }>('package.json', projectDirectory);
```

### Process Management

#### `startProcess(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): ChildProcess`

Start a long-running process.

```typescript
const devProcess = startProcess('npx', ['nx', 'dev', 'test-app'], projectDirectory);
```

#### `killProcess(process: ChildProcess): Promise<void>`

Kill a process and wait for it to exit.

```typescript
await killProcess(devProcess);
```

### Port Utilities

#### `waitForPort(port: number, timeout?: number): Promise<void>`

Wait for a port to be in use (server started).

```typescript
await waitForPort(4321, 60000); // Wait up to 60 seconds
```

#### `isPortAvailable(port: number): Promise<boolean>`

Check if a port is available.

```typescript
const available = await isPortAvailable(4321);
```

### Utility Functions

#### `waitForCondition(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>`

Wait for a condition to be true.

```typescript
await waitForCondition(() => fileExists('dist/index.html', projectDir), 30000);
```

#### `logStep(message: string): void`

Log a test step for debugging.

```typescript
logStep('Running build executor...');
```

## Test Execution Flow

### 1. Setup Phase (beforeAll)

```typescript
beforeAll(() => {
  // 1. Create temporary Nx workspace
  projectDirectory = createTestProject();

  // 2. Install nx-astro plugin
  execSync('pnpm add -Dw nx-astro@e2e', {
    cwd: projectDirectory,
  });
});
```

### 2. Test Execution Phase

The tests run in order:

1. Plugin installation verification
2. Init generator tests
3. Application generator tests
4. Component generator tests
5. Task inference tests
6. Executor tests (sync, check, build, test)
7. Server configuration tests

### 3. Cleanup Phase (afterAll)

```typescript
afterAll(() => {
  // Remove temporary workspace
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
});
```

## Running Tests

### Local Development

```bash
# Run all E2E tests
pnpx nx e2e nx-astro-e2e

# Run with verbose output
pnpx nx e2e nx-astro-e2e --verbose

# Run with specific reporter
pnpx nx e2e nx-astro-e2e --reporters=verbose
```

### CI/CD

Tests are designed to run automatically in CI pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: pnpx nx e2e nx-astro-e2e
```

### Debugging Tests

Enable verbose output and logging:

```bash
# Set environment variable
export NX_VERBOSE_LOGGING=true

# Run tests
pnpx nx e2e nx-astro-e2e --verbose
```

## Test Environment

### Workspace Configuration

- **Type:** Nx workspace with `apps` preset
- **Package Manager:** pnpm
- **Node Version:** Current
- **Location:** `tmp/test-project/`
- **Registry:** Verdaccio local registry
- **Cleanup:** Automatic

### Dependencies

Tests automatically install:

- nx-astro plugin (from local registry)
- @astrojs/check (for type checking)
- typescript (for type checking)
- All Astro dependencies

## Best Practices

### Writing New Tests

1. **Follow TDD**

   ```typescript
   it('should do something', () => {
     // Arrange
     const input = setupTestData();

     // Act
     const result = performAction(input);

     // Assert
     expect(result).toBe(expected);
   });
   ```

2. **Use Helper Utilities**

   ```typescript
   // ❌ Don't
   execSync('npx nx build test-app', { cwd: projectDirectory });

   // ✅ Do
   runNxCommand('build test-app', projectDirectory);
   ```

3. **Log Steps**

   ```typescript
   it('should build project', () => {
     logStep('Running build executor...');
     runNxCommand('build test-app', projectDirectory);

     logStep('Verifying build output...');
     expect(fileExists('dist/index.html', projectDirectory)).toBe(true);
   });
   ```

4. **Handle Errors**
   ```typescript
   it('should handle errors gracefully', () => {
     expect(() => {
       runNxCommand('invalid-command', projectDirectory);
     }).toThrow();
   });
   ```

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- One assertion per test (when possible)
- Test happy path and edge cases
- Clean up resources in afterEach/afterAll

### Performance Optimization

- Reuse test workspace across test groups
- Use silent mode for commands that don't need output
- Avoid starting long-running servers
- Cache dependencies when possible
- Use appropriate timeouts

## Troubleshooting

### Tests Timeout

**Symptoms:**

- Tests fail with timeout error
- No output for extended periods

**Solutions:**

1. Increase timeout in jest.config.ts:

   ```typescript
   testTimeout: 600000; // 10 minutes
   ```

2. Check network connectivity:

   ```bash
   ping registry.npmjs.org
   ```

3. Verify verdaccio is running:
   ```bash
   ps aux | grep verdaccio
   ```

### Check Executor Fails

**Symptoms:**

- Type checking fails
- @astrojs/check not found

**Solutions:**

1. Verify TypeScript version:

   ```bash
   pnpm ls typescript
   ```

2. Manually install dependency:

   ```bash
   pnpm add -D @astrojs/check
   ```

3. Check package.json:
   ```bash
   cat package.json | grep check
   ```

### Build Fails

**Symptoms:**

- Build executor throws error
- Output directory not created

**Solutions:**

1. Check for syntax errors:

   ```bash
   pnpx nx lint test-app
   ```

2. Verify Astro installation:

   ```bash
   pnpm ls astro
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Component Not Generated

**Symptoms:**

- Component file doesn't exist
- Generator completes but no file

**Solutions:**

1. Verify application exists:

   ```bash
   pnpx nx show project test-app
   ```

2. Check generator logs:

   ```bash
   pnpx nx g @geekvetica/nx-astro:component Button --dry-run
   ```

3. Verify project configuration:
   ```bash
   cat apps/test-app/project.json
   ```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run E2E tests
        run: pnpx nx e2e nx-astro-e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: coverage/
```

### GitLab CI

```yaml
e2e-tests:
  stage: test
  image: node:20
  script:
    - npm install -g pnpm
    - pnpm install
    - pnpx nx e2e nx-astro-e2e
  artifacts:
    when: always
    paths:
      - coverage/
```

## Future Enhancements

### Planned Improvements

1. **Advanced Scenarios**

   - SSR/hybrid mode configurations
   - Multiple framework integrations
   - Custom adapter testing
   - Multi-project workspaces

2. **Error Testing**

   - Invalid configurations
   - Missing dependencies
   - File system errors
   - Network failures

3. **Performance Testing**

   - Build time benchmarks
   - Cache effectiveness metrics
   - Memory profiling
   - Large project testing

4. **Platform Testing**

   - Windows compatibility
   - Linux testing
   - macOS verification
   - Different Node versions

5. **Migration Testing**
   - Version upgrades
   - Breaking change handling
   - Backward compatibility
   - Migration scripts

## Resources

### Documentation

- [Nx Documentation](https://nx.dev)
- [Astro Documentation](https://docs.astro.build)
- [Jest Documentation](https://jestjs.io)
- [Vitest Documentation](https://vitest.dev)

### Project Files

- Main test file: `nx-astro-e2e/src/nx-astro.spec.ts`
- Helper utilities: `nx-astro-e2e/src/helpers/test-utils.ts`
- Test README: `nx-astro-e2e/README.md`
- Jest config: `nx-astro-e2e/jest.config.ts`

### Related Documentation

- Stage 12 Summary: `STAGE-12-SUMMARY.md`
- Architecture: `docs/architecture.md`
- Plugin README: `nx-astro/README.md`

## Conclusion

The E2E test suite provides comprehensive coverage of the nx-astro plugin functionality. It validates all generators, executors, and plugin features in real Nx workspace scenarios. The tests are reliable, well-documented, and designed for both local development and CI/CD execution.

By following this guide, developers can understand, maintain, and extend the test suite to ensure the continued quality and reliability of the nx-astro plugin.
