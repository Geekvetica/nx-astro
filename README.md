# nx-astro

[![CI](https://github.com/geekvetica/nx-astro/actions/workflows/ci.yml/badge.svg)](https://github.com/geekvetica/nx-astro/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/geekvetica/nx-astro/branch/main/graph/badge.svg)](https://codecov.io/gh/geekvetica/nx-astro)
[![npm version](https://badge.fury.io/js/%40geekvetica%2Fnx-astro.svg)](https://www.npmjs.com/package/@geekvetica/nx-astro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An Nx plugin for [Astro](https://astro.build) that provides generators and executors for seamless integration of Astro applications in Nx monorepos.

## Features

- **Project Generators**: Scaffold new Astro applications and libraries with best practices
- **Import Generator**: Import existing Astro projects into your Nx workspace
- **Configuration Generator**: Add Astro to existing projects
- **Build Executor**: Build Astro sites with Nx caching
- **Dev Server Executor**: Run Astro dev server with hot reload
- **Preview Executor**: Preview production builds locally
- **Sync Executor**: Generate Astro TypeScript definitions
- **Check Executor**: Type-check Astro components and pages
- **Test Executor**: Run Vitest tests (automatically configured when vitest is detected)
- **Full Nx Integration**: Leverage Nx's task caching, affected commands, and dependency graph

## Installation

### New Workspace

Create a new Nx workspace with Astro:

```bash
npx create-nx-workspace@latest my-workspace --preset=@geekvetica/nx-astro
```

### Existing Workspace

Add nx-astro to an existing Nx workspace:

```bash
# npm
npm install --save-dev @geekvetica/nx-astro

# pnpm
pnpm add -D @geekvetica/nx-astro

# yarn
yarn add -D @geekvetica/nx-astro
```

## Usage

### Generate a New Astro Application

```bash
nx g @geekvetica/nx-astro:application my-app
```

Options:

- `--directory`: Directory where the app is placed
- `--tags`: Tags for the project (comma-separated)
- `--adapter`: Astro adapter (none, node, vercel, netlify, cloudflare)
- `--style`: CSS framework (css, scss, tailwind, styled-components)
- `--unitTestRunner`: Unit test runner (vitest, none)
- `--e2eTestRunner`: E2E test runner (playwright, cypress, none)

### Generate a New Astro Library

```bash
nx g @geekvetica/nx-astro:library my-lib
```

Options:

- `--directory`: Directory where the library is placed
- `--tags`: Tags for the project
- `--unitTestRunner`: Unit test runner (vitest, none)
- `--buildable`: Generate a buildable library

### Import an Existing Astro Project

Import an existing standalone Astro project into your Nx workspace:

```bash
nx g @geekvetica/nx-astro:import --source=/path/to/astro-project --name=my-app
```

Options:

- `--source`: Path to the existing Astro project directory (required)
- `--name`: Name for the imported project in the workspace (required)
- `--directory`: Destination directory in the workspace (e.g., `apps/my-app`)
- `--tags`: Tags for the project (comma-separated)

The import generator will:

- Copy all project files to the workspace
- Create a `project.json` with inferred Nx targets (build, dev, preview, check, sync)
- Update TypeScript path mappings in `tsconfig.base.json`
- Preserve the original project structure and configuration
- Automatically detect and configure available targets based on dependencies (e.g., test target only if vitest is installed)

Example:

```bash
# Import a standalone Astro blog into apps/blog
nx g @geekvetica/nx-astro:import --source=../my-astro-blog --name=blog --directory=apps/blog

# After import, you can use all Nx commands
nx dev blog
nx build blog
nx test blog  # Only available if vitest is installed
```

### Add Astro Configuration to Existing Project

```bash
nx g @geekvetica/nx-astro:configuration my-existing-project
```

### Run Development Server

```bash
nx dev my-app
```

Options:

- `--port`: Port number (default: 4321)
- `--host`: Host address (default: localhost)
- `--open`: Open browser on startup

### Build for Production

```bash
nx build my-app
```

Options:

- `--outDir`: Output directory (default: dist/apps/my-app)

### Preview Production Build

```bash
nx preview my-app
```

Options:

- `--port`: Port number (default: 4321)
- `--host`: Host address

### Sync Astro Dependencies

Generate TypeScript definitions for content collections and integrations:

```bash
nx sync my-app
```

### Type Check

Run Astro's type checker:

```bash
nx check my-app
```

**Requirements:**

- The `@astrojs/check` package must be installed as a devDependency
- If missing, the executor will display an error with installation instructions
- The install command shown will match your package manager (bun, pnpm, yarn, or npm)

**Manual installation**:

```bash
# Bun
bun add -d @astrojs/check

# pnpm
pnpm add -D @astrojs/check

# Yarn
yarn add -D @astrojs/check

# npm
npm install --save-dev @astrojs/check
```

**Auto-install option**:

You can enable automatic installation of `@astrojs/check` by adding the `autoInstall` option to your project configuration:

```json
{
  "targets": {
    "check": {
      "executor": "@geekvetica/nx-astro:check",
      "options": {
        "autoInstall": true
      }
    }
  }
}
```

When `autoInstall: true`, the plugin will automatically install `@astrojs/check` if it's missing, then proceed with type checking.

## Nx Integration

### Affected Commands

Only build/test projects affected by your changes:

```bash
# Build only affected projects
nx affected -t build

# Test only affected projects
nx affected -t test

# Run multiple targets
nx affected -t lint test build
```

### Task Caching

Nx automatically caches task results. Subsequent runs are instant:

```bash
# First run - executes
nx build my-app

# Second run - cached (instant)
nx build my-app
```

### Dependency Graph

Visualize your workspace structure:

```bash
nx graph
```

### Run Multiple Projects

```bash
# Run target for all projects
nx run-many -t build --all

# Run for specific projects
nx run-many -t build --projects=app1,app2

# Parallel execution
nx run-many -t test --all --parallel=3
```

## Project Structure

Generated Astro applications follow this structure:

```
apps/my-app/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   └── index.astro
│   └── styles/
├── public/
├── astro.config.mjs
├── tsconfig.json
├── project.json
└── package.json
```

## Configuration

### project.json

Each Astro project has a `project.json` defining its targets:

```json
{
  "name": "my-app",
  "targets": {
    "build": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "outputPath": "dist/apps/my-app"
      }
    },
    "dev": {
      "executor": "@geekvetica/nx-astro:dev",
      "options": {
        "port": 4321
      }
    },
    "sync": {
      "executor": "@geekvetica/nx-astro:sync"
    },
    "check": {
      "executor": "@geekvetica/nx-astro:check"
    }
  }
}
```

### astro.config.mjs

Standard Astro configuration file:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Your Astro configuration
});
```

## Adapters

### Static Site (Default)

```bash
nx g @geekvetica/nx-astro:application my-app
```

### Server-Side Rendering

```bash
# Node.js
nx g @geekvetica/nx-astro:application my-app --adapter=node

# Vercel
nx g @geekvetica/nx-astro:application my-app --adapter=vercel

# Netlify
nx g @geekvetica/nx-astro:application my-app --adapter=netlify

# Cloudflare
nx g @geekvetica/nx-astro:application my-app --adapter=cloudflare
```

## Styling

### CSS Frameworks

```bash
# Tailwind CSS
nx g @geekvetica/nx-astro:application my-app --style=tailwind

# SCSS
nx g @geekvetica/nx-astro:application my-app --style=scss

# Styled Components
nx g @geekvetica/nx-astro:application my-app --style=styled-components
```

## Testing

### Unit Testing with Vitest

```bash
# Generate app with Vitest
nx g @geekvetica/nx-astro:application my-app --unitTestRunner=vitest

# Run tests
nx test my-app
```

### E2E Testing

```bash
# Generate app with Playwright
nx g @geekvetica/nx-astro:application my-app --e2eTestRunner=playwright

# Run E2E tests
nx e2e my-app-e2e
```

## CI/CD

### GitHub Actions

See our [CI/CD setup guide](./docs/ci-cd-setup.md) for detailed instructions.

Example workflow:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected -t lint test build --base=origin/main
```

### For Projects Using nx-astro

If you're setting up CI for a project that uses nx-astro, see our [consuming project CI guide](./docs/consuming-project-ci.md).

## Documentation

- [CI/CD Setup Guide](./docs/ci-cd-setup.md) - Set up continuous integration and deployment
- [Consuming Project CI Guide](./docs/consuming-project-ci.md) - CI/CD for projects using nx-astro
- [Example CI Workflow](./docs/ci-examples/astro-project-ci.yml) - Complete GitHub Actions example
- [Architecture Documentation](./docs/architecture.md) - Plugin architecture and design decisions

## Examples

### Create a Blog Application

```bash
nx g @geekvetica/nx-astro:application blog --style=tailwind --unitTestRunner=vitest
```

### Create a Marketing Site with SSR

```bash
nx g @geekvetica/nx-astro:application marketing-site --adapter=vercel --style=tailwind
```

### Create a Shared Component Library

```bash
nx g @geekvetica/nx-astro:library ui-components --buildable
```

### Add Astro to Existing Project

```bash
nx g @geekvetica/nx-astro:configuration existing-project
```

### Import an Existing Astro Project

```bash
# Import your standalone Astro portfolio site
nx g @geekvetica/nx-astro:import --source=~/projects/my-portfolio --name=portfolio --directory=apps/portfolio --tags=web,public

# Build and preview the imported project
nx build portfolio
nx preview portfolio
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development

```bash
# Clone the repository
git clone https://github.com/geekvetica/nx-astro.git
cd nx-astro

# Install dependencies
pnpm install

# Build the plugin
nx build nx-astro

# Run tests
nx test nx-astro

# Run E2E tests
nx e2e nx-astro-e2e
```

## Release Process

Releases are automated via GitHub Actions. See our [CI/CD setup guide](./docs/ci-cd-setup.md#release-pipeline) for details.

To trigger a release:

1. Go to Actions tab
2. Select "Release" workflow
3. Click "Run workflow"
4. Choose version bump type (patch, minor, major)
5. Confirm

## Compatibility

| nx-astro | Nx      | Astro  | Node.js          |
| -------- | ------- | ------ | ---------------- |
| ^1.0.0   | ^21.0.0 | ^5.0.0 | ^18.0.0, ^20.0.0 |

## Requirements

- Node.js 18.x or 20.x
- Nx 21.x or later
- Astro 5.x or later
- Package manager: npm, pnpm, or yarn

## FAQ

### Why use Nx with Astro?

Nx provides powerful monorepo capabilities:

- **Smart rebuilds**: Only rebuild what changed
- **Task caching**: Instant re-runs of previous tasks
- **Code sharing**: Share components across multiple Astro apps
- **Dependency graph**: Visualize project relationships
- **Affected commands**: Test/build only what's affected by changes

### Can I use Astro integrations?

Yes! All Astro integrations work normally. Install them in your project and configure in `astro.config.mjs`.

### Does this support SSR?

Yes! Use the `--adapter` flag when generating projects:

- `--adapter=node` for Node.js
- `--adapter=vercel` for Vercel
- `--adapter=netlify` for Netlify
- `--adapter=cloudflare` for Cloudflare

### Can I migrate existing Astro projects?

Yes! Use the import generator to bring existing Astro projects into your Nx workspace:

```bash
nx g @geekvetica/nx-astro:import --source=/path/to/your/astro-project --name=my-app --directory=apps/my-app
```

This will:

- Copy your entire project into the workspace
- Set up Nx targets automatically
- Preserve your existing configuration
- Enable Nx caching and task orchestration

Alternatively, for projects already in the workspace, use the configuration generator:

```bash
nx g @geekvetica/nx-astro:configuration my-existing-project
```

### How do I share components between Astro apps?

Create a shared library:

```bash
nx g @geekvetica/nx-astro:library shared-components
```

Import components in your apps:

```astro
---
import { Button } from '@my-workspace/shared-components';
---

<Button>Click me</Button>
```

## Support

- [GitHub Issues](https://github.com/geekvetica/nx-astro/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions) - Questions and discussions
- [Nx Discord](https://go.nx.dev/community) - Community support
- [Astro Discord](https://astro.build/chat) - Astro-specific questions

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Credits

Built with:

- [Nx](https://nx.dev) - Smart monorepos for modern applications
- [Astro](https://astro.build) - The web framework for content-driven websites

## Acknowledgments

Special thanks to:

- The Nx team for the amazing developer tools
- The Astro team for the incredible web framework
- All contributors who help improve this plugin

---

Made with ❤️ by Geekvetica Paweł Wojciechowski
