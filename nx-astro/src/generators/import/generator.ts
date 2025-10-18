import {
  Tree,
  formatFiles,
  addProjectConfiguration,
  logger,
  addDependenciesToPackageJson,
  GeneratorCallback,
} from '@nx/devkit';
import { ImportGeneratorSchema } from './schema';
import { normalizeOptions } from './utils/normalize-options';
import { validateSource } from './utils/validate-source';
import { validateProjectName } from './utils/validate-project-name';
import { validateTargetDirectory } from './utils/validate-target-directory';
import { copyProjectFiles } from './utils/copy-project-files';
import { createProjectConfig } from './utils/create-project-config';
import { updateTsconfigPaths } from './utils/update-tsconfig-paths';
import { extractDependencies } from './utils/extract-dependencies';

/**
 * Import an existing Astro application into the Nx workspace.
 *
 * This generator automates the migration of existing Astro projects into an Nx monorepo,
 * providing full Nx integration with caching, task orchestration, and dependency management.
 *
 * ## What it does
 * 1. Validates the source is a valid Astro project (checks for astro.config, package.json, astro dependency)
 * 2. Copies project files while excluding generated content (node_modules, dist, .astro, lock files, etc.)
 * 3. Extracts all dependencies from the source project's package.json
 * 4. Merges dependencies into workspace root package.json (filters out workspace protocols, file links)
 * 5. Generates Nx project configuration with all standard targets (build, dev, preview, check, sync)
 * 6. Registers the project in the workspace configuration
 * 7. Updates TypeScript path mappings in tsconfig.base.json for type-safe imports
 * 8. Optionally formats all generated files
 * 9. Optionally installs packages (unless skipInstall is true)
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
 * @example Import without automatic package installation
 * ```bash
 * # Skip automatic package installation (useful for CI/custom workflows)
 * nx g @geekvetica/nx-astro:import \
 *   --source=./my-astro-site \
 *   --skipInstall
 * # Dependencies are added to package.json but not installed
 * # Run: bun install (or npm/pnpm install) when ready
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
  options: ImportGeneratorSchema,
): Promise<GeneratorCallback | void> {
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
    tree,
  );

  // Step 5.5: Extract dependencies from source package.json
  logger.info('📦 Extracting dependencies...');
  const { dependencies, devDependencies } = extractDependencies(
    normalizedOptions.sourcePath,
  );
  const totalDeps =
    Object.keys(dependencies).length + Object.keys(devDependencies).length;
  logger.info(
    `   Found ${totalDeps} dependencies (${Object.keys(dependencies).length} runtime, ${Object.keys(devDependencies).length} dev)`,
  );

  // Step 6: Create project configuration
  logger.info('⚙️  Creating project configuration...');
  const projectConfig = createProjectConfig(normalizedOptions, tree);
  addProjectConfiguration(tree, normalizedOptions.projectName, projectConfig);

  // Step 6.5: Add dependencies to workspace package.json
  logger.info('📝 Adding dependencies to workspace...');
  const installTask = addDependenciesToPackageJson(
    tree,
    dependencies,
    devDependencies,
  );

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
  logger.info('Dependencies added to workspace package.json:');
  logger.info(`  - ${Object.keys(dependencies).length} runtime dependencies`);
  logger.info(`  - ${Object.keys(devDependencies).length} dev dependencies`);
  logger.info('');
  logger.info('Next steps:');
  logger.info(
    `  1. Review the imported project in ${normalizedOptions.projectRoot}`,
  );
  if (normalizedOptions.skipInstall) {
    logger.info(`  2. Install dependencies: bun install`);
    logger.info(
      `  3. Run the dev server: nx dev ${normalizedOptions.projectName}`,
    );
  } else {
    logger.info(
      `  2. Run the dev server: nx dev ${normalizedOptions.projectName}`,
    );
    logger.info('     (dependencies will be installed automatically)');
  }
  logger.info('');

  // Step 9: Install packages unless skipInstall is true
  if (!normalizedOptions.skipInstall) {
    return installTask;
  }
}

export default importGenerator;
