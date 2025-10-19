# Troubleshooting Guide

This guide helps you resolve common issues when using the `@geekvetica/nx-astro` plugin.

## Table of Contents

- [Preview Command Can't Find Build Output](#preview-command-cant-find-build-output)
- [TypeScript Sync Errors](#typescript-sync-errors)
- [Migration from Older Versions](#migration-from-older-versions)
- [Commands Fail with "astro: command not found"](#commands-fail-with-astro-command-not-found)
- [Type Checking Fails](#type-checking-fails)
- [Vitest Tests Don't Run](#vitest-tests-dont-run)

---

## Preview Command Can't Find Build Output

### Symptoms

When running `nx preview my-app`, you see errors like:

```bash
Cannot read properties of undefined (reading 'port')
Error: Build output not found
Could not find build output directory
```

Or the preview command starts but shows a blank page or 404 errors.

### Root Cause

Imported Astro projects don't have the `outDir` property configured in `astro.config.mjs`, so Astro builds to the wrong location. The preview command then can't find the built files.

**Why this happens:**

- Standalone Astro projects typically output to `dist/` (relative to project root)
- Nx workspaces use a centralized `dist/` folder at the workspace root
- Without `outDir` configuration, Astro outputs to `{projectRoot}/dist/` instead of `{workspaceRoot}/dist/{projectRoot}/`

### Solution

#### ✅ For New Projects (v1.0.6+)

The `import` generator automatically configures `outDir` for you. No action needed!

```bash
# Import a project (automatic configuration)
nx g @geekvetica/nx-astro:import --source=/path/to/project --name=my-app

# Build and preview work immediately
nx build my-app
nx preview my-app
```

#### 📝 For Existing Projects (Manual Fix)

If you imported a project before v1.0.6, manually add `outDir` to your `astro.config.mjs`:

**Step 1:** Open your project's `astro.config.mjs` file (e.g., `apps/my-app/astro.config.mjs`)

**Step 2:** Add the `outDir` property to the configuration object:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Add this line - adjust the path based on your project depth
  outDir: '../../dist/apps/my-app',

  // ... your existing configuration
  integrations: [...],
  adapter: ...,
});
```

**Important:** The path must be correct for your project depth:

| Project Location           | outDir Value                            |
| -------------------------- | --------------------------------------- |
| `apps/my-app/`             | `../../dist/apps/my-app`                |
| `apps/websites/marketing/` | `../../../dist/apps/websites/marketing` |
| `projects/blog/`           | `../../dist/projects/blog`              |

**Pattern:** `{offset-to-workspace-root}/dist/{project-path}`

**Step 3:** Rebuild and preview:

```bash
nx build my-app
nx preview my-app
```

### Verification

After fixing, verify the build outputs to the correct location:

```bash
# Build the project
nx build my-app

# Check that output exists at workspace root
ls dist/apps/my-app/
# Should show: index.html, _astro/, assets/, etc.
```

---

## TypeScript Sync Errors

### Symptoms

Running `nx sync` or `nx affected -t sync` fails with errors like:

```bash
Missing root tsconfig.json file
Cannot find root TypeScript configuration
NX   Running target sync for project my-app failed
```

Or warnings in the console:

```bash
⚠️  Nx detected @nx/js:typescript-sync generator but workspace uses tsconfig.base.json
```

### Root Cause

Nx's `@nx/js:typescript-sync` generator expects a `tsconfig.json` file at the workspace root, but Nx convention is to use `tsconfig.base.json` only. This creates a conflict when Nx tries to auto-detect TypeScript projects.

**Why this happens:**

- Nx has a built-in TypeScript sync generator (`@nx/js:typescript-sync`) for managing TypeScript project references
- Astro projects use their own sync command (`astro sync`) for generating content collection types
- The `@nx/js` plugin auto-detects TypeScript projects and tries to run TypeScript sync
- Astro sync and Nx TypeScript sync are incompatible (different purposes)

**What each sync does:**

- **Astro sync** (`astro sync`): Generates `.astro/types.d.ts` for content collections and module declarations
- **Nx TypeScript sync** (`@nx/js:typescript-sync`): Updates `references` array in `tsconfig.json` for project references

### Solution

#### ✅ For New Projects (v1.0.6+)

The `import` generator automatically adds metadata to prevent conflicts. You still need to configure `nx.json` once per workspace:

**Add to workspace `nx.json`:**

```json
{
  "sync": {
    "disabledTaskSyncGenerators": ["@nx/js:typescript-sync"]
  }
}
```

This tells Nx to skip the TypeScript sync generator globally, preventing conflicts with Astro's sync.

#### 📝 For Existing Projects (Manual Fix)

**Step 1:** Add configuration to workspace `nx.json` (at workspace root):

```json
{
  "sync": {
    "disabledTaskSyncGenerators": ["@nx/js:typescript-sync"]
  }
}
```

**Step 2 (Optional):** Add metadata to your project's sync target in `project.json`:

```json
{
  "targets": {
    "sync": {
      "executor": "@geekvetica/nx-astro:sync",
      "options": {},
      "inputs": ["{projectRoot}/src/content/**/*"],
      "outputs": ["{projectRoot}/.astro"],
      "cache": true,
      "metadata": {
        "technologies": ["astro"],
        "description": "Generate TypeScript types for Astro Content Collections and modules (via astro sync)"
      }
    }
  }
}
```

The metadata explicitly marks the target as Astro-specific, making it clearer to Nx and other tools.

### Verification

After fixing, sync commands should work:

```bash
# Run sync for a specific project
nx sync my-app
# ✅ Should complete without errors

# Run sync for all affected projects
nx affected -t sync
# ✅ Should complete without TypeScript sync warnings
```

### Why This Matters

Without this fix:

- CI/CD pipelines fail with cryptic errors
- Developers see confusing warnings about missing files
- Nx tries to manage TypeScript project references unnecessarily
- Astro's content collection types may not generate properly

With the fix:

- Astro sync runs exclusively for content collection type generation
- Nx respects Astro's sync behavior
- No conflict between sync systems
- Clear separation of concerns

---

## Migration from Older Versions

### Upgrading to v1.0.6+

If you're upgrading from an earlier version of `@geekvetica/nx-astro`, follow these steps to benefit from the bug fixes.

#### Step 1: Update the Package

```bash
# Bun
bun add -d @geekvetica/nx-astro@latest

# pnpm
pnpm add -D @geekvetica/nx-astro@latest

# Yarn
yarn add -D @geekvetica/nx-astro@latest

# npm
npm install --save-dev @geekvetica/nx-astro@latest
```

#### Step 2: Fix Preview Command (if needed)

**Check if you need this fix:**

Run your preview command. If it works, skip this step. If it fails to find the build output, continue:

```bash
nx build my-app
nx preview my-app
# If this fails with "Cannot find build output", fix needed
```

**Apply the fix:**

Add `outDir` to each affected project's `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  outDir: '../../dist/apps/my-app', // Adjust path for your project depth
  // ... rest of your config
});
```

#### Step 3: Fix TypeScript Sync (if needed)

**Check if you need this fix:**

Run the sync command. If it works, skip this step. If you see errors about missing `tsconfig.json`, continue:

```bash
nx sync my-app
# If this fails with "Missing root tsconfig.json", fix needed
```

**Apply the fix:**

Add to workspace `nx.json`:

```json
{
  "sync": {
    "disabledTaskSyncGenerators": ["@nx/js:typescript-sync"]
  }
}
```

#### Step 4: Verify Everything Works

Run the full build and test cycle:

```bash
# Build all affected projects
nx affected -t build

# Run all sync targets
nx affected -t sync

# Preview a project
nx build my-app
nx preview my-app
```

### What Changes Automatically vs Manually

| Change                                       | Automatic (New Projects) | Manual (Existing Projects)    |
| -------------------------------------------- | ------------------------ | ----------------------------- |
| `outDir` configuration in `astro.config.mjs` | ✅ Yes (v1.0.6+)         | ❌ No - Add manually          |
| Sync target metadata in `project.json`       | ✅ Yes (v1.0.6+)         | ⚠️ Optional - Add for clarity |
| `nx.json` sync configuration                 | ❌ No - Add manually     | ❌ No - Add manually          |

**Why some changes are manual:**

- `nx.json` is a workspace-level configuration that affects all projects
- We don't auto-modify it to avoid unexpected side effects
- One-time setup per workspace (not per project)

### Migration Checklist

Use this checklist to ensure a smooth migration:

- [ ] Updated `@geekvetica/nx-astro` to v1.0.6 or later
- [ ] Added `outDir` to `astro.config.mjs` for all imported projects (if preview was failing)
- [ ] Added `sync.disabledTaskSyncGenerators` to workspace `nx.json` (if sync was failing)
- [ ] Optionally added metadata to sync targets for clarity
- [ ] Ran `nx build` successfully
- [ ] Ran `nx preview` successfully
- [ ] Ran `nx sync` successfully
- [ ] All CI/CD pipelines passing

---

## Commands Fail with "astro: command not found"

### Symptoms

```bash
nx build my-app
# Error: astro: command not found
# Error: sh: astro: No such file or directory
```

### Solution

This was common in versions before v1.0.4. The plugin now automatically handles package manager detection.

**If using v1.0.4+:**

1. Verify Astro is installed:

   ```bash
   cat package.json | grep astro
   # Should show: "astro": "^5.x.x"
   ```

2. Ensure node_modules is up to date:
   ```bash
   bun install
   # or: npm install, pnpm install, yarn install
   ```

**If using older version:**

Upgrade to the latest version:

```bash
bun add -d @geekvetica/nx-astro@latest
```

See [README - Package Manager Support](./README.md#package-manager-support) for details.

---

## Type Checking Fails

### Symptoms

```bash
nx check my-app
# Error: @astrojs/check not found
# Error: Cannot find module '@astrojs/check'
```

### Solution

The `check` executor requires `@astrojs/check` to be installed.

**Option 1: Manual Installation**

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

**Option 2: Automatic Installation**

Enable auto-install in your `project.json`:

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

Now the plugin will automatically install `@astrojs/check` if missing.

---

## Vitest Tests Don't Run

### Symptoms

```bash
nx test my-app
# Error: Cannot find target 'test' for project 'my-app'
```

Or:

```bash
nx test my-app
# Error: vitest: command not found
```

### Solution

The `test` executor is only available when Vitest is installed.

**Install Vitest:**

```bash
# Bun
bun add -d vitest

# pnpm
pnpm add -D vitest

# Yarn
yarn add -D vitest

# npm
npm install --save-dev vitest
```

**Verify test target exists:**

After installation, the import generator should detect Vitest and add the test target automatically. Check `project.json`:

```json
{
  "targets": {
    "test": {
      "executor": "@geekvetica/nx-astro:test",
      "options": {}
    }
  }
}
```

---

## Getting More Help

If you're still experiencing issues:

1. **Check the version:**

   ```bash
   cat package.json | grep @geekvetica/nx-astro
   ```

   Ensure you're on v1.0.6 or later for the latest fixes.

2. **Search existing issues:**
   [GitHub Issues](https://github.com/geekvetica/nx-astro/issues)

3. **Ask for help:**
   - [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions)
   - [Nx Discord](https://go.nx.dev/community)
   - [Astro Discord](https://astro.build/chat)

4. **Report a bug:**
   [Create a new issue](https://github.com/geekvetica/nx-astro/issues/new) with:
   - Version numbers (`@geekvetica/nx-astro`, Nx, Astro)
   - Full error message
   - Steps to reproduce
   - Your configuration files (`project.json`, `astro.config.mjs`, `nx.json`)

---

**Last Updated:** 2025-10-19 | **Version:** 1.0.6
