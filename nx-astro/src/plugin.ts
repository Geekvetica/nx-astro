import {
  CreateNodesV2,
  CreateNodesContext,
  CreateNodesResult,
  TargetConfiguration,
} from '@nx/devkit';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { AstroPluginOptions } from './types/plugin-options';
import { parseAstroConfig } from './utils/astro-config-parser';
import { buildAstroTasks, NormalizedOptions } from './utils/task-builder';
import { normalizeProjectRoot } from './utils/path-utils';

/**
 * Glob pattern to detect Astro projects.
 * Matches astro.config.mjs, astro.config.js, and astro.config.ts
 */
export const ASTRO_CONFIG_GLOB = '**/astro.config.{mjs,js,ts}';

/**
 * CreateNodesV2 implementation for the Nx-Astro plugin.
 *
 * Automatically detects Astro projects by finding `astro.config.{mjs,js,ts}` files
 * and infers Nx tasks (build, dev, check, sync, preview, test) based on the
 * project's configuration.
 *
 * @remarks
 * This plugin uses the CreateNodesV2 API which processes multiple config files
 * in parallel for better performance. Each detected Astro project gets a full
 * set of task targets automatically configured.
 *
 * @example
 * ```typescript
 * // In nx.json
 * {
 *   "plugins": [
 *     {
 *       "plugin": "@geekvetica/nx-astro",
 *       "options": {
 *         "buildTargetName": "build",
 *         "devTargetName": "dev"
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export const createNodesV2: CreateNodesV2<AstroPluginOptions> = [
  ASTRO_CONFIG_GLOB,
  async (
    configFiles: readonly string[],
    options: AstroPluginOptions | undefined,
    context: CreateNodesContext
  ): Promise<Array<[string, CreateNodesResult]>> => {
    const normalizedOptions = normalizeOptions(options);

    const results: Array<[string, CreateNodesResult]> = [];

    for (const configFile of configFiles) {
      try {
        const result = await createNodesForConfigFile(
          configFile,
          normalizedOptions,
          context
        );
        results.push([configFile, result]);
      } catch (error) {
        // Log error but don't fail the entire process
        console.warn(
          `Failed to process Astro config file ${configFile}:`,
          error
        );

        // Still create a minimal project configuration
        const projectRoot = dirname(configFile);
        results.push([
          configFile,
          {
            projects: {
              [projectRoot]: {
                root: projectRoot,
                targets: {},
              },
            },
          },
        ]);
      }
    }

    return results;
  },
];

/**
 * Creates nodes for a single Astro config file
 */
async function createNodesForConfigFile(
  configFile: string,
  options: NormalizedOptions,
  context: CreateNodesContext
): Promise<CreateNodesResult> {
  const projectRoot = normalizeProjectRoot(dirname(configFile));
  const absoluteConfigPath = join(context.workspaceRoot, configFile);

  // Read and parse the Astro config file
  let astroConfig: Partial<import('./types/astro-config').AstroConfig> = {};
  try {
    const configContent = readFileSync(absoluteConfigPath, 'utf-8');
    astroConfig = parseAstroConfig(configContent);
  } catch (error) {
    // If config reading/parsing fails, use empty config
    console.warn(
      `Failed to parse Astro config at ${configFile}, using defaults:`,
      error
    );
  }

  // Build task configurations
  const tasks = buildAstroTasks(
    projectRoot,
    astroConfig,
    options,
    context.workspaceRoot
  );

  // Determine source root from config or use default
  const srcDir = astroConfig.srcDir
    ? normalizeProjectRoot(astroConfig.srcDir)
    : 'src';
  const sourceRoot = join(projectRoot, srcDir).replace(/^\.\//, '');

  // Create the project configuration
  return {
    projects: {
      [projectRoot]: {
        root: projectRoot,
        sourceRoot,
        projectType: 'application',
        targets: tasks as Record<string, TargetConfiguration>,
        tags: ['astro'],
      },
    },
  };
}

/**
 * Normalizes plugin options with default values
 */
function normalizeOptions(
  options: AstroPluginOptions | undefined
): NormalizedOptions {
  return {
    devTargetName: options?.devTargetName || 'dev',
    buildTargetName: options?.buildTargetName || 'build',
    previewTargetName: options?.previewTargetName || 'preview',
    checkTargetName: options?.checkTargetName || 'check',
    testTargetName: options?.testTargetName || 'test',
    syncTargetName: options?.syncTargetName || 'sync',
  };
}
