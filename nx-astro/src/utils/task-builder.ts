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
    command: 'astro dev',
    options: {
      cwd: projectRoot,
    },
    cache: false,
  };

  // Build task - builds for production
  tasks[options.buildTargetName] = {
    command: 'astro build',
    options: {
      cwd: projectRoot,
    },
    inputs: [
      'production',
      '^production',
      {
        externalDependencies: ['astro'],
      },
    ],
    outputs: [`{projectRoot}/${outDir}`, `{projectRoot}/.astro`],
    cache: true,
    dependsOn: ['^build'],
  };

  // Preview task - serves built application
  tasks[options.previewTargetName] = {
    command: 'astro preview',
    options: {
      cwd: projectRoot,
    },
    cache: false,
    dependsOn: ['build'],
  };

  // Check task - type checking
  tasks[options.checkTargetName] = {
    command: 'astro check',
    options: {
      cwd: projectRoot,
    },
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
    command: 'astro sync',
    options: {
      cwd: projectRoot,
    },
    inputs: [
      `{projectRoot}/src/content/**/*`,
      {
        externalDependencies: ['astro'],
      },
    ],
    outputs: [`{projectRoot}/.astro`],
    cache: true,
  };

  return tasks;
}
