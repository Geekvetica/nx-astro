import { Tree, updateJson } from '@nx/devkit';
import { NormalizedImportOptions } from './normalize-options';

/**
 * Updates tsconfig.base.json to add a TypeScript path mapping for the imported project.
 *
 * Configures TypeScript path aliases to enable clean, type-safe imports from the
 * imported project. This allows other projects in the workspace to import from the
 * imported project using a named alias instead of relative paths.
 *
 * ## What it does
 * 1. Adds or updates the path mapping in tsconfig.base.json
 * 2. Creates compilerOptions and paths sections if they don't exist
 * 3. Skips gracefully if importPath is not provided or tsconfig.base.json doesn't exist
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Normalized import generator options containing importPath and projectRoot
 *
 * @example Basic path mapping
 * ```typescript
 * updateTsconfigPaths(tree, {
 *   importPath: '@myorg/my-app',
 *   projectRoot: 'apps/my-app',
 *   // ... other options
 * });
 *
 * // Result in tsconfig.base.json:
 * // {
 * //   "compilerOptions": {
 * //     "paths": {
 * //       "@myorg/my-app": ["apps/my-app/src/index.ts"]
 * //     }
 * //   }
 * // }
 * ```
 *
 * @example Using the path alias in other projects
 * ```typescript
 * // After importing with:
 * // importPath: '@myorg/shared-ui'
 * // projectRoot: 'libs/shared-ui'
 *
 * // You can now import in any project:
 * import { Button } from '@myorg/shared-ui';
 * import type { ButtonProps } from '@myorg/shared-ui';
 *
 * // Instead of relative paths:
 * // import { Button } from '../../libs/shared-ui/src/components/Button.astro';
 * ```
 *
 * @example Workspace-scoped imports
 * ```typescript
 * // When workspace name is 'acme', auto-generated importPath:
 * updateTsconfigPaths(tree, {
 *   importPath: '@acme/marketing-site',
 *   projectRoot: 'apps/websites/marketing',
 *   // ...
 * });
 *
 * // Enables imports like:
 * import { config } from '@acme/marketing-site';
 * ```
 *
 * @example Graceful handling when no importPath
 * ```typescript
 * updateTsconfigPaths(tree, {
 *   importPath: undefined,  // No path alias requested
 *   projectRoot: 'apps/my-app',
 *   // ...
 * });
 * // Function returns early, no changes made to tsconfig.base.json
 * ```
 *
 * @see {@link NormalizedImportOptions} for the options type
 * @see {@link normalizeOptions} for how importPath is generated
 */
export function updateTsconfigPaths(
  tree: Tree,
  options: NormalizedImportOptions
): void {
  const { importPath, projectRoot } = options;

  // Skip if no import path is provided
  if (!importPath) {
    return;
  }

  // Skip if tsconfig.base.json doesn't exist
  if (!tree.exists('tsconfig.base.json')) {
    return;
  }

  updateJson(tree, 'tsconfig.base.json', (json) => {
    // Ensure compilerOptions exists
    if (!json.compilerOptions) {
      json.compilerOptions = {};
    }

    // Ensure paths exists
    if (!json.compilerOptions.paths) {
      json.compilerOptions.paths = {};
    }

    // Add or update the path mapping
    const targetPath = `${projectRoot}/src/index.ts`;
    json.compilerOptions.paths[importPath] = [targetPath];

    return json;
  });
}
