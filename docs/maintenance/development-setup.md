# Development Setup

This guide covers the development environment setup for maintainers and core contributors of `@geekvetica/nx-astro`.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher (20.x recommended)
- **pnpm** package manager (version 9 or higher)
- **Git** for version control
- A **GitHub account** with appropriate repository access

### Verifying Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check pnpm version
pnpm --version  # Should be 9.0.0 or higher

# Check Git version
git --version   # Any recent version is fine
```

## Repository Setup

### 1. Fork and Clone

If you're a core contributor, you can clone directly. Otherwise, fork first:

```bash
# Fork the repository on GitHub (if not a core contributor)
# Then clone your fork or the main repository
git clone https://github.com/geekvetica/nx-astro.git
cd nx-astro
```

### 2. Install Dependencies

The workspace uses **pnpm** as the package manager:

```bash
# Install all dependencies
pnpm install
```

This will install dependencies for:
- The `nx-astro` plugin package
- The `nx-astro-e2e` test package
- Workspace-level tooling

### 3. Build the Plugin

Build the plugin to ensure everything is set up correctly:

```bash
# Build the nx-astro plugin
npx nx build nx-astro
```

The build output will be in `dist/nx-astro/`.

### 4. Verify Build Output

```bash
# Verify build succeeded
ls -la dist/nx-astro

# Check that essential files exist
cat dist/nx-astro/package.json
cat dist/nx-astro/generators.json
cat dist/nx-astro/executors.json
```

### 5. Run Tests

Verify that all tests pass:

```bash
# Run unit tests for nx-astro
npx nx test nx-astro

# Run tests in CI mode with coverage
npx nx test nx-astro --configuration=ci

# Run E2E tests (requires built plugin)
npx nx e2e nx-astro-e2e

# Run all tests
npx nx run-many -t test --all
```

### 6. Run Linting

Ensure code quality standards are met:

```bash
# Lint nx-astro plugin
npx nx lint nx-astro

# Lint E2E tests
npx nx lint nx-astro-e2e

# Lint all projects
npx nx run-many -t lint --all
```

## Development Workflow

### Creating a Feature Branch

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Or a bug fix branch
git checkout -b fix/bug-description
```

### Making Changes

1. Make your changes in the appropriate directory:
   - Generators: `nx-astro/src/generators/`
   - Executors: `nx-astro/src/executors/`
   - Plugin core: `nx-astro/src/plugin.ts`
   - Utilities: `nx-astro/src/utils/`
   - Types: `nx-astro/src/types/`

2. Write or update tests:
   - Unit tests: `*.spec.ts` files next to implementation
   - E2E tests: `nx-astro-e2e/src/`

3. Build and test your changes:
   ```bash
   # Build
   npx nx build nx-astro

   # Run tests
   npx nx test nx-astro

   # Run specific test file
   npx nx test nx-astro --testFile=my-feature.spec.ts
   ```

### Testing Changes Locally

To test your changes in a real Nx workspace:

```bash
# Build the plugin
npx nx build nx-astro

# Link locally for testing
cd dist/nx-astro
npm link

# In a test workspace
cd /path/to/test-workspace
npm link @geekvetica/nx-astro

# Test your changes
npx nx g @geekvetica/nx-astro:application my-test-app
```

### Using Watch Mode

For rapid development, use watch mode:

```bash
# Run tests in watch mode
npx nx test nx-astro --watch

# Build in watch mode (if supported)
npx nx build nx-astro --watch
```

## Project Structure

Understanding the project layout:

```
nx-astro/
├── nx-astro/                      # Main plugin package
│   ├── src/
│   │   ├── generators/            # Code generators
│   │   │   ├── init/
│   │   │   ├── application/
│   │   │   ├── library/
│   │   │   └── configuration/
│   │   ├── executors/             # Task executors
│   │   │   ├── dev/
│   │   │   ├── build/
│   │   │   ├── preview/
│   │   │   ├── check/
│   │   │   ├── test/
│   │   │   └── sync/
│   │   ├── utils/                 # Shared utilities
│   │   ├── types/                 # TypeScript types
│   │   ├── plugin.ts              # Plugin implementation
│   │   └── index.ts               # Main export
│   ├── generators.json            # Generator registry
│   ├── executors.json             # Executor registry
│   ├── plugin-options.json        # Plugin options schema
│   └── package.json
│
├── nx-astro-e2e/                  # E2E tests
│   ├── src/
│   │   ├── nx-astro.spec.ts       # Main E2E tests
│   │   └── helpers/               # Test helpers
│   ├── jest.config.ts
│   └── project.json
│
├── docs/                          # Documentation
│   ├── generators.md
│   ├── executors.md
│   ├── configuration.md
│   └── maintenance/               # Maintainer docs
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # CI pipeline
│       └── release.yml            # Release pipeline
│
├── nx.json                        # Nx workspace config
├── tsconfig.base.json             # Base TypeScript config
├── package.json                   # Workspace dependencies
└── pnpm-workspace.yaml            # pnpm workspace config
```

## Common Development Tasks

### Adding a New Generator

1. Create generator directory:
   ```bash
   mkdir -p nx-astro/src/generators/my-generator
   ```

2. Create required files:
   - `my-generator.ts` - Implementation
   - `my-generator.spec.ts` - Tests
   - `schema.json` - Options schema
   - `schema.d.ts` - TypeScript types
   - `files/` - Template files (if needed)

3. Register in `nx-astro/generators.json`:
   ```json
   {
     "generators": {
       "my-generator": {
         "factory": "./src/generators/my-generator/my-generator",
         "schema": "./src/generators/my-generator/schema.json",
         "description": "Description of my generator"
       }
     }
   }
   ```

4. Build and test:
   ```bash
   npx nx build nx-astro
   npx nx test nx-astro
   ```

### Adding a New Executor

1. Create executor directory:
   ```bash
   mkdir -p nx-astro/src/executors/my-executor
   ```

2. Create required files:
   - `my-executor.impl.ts` - Implementation
   - `my-executor.impl.spec.ts` - Tests
   - `schema.json` - Options schema
   - `schema.d.ts` - TypeScript types

3. Register in `nx-astro/executors.json`:
   ```json
   {
     "executors": {
       "my-executor": {
         "implementation": "./src/executors/my-executor/my-executor.impl",
         "schema": "./src/executors/my-executor/schema.json",
         "description": "Description of my executor"
       }
     }
   }
   ```

4. Build and test:
   ```bash
   npx nx build nx-astro
   npx nx test nx-astro
   ```

### Running Nx Commands

```bash
# Build all projects
npx nx run-many -t build --all

# Test all projects
npx nx run-many -t test --all

# Lint all projects
npx nx run-many -t lint --all

# Run multiple targets in parallel
npx nx run-many -t lint test build --all --parallel=3

# Visualize dependency graph
npx nx graph

# Clear Nx cache
npx nx reset
```

## Debugging

### Debugging Tests

```bash
# Debug tests with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test file
node --inspect-brk node_modules/.bin/jest --runInBand nx-astro/src/generators/application/application.spec.ts
```

### Debugging Generators

```bash
# Debug generator execution
node --inspect-brk node_modules/.bin/nx g @geekvetica/nx-astro:application my-app

# Run generator with verbose output
NX_VERBOSE_LOGGING=true npx nx g @geekvetica/nx-astro:application my-app
```

### Debugging Executors

```bash
# Run executor with verbose output
NX_VERBOSE_LOGGING=true npx nx build my-app --verbose
```

### Using Chrome DevTools

1. Run debug command (with `--inspect-brk`)
2. Open Chrome and navigate to `chrome://inspect`
3. Click "inspect" on the Node.js target
4. Set breakpoints and debug

## Performance Optimization

### Leveraging Nx Cache

Nx automatically caches task results:

```bash
# First run - executes
npx nx test nx-astro

# Second run - cached (instant)
npx nx test nx-astro

# Clear cache if needed
npx nx reset
```

### Parallel Execution

Run tasks in parallel for better performance:

```bash
# Run tests in parallel (3 workers)
npx nx run-many -t test --all --parallel=3

# Limit parallel tasks
npx nx run-many -t build --all --parallel=2
```

## CI/CD Integration

The project uses GitHub Actions for CI/CD. When developing:

1. All CI checks must pass before merging
2. Tests run on every push and PR
3. E2E tests verify plugin functionality
4. Coverage reports are generated

See [CI/CD Setup](./ci-cd-setup.md) for detailed CI/CD information.

## Troubleshooting

### Common Issues

**Issue: pnpm install fails**
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

**Issue: Build fails with TypeScript errors**
```bash
# Check TypeScript version
npx tsc --version

# Rebuild TypeScript project references
npx nx reset
npx nx build nx-astro
```

**Issue: Tests fail with module resolution errors**
```bash
# Ensure plugin is built first
npx nx build nx-astro

# Clear Jest cache
npx jest --clearCache
```

**Issue: E2E tests fail**
```bash
# Ensure plugin is built
npx nx build nx-astro

# Check verdaccio is not running on port 4873
lsof -ti:4873 | xargs kill -9

# Run E2E tests
npx nx e2e nx-astro-e2e
```

### Getting Help

- Review existing documentation in `docs/`
- Check GitHub Issues for similar problems
- Ask in GitHub Discussions
- Contact maintainers directly

## Next Steps

After setting up your development environment:

1. Review the [Project Structure](./project-structure.md) documentation
2. Understand the [Release Process](./release-process.md)
3. Read the [Contributing Guidelines](../../CONTRIBUTING.md)
4. Explore the codebase and run examples

## Additional Resources

- [Nx Documentation](https://nx.dev)
- [Astro Documentation](https://docs.astro.build)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
