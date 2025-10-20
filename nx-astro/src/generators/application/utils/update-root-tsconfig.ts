import { Tree, updateJson } from '@nx/devkit';

/**
 * Updates or creates root tsconfig.json and adds project reference.
 *
 * This ensures Nx TypeScript sync (@nx/js:typescript-sync) can function
 * properly by maintaining the root solution-style tsconfig.json with
 * references to all TypeScript projects in the workspace.
 *
 * The root tsconfig.json serves as a "solution file" in TypeScript's
 * project references system, enabling:
 * - IDEs to understand the full project structure
 * - TypeScript compiler to build projects in the correct order
 * - Nx to automatically maintain dependency relationships
 *
 * @param tree - Nx virtual file system
 * @param projectRoot - Root directory of the project to add (e.g., 'apps/my-app')
 *
 * @example
 * ```typescript
 * updateRootTsconfig(tree, 'apps/my-astro-app');
 * // Creates or updates root tsconfig.json with reference to apps/my-astro-app
 * ```
 */
export function updateRootTsconfig(tree: Tree, projectRoot: string): void {
  // Create root tsconfig.json if it doesn't exist
  if (!tree.exists('tsconfig.json')) {
    tree.write(
      'tsconfig.json',
      JSON.stringify(
        {
          extends: './tsconfig.base.json',
          compileOnSave: false,
          files: [],
          include: [],
          references: [],
        },
        null,
        2,
      ),
    );
  }

  // Add project reference
  updateJson(tree, 'tsconfig.json', (json) => {
    // Ensure references array exists
    if (!json.references) {
      json.references = [];
    }

    // Add reference if it doesn't already exist
    const refPath = `./${projectRoot}`;
    const exists = json.references.some((ref: any) => ref.path === refPath);

    if (!exists) {
      json.references.push({ path: refPath });
    }

    return json;
  });
}
