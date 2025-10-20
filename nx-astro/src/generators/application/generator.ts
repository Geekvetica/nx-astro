import {
  Tree,
  generateFiles,
  addProjectConfiguration,
  formatFiles,
  readProjectConfiguration,
  offsetFromRoot,
} from '@nx/devkit';
import { join } from 'path';
import { ApplicationGeneratorSchema } from './schema';
import { normalizeOptions } from './utils/normalize-options';
import { validateExistingProject } from './utils/validate-project';
import { updateRootTsconfig } from './utils/update-root-tsconfig';
import { createProjectConfig } from '../import/utils/create-project-config';
import { NormalizedImportOptions } from '../import/utils/normalize-options';

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
  options: ApplicationGeneratorSchema,
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
  options: ReturnType<typeof normalizeOptions>,
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
      `Project "${projectName}" already exists in the workspace.`,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    // Project doesn't exist - this is expected
  }
}

/**
 * Adds project configuration to the workspace using the shared createProjectConfig utility.
 *
 * This ensures consistency between generated and imported projects by reusing the same
 * configuration logic. The generated project will have all standard Astro targets (dev, build,
 * preview, check, sync) with proper caching, dependencies, and metadata.
 *
 * The sync target includes metadata to prevent conflicts with Nx TypeScript sync:
 * - Explicitly marks the sync target as Astro-specific (technologies: ['astro'])
 * - Prevents @nx/js/typescript plugin from auto-detecting and adding its sync generator
 * - Ensures the sync target uses 'astro sync' command, not Nx TypeScript project references
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Normalized application generator options
 */
function addProjectToWorkspace(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
): void {
  // Convert application generator options to import generator options format
  // createProjectConfig expects NormalizedImportOptions, but we have NormalizedOptions
  // Map the common fields and set defaults for fields that don't exist in application options
  const importOptions: NormalizedImportOptions = {
    projectName: options.projectName,
    projectRoot: options.projectRoot,
    projectDirectory: options.projectDirectory,
    parsedTags: options.parsedTags,
    skipFormat: options.skipFormat,
    // Fields that don't exist in application options - set safe defaults
    sourcePath: '', // Not used by createProjectConfig
    sourceProjectName: options.projectName,
    skipInstall: false,
    importPath: undefined,
  };

  // Use the shared utility to create project configuration with all targets
  const projectConfig = createProjectConfig(importOptions, tree);

  addProjectConfiguration(tree, options.projectName, projectConfig);

  // Add project reference to root tsconfig.json for Nx TypeScript sync
  updateRootTsconfig(tree, options.projectRoot);
}

function getTemplateSubstitutions(
  projectName: string,
  projectRoot: string,
): Record<string, string> {
  return {
    projectName,
    projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
    className: projectName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(''),
    tmpl: '',
  };
}

async function createNewProject(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
): Promise<void> {
  if (options.template !== 'minimal') {
    throw new Error(
      `Template "${options.template}" is not yet implemented. Only "minimal" template is currently supported.`,
    );
  }

  const templatePath = join(__dirname, 'files');
  const substitutions = getTemplateSubstitutions(
    options.projectName,
    options.projectRoot,
  );

  generateFiles(tree, templatePath, options.projectRoot, substitutions);
}

export default applicationGenerator;
