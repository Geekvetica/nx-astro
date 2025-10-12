import { Tree } from '@nx/devkit';
import { join } from 'path';

const ASTRO_CONFIG_FILES = [
  'astro.config.mjs',
  'astro.config.js',
  'astro.config.ts',
];

export function validateExistingProject(tree: Tree, projectRoot: string): void {
  // Check if any Astro config file exists
  const hasAstroConfig = ASTRO_CONFIG_FILES.some((configFile) => {
    const configPath = join(projectRoot, configFile);
    return tree.exists(configPath);
  });

  if (!hasAstroConfig) {
    throw new Error(
      `Cannot import project from "${projectRoot}". No Astro configuration file found. ` +
        `Expected one of: ${ASTRO_CONFIG_FILES.join(', ')}`
    );
  }
}

export function findAstroConfigFile(
  tree: Tree,
  projectRoot: string
): string | null {
  for (const configFile of ASTRO_CONFIG_FILES) {
    const configPath = join(projectRoot, configFile);
    if (tree.exists(configPath)) {
      return configFile;
    }
  }
  return null;
}
