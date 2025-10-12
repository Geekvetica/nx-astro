# Contributing to @geekvetica/nx-astro

Thank you for considering contributing to @geekvetica/nx-astro! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

### Our Standards

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18.0.0 or higher
- **npm**, **yarn**, or **pnpm** package manager
- **Git** for version control
- A **GitHub account**

### Finding Ways to Contribute

- **Bug Reports**: Find and report bugs
- **Feature Requests**: Suggest new features
- **Documentation**: Improve or expand documentation
- **Code**: Fix bugs or implement features
- **Examples**: Add usage examples
- **Testing**: Write tests or improve test coverage

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/geekvetica/nx-astro.git
cd nx-astro
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### 3. Build the Plugin

```bash
# Build @geekvetica/nx-astro plugin
nx build nx-astro

# Verify build succeeded
ls dist/nx-astro
```

### 4. Run Tests

```bash
# Run unit tests
nx test nx-astro

# Run E2E tests
nx e2e nx-astro-e2e

# Run all tests
nx run-many --target=test --all
```

### 5. Create a Branch

```bash
# Create feature branch
git checkout -b feature/my-feature

# Or bug fix branch
git checkout -b fix/bug-description
```

---

## Project Structure

```
nx-astro/
├── nx-astro/                      # Main plugin package
│   ├── src/
│   │   ├── generators/            # Code generators
│   │   │   ├── init/
│   │   │   ├── application/
│   │   │   └── component/
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
│   └── package.json
│
├── nx-astro-e2e/                  # E2E tests
│   └── tests/
│
├── docs/                          # Documentation
│   ├── generators.md
│   ├── executors.md
│   ├── configuration.md
│   └── ...
│
└── README.md
```

---

## Development Workflow

### Working on Generators

```bash
# Navigate to generator directory
cd nx-astro/src/generators/application

# Edit generator implementation
# - application.ts (implementation)
# - schema.json (options schema)
# - schema.d.ts (TypeScript types)
# - files/ (template files)

# Write tests
# - application.spec.ts

# Test locally
nx build nx-astro
nx g @geekvetica/nx-astro:application test-app --dry-run
```

### Working on Executors

```bash
# Navigate to executor directory
cd nx-astro/src/executors/build

# Edit executor implementation
# - build.impl.ts (implementation)
# - schema.json (options schema)
# - schema.d.ts (TypeScript types)

# Write tests
# - build.impl.spec.ts

# Test locally
nx build nx-astro
nx build test-app
```

### Testing Changes Locally

```bash
# Build the plugin
nx build nx-astro

# Link locally for testing
cd dist/nx-astro
pnpm link --global

# In a test workspace
cd /path/to/test-workspace
pnpm link --global @geekvetica/nx-astro

# Test your changes
nx g @geekvetica/nx-astro:application my-test-app
```

---

## Testing

### Unit Tests

Write unit tests for all new functionality:

```typescript
// Example unit test
import { applicationGenerator } from './application';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe('application generator', () => {
  let tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate application files', async () => {
    await applicationGenerator(tree, { name: 'test-app' });

    expect(tree.exists('apps/test-app/astro.config.mjs')).toBe(true);
    expect(tree.exists('apps/test-app/src/pages/index.astro')).toBe(true);
  });

  it('should update workspace configuration', async () => {
    await applicationGenerator(tree, { name: 'test-app' });

    const config = readProjectConfiguration(tree, 'test-app');
    expect(config.targets.build).toBeDefined();
  });
});
```

### E2E Tests

E2E tests verify end-to-end functionality:

```typescript
// Example E2E test
describe('@geekvetica/nx-astro e2e', () => {
  it('should create and build an application', async () => {
    const project = newProject();

    // Generate application
    runNxCommandAsync('generate @geekvetica/nx-astro:application my-app').exitCode;
    expect(await fileExists('apps/my-app/astro.config.mjs')).toBe(true);

    // Build application
    const result = await runNxCommandAsync('build my-app');
    expect(result.stdout).toContain('Successfully built');
    expect(await fileExists('dist/apps/my-app/index.html')).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all unit tests
nx test nx-astro

# Run specific test file
nx test nx-astro --testFile=application.spec.ts

# Run with coverage
nx test nx-astro --coverage

# Run E2E tests
nx e2e nx-astro-e2e

# Run in watch mode
nx test nx-astro --watch
```

### Test Coverage

Maintain high test coverage:

```bash
# Check coverage
nx test nx-astro --coverage

# Coverage requirements:
# - Statements: 80%+
# - Branches: 80%+
# - Functions: 80%+
# - Lines: 80%+
```

---

## Coding Standards

### TypeScript

- Use **strict mode** (`strict: true` in tsconfig)
- Avoid `any` type - use `unknown` when type is uncertain
- Use type inference when type is obvious
- Document public APIs with JSDoc comments

```typescript
/**
 * Creates a new Astro application in the workspace.
 *
 * @param tree The file system tree
 * @param options Generator options
 * @returns A function that performs the generation
 */
export async function applicationGenerator(tree: Tree, options: ApplicationGeneratorSchema): Promise<GeneratorCallback> {
  // Implementation
}
```

### Code Style

- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons** at statement ends
- Use **trailing commas** in multi-line objects/arrays
- Maximum line length: **100 characters**

### Naming Conventions

- **Files**: kebab-case (`application.ts`, `dev.impl.ts`)
- **Classes**: PascalCase (`ApplicationGenerator`)
- **Functions**: camelCase (`applicationGenerator`)
- **Interfaces**: PascalCase (`ApplicationGeneratorSchema`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PORT`)

### File Organization

- Group related functionality
- Keep files focused and under 300 lines
- Extract utilities to separate files
- Use barrel exports (`index.ts`) for public APIs

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring (no feature change)
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
# Feature
feat(application): add portfolio template option

# Bug fix
fix(build): correct output path resolution on Windows

# Documentation
docs(readme): add installation instructions

# Refactor
refactor(generators): extract common file generation logic

# Test
test(dev): add tests for custom port configuration
```

### Scope

The scope should be the name of the affected package or area:

- `generators` - Generator-related changes
- `executors` - Executor-related changes
- `plugin` - Plugin infrastructure
- `docs` - Documentation
- `deps` - Dependencies

---

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**

   ```bash
   nx test nx-astro
   nx e2e nx-astro-e2e
   ```

2. **Lint your code**

   ```bash
   nx lint nx-astro
   ```

3. **Build successfully**

   ```bash
   nx build nx-astro
   ```

4. **Update documentation** if needed

5. **Add tests** for new functionality

### Creating a Pull Request

1. **Push to your fork**

   ```bash
   git push origin feature/my-feature
   ```

2. **Create PR on GitHub**

   - Use a clear, descriptive title
   - Reference related issues
   - Describe changes made
   - Include screenshots if UI-related

3. **Fill out PR template**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - [ ] Unit tests added/updated
   - [ ] E2E tests added/updated
   - [ ] Manual testing performed

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings
   - [ ] Tests pass locally
   ```

### PR Review Process

1. **Automated checks** run (CI, linting, tests)
2. **Maintainer review** (may request changes)
3. **Address feedback** (update PR as needed)
4. **Approval** by maintainer
5. **Merge** (squash and merge)

### After Merge

- Delete your branch
- Pull latest main
- Close related issues

---

## Issue Reporting

### Bug Reports

Create a bug report with:

1. **Clear title**: Describe the bug concisely
2. **Description**: Detailed explanation
3. **Steps to reproduce**:
   ```
   1. Run 'nx g @geekvetica/nx-astro:application my-app'
   2. Run 'nx build my-app'
   3. See error...
   ```
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Environment**:
   - OS: macOS 14.0
   - Node: 18.17.0
   - Nx: 21.6.4
   - @geekvetica/nx-astro: 1.0.0
7. **Additional context**: Screenshots, logs, etc.

### Feature Requests

Create a feature request with:

1. **Problem description**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: Other approaches
4. **Additional context**: Use cases, examples

---

## Documentation

### Writing Documentation

- Use clear, concise language
- Provide code examples
- Include use cases
- Update existing docs when making changes

### Documentation Types

- **User guides**: How to use features
- **API reference**: Technical specifications
- **Examples**: Real-world usage
- **Troubleshooting**: Common issues and solutions

### Documentation Structure

```
docs/
├── generators.md           # Generator usage
├── executors.md            # Executor usage
├── configuration.md        # Configuration options
├── migration-guide.md      # Migration instructions
├── examples.md             # Usage examples
├── troubleshooting.md      # Common issues
├── api-reference.md        # Technical reference
└── faq.md                  # Frequently asked questions
```

---

## Development Tips

### Debugging

```bash
# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug generator
node --inspect-brk node_modules/.bin/nx g @geekvetica/nx-astro:application my-app

# Verbose output
nx build my-app --verbose
```

### Local Testing

```bash
# Create test workspace
npx create-nx-workspace test-workspace
cd test-workspace

# Link local plugin
pnpm link --global @geekvetica/nx-astro

# Test changes
nx g @geekvetica/nx-astro:application test-app
```

### Performance

- Use Nx caching
- Avoid unnecessary file system operations
- Use streams for large files
- Profile with Chrome DevTools

---

## Questions?

- **GitHub Discussions**: Ask questions
- **Discord**: Join Nx community
- **Issues**: Report bugs or request features

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Copyright (c) 2025 Geekvetica Paweł Wojciechowski

---

Thank you for contributing to @geekvetica/nx-astro!
