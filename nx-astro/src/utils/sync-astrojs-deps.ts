import { existsSync, readFileSync, writeFileSync } from 'fs';
import { logger } from '@nx/devkit';
import { join } from 'path';

/**
 * Type alias for dependency record objects.
 */
type DependencyRecord = Record<string, string>;

/**
 * Synchronizes @astrojs/* dependencies from workspace root to project package.json.
 *
 * This function ensures that a project's @astrojs/* dependencies always match those
 * defined in the workspace root package.json before every build. This solves the
 * synchronization problem in monorepos where workspace-level @astrojs/* dependencies
 * need to be available in project-level package.json for Astro's build process.
 *
 * ## What it does
 * - Checks if project package.json exists, warns and exits early if not
 * - Reads workspace root package.json
 * - Extracts all @astrojs/* dependencies (from both dependencies and devDependencies)
 * - Compares with project's current @astrojs/* dependencies
 * - Updates project package.json only if changes are detected
 * - Preserves all non-@astrojs/* dependencies in project
 * - Logs sync results (count or "already in sync")
 *
 * ## Performance Optimization
 * - Skips filesystem write when dependencies are already synchronized
 * - Uses simple JSON comparison to detect changes
 *
 * @param projectRoot - Relative path to project from workspace root (e.g., 'apps/my-app')
 * @param workspaceRoot - Absolute path to workspace root (e.g., '/Users/dev/my-workspace')
 *
 * @example Basic usage in build executor
 * ```typescript
 * // Before building project, sync @astrojs/* dependencies
 * syncAstrojsDependencies('apps/my-astro-app', context.root);
 * // Now build process has access to latest @astrojs/* deps
 * ```
 *
 * @example Handling missing project package.json
 * ```typescript
 * // If project has no package.json (e.g., imported before this feature)
 * syncAstrojsDependencies('apps/legacy-app', '/workspace');
 * // Logs warning: "package.json not found at apps/legacy-app/package.json. Skipping sync."
 * ```
 *
 * @example Sync with multiple @astrojs/* dependencies
 * ```typescript
 * // Root package.json:
 * // {
 * //   "dependencies": { "@astrojs/react": "^3.0.0" },
 * //   "devDependencies": { "@astrojs/check": "^0.5.0" }
 * // }
 *
 * // Project package.json before:
 * // {
 * //   "dependencies": {
 * //     "@astrojs/react": "^2.0.0",
 * //     "react": "^18.0.0"
 * //   }
 * // }
 *
 * syncAstrojsDependencies('apps/my-app', '/workspace');
 *
 * // Project package.json after:
 * // {
 * //   "dependencies": {
 * //     "@astrojs/react": "^3.0.0",
 * //     "@astrojs/check": "^0.5.0",
 * //     "react": "^18.0.0"
 * //   }
 * // }
 * ```
 */
export function syncAstrojsDependencies(
  projectRoot: string,
  workspaceRoot: string,
): void {
  const projectPackageJsonPath = join(
    workspaceRoot,
    projectRoot,
    'package.json',
  );

  // Check if project package.json exists
  if (!existsSync(projectPackageJsonPath)) {
    logger.warn(
      `package.json not found at ${projectRoot}/package.json. Skipping sync.`,
    );
    return;
  }

  // Read workspace root package.json
  const rootPackageJsonPath = join(workspaceRoot, 'package.json');
  const rootContent = readFileSync(rootPackageJsonPath, 'utf-8');
  const rootPackageJson = JSON.parse(rootContent);

  // Extract @astrojs/* dependencies from root
  const rootAstrojsDeps = extractAstrojsDependencies(rootPackageJson);

  // Read project package.json
  const projectContent = readFileSync(projectPackageJsonPath, 'utf-8');
  const projectPackageJson = JSON.parse(projectContent);

  // Get current project dependencies
  const currentDeps = projectPackageJson.dependencies || {};

  // Extract current @astrojs/* dependencies from project
  const currentAstrojsDeps = extractAstrojsDependencies({
    dependencies: currentDeps,
  });

  // Check if already in sync
  if (areAstrojsDepsEqual(currentAstrojsDeps, rootAstrojsDeps)) {
    logger.info(
      `@astrojs/* dependencies already in sync for ${projectRoot}/package.json`,
    );
    return;
  }

  // Merge dependencies: remove old @astrojs/*, keep non-@astrojs/*, add new @astrojs/*
  const updatedDeps = removeAstrojsDependencies(currentDeps);

  // Add new @astrojs/* dependencies from root
  Object.assign(updatedDeps, rootAstrojsDeps);

  // Update project package.json
  projectPackageJson.dependencies = updatedDeps;

  // Write back to filesystem
  writeFileSync(
    projectPackageJsonPath,
    JSON.stringify(projectPackageJson, null, 2),
  );

  // Log success
  const count = Object.keys(rootAstrojsDeps).length;
  const word = count === 1 ? 'dependency' : 'dependencies';
  logger.info(
    `Synced ${count} @astrojs/* ${word} to ${projectRoot}/package.json`,
  );
}

/**
 * Removes all @astrojs/* dependencies from a dependency object.
 *
 * Creates a new object containing only non-@astrojs/* dependencies.
 *
 * @param dependencies - Dependency object to filter
 * @returns New object with @astrojs/* dependencies removed
 */
function removeAstrojsDependencies(
  dependencies: DependencyRecord,
): DependencyRecord {
  const filtered: DependencyRecord = {};

  for (const [name, version] of Object.entries(dependencies)) {
    if (!name.startsWith('@astrojs/')) {
      filtered[name] = version;
    }
  }

  return filtered;
}

/**
 * Extracts all @astrojs/* dependencies from a package.json object.
 *
 * Combines dependencies from both "dependencies" and "devDependencies" fields.
 *
 * @param packageJson - Parsed package.json object
 * @returns Object containing only @astrojs/* dependencies with their versions
 */
function extractAstrojsDependencies(packageJson: {
  dependencies?: DependencyRecord;
  devDependencies?: DependencyRecord;
}): DependencyRecord {
  const astrojsDeps: DependencyRecord = {};

  // Extract from both dependencies and devDependencies
  const allDeps = [
    packageJson.dependencies || {},
    packageJson.devDependencies || {},
  ];

  for (const deps of allDeps) {
    for (const [name, version] of Object.entries(deps)) {
      if (name.startsWith('@astrojs/')) {
        astrojsDeps[name] = version;
      }
    }
  }

  return astrojsDeps;
}

/**
 * Compares two @astrojs/* dependency objects for equality.
 *
 * @param deps1 - First dependency object
 * @param deps2 - Second dependency object
 * @returns true if both objects have the same keys and values, false otherwise
 */
function areAstrojsDepsEqual(
  deps1: DependencyRecord,
  deps2: DependencyRecord,
): boolean {
  const keys1 = Object.keys(deps1).sort();
  const keys2 = Object.keys(deps2).sort();

  // Different number of keys
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Check if all keys and values match
  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) {
      return false;
    }
    if (deps1[keys1[i]] !== deps2[keys2[i]]) {
      return false;
    }
  }

  return true;
}
