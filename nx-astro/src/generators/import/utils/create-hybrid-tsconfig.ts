import { Tree, offsetFromRoot, joinPathFragments } from '@nx/devkit';

/**
 * Creates hybrid TypeScript configuration for imported Astro projects.
 *
 * Generates both tsconfig.base.json (extends workspace) and tsconfig.json
 * (extends local base) to integrate the project with workspace TypeScript
 * while preserving Astro-specific configuration.
 *
 * This hybrid approach provides the best of both worlds:
 * - **Workspace integration**: Inherits shared compiler options and path mappings
 * - **Astro compatibility**: Maintains Astro-specific TypeScript settings
 * - **IDE support**: Better TypeScript IntelliSense across the workspace
 * - **Nx sync compatibility**: Works seamlessly with @nx/js:typescript-sync
 *
 * The generated structure:
 * ```
 * project-root/
 * ├── tsconfig.base.json   (extends workspace, adds JSX settings)
 * └── tsconfig.json         (extends local base, adds Astro specifics)
 * ```
 *
 * @param tree - Nx virtual file system
 * @param projectRoot - Root directory of the project being imported
 *
 * @example Basic usage
 * ```typescript
 * createHybridTsconfig(tree, 'apps/my-astro-app');
 * // Creates:
 * // - apps/my-astro-app/tsconfig.base.json
 * // - apps/my-astro-app/tsconfig.json
 * ```
 *
 * @example After importing existing project
 * ```typescript
 * // In import generator after copying files:
 * copyProjectFiles(sourcePath, projectRoot, tree);
 * createHybridTsconfig(tree, projectRoot);
 * // Old tsconfig.json is replaced with hybrid configuration
 * ```
 */
export function createHybridTsconfig(tree: Tree, projectRoot: string): void {
  // Calculate offset for relative paths (e.g., "../../" for "apps/my-app")
  const offset = offsetFromRoot(projectRoot);

  // Create tsconfig.base.json (extends workspace base, adds JSX settings)
  const baseConfigPath = joinPathFragments(projectRoot, 'tsconfig.base.json');
  const baseConfig = {
    extends: `${offset}tsconfig.base.json`,
    compilerOptions: {
      jsx: 'react-jsx',
      jsxImportSource: 'react',
    },
  };
  tree.write(baseConfigPath, JSON.stringify(baseConfig, null, 2) + '\n');

  // Create tsconfig.json (extends local base, adds Astro-specific settings)
  const configPath = joinPathFragments(projectRoot, 'tsconfig.json');
  const config = {
    extends: './tsconfig.base.json',
    include: ['.astro/types.d.ts', '**/*'],
    exclude: ['dist'],
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
  };
  tree.write(configPath, JSON.stringify(config, null, 2) + '\n');
}
