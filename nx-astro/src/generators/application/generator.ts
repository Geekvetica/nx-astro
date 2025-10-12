import {
  Tree,
  generateFiles,
  addProjectConfiguration,
  formatFiles,
  joinPathFragments,
  readProjectConfiguration,
} from '@nx/devkit';
import { join } from 'path';
import { ApplicationGeneratorSchema } from './schema';
import { normalizeOptions } from './utils/normalize-options';
import { validateExistingProject } from './utils/validate-project';

/**
 * Generates a new Astro application in an Nx workspace.
 *
 * Creates a new Astro project with all necessary configuration files, directory structure,
 * and Nx integration. Optionally imports an existing Astro project into the workspace.
 *
 * @param tree - The virtual file system tree
 * @param options - Generator options including project name, directory, and configuration
 *
 * @example
 * ```typescript
 * // Generate a new Astro app
 * await applicationGenerator(tree, {
 *   name: 'my-app',
 *   directory: 'apps/my-app',
 *   unitTestRunner: 'vitest'
 * });
 * ```
 *
 * @remarks
 * This generator will:
 * - Create project structure (src/, public/, etc.)
 * - Generate astro.config.mjs
 * - Set up TypeScript configuration
 * - Configure test runner if specified
 * - Register project in workspace
 * - Run formatFiles unless skipFormat is true
 */
export async function applicationGenerator(
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(options);

  ensureProjectDoesNotExist(tree, normalizedOptions.projectName);

  if (normalizedOptions.importExisting) {
    await importExistingProject(tree, normalizedOptions);
  } else {
    await createNewProject(tree, normalizedOptions);
  }

  addProjectToWorkspace(tree, normalizedOptions);

  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }
}

async function importExistingProject(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>
): Promise<void> {
  // Validate that the project exists and has an Astro config
  validateExistingProject(tree, options.projectRoot);

  // For import mode, we just validate and register the project
  // The project files already exist, so we don't generate anything
}

function ensureProjectDoesNotExist(tree: Tree, projectName: string): void {
  try {
    readProjectConfiguration(tree, projectName);
    throw new Error(
      `Project "${projectName}" already exists in the workspace.`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    // Project doesn't exist - this is expected
  }
}

function addProjectToWorkspace(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>
): void {
  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    sourceRoot: joinPathFragments(options.projectRoot, 'src'),
    projectType: 'application',
    tags: options.parsedTags,
  });
}

function getTemplateSubstitutions(projectName: string): Record<string, string> {
  return {
    projectName,
    className: projectName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(''),
    tmpl: '',
  };
}

async function createNewProject(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>
): Promise<void> {
  if (options.template !== 'minimal') {
    throw new Error(
      `Template "${options.template}" is not yet implemented. Only "minimal" template is currently supported.`
    );
  }

  const templatePath = join(__dirname, 'files');
  const substitutions = getTemplateSubstitutions(options.projectName);

  generateFiles(tree, templatePath, options.projectRoot, substitutions);
}

export default applicationGenerator;
