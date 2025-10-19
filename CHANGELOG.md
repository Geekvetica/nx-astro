## [1.0.6] - 2025-10-19

### Fixed

- **Import generator now automatically configures `outDir`** in `astro.config.mjs` to align with Nx output structure (`dist/{projectRoot}`)
  - Fixes issue where preview command couldn't find build output after importing projects
  - Injects `outDir` configuration pointing to `{workspaceRoot}/dist/{projectRoot}`
  - Works for projects at any nesting depth (e.g., `apps/my-app`, `apps/websites/marketing`)
  - Preserves all existing Astro configuration properties
  - Skips injection if `outDir` is already configured

- **Fixed TypeScript sync conflicts** for Astro projects
  - Added metadata to sync target to prevent `@nx/js:typescript-sync` auto-detection
  - Astro projects use their own sync (`astro sync`) for content collection types
  - Prevents errors when workspace uses `tsconfig.base.json` convention (no root `tsconfig.json`)
  - Application and import generators create projects with Astro-specific metadata

### Changed

- Import generator now modifies imported `astro.config.mjs` files
  - Automatically injects `outDir` configuration during import process
  - Configuration is workspace-structure-aware (uses `offsetFromRoot` for correct paths)

- Sync target includes explicit metadata to identify technology and prevent conflicts:
  ```json
  {
    "metadata": {
      "technologies": ["astro"],
      "description": "Generate TypeScript types for Astro Content Collections and modules (via astro sync)"
    }
  }
  ```

### Documentation

- **Added comprehensive troubleshooting guide** ([TROUBLESHOOTING.md](./TROUBLESHOOTING.md))
  - Preview command can't find build output
  - TypeScript sync errors ("Missing root tsconfig.json")
  - Migration guide for existing projects
  - Common issues and solutions

- **Updated README** with:
  - Link to troubleshooting guide
  - Nx compliance information
  - TypeScript sync behavior explanation
  - Automatic outDir configuration feature

### Migration Notes

**For existing projects (imported before v1.0.6):**

#### 1. To fix preview command:

Add `outDir` to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  outDir: '../../dist/apps/my-app', // Adjust path based on your project depth
  // ... rest of your config
});
```

Path formula: `{offset-to-workspace-root}/dist/{project-path}`

Examples:

- `apps/my-app/` → `../../dist/apps/my-app`
- `apps/websites/marketing/` → `../../../dist/apps/websites/marketing`
- `projects/blog/` → `../../dist/projects/blog`

#### 2. To fix sync errors:

Add to workspace `nx.json`:

```json
{
  "sync": {
    "disabledTaskSyncGenerators": ["@nx/js:typescript-sync"]
  }
}
```

This prevents Nx TypeScript sync from conflicting with Astro sync.

#### 3. Optional - Add metadata for clarity:

Update your project's `sync` target in `project.json`:

```json
"sync": {
  "executor": "@geekvetica/nx-astro:sync",
  "metadata": {
    "technologies": ["astro"],
    "description": "Generate TypeScript types for Astro Content Collections and modules (via astro sync)"
  }
}
```

**For new projects (v1.0.6+):**

✅ All fixes are applied automatically during project generation/import!

You still need to add the `nx.json` configuration once per workspace:

```json
{
  "sync": {
    "disabledTaskSyncGenerators": ["@nx/js:typescript-sync"]
  }
}
```

### Technical Details

- Follows Tidy First principles: structural changes separated from behavioral changes
- Implements TDD methodology: tests written first (Red), implementation second (Green)
- `modifyAstroConfig()` utility handles both `defineConfig({})` and plain object formats
- Package manager detection used for correct path offset calculation
- No breaking changes to existing functionality

### Breaking Changes

None. Existing projects will continue to work but may need manual updates to benefit from fixes.

---

## 1.0.5 (2025-10-19)

### 🩹 Fixes

- check task fix ([5833518](https://github.com/Geekvetica/nx-astro/commit/5833518))

### ❤️ Thank You

- Paweł Wojciechowski

## 1.0.4 (2025-10-18)

### 🩹 Fixes

- astro check dependencies checking while importing ([65f1153](https://github.com/Geekvetica/nx-astro/commit/65f1153))
- tests timing ([33a5ad0](https://github.com/Geekvetica/nx-astro/commit/33a5ad0))

### ❤️ Thank You

- Paweł Wojciechowski

## [Unreleased]

### Fixed

- **check executor**: Prevents hanging when `@astrojs/check` is not installed
  - Added validation to check if `@astrojs/check` package is installed before running type checking
  - Provides clear error messages with package-manager-specific installation instructions
  - Automatically detects package manager from lock files and `package.json`
  - Shows correct install command for detected package manager (bun, pnpm, yarn, or npm)
  - Resolves issue where Astro CLI would show interactive prompt in CI/non-interactive environments

### Added

- **check executor**: New `autoInstall` option for automatic dependency installation
  - When enabled (`autoInstall: true`), automatically installs `@astrojs/check` if missing
  - Gracefully handles installation failures with helpful error messages
  - Disabled by default to maintain backward compatibility
- **utils**: New `dependency-checker` utility module
  - `isPackageInstalled()`: Checks if a package exists in node_modules
  - `detectPackageManager()`: Detects package manager from lock files and package.json
  - `getInstallCommand()`: Generates correct install command for each package manager

### Technical Details

- Follows Tidy First principles: structural changes separated from behavioral changes
- Implements TDD methodology: tests written first (Red), implementation second (Green), refactored third
- 100% test coverage on new functionality
- No breaking changes to existing functionality

## 1.0.3 (2025-10-18)

### 🩹 Fixes

- bun incompability ([a010227](https://github.com/Geekvetica/nx-astro/commit/a010227))

### ❤️ Thank You

- Paweł Wojciechowski

## 1.0.2 (2025-10-18)

### 🩹 Fixes

- import generator ([78590b6](https://github.com/Geekvetica/nx-astro/commit/78590b6))

### ❤️ Thank You

- Paweł Wojciechowski

## 1.0.1 (2025-10-16)

### 🩹 Fixes

- remove autogenerated files from repo ([32787b9](https://github.com/Geekvetica/nx-astro/commit/32787b9))

### ❤️ Thank You

- Paweł Wojciechowski

# 1.0.0 (2025-10-16)

### 🚀 Features

- import generator ([da768cf](https://github.com/Geekvetica/nx-astro/commit/da768cf))

### 🩹 Fixes

- pipeline ([997e040](https://github.com/Geekvetica/nx-astro/commit/997e040))
- tuning code coverage ([8b43039](https://github.com/Geekvetica/nx-astro/commit/8b43039))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.6 (2025-10-14)

### 🩹 Fixes

- hopefully final version fix ([d37a60f](https://github.com/Geekvetica/nx-astro/commit/d37a60f))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.5 (2025-10-14)

### 🩹 Fixes

- e2e tests isolation ([f3d0b03](https://github.com/Geekvetica/nx-astro/commit/f3d0b03))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.4 (2025-10-14)

### 🩹 Fixes

- release config fixes ([c57af60](https://github.com/Geekvetica/nx-astro/commit/c57af60))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.3 (2025-10-14)

### 🩹 Fixes

- release config fixes ([59a11f5](https://github.com/Geekvetica/nx-astro/commit/59a11f5))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.2 (2025-10-14)

### 🚀 Features

- automatic publish after release ([0ec70bd](https://github.com/Geekvetica/nx-astro/commit/0ec70bd))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.1 (2025-10-14)

### 🚀 Features

- release to npm registry with provenance ([5232eb2](https://github.com/Geekvetica/nx-astro/commit/5232eb2))

### ❤️ Thank You

- Paweł Wojciechowski

## 0.9.0 (2025-10-14)

### 🚀 Features

- fix lint and setup precommit hooks for test and lint ([b4eac7c](https://github.com/Geekvetica/nx-astro/commit/b4eac7c))

### 🩹 Fixes

- pipeline ([fb94af0](https://github.com/Geekvetica/nx-astro/commit/fb94af0))
- pipeline ([40c66af](https://github.com/Geekvetica/nx-astro/commit/40c66af))
- update local registry setup and enhance release process ([4b684c1](https://github.com/Geekvetica/nx-astro/commit/4b684c1))
- e2e tests ([dac3801](https://github.com/Geekvetica/nx-astro/commit/dac3801))
- e2e tests ([1471eeb](https://github.com/Geekvetica/nx-astro/commit/1471eeb))
- update application generator templates and tests for output directory structure ([4229265](https://github.com/Geekvetica/nx-astro/commit/4229265))
- remove test-app and update task outputs to reflect workspace directory structure ([07ce031](https://github.com/Geekvetica/nx-astro/commit/07ce031))
- enhance e2e tests with dependency installation and project graph reset ([2f08ee2](https://github.com/Geekvetica/nx-astro/commit/2f08ee2))
- update e2e tests to reflect dependency hoisting and skip explicit sync test ([65995b7](https://github.com/Geekvetica/nx-astro/commit/65995b7))
- comment out PR labels configuration in dependabot ([7c2ee41](https://github.com/Geekvetica/nx-astro/commit/7c2ee41))

### ❤️ Thank You

- Paweł Wojciechowski
