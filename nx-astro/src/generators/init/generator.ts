import {
  Tree,
  addDependenciesToPackageJson,
  readJson,
  updateJson,
  formatFiles,
} from '@nx/devkit';
import { InitGeneratorSchema } from './schema';

const PLUGIN_NAME = '@geekvetica/nx-astro';

const ASTRO_VERSIONS: Record<string, { astro: string; node: string }> = {
  '5': { astro: '^5.14.5', node: '^9.5.0' },
  '6': { astro: '^6.2.0', node: '^10.0.0' },
};

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
  options: InitGeneratorSchema,
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
    addDependencies(tree, options.astroVersion ?? 'latest');
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
        (typeof plugin === 'object' && plugin.plugin === PLUGIN_NAME),
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

function addDependencies(tree: Tree, astroVersion: '5' | '6' | 'latest'): void {
  const packageJson = readJson(tree, 'package.json');
  const existingDependencies = packageJson.dependencies || {};
  const existingDevDependencies = packageJson.devDependencies || {};

  const existingAstroRange =
    existingDependencies['astro'] ?? existingDevDependencies['astro'];

  const astroRange = existingAstroRange ?? resolveVersionRange(astroVersion);
  const nodeRange = existingAstroRange
    ? resolveNodeVersionFromRange(existingAstroRange)
    : resolveNodeVersion(astroVersion);

  const devDependencies: Record<string, string> = {};

  if (!existingAstroRange) {
    devDependencies['astro'] = astroRange;
  }

  if (
    !existingDependencies['@astrojs/node'] &&
    !existingDevDependencies['@astrojs/node'] &&
    nodeRange
  ) {
    devDependencies['@astrojs/node'] = nodeRange;
  }

  if (Object.keys(devDependencies).length > 0) {
    addDependenciesToPackageJson(tree, {}, devDependencies);
  }
}

function resolveVersionRange(astroVersion: '5' | '6' | 'latest'): string {
  const resolved = astroVersion === 'latest' ? '6' : astroVersion;
  return ASTRO_VERSIONS[resolved].astro;
}

function resolveNodeVersion(astroVersion: '5' | '6' | 'latest'): string {
  const resolved = astroVersion === 'latest' ? '6' : astroVersion;
  return ASTRO_VERSIONS[resolved].node;
}

function resolveNodeVersionFromRange(astroRange: string): string | undefined {
  const majorMatch = astroRange.match(/^[\^~>=<]*\s*(\d+)/);
  if (!majorMatch) {
    return undefined;
  }
  const major = majorMatch[1];
  return ASTRO_VERSIONS[major]?.node;
}

export default initGenerator;
