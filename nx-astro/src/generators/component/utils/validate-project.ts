import {
  Tree,
  readProjectConfiguration,
  ProjectConfiguration,
} from '@nx/devkit';

export function validateProject(
  tree: Tree,
  projectName: string
): ProjectConfiguration {
  let projectConfig: ProjectConfiguration;

  try {
    projectConfig = readProjectConfiguration(tree, projectName);
  } catch {
    throw new Error(
      `Project "${projectName}" does not exist in the workspace.\n\n` +
        `Available projects can be listed using: nx show projects`
    );
  }

  // Check if it's an Astro project by looking for astro.config file
  const hasAstroConfig =
    tree.exists(`${projectConfig.root}/astro.config.mjs`) ||
    tree.exists(`${projectConfig.root}/astro.config.js`) ||
    tree.exists(`${projectConfig.root}/astro.config.ts`);

  if (!hasAstroConfig) {
    throw new Error(
      `Project "${projectName}" is not an Astro project.\n\n` +
        `Expected to find one of:\n` +
        `  - ${projectConfig.root}/astro.config.mjs\n` +
        `  - ${projectConfig.root}/astro.config.js\n` +
        `  - ${projectConfig.root}/astro.config.ts\n\n` +
        `To create a new Astro project, run: nx g @geekvetica/nx-astro:app <app-name>`
    );
  }

  return projectConfig;
}
