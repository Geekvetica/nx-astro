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
  '7': { astro: '^7.3.6', node: '^11.1.7' },
};

const LATEST_ASTRO_MAJOR = '7';

/**
 * @astrojs/node ranges per Astro major, newest first. Each entry is used only
 * when the workspace's Astro range cannot go below `minAstro`, which is the
 * lowest Astro version every adapter release in `node` accepts as a peer.
 */
const NODE_ADAPTER_COMPATIBILITY: Record<
  string,
  { minAstro: string; node: string }[]
> = {
  '5': [
    { minAstro: '5.17.3', node: '^9.5.4' },
    { minAstro: '5.14.3', node: '>=9.4.6 <9.5.4' },
    { minAstro: '5.7.0', node: '>=9.4.3 <9.4.6' },
    { minAstro: '5.3.0', node: '>=9.1.0 <9.4.3' },
    { minAstro: '5.0.0', node: '>=9.0.0 <9.1.0' },
  ],
  '6': [
    { minAstro: '6.3.0', node: '^10.1.0' },
    { minAstro: '6.0.0', node: '>=10.0.2 <10.1.0' },
  ],
  '7': [
    { minAstro: '7.2.1', node: '^11.1.7' },
    { minAstro: '7.0.0', node: '>=11.0.1 <11.1.3' },
  ],
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

function addDependencies(
  tree: Tree,
  astroVersion: '5' | '6' | '7' | 'latest',
): void {
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

function resolveVersionRange(astroVersion: '5' | '6' | '7' | 'latest'): string {
  const resolved =
    astroVersion === 'latest' ? LATEST_ASTRO_MAJOR : astroVersion;
  return ASTRO_VERSIONS[resolved].astro;
}

function resolveNodeVersion(astroVersion: '5' | '6' | '7' | 'latest'): string {
  const resolved =
    astroVersion === 'latest' ? LATEST_ASTRO_MAJOR : astroVersion;
  return ASTRO_VERSIONS[resolved].node;
}

/**
 * Picks an @astrojs/node range whose peer requirement is met by every Astro
 * version the existing range allows, based on the range's lower bound.
 */
function resolveNodeVersionFromRange(astroRange: string): string | undefined {
  const lowerBound = parseLowerBound(astroRange);
  if (!lowerBound) {
    return undefined;
  }

  const candidates = NODE_ADAPTER_COMPATIBILITY[String(lowerBound[0])];
  return candidates?.find(
    ({ minAstro }) =>
      compareVersions(lowerBound, parseLowerBound(minAstro) ?? [0, 0, 0]) >= 0,
  )?.node;
}

function parseLowerBound(range: string): [number, number, number] | undefined {
  const match = range
    .trim()
    .match(/^(?:\^|~|>=?|=)?\s*v?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/i);
  if (!match) {
    return undefined;
  }
  const toNumber = (part?: string) =>
    part && /^\d+$/.test(part) ? Number(part) : 0;
  return [Number(match[1]), toNumber(match[2]), toNumber(match[3])];
}

function compareVersions(
  a: [number, number, number],
  b: [number, number, number],
): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

export default initGenerator;
