import { Tree, formatFiles, addProjectConfiguration, logger } from '@nx/devkit';
import { ImportGeneratorSchema } from './schema';
import { normalizeOptions } from './utils/normalize-options';
import { validateSource } from './utils/validate-source';
import { validateProjectName } from './utils/validate-project-name';
import { validateTargetDirectory } from './utils/validate-target-directory';
import { copyProjectFiles } from './utils/copy-project-files';
import { createProjectConfig } from './utils/create-project-config';
import { updateTsconfigPaths } from './utils/update-tsconfig-paths';

/**
 * Import an existing Astro application into the Nx workspace.
 *
 * This generator automates the migration of existing Astro projects into an Nx monorepo,
 * providing full Nx integration with caching, task orchestration, and dependency management.
 *
 * ## What it does
 * 1. Validates the source is a valid Astro project (checks for astro.config, package.json, astro dependency)
 * 2. Copies project files while excluding generated content (node_modules, dist, .astro, lock files, etc.)
 * 3. Generates Nx project configuration with all standard targets (build, dev, preview, check, sync)
 * 4. Registers the project in the workspace configuration
 * 5. Updates TypeScript path mappings in tsconfig.base.json for type-safe imports
 * 6. Optionally formats all generated files
 *
 * ## Use cases
 * - Migrating existing Astro projects into a new Nx monorepo
 * - Consolidating multiple standalone Astro sites into a shared workspace
 * - Importing open-source Astro templates/starters for customization
 * - Setting up a monorepo with existing client projects
 *
 * @param tree - Nx virtual file system tree (writes are staged, not immediately persisted)
 * @param options - Import generator options (see {@link ImportGeneratorSchema})
 * @returns Promise that resolves when import is complete
 *
 * @example Basic import
 * ```bash
 * # Import project from relative path
 * nx g @geekvetica/nx-astro:import --source=../my-astro-app
 *
 * # Import project from absolute path
 * nx g @geekvetica/nx-astro:import --source=/Users/dev/projects/astro-site
 * ```
 *
 * @example Import with custom name and location
 * ```bash
 * # Specify custom project name and directory
 * nx g @geekvetica/nx-astro:import \
 *   --source=./external/astro-app \
 *   --name=marketing-site \
 *   --directory=apps/websites/marketing
 * ```
 *
 * @example Import with tags and custom import path
 * ```bash
 * # Add tags for better organization and filtering
 * nx g @geekvetica/nx-astro:import \
 *   --source=../blog \
 *   --name=company-blog \
 *   --tags=astro,web,public,blog \
 *   --importPath=@myorg/blog
 * ```
 *
 * @example Programmatic usage
 * ```typescript
 * import { importGenerator } from '@geekvetica/nx-astro';
 * import { Tree } from '@nx/devkit';
 *
 * async function migrateProjects(tree: Tree) {
 *   await importGenerator(tree, {
 *     source: '../existing-astro-app',
 *     name: 'my-app',
 *     directory: 'apps/my-app',
 *     tags: 'astro,web',
 *     skipFormat: false,
 *     skipInstall: false,
 *   });
 * }
 * ```
 *
 * @see {@link ImportGeneratorSchema} for all available options
 * @see {@link normalizeOptions} for how options are processed
 */
export async function importGenerator(
  tree: Tree,
  options: ImportGeneratorSchema
): Promise<void> {
  // Step 1: Normalize options
  logger.info('📋 Normalizing options...');
  const normalizedOptions = normalizeOptions(tree, options);

  // Step 2: Validate source project
  logger.info('🔍 Validating source project...');
  validateSource(normalizedOptions.sourcePath);

  // Step 3: Validate project name doesn't exist
  logger.info('✅ Validating project name...');
  validateProjectName(tree, normalizedOptions.projectName);

  // Step 4: Validate target directory
  logger.info('📂 Validating target directory...');
  validateTargetDirectory(tree, normalizedOptions.projectRoot);

  // Step 5: Copy project files
  logger.info('📦 Copying project files...');
  copyProjectFiles(
    normalizedOptions.sourcePath,
    normalizedOptions.projectRoot,
    tree
  );

  // Step 6: Create project configuration
  logger.info('⚙️  Creating project configuration...');
  const projectConfig = createProjectConfig(normalizedOptions);
  addProjectConfiguration(tree, normalizedOptions.projectName, projectConfig);

  // Step 7: Update TypeScript paths
  if (normalizedOptions.importPath) {
    logger.info('🔗 Updating TypeScript paths...');
    updateTsconfigPaths(tree, normalizedOptions);
  }

  // Step 8: Format files
  if (!normalizedOptions.skipFormat) {
    logger.info('✨ Formatting files...');
    await formatFiles(tree);
  }

  // Success message
  logger.info('');
  logger.info('✅ Successfully imported Astro project!');
  logger.info('');
  logger.info('Next steps:');
  logger.info(
    `  1. Review the imported project in ${normalizedOptions.projectRoot}`
  );
  logger.info(`  2. Install dependencies: pnpm install`);
  logger.info(
    `  3. Run the dev server: nx dev ${normalizedOptions.projectName}`
  );
  logger.info('');
}

export default importGenerator;
