import { ProjectConfiguration, joinPathFragments } from '@nx/devkit';
import { NormalizedImportOptions } from './normalize-options';

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
 * @param options - Normalized import generator options
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
 * @see {@link NormalizedImportOptions} for the input type
 */
export function createProjectConfig(
  options: NormalizedImportOptions
): ProjectConfiguration {
  const { projectRoot, parsedTags } = options;

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
        inputs: [
          'production',
          '^production',
          {
            externalDependencies: ['astro'],
          },
        ],
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
        inputs: [
          'default',
          '^production',
          {
            externalDependencies: ['astro', 'typescript'],
          },
        ],
        cache: true,
        dependsOn: ['sync'],
      },
      sync: {
        executor: '@geekvetica/nx-astro:sync',
        options: {},
        inputs: [
          `{projectRoot}/src/content/**/*`,
          {
            externalDependencies: ['astro'],
          },
        ],
        outputs: [`{projectRoot}/.astro`],
        cache: true,
      },
    },
  };
}
