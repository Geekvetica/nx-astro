import {
  Tree,
  addDependenciesToPackageJson,
  readJson,
  updateJson,
  formatFiles,
} from '@nx/devkit';
import { InitGeneratorSchema } from './schema';

const PLUGIN_NAME = '@geekvetica/nx-astro';
const ASTRO_VERSION = '^5.0.3';
const ASTROJS_NODE_VERSION = '^9.0.0';

const DEFAULT_PLUGIN_OPTIONS = {
  devTargetName: 'dev',
  buildTargetName: 'build',
  previewTargetName: 'preview',
  checkTargetName: 'check',
  testTargetName: 'test',
  syncTargetName: 'sync',
};

/**
 * Initializes the @geekvetica/nx-astro plugin in an Nx workspace.
 *
 * Registers the plugin in nx.json and installs Astro dependencies. This is typically
 * the first generator to run when setting up Astro support in an Nx workspace.
 *
 * @param tree - The virtual file system tree
 * @param options - Generator options for initialization
 *
 * @example
 * ```typescript
 * // Initialize @geekvetica/nx-astro plugin
 * await initGenerator(tree, {
 *   skipFormat: false,
 *   skipPackageJson: false
 * });
 * ```
 *
 * @remarks
 * This generator will:
 * - Add '@geekvetica/nx-astro' plugin to nx.json if not already present
 * - Install Astro and @astrojs/node as dev dependencies
 * - Format files unless skipFormat is true
 * - Skip package.json updates if skipPackageJson is true
 */
export async function initGenerator(
  tree: Tree,
  options: InitGeneratorSchema
): Promise<void> {
  // Check if nx.json exists
  if (!tree.exists('nx.json')) {
    throw new Error('nx.json not found in workspace root');
  }

  // Add plugin to nx.json
  addPluginToNxJson(tree);

  // Add dependencies to package.json unless skipPackageJson is true
  if (!options.skipPackageJson) {
    if (!tree.exists('package.json')) {
      throw new Error('package.json not found in workspace root');
    }
    addDependencies(tree);
  }

  await formatFiles(tree);
}

function addPluginToNxJson(tree: Tree): void {
  updateJson(tree, 'nx.json', (json) => {
    // Initialize plugins array if it doesn't exist
    if (!json.plugins) {
      json.plugins = [];
    }

    // Check if plugin is already registered
    const isPluginRegistered = json.plugins.some(
      (plugin: string | { plugin: string }) =>
        plugin === PLUGIN_NAME ||
        (typeof plugin === 'object' && plugin.plugin === PLUGIN_NAME)
    );

    // Only add if not already registered
    if (!isPluginRegistered) {
      json.plugins.push({
        plugin: PLUGIN_NAME,
        options: DEFAULT_PLUGIN_OPTIONS,
      });
    }

    return json;
  });
}

function addDependencies(tree: Tree): void {
  const packageJson = readJson(tree, 'package.json');
  const existingDependencies = packageJson.dependencies || {};
  const existingDevDependencies = packageJson.devDependencies || {};

  // Prepare dev dependencies to add
  const devDependencies: Record<string, string> = {};

  // Only add if not already present in either dependencies or devDependencies
  if (!existingDependencies['astro'] && !existingDevDependencies['astro']) {
    devDependencies['astro'] = ASTRO_VERSION;
  }

  if (
    !existingDependencies['@astrojs/node'] &&
    !existingDevDependencies['@astrojs/node']
  ) {
    devDependencies['@astrojs/node'] = ASTROJS_NODE_VERSION;
  }

  // Add dev dependencies if there are any to add
  if (Object.keys(devDependencies).length > 0) {
    addDependenciesToPackageJson(tree, {}, devDependencies);
  }
}

export default initGenerator;
