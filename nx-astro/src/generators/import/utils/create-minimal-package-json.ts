import { Tree, logger } from '@nx/devkit';
import { readFileSync } from 'fs';
import { basename } from 'path';

/**
 * Creates a minimal package.json file with astro and @astrojs/* dependencies extracted from source.
 *
 * This function solves a monorepo build issue where Astro's heuristics fail to identify
 * @astrojs/* integrations without a local package.json. It reads the source package.json,
 * extracts the astro package and all dependencies starting with @astrojs/, and creates a
 * minimal package.json in the project root with only those dependencies.
 *
 * ## What it does
 * - Reads source package.json from sourcePath
 * - Extracts astro and all dependencies starting with @astrojs/* (from both dependencies and devDependencies)
 * - Creates a minimal package.json with:
 *   - name: basename of projectRoot
 *   - version: "0.1.0"
 *   - private: true
 *   - type: "module"
 *   - dependencies: all extracted astro and @astrojs/* deps
 * - Writes to tree at {projectRoot}/package.json
 * - Logs the number of Astro-related dependencies added
 *
 * @param tree - Nx virtual file system tree (changes are staged until commit)
 * @param projectRoot - Target path in workspace (relative to workspace root) where package.json will be created
 * @param sourcePath - Absolute path to source package.json file on file system
 *
 * @example Basic usage
 * ```typescript
 * // Extract @astrojs/* deps from source and create minimal package.json
 * createMinimalPackageJson(
 *   tree,
 *   'apps/my-astro-app',
 *   '/Users/dev/source-project/package.json'
 * );
 * // Result: Creates apps/my-astro-app/package.json with @astrojs/* dependencies
 * ```
 *
 * @example With multiple Astro-related dependencies
 * ```typescript
 * // Source package.json has:
 * // {
 * //   "dependencies": {
 * //     "astro": "^5.0.0",
 * //     "@astrojs/react": "^3.0.0",
 * //     "react": "^18.0.0"
 * //   },
 * //   "devDependencies": {
 * //     "@astrojs/check": "^0.5.0",
 * //     "typescript": "^5.0.0"
 * //   }
 * // }
 *
 * createMinimalPackageJson(tree, 'apps/my-app', '/source/package.json');
 *
 * // Generated package.json:
 * // {
 * //   "name": "my-app",
 * //   "version": "0.1.0",
 * //   "private": true,
 * //   "type": "module",
 * //   "dependencies": {
 * //     "astro": "^5.0.0",
 * //     "@astrojs/react": "^3.0.0",
 * //     "@astrojs/check": "^0.5.0"
 * //   }
 * // }
 * ```
 *
 * @example No Astro-related dependencies except astro itself
 * ```typescript
 * // Source package.json has only astro
 * // {
 * //   "dependencies": { "astro": "^5.0.0" }
 * // }
 * createMinimalPackageJson(tree, 'apps/my-app', '/source/package.json');
 *
 * // Generated package.json with astro:
 * // {
 * //   "name": "my-app",
 * //   "version": "0.1.0",
 * //   "private": true,
 * //   "type": "module",
 * //   "dependencies": {
 * //     "astro": "^5.0.0"
 * //   }
 * // }
 * ```
 */
/**
 * Extracts the astro package and all dependencies starting with @astrojs/ from a dependencies object.
 *
 * @param dependencies - Dependencies object from package.json (can be null/undefined)
 * @returns Object containing only astro and @astrojs/* dependencies with their versions
 */
function extractAstrojsDependencies(
  dependencies: Record<string, string> | null | undefined,
): Record<string, string> {
  if (!dependencies) {
    return {};
  }

  const astrojsDeps: Record<string, string> = {};

  for (const [name, version] of Object.entries(dependencies)) {
    // Include both astro itself and all @astrojs/* packages
    if (name === 'astro' || name.startsWith('@astrojs/')) {
      astrojsDeps[name] = version;
    }
  }

  return astrojsDeps;
}

export function createMinimalPackageJson(
  tree: Tree,
  projectRoot: string,
  sourcePath: string,
): void {
  // Read and parse source package.json
  const sourceContent = readFileSync(sourcePath, 'utf-8');
  const sourcePackageJson = JSON.parse(sourceContent);

  // Extract @astrojs/* dependencies from both dependencies and devDependencies
  const depsFromDependencies = extractAstrojsDependencies(
    sourcePackageJson.dependencies,
  );
  const depsFromDevDependencies = extractAstrojsDependencies(
    sourcePackageJson.devDependencies,
  );

  // Merge both sets of dependencies
  const allAstrojsDeps = {
    ...depsFromDependencies,
    ...depsFromDevDependencies,
  };

  // Create minimal package.json structure
  const minimalPackageJson = {
    name: basename(projectRoot),
    version: '0.1.0',
    private: true,
    type: 'module',
    dependencies: allAstrojsDeps,
  };

  // Write to tree
  const targetPath = `${projectRoot}/package.json`;
  tree.write(targetPath, JSON.stringify(minimalPackageJson, null, 2));

  // Log the number of dependencies added
  const dependencyCount = Object.keys(allAstrojsDeps).length;
  const dependencyWord = dependencyCount === 1 ? 'dependency' : 'dependencies';
  logger.info(
    `Added ${dependencyCount} Astro-related ${dependencyWord} to ${targetPath}`,
  );
}
