import { Tree } from '@nx/devkit';

/**
 * Modifies an Astro project's astro.config.mjs file to inject the correct outDir configuration.
 *
 * This function updates the Astro configuration to ensure builds output to the correct
 * location within an Nx workspace structure (dist/{projectRoot}). It handles both
 * plain object exports and defineConfig wrapper formats.
 *
 * ## Behavior
 * - Skips modification if astro.config.mjs doesn't exist
 * - Skips modification if outDir is already configured
 * - Injects outDir at the beginning of the config object
 * - Preserves all existing configuration properties
 *
 * ## Supported formats
 * - `export default { ... }`
 * - `export default defineConfig({ ... })`
 *
 * @param tree - Nx virtual file system tree
 * @param projectRoot - Root directory of the project (e.g., 'apps/my-app')
 * @param offsetFromRoot - Relative path from project root to workspace root (e.g., '../../')
 *
 * @example
 * ```typescript
 * // For project at 'apps/my-app' with offsetFromRoot '../../'
 * modifyAstroConfig(tree, 'apps/my-app', '../../');
 * // Injects: outDir: '../../dist/apps/my-app'
 * ```
 */
export function modifyAstroConfig(
  tree: Tree,
  projectRoot: string,
  offsetFromRoot: string,
): void {
  const configPath = `${projectRoot}/astro.config.mjs`;

  // Early return if config doesn't exist
  if (!tree.exists(configPath)) {
    return;
  }

  const content = tree.read(configPath, 'utf-8');
  if (!content) {
    return;
  }

  // Skip if outDir is already configured
  if (hasOutDirConfigured(content)) {
    return;
  }

  const outDir = buildOutDirPath(offsetFromRoot, projectRoot);
  const modifiedContent = injectOutDir(content, outDir);

  tree.write(configPath, modifiedContent);
}

/**
 * Checks if the config already has an outDir property.
 *
 * @param content - The config file content
 * @returns true if outDir exists in the config
 */
function hasOutDirConfigured(content: string): boolean {
  return content.includes('outDir');
}

/**
 * Builds the outDir path relative to the workspace root.
 *
 * @param offsetFromRoot - Relative path from project to workspace root
 * @param projectRoot - Project root path
 * @returns The complete outDir path
 */
function buildOutDirPath(offsetFromRoot: string, projectRoot: string): string {
  return `${offsetFromRoot}dist/${projectRoot}`;
}

/**
 * Injects the outDir configuration into the Astro config content.
 *
 * Handles two formats:
 * 1. defineConfig({ ... }) wrapper
 * 2. Plain export default { ... }
 *
 * @param content - Original config file content
 * @param outDir - The outDir path to inject
 * @returns Modified config content with outDir injected
 */
function injectOutDir(content: string, outDir: string): string {
  const outDirProperty = `outDir: '${outDir}'`;

  // Handle defineConfig wrapper format
  if (content.includes('defineConfig({')) {
    return content.replace(
      /defineConfig\(\{/,
      `defineConfig({\n  ${outDirProperty},`,
    );
  }

  // Handle plain export default format
  return content.replace(
    /export default \{/,
    `export default {\n  ${outDirProperty},`,
  );
}
