# Import Generator

Import existing Astro applications into your Nx workspace with full monorepo integration.

## Overview

The `import` generator automates the migration of standalone Astro projects into an Nx monorepo. It validates the source project, copies relevant files, creates Nx configuration, and sets up TypeScript path mappings for seamless integration.

## When to Use

Use the import generator when you need to:

- **Migrate existing projects** - Move standalone Astro sites into an Nx workspace
- **Consolidate multiple sites** - Bring together several Astro projects into a unified monorepo
- **Adopt Nx gradually** - Start with existing projects and expand your monorepo
- **Import templates** - Bring in open-source Astro templates or starters for customization
- **Onboard client projects** - Import client work into your workspace for easier management

## Basic Usage

```bash
# Import from a relative path
nx g @geekvetica/nx-astro:import --source=../my-astro-app

# Import from an absolute path
nx g @geekvetica/nx-astro:import --source=/Users/dev/projects/astro-site

# Import with custom name
nx g @geekvetica/nx-astro:import --source=./external/site --name=marketing-site
```

After importing:

```bash
# Install dependencies
pnpm install

# Start development server
nx dev marketing-site

# Build for production
nx build marketing-site
```

## Advanced Usage

### Custom Directory Structure

Place imported projects in specific locations:

```bash
# Import into custom directory
nx g @geekvetica/nx-astro:import \
  --source=../astro-blog \
  --name=company-blog \
  --directory=apps/websites/blog

# Import into libs for shared code
nx g @geekvetica/nx-astro:import \
  --source=../shared-components \
  --name=shared-ui \
  --directory=libs/shared-ui
```

### Adding Tags for Organization

Use tags to organize and filter projects:

```bash
# Add tags for better project organization
nx g @geekvetica/nx-astro:import \
  --source=../marketing-site \
  --name=marketing \
  --tags=astro,web,public-facing,ssg

# Query projects by tags
nx show projects --tag=public-facing
nx run-many --target=build --tag=astro
```

### Custom Import Paths

Configure TypeScript path aliases:

```bash
# Set custom import path
nx g @geekvetica/nx-astro:import \
  --source=../my-app \
  --name=my-app \
  --importPath=@company/my-app

# Use in other projects
# import { config } from '@company/my-app';
```

### Skipping Optional Steps

Control the import process:

```bash
# Skip formatting (for manual formatting later)
nx g @geekvetica/nx-astro:import \
  --source=../app \
  --skipFormat

# Skip dependency installation
nx g @geekvetica/nx-astro:import \
  --source=../app \
  --skipInstall
```

## Options Reference

| Option        | Type      | Required | Default        | Description                                            |
| ------------- | --------- | -------- | -------------- | ------------------------------------------------------ |
| `source`      | `string`  | Yes      | -              | Path to existing Astro project (relative or absolute)  |
| `name`        | `string`  | No       | Directory name | Project name in the workspace (kebab-case recommended) |
| `directory`   | `string`  | No       | `apps/{name}`  | Target directory relative to workspace root            |
| `tags`        | `string`  | No       | -              | Comma-separated tags for project organization          |
| `importPath`  | `string`  | No       | Auto-generated | Custom TypeScript path alias (e.g., `@myorg/project`)  |
| `skipFormat`  | `boolean` | No       | `false`        | Skip formatting generated files                        |
| `skipInstall` | `boolean` | No       | `false`        | Skip installing dependencies after import              |

### Option Details

#### `source` (required)

Path to the existing Astro project. Can be relative or absolute.

```bash
# Relative paths
--source=../my-app
--source=./external/astro-site

# Absolute paths
--source=/Users/dev/projects/astro-app
--source=/home/user/sites/my-blog
```

#### `name` (optional)

Project name in the Nx workspace. If not provided, extracted from source directory name. Automatically converted to kebab-case.

```bash
# Explicit name
--name=marketing-site

# Name extracted from directory
--source=../MyAstroApp  # Becomes 'my-astro-app'
```

#### `directory` (optional)

Target directory for the imported project, relative to workspace root. Defaults to `apps/{name}`.

```bash
# Default placement
--name=my-app  # → apps/my-app

# Custom placement
--directory=apps/websites/marketing  # → apps/websites/marketing
--directory=libs/shared              # → libs/shared
```

#### `tags` (optional)

Comma-separated tags for organizing projects. Useful for filtering and running tasks on project groups.

```bash
# Single tag
--tags=astro

# Multiple tags
--tags=astro,web,public-facing,blog

# Use tags to filter projects
nx show projects --tag=astro
nx run-many --target=build --tag=public-facing
```

#### `importPath` (optional)

Custom TypeScript path alias for importing from the project. If not provided, automatically generated as `@{workspace}/{name}`.

```bash
# Auto-generated (workspace: 'acme', name: 'my-app')
# → @acme/my-app

# Custom import path
--importPath=@company/my-app
--importPath=@shared/ui-components
```

## What Gets Imported

### Included Files

The generator copies:

- Source code (`src/`, `public/`, etc.)
- Configuration files (`astro.config.*`, `tsconfig.json`, etc.)
- Package metadata (`package.json`)
- Documentation (`README.md`, `docs/`, etc.)
- Example environment files (`.env.example`, `.env.template`)
- Test files (`*.test.ts`, `*.spec.ts`, etc.)

### Excluded Files

The generator excludes:

- Dependencies (`node_modules/`)
- Build outputs (`dist/`, `build/`, `.astro/`)
- Lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
- Version control (`.git/`)
- IDE directories (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)
- Environment files (`.env`, `.env.local`)

## Generated Configuration

The generator creates a complete `project.json` with the following targets:

### `dev` Target

Development server with hot module replacement.

```json
{
  "executor": "@geekvetica/nx-astro:dev",
  "options": {},
  "cache": false
}
```

### `build` Target

Production build with caching and dependency tracking.

```json
{
  "executor": "@geekvetica/nx-astro:build",
  "options": {},
  "inputs": ["production", "^production", { "externalDependencies": ["astro"] }],
  "outputs": ["{workspaceRoot}/dist/{projectRoot}", "{projectRoot}/.astro"],
  "cache": true,
  "dependsOn": ["^build"]
}
```

### `preview` Target

Preview production build (depends on build).

```json
{
  "executor": "@geekvetica/nx-astro:preview",
  "options": {},
  "cache": false,
  "dependsOn": ["build"]
}
```

### `check` Target

TypeScript type checking with caching.

```json
{
  "executor": "@geekvetica/nx-astro:check",
  "options": {},
  "inputs": ["default", "^production", { "externalDependencies": ["astro", "typescript"] }],
  "cache": true,
  "dependsOn": ["sync"]
}
```

### `sync` Target

Generate content collection types.

```json
{
  "executor": "@geekvetica/nx-astro:sync",
  "options": {},
  "inputs": ["{projectRoot}/src/content/**/*", { "externalDependencies": ["astro"] }],
  "outputs": ["{projectRoot}/.astro"],
  "cache": true
}
```

## Common Scenarios

### Scenario 1: Single Project Migration

You have a standalone Astro site and want to move it to Nx:

```bash
# 1. Create Nx workspace (if needed)
npx create-nx-workspace@latest my-workspace
cd my-workspace

# 2. Install nx-astro
pnpm add -D @geekvetica/nx-astro

# 3. Import your project
nx g @geekvetica/nx-astro:import --source=../my-existing-site

# 4. Install dependencies
pnpm install

# 5. Start development
nx dev my-existing-site
```

### Scenario 2: Multiple Sites Consolidation

You have several Astro sites and want to manage them together:

```bash
# Import marketing site
nx g @geekvetica/nx-astro:import \
  --source=../marketing \
  --name=marketing \
  --directory=apps/websites/marketing \
  --tags=public-facing,ssg

# Import blog
nx g @geekvetica/nx-astro:import \
  --source=../blog \
  --name=blog \
  --directory=apps/websites/blog \
  --tags=public-facing,blog

# Import docs site
nx g @geekvetica/nx-astro:import \
  --source=../docs \
  --name=docs \
  --directory=apps/websites/docs \
  --tags=documentation

# Build all websites
nx run-many --target=build --tag=public-facing
```

### Scenario 3: Shared Component Library

Import an Astro component library for sharing across projects:

```bash
# Import as library
nx g @geekvetica/nx-astro:import \
  --source=../shared-components \
  --name=shared-ui \
  --directory=libs/shared-ui \
  --importPath=@myorg/shared-ui \
  --tags=shared,ui

# Use in other projects
# import { Button } from '@myorg/shared-ui';
```

### Scenario 4: Template Import

Import an open-source Astro template for customization:

```bash
# Clone template
git clone https://github.com/example/astro-template /tmp/astro-template

# Import into workspace
nx g @geekvetica/nx-astro:import \
  --source=/tmp/astro-template \
  --name=my-site \
  --tags=astro,web

# Customize and develop
nx dev my-site
```

## Troubleshooting

### Error: Source path does not exist

**Problem**: The provided source path doesn't exist.

**Solution**:

```bash
# Verify the path exists
ls ../my-astro-app

# Use absolute path if relative path doesn't work
nx g @geekvetica/nx-astro:import --source=/full/path/to/project
```

### Error: No Astro configuration file found

**Problem**: The source directory doesn't contain an Astro config file.

**Solution**:

- Ensure the directory is an Astro project
- Check for `astro.config.mjs`, `astro.config.js`, or `astro.config.ts`
- If missing, create one:

  ```javascript
  // astro.config.mjs
  import { defineConfig } from 'astro/config';

  export default defineConfig({});
  ```

### Error: Astro not found in dependencies

**Problem**: The `package.json` doesn't list `astro` as a dependency.

**Solution**:

- Verify `astro` is in `dependencies` or `devDependencies`
- Add it if missing:
  ```bash
  cd /path/to/source
  npm install astro
  ```

### Error: Project already exists

**Problem**: A project with the same name already exists in the workspace.

**Solution**:

```bash
# Use a different name
nx g @geekvetica/nx-astro:import --source=../app --name=my-app-v2

# Or remove the existing project first
nx g @nx/workspace:remove my-app
```

### Error: Target directory already exists

**Problem**: The target directory already contains files.

**Solution**:

```bash
# Use a different directory
nx g @geekvetica/nx-astro:import \
  --source=../app \
  --directory=apps/my-app-new

# Or remove the existing directory
rm -rf apps/my-app
```

### Files Not Copying

**Problem**: Some expected files aren't being imported.

**Solution**:

- Check if files are in the exclusion list (node_modules, .git, etc.)
- Verify file permissions
- Check for symlinks (not copied by default)
- Review the file filter rules in the generator source

### TypeScript Path Mapping Not Working

**Problem**: Import path alias doesn't work after import.

**Solution**:

```bash
# Verify tsconfig.base.json was updated
cat tsconfig.base.json | grep "@myorg/my-app"

# Restart TypeScript server in your IDE
# VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"

# Ensure importPath was provided during import
nx g @geekvetica/nx-astro:import \
  --source=../app \
  --importPath=@myorg/my-app
```

### Dependencies Not Installing

**Problem**: Dependencies from imported project aren't installed.

**Solution**:

```bash
# Manually install dependencies
pnpm install

# Or re-run import without skipInstall
nx g @geekvetica/nx-astro:import \
  --source=../app \
  --skipInstall=false
```

## Best Practices

### Project Naming

Use consistent, descriptive names:

- Use kebab-case: `marketing-site`, `company-blog`
- Be specific: `marketing-site` not `site1`
- Include purpose: `docs-site`, `admin-dashboard`

### Directory Structure

Organize projects logically:

```
workspace/
├── apps/
│   ├── websites/        # Public-facing sites
│   │   ├── marketing/
│   │   ├── blog/
│   │   └── docs/
│   └── internal/        # Internal tools
│       └── admin/
└── libs/
    ├── shared-ui/       # Shared components
    └── utils/           # Shared utilities
```

### Tagging Strategy

Use tags for organization and automation:

```bash
# Technology tags
--tags=astro,typescript,tailwind

# Purpose tags
--tags=public-facing,internal,documentation

# Status tags
--tags=production,staging,experimental

# Team tags
--tags=team-marketing,team-engineering
```

### After Import Checklist

1. **Review configuration** - Check `project.json` for correctness
2. **Install dependencies** - Run `pnpm install`
3. **Update workspace lock file** - Commit the updated `pnpm-lock.yaml`
4. **Test locally** - Verify `nx dev` and `nx build` work
5. **Update documentation** - Document any project-specific requirements
6. **Configure CI/CD** - Ensure CI pipeline handles the new project
7. **Review dependencies** - Check for duplicate or outdated packages

### Incremental Migration

Don't import everything at once:

1. Start with one project
2. Verify it works correctly
3. Import additional projects gradually
4. Learn and adjust your process

## Related Documentation

- [Application Generator](./application.md) - Create new Astro applications
- [Component Generator](./component.md) - Generate Astro components
- [Build Executor](../executors/build.md) - Build configuration
- [Dev Executor](../executors/dev.md) - Development server
- [Migration Guide](../migration-guide.md) - Complete migration guide

## FAQ

### Can I import projects with custom build configurations?

Yes, but you may need to manually adjust the generated `project.json` after import to match your build requirements.

### Will my .env files be copied?

No, actual environment files (`.env`, `.env.local`) are excluded for security. Only `.env.example` and `.env.template` are copied. You'll need to recreate environment files in the new location.

### Can I import non-Astro projects?

No, the import generator validates that the source is a valid Astro project. For other project types, use Nx's built-in generators.

### What happens to my git history?

Git history is not preserved during import (`.git` directory is excluded). If you need to preserve history, consider using git submodules or subtree merging instead.

### Can I import projects with dependencies on each other?

Yes, but you should import them in dependency order and manually configure Nx project dependencies in `project.json` after import.

### How do I update an imported project later?

Treat it like any other project in your workspace. Make changes, commit them, and use Nx commands to build and test.

## Support

Need help with the import generator?

- Check the [Troubleshooting Guide](../troubleshooting.md)
- Review [GitHub Issues](https://github.com/geekvetica/nx-astro/issues)
- Join the [Nx Community Discord](https://discord.gg/nx)
- Ask in [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions)
