/**
 * Nx-Astro Plugin
 *
 * This plugin provides seamless integration between Astro framework and Nx monorepos.
 * It automatically detects Astro projects and infers tasks for development, building,
 * previewing, type checking, and content collection synchronization.
 */

// Export the main plugin
export { createNodesV2, ASTRO_CONFIG_GLOB } from './plugin';

// Export types
export { AstroPluginOptions } from './types/plugin-options';
export {
  AstroConfig,
  AstroAdapter,
  AstroIntegration,
} from './types/astro-config';

// Export utilities for advanced usage
export { parseAstroConfig } from './utils/astro-config-parser';
export {
  buildAstroTasks,
  NormalizedOptions,
  AstroTasks,
} from './utils/task-builder';
export {
  normalizeProjectRoot,
  getProjectNameFromPath,
  joinPathFragments,
  resolveOutputPath,
} from './utils/path-utils';
