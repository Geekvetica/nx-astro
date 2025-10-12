# Migration Guide

This guide helps you migrate existing Astro projects into an Nx monorepo with the nx-astro plugin. Whether you're moving a single project or multiple sites, this guide provides step-by-step instructions.

## Table of Contents

- [Why Migrate to Nx?](#why-migrate-to-nx)
- [Prerequisites](#prerequisites)
- [Migration Scenarios](#migration-scenarios)
- [Step-by-Step Migration](#step-by-step-migration)
- [Post-Migration Checklist](#post-migration-checklist)
- [Common Issues](#common-issues)
- [Rollback Strategy](#rollback-strategy)

---

## Why Migrate to Nx?

Migrating your Astro project(s) to Nx provides several benefits:

### Performance Benefits

- **Intelligent Caching**: Build once, use everywhere - Nx caches task results
- **Parallel Execution**: Run tasks across multiple projects simultaneously
- **Affected Detection**: Only build/test what changed

### Developer Experience

- **Consistent Tooling**: Unified commands across all projects
- **Code Generation**: Scaffolding with generators
- **Dependency Graph**: Visualize project relationships
- **Task Orchestration**: Automatic dependency ordering

### Monorepo Advantages

- **Code Sharing**: Share components and utilities across apps
- **Atomic Changes**: Update multiple apps in a single commit
- **Unified Dependencies**: Manage packages in one place
- **Consistent Configuration**: Standardize build and test configs

---

## Prerequisites

Before migrating, ensure you have:

### System Requirements

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Git (for version control)

### Project Requirements

- Existing Astro project(s) with valid `astro.config.mjs`
- Working build and dev scripts
- All dependencies listed in `package.json`

### Recommended Preparation

1. **Commit all changes**: Ensure your git working directory is clean
2. **Backup your project**: Create a backup or tag current state
3. **Document custom setup**: Note any special build steps or configurations
4. **Test current build**: Ensure your project builds successfully

```bash
# Commit changes
git add .
git commit -m "Pre-migration checkpoint"

# Create backup tag
git tag pre-nx-migration

# Backup project (optional)
cp -r my-astro-project my-astro-project-backup
```

---

## Migration Scenarios

Choose the scenario that matches your situation:

### Scenario 1: Single Astro Project → Nx Monorepo

Migrate one standalone Astro project into a new Nx workspace.

**Use Case**: Starting fresh with Nx, want to add more projects later.

### Scenario 2: Multiple Astro Projects → Nx Monorepo

Consolidate multiple Astro projects into one Nx workspace.

**Use Case**: Managing multiple related sites (marketing, blog, docs).

### Scenario 3: Add Astro to Existing Nx Workspace

Add Astro project(s) to an existing Nx monorepo.

**Use Case**: Already using Nx, want to add Astro capabilities.

### Scenario 4: Import Existing Project Structure

Import an Astro project while preserving its current directory structure.

**Use Case**: Want to keep existing folder organization.

---

## Step-by-Step Migration

### Scenario 1: Single Project Migration

#### Step 1: Create Nx Workspace

```bash
# Create new Nx workspace
npx create-nx-workspace@latest my-monorepo

# Choose options:
# - Package-based or integrated? → Integrated
# - Which stack? → None (we'll add nx-astro)
# - Package manager? → npm/yarn/pnpm (your choice)
# - Nx Cloud? → Optional
```

#### Step 2: Install nx-astro Plugin

```bash
cd my-monorepo

# Install the plugin
npm install --save-dev @geekvetica/nx-astro
# or
yarn add --dev @geekvetica/nx-astro
# or
pnpm add -D @geekvetica/nx-astro

# Initialize the plugin
npx nx g @geekvetica/nx-astro:init
```

#### Step 3: Copy Project Files

```bash
# Create target directory
mkdir -p apps/my-app

# Copy your Astro project files
cp -r /path/to/old-project/{src,public,astro.config.mjs,tsconfig.json} apps/my-app/

# Copy additional config files if needed
cp /path/to/old-project/.gitignore apps/my-app/
```

#### Step 4: Update Dependencies

Merge dependencies from your old `package.json` into the workspace root:

```bash
# View your old dependencies
cat /path/to/old-project/package.json

# Install them at workspace root
npm install astro @astrojs/node  # Add your specific dependencies
npm install --save-dev @astrojs/check typescript  # Add dev dependencies
```

#### Step 5: Update Configuration

Update paths in `astro.config.mjs` if needed:

```javascript
// apps/my-app/astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Update any path references to be relative to this file
  srcDir: './src',
  publicDir: './public',
  outDir: '../../dist/apps/my-app', // Note: relative to project root
});
```

Update `tsconfig.json` to extend workspace config:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["astro/client"]
  },
  "include": ["src/**/*", ".astro/**/*"]
}
```

#### Step 6: Verify Migration

```bash
# Verify project is detected
npx nx show projects

# Should show: my-app

# View inferred configuration
npx nx show project my-app

# Try running dev server
npx nx dev my-app

# Try building
npx nx build my-app
```

#### Step 7: Update Git Configuration

```bash
# Add workspace .gitignore if not exists
echo "node_modules" >> .gitignore
echo "dist" >> .gitignore
echo ".nx" >> .gitignore

# Remove old project
rm -rf /path/to/old-project

# Commit migration
git add .
git commit -m "Migrate to Nx monorepo with nx-astro"
```

---

### Scenario 2: Multiple Projects Migration

#### Step 1: Create Nx Workspace

```bash
npx create-nx-workspace@latest my-monorepo
cd my-monorepo
npm install --save-dev @geekvetica/nx-astro
npx nx g @geekvetica/nx-astro:init
```

#### Step 2: Plan Project Structure

Decide on directory organization:

```
apps/
├── marketing-site/    # Main website
├── blog/              # Company blog
├── docs/              # Documentation site
└── admin/             # Admin dashboard
```

#### Step 3: Migrate First Project

```bash
# Copy first project
mkdir -p apps/marketing-site
cp -r /path/to/marketing/{src,public,astro.config.mjs,tsconfig.json} apps/marketing-site/

# Update astro.config.mjs
# Update tsconfig.json

# Test it works
npx nx dev marketing-site
```

#### Step 4: Migrate Remaining Projects

Repeat for each project:

```bash
# Blog
mkdir -p apps/blog
cp -r /path/to/blog/{src,public,astro.config.mjs,tsconfig.json} apps/blog/

# Docs
mkdir -p apps/docs
cp -r /path/to/docs/{src,public,astro.config.mjs,tsconfig.json} apps/docs/

# Update configs for each
# Test each project
```

#### Step 5: Consolidate Dependencies

```bash
# Merge all package.json dependencies
# Install at workspace root
npm install astro @astrojs/node @astrojs/mdx @astrojs/tailwind

# Remove individual project package.json files (optional)
```

#### Step 6: Extract Shared Code

Create shared libraries for common code:

```bash
# Create shared component library
npx nx g @nx/js:library shared-ui --directory=libs/shared-ui

# Move shared components
mv apps/marketing-site/src/components/Button.astro libs/shared-ui/src/components/
mv apps/blog/src/components/Card.astro libs/shared-ui/src/components/

# Create shared utilities library
npx nx g @nx/js:library utils --directory=libs/utils

# Move shared utilities
mv apps/marketing-site/src/lib/formatDate.ts libs/utils/src/
```

#### Step 7: Update Imports

Update imports to use new shared libraries:

```typescript
// Before (in apps/marketing-site)
import Button from '../components/Button.astro';
import { formatDate } from '../lib/formatDate';

// After
import Button from '@my-org/shared-ui/components/Button.astro';
import { formatDate } from '@my-org/utils';
```

Configure path aliases in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@my-org/shared-ui/*": ["libs/shared-ui/src/*"],
      "@my-org/utils": ["libs/utils/src/index.ts"]
    }
  }
}
```

#### Step 8: Test All Projects

```bash
# Test each project individually
npx nx dev marketing-site
npx nx dev blog
npx nx dev docs

# Build all projects
npx nx run-many --target=build --all

# Run tests
npx nx run-many --target=test --all
```

---

### Scenario 3: Add to Existing Nx Workspace

#### Step 1: Install nx-astro Plugin

```bash
# In your existing Nx workspace
npm install --save-dev nx-astro
npx nx g @geekvetica/nx-astro:init
```

#### Step 2: Create or Import Application

```bash
# Option A: Create new application
npx nx g @geekvetica/nx-astro:application my-astro-app

# Option B: Import existing
mkdir -p apps/my-astro-app
cp -r /path/to/astro-project/* apps/my-astro-app/
# Update configurations as needed
```

#### Step 3: Configure Integration

If you have existing shared libraries:

```bash
# Update tsconfig.json to use workspace paths
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["astro/client"]
  }
}
```

Import existing libraries:

```typescript
import { Button } from '@my-org/ui-components';
import { apiClient } from '@my-org/api-client';
```

---

### Scenario 4: Preserve Directory Structure

If you want to keep your current structure:

#### Step 1: Use Import Feature

```bash
# Copy project to apps directory with original name
cp -r /path/to/my-site apps/my-site

# Generate application configuration
npx nx g @geekvetica/nx-astro:application my-site --importExisting
```

#### Step 2: Verify Structure

The plugin will detect your existing structure and preserve it:

```
apps/my-site/
├── src/
│   ├── pages/
│   ├── components/
│   └── layouts/
├── public/
├── astro.config.mjs
├── tsconfig.json
└── package.json  (optional, can be removed)
```

---

## Post-Migration Checklist

After migration, verify everything works:

### Functionality Checks

- [ ] Development server starts: `nx dev my-app`
- [ ] Application loads in browser: `http://localhost:4321`
- [ ] Hot reload works (make a change and see it update)
- [ ] Production build succeeds: `nx build my-app`
- [ ] Preview server works: `nx preview my-app`
- [ ] Type checking passes: `nx check my-app`
- [ ] Tests run: `nx test my-app`
- [ ] Content collections work (if applicable): `nx sync my-app`

### Configuration Verification

- [ ] All environment variables migrated
- [ ] Asset paths work correctly
- [ ] API endpoints configured properly
- [ ] Build outputs to correct directory
- [ ] TypeScript paths resolve correctly
- [ ] Shared code imports work

### Performance Checks

- [ ] First build completes successfully
- [ ] Second build uses cache (should be much faster)
- [ ] Affected detection works: `nx affected:build`
- [ ] Parallel execution works: `nx run-many --target=build --all`

### Documentation Updates

- [ ] Update README with new commands
- [ ] Document any custom scripts
- [ ] Update deployment documentation
- [ ] Update contributor guidelines

---

## Common Issues

### Issue: Module Not Found

**Problem**: Import errors after migration.

**Solution**:

```bash
# Clear Nx cache
nx reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify TypeScript paths
cat tsconfig.base.json

# Restart TypeScript server in IDE
```

### Issue: Assets Not Loading

**Problem**: Images or static files return 404.

**Solution**:

```javascript
// Check astro.config.mjs
export default defineConfig({
  publicDir: './public', // Ensure this points to correct directory

  // For subdirectory deployments
  base: '/my-app',
});
```

### Issue: Build Output Directory

**Problem**: Build outputs to wrong location.

**Solution**:

```javascript
// In astro.config.mjs
export default defineConfig({
  outDir: '../../dist/apps/my-app',  // Relative to this config file
});

// Or configure in project.json
{
  "targets": {
    "build": {
      "options": {
        "outputPath": "dist/apps/my-app"
      }
    }
  }
}
```

### Issue: Content Collections Not Working

**Problem**: Content collection types not generated.

**Solution**:

```bash
# Generate types
nx sync my-app

# Check .astro directory was created
ls -la apps/my-app/.astro/

# Ensure src/content/config.ts exists
cat apps/my-app/src/content/config.ts
```

### Issue: Dependency Resolution

**Problem**: Package not found errors.

**Solution**:

```bash
# Check package.json at workspace root
cat package.json

# Install missing dependencies
npm install missing-package

# For project-specific dependencies (if using standalone mode)
# Add them to apps/my-app/package.json
```

### Issue: TypeScript Errors

**Problem**: Type errors after migration.

**Solution**:

```json
// Update tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["astro/client"],
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*", ".astro/**/*"]
}
```

### Issue: Environment Variables

**Problem**: Environment variables not loading.

**Solution**:

```bash
# Create .env file at project root
echo "PUBLIC_API_URL=https://api.example.com" > apps/my-app/.env

# Or at workspace root for shared variables
echo "PUBLIC_API_URL=https://api.example.com" > .env

# Verify loading
nx dev my-app --verbose
```

### Issue: Git Conflicts

**Problem**: Merge conflicts in package.json or configs.

**Solution**:

```bash
# Use workspace root package.json
# Resolve conflicts in favor of monorepo structure

# For project-specific configs, keep both:
# - Workspace config (tsconfig.base.json)
# - Project config (apps/my-app/tsconfig.json) extending base
```

---

## Rollback Strategy

If migration causes issues, you can rollback:

### Option 1: Git Revert

```bash
# Return to pre-migration state
git reset --hard pre-nx-migration

# Or revert specific commits
git revert <commit-hash>
```

### Option 2: Restore from Backup

```bash
# If you created a backup
rm -rf my-monorepo
mv my-astro-project-backup my-astro-project
cd my-astro-project
npm install
npm run dev
```

### Option 3: Keep Both (Transition Period)

```bash
# Keep old project running while testing Nx version
# Run old: cd old-project && npm run dev
# Run new: cd my-monorepo && nx dev my-app

# Compare outputs, functionality
# Once confident, remove old project
```

---

## Migration Best Practices

### Before Migration

1. **Start Small**: Migrate one project first, learn, then migrate others
2. **Test Thoroughly**: Run full test suite before migration
3. **Document Custom Setup**: Note any special configurations
4. **Check Dependencies**: Ensure all deps are compatible

### During Migration

1. **One Project at a Time**: Don't rush, migrate methodically
2. **Verify Each Step**: Test after each major change
3. **Keep Git History**: Commit frequently with clear messages
4. **Test Builds**: Ensure builds work after each migration

### After Migration

1. **Update Documentation**: Document new commands and workflows
2. **Train Team**: Ensure everyone knows new commands
3. **Monitor Performance**: Verify caching and parallelization work
4. **Optimize**: Look for opportunities to share code

---

## Advanced Migration Topics

### Migrating with Custom Build Process

If you have custom build steps:

```json
// project.json
{
  "targets": {
    "prebuild": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node scripts/generate-sitemap.js"
      }
    },
    "build": {
      "executor": "@geekvetica/nx-astro:build",
      "dependsOn": ["prebuild"]
    }
  }
}
```

### Migrating with Monolithic Dependencies

If you can't move dependencies to root:

```json
// apps/my-app/package.json (standalone mode)
{
  "name": "my-app",
  "dependencies": {
    "some-legacy-package": "1.0.0"
  }
}
```

### Migrating Large Projects

For projects with 1000+ files:

1. **Use Dry Run**: Test migration scripts without committing
2. **Batch Process**: Migrate in stages (configs, then code, then assets)
3. **Automate**: Write scripts to automate repetitive tasks
4. **Validate**: Use linters and type checkers to catch issues

---

## Success Stories

### Example: Marketing Site Migration

**Before**: 3 separate repos, manual deployments
**After**: 1 monorepo, automated CI/CD, 50% faster builds

```bash
# Old workflow
cd marketing && npm run build  # 45s
cd blog && npm run build       # 38s
cd docs && npm run build       # 52s
# Total: 135s

# New workflow (with caching)
nx run-many --target=build --all  # 47s first run, 2s cached
```

### Example: Content Platform Migration

**Before**: Duplicated components, inconsistent styling
**After**: Shared component library, consistent design

```bash
# Shared components
libs/shared-ui/
├── components/
│   ├── Button.astro
│   ├── Card.astro
│   └── Navigation.astro

# Used across 4 apps
apps/marketing/
apps/blog/
apps/docs/
apps/help/
```

---

## Next Steps

After successful migration:

1. **Explore Nx Features**: Learn about affected commands, caching, and task orchestration
2. **Optimize Workflows**: Set up CI/CD with [CI/CD Setup Guide](./ci-cd-setup.md)
3. **Share Code**: Create shared libraries for common functionality
4. **Document Changes**: Update your project documentation
5. **Train Team**: Ensure everyone understands new workflows

## Additional Resources

- [Generators Guide](./generators.md) - Create new projects and components
- [Executors Guide](./executors.md) - Run builds, tests, and servers
- [Configuration Guide](./configuration.md) - Configure the plugin
- [Examples](./examples.md) - Real-world usage patterns
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
