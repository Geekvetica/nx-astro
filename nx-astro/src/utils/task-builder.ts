import { TargetConfiguration } from '@nx/devkit';
import { AstroConfig } from '../types/astro-config';

/**
 * Normalized plugin options with default values
 */
export interface NormalizedOptions {
  devTargetName: string;
  buildTargetName: string;
  previewTargetName: string;
  checkTargetName: string;
  testTargetName: string;
  syncTargetName: string;
}

/**
 * Collection of inferred Astro tasks
 */
export interface AstroTasks {
  [key: string]: TargetConfiguration;
}

/**
 * Builds Nx target configurations for an Astro project based on its configuration.
 *
 * @param projectRoot - The project root directory
 * @param astroConfig - Parsed Astro configuration
 * @param options - Normalized plugin options
 * @returns Object containing all inferred task configurations
 */
export function buildAstroTasks(
  projectRoot: string,
  astroConfig: Partial<AstroConfig>,
  options: NormalizedOptions
): AstroTasks {
  const tasks: AstroTasks = {};

  // Determine output directory (normalize by removing leading ./)
  const outDir = (astroConfig.outDir || './dist').replace(/^\.\//, '');

  // Dev task - runs development server
  tasks[options.devTargetName] = {
    executor: '@geekvetica/nx-astro:dev',
    options: {},
    cache: false,
  };

  // Build task - builds for production
  tasks[options.buildTargetName] = {
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
  };

  // Preview task - serves built application
  tasks[options.previewTargetName] = {
    executor: '@geekvetica/nx-astro:preview',
    options: {},
    cache: false,
    dependsOn: ['build'],
  };

  // Check task - type checking
  tasks[options.checkTargetName] = {
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
  };

  // Sync task - generates types for content collections
  tasks[options.syncTargetName] = {
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
  };

  // Test task - runs Vitest tests
  tasks[options.testTargetName] = {
    executor: '@geekvetica/nx-astro:test',
    options: {},
    inputs: ['default', '^production'],
    cache: true,
  };

  return tasks;
}
