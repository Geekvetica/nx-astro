import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Result of extracting dependencies from a package.json file.
 */
export interface ExtractedDependencies {
  /**
   * Runtime dependencies needed by the application
   */
  dependencies: Record<string, string>;
  /**
   * Development dependencies (build tools, type definitions, etc.)
   */
  devDependencies: Record<string, string>;
}

/**
 * Extracts dependencies from an imported project's package.json.
 *
 * Reads the source project's package.json and extracts both dependencies and
 * devDependencies, filtering out incompatible dependency types that don't work
 * in Nx monorepos (workspace protocols, file links, etc.).
 *
 * ## What it extracts
 * - **dependencies**: Runtime dependencies needed by the application
 * - **devDependencies**: Development dependencies (build tools, type definitions, etc.)
 * - **optionalDependencies**: Converted to devDependencies for safety
 *
 * ## What it filters out
 * - Workspace protocol references (`workspace:*`, `workspace:^`, etc.)
 * - File protocol dependencies (`file:../path`)
 * - Link protocol dependencies (`link:../path`)
 * - Invalid version specifications (empty, undefined, etc.)
 *
 * @param sourcePath - Absolute path to the source project directory
 * @returns Object containing dependencies and devDependencies maps
 * @throws {Error} If source package.json doesn't exist or can't be parsed
 *
 * @example Basic usage
 * ```typescript
 * const deps = extractDependencies('/path/to/astro-project');
 * // Returns:
 * // {
 * //   dependencies: { 'astro': '^5.14.3', 'react': '^19.2.0' },
 * //   devDependencies: { '@types/react': '^19.2.2' }
 * // }
 * ```
 *
 * @example Handles workspace dependencies
 * ```typescript
 * // Source package.json has:
 * // {
 * //   "dependencies": {
 * //     "astro": "^5.0.0",
 * //     "shared-lib": "workspace:*"  // Filtered out
 * //   }
 * // }
 *
 * const deps = extractDependencies('/path/to/project');
 * // Returns only: { dependencies: { 'astro': '^5.0.0' }, devDependencies: {} }
 * ```
 *
 * @example Merges optional dependencies
 * ```typescript
 * // Source package.json has:
 * // {
 * //   "dependencies": { "astro": "^5.0.0" },
 * //   "devDependencies": { "vitest": "^2.0.0" },
 * //   "optionalDependencies": { "sharp": "^0.33.0" }
 * // }
 *
 * const deps = extractDependencies('/path/to/project');
 * // Returns:
 * // {
 * //   dependencies: { 'astro': '^5.0.0' },
 * //   devDependencies: { 'vitest': '^2.0.0', 'sharp': '^0.33.0' }
 * // }
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   const deps = extractDependencies('/nonexistent/path');
 * } catch (error) {
 *   console.error(error.message);
 *   // Error: package.json not found at /nonexistent/path/package.json
 * }
 * ```
 */
export function extractDependencies(sourcePath: string): ExtractedDependencies {
  const packageJsonPath = join(sourcePath, 'package.json');

  // Check if package.json exists
  if (!existsSync(packageJsonPath)) {
    throw new Error(
      `package.json not found at ${packageJsonPath}\n` +
        `The source project must have a package.json file.`,
    );
  }

  // Read and parse package.json
  let packageJson: any;
  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to parse package.json at ${packageJsonPath}:\n` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Extract dependencies
  const rawDependencies = packageJson.dependencies || {};
  const rawDevDependencies = packageJson.devDependencies || {};
  const rawOptionalDependencies = packageJson.optionalDependencies || {};

  // Filter dependencies
  const dependencies = filterDependencies(rawDependencies);

  // Merge dev and optional dependencies
  const devDependencies = {
    ...filterDependencies(rawDevDependencies),
    ...filterDependencies(rawOptionalDependencies),
  };

  return {
    dependencies,
    devDependencies,
  };
}

/**
 * Filters out invalid or incompatible dependency specifications.
 *
 * Removes dependencies that use protocols or formats incompatible with
 * standard npm/pnpm/bun package managers in monorepo contexts.
 *
 * @param deps - Raw dependencies object from package.json
 * @returns Filtered dependencies object with only valid entries
 *
 * @internal
 */
function filterDependencies(
  deps: Record<string, string>,
): Record<string, string> {
  const filtered: Record<string, string> = {};

  for (const [name, version] of Object.entries(deps)) {
    // Skip if version is empty or undefined
    if (!version || version.trim().length === 0) {
      continue;
    }

    // Skip workspace protocol (used in pnpm/yarn workspaces)
    if (version.startsWith('workspace:')) {
      continue;
    }

    // Skip file protocol (local file dependencies)
    if (version.startsWith('file:')) {
      continue;
    }

    // Skip link protocol (local symlink dependencies)
    if (version.startsWith('link:')) {
      continue;
    }

    // Keep this dependency
    filtered[name] = version;
  }

  return filtered;
}
