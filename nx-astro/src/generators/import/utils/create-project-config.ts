import { ProjectConfiguration, joinPathFragments, Tree } from '@nx/devkit';
import { NormalizedImportOptions } from './normalize-options';

/**
 * Detects the package manager used in the workspace.
 *
 * Checks package.json's packageManager field first, falls back to
 * detecting lock files if not specified.
 *
 * @param tree - Nx virtual file system
 * @returns Package manager name: 'bun', 'pnpm', 'yarn', or 'npm'
 */
function detectPackageManager(tree: Tree): 'bun' | 'pnpm' | 'yarn' | 'npm' {
  // Check package.json packageManager field (most reliable)
  if (tree.exists('package.json')) {
    const packageJsonContent = tree.read('package.json', 'utf-8');
    if (packageJsonContent) {
      const packageJson = JSON.parse(packageJsonContent);
      if (packageJson.packageManager) {
        const manager = packageJson.packageManager.split('@')[0];
        if (['bun', 'pnpm', 'yarn', 'npm'].includes(manager)) {
          return manager as 'bun' | 'pnpm' | 'yarn' | 'npm';
        }
      }
    }
  }

  // Fallback: detect by lock file
  if (tree.exists('bun.lockb')) return 'bun';
  if (tree.exists('pnpm-lock.yaml')) return 'pnpm';
  if (tree.exists('yarn.lock')) return 'yarn';
  return 'npm'; // Default fallback
}

/**
 * Creates a ProjectConfiguration object for an imported Astro project.
 *
 * Generates a complete Nx project configuration with all standard Astro targets,
 * properly configured for caching, dependency management, and task orchestration.
 * The configuration follows Nx best practices for optimal performance in monorepos.
 *
 * ## Generated targets
 * - **dev**: Development server with hot module replacement (no cache)
 * - **build**: Production build with caching and dependency tracking
 * - **preview**: Preview production build (depends on build)
 * - **check**: TypeScript type checking with caching (depends on sync)
 * - **sync**: Content collection type generation with caching
 *
 * ## Caching strategy
 * - Cached targets: build, check, sync (for fast rebuilds)
 * - Non-cached targets: dev, preview (interactive commands)
 *
 * ## Package Manager Compatibility
 * The configuration automatically detects the package manager:
 * - **Bun**: Uses `bun.lockb` for cache invalidation (workaround for Nx hasher limitation)
 * - **npm/pnpm/yarn**: Uses `externalDependencies` for precise version tracking
 *
 * This ensures optimal caching behavior across all package managers while
 * maintaining compatibility with Bun's unique module resolution.
 *
 * @param options - Normalized import generator options
 * @param tree - Optional Nx virtual file system (for package manager detection)
 * @returns ProjectConfiguration with all targets, caching, and dependencies configured
 *
 * @example Basic usage
 * ```typescript
 * const config = createProjectConfig({
 *   projectName: 'my-app',
 *   projectRoot: 'apps/my-app',
 *   projectDirectory: 'apps/my-app',
 *   parsedTags: ['astro', 'web'],
 *   // ... other normalized options
 * });
 *
 * // Returns:
 * // {
 * //   root: 'apps/my-app',
 * //   sourceRoot: 'apps/my-app/src',
 * //   projectType: 'application',
 * //   tags: ['astro', 'web'],
 * //   targets: { dev, build, preview, check, sync }
 * // }
 * ```
 *
 * @example With custom tags for organization
 * ```typescript
 * const config = createProjectConfig({
 *   projectName: 'marketing-site',
 *   projectRoot: 'apps/websites/marketing',
 *   parsedTags: ['astro', 'web', 'public-facing', 'ssg'],
 *   // ... other options
 * });
 * // Tags help filter and organize projects in the workspace
 * ```
 *
 * @example Configuration enables Nx caching
 * ```typescript
 * // After creating the configuration:
 * const config = createProjectConfig(options);
 * addProjectConfiguration(tree, projectName, config);
 *
 * // Now you can use Nx caching:
 * // First build (cold):
 * //   nx build my-app  // Takes 15s
 * // Second build (cached):
 * //   nx build my-app  // Takes 0.2s (from cache)
 * ```
 *
 * @example Target dependencies ensure correct execution order
 * ```typescript
 * // The configuration sets up these dependencies:
 * // - preview depends on build (builds first, then previews)
 * // - check depends on sync (generates types first, then checks)
 * // - build depends on ^build (builds dependencies first)
 *
 * // Example workflow:
 * // nx check my-app
 * //   → First runs: nx sync my-app (generates content types)
 * //   → Then runs: nx check my-app (type checks with generated types)
 * ```
 *
 * @example With Bun package manager
 * ```typescript
 * // package.json has "packageManager": "bun@latest"
 * const config = createProjectConfig(options, tree);
 * // Returns config with inputs: [..., '{workspaceRoot}/bun.lockb']
 * // Cache invalidates when any dependency changes
 * ```
 *
 * @example With npm/pnpm package manager
 * ```typescript
 * // package.json has "packageManager": "pnpm@8.0.0"
 * const config = createProjectConfig(options, tree);
 * // Returns config with inputs: [..., {externalDependencies: ['astro']}]
 * // Cache invalidates only when astro version changes
 * ```
 *
 * @see {@link NormalizedImportOptions} for the input type
 */
export function createProjectConfig(
  options: NormalizedImportOptions,
  tree?: Tree,
): ProjectConfiguration {
  const { projectRoot, parsedTags } = options;

  // Detect package manager (only if tree is provided)
  const packageManager = tree ? detectPackageManager(tree) : 'npm';
  const isBun = packageManager === 'bun';

  // Helper to create inputs array based on package manager
  const createInputs = (base: any[], externalDeps: string[]): any[] => {
    if (isBun) {
      // For Bun: use lockfile instead of externalDependencies
      return [...base, '{workspaceRoot}/bun.lockb'];
    } else {
      // For npm/pnpm/yarn: use externalDependencies (precise)
      return [...base, { externalDependencies: externalDeps }];
    }
  };

  return {
    root: projectRoot,
    sourceRoot: joinPathFragments(projectRoot, 'src'),
    projectType: 'application',
    tags: parsedTags,
    targets: {
      dev: {
        executor: '@geekvetica/nx-astro:dev',
        options: {},
        cache: false,
      },
      build: {
        executor: '@geekvetica/nx-astro:build',
        options: {},
        inputs: createInputs(['production', '^production'], ['astro']),
        outputs: [`{workspaceRoot}/dist/{projectRoot}`, `{projectRoot}/.astro`],
        cache: true,
        dependsOn: ['^build'],
      },
      preview: {
        executor: '@geekvetica/nx-astro:preview',
        options: {},
        cache: false,
        dependsOn: ['build'],
      },
      check: {
        executor: '@geekvetica/nx-astro:check',
        options: {},
        inputs: createInputs(
          ['default', '^production'],
          ['astro', 'typescript'],
        ),
        cache: true,
        dependsOn: ['sync'],
      },
      sync: {
        executor: '@geekvetica/nx-astro:sync',
        options: {},
        inputs: createInputs([`{projectRoot}/src/content/**/*`], ['astro']),
        outputs: [`{projectRoot}/.astro`],
        cache: true,
      },
    },
  };
}
