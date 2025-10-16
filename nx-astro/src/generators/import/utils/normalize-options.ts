import { Tree, names, readJson, normalizePath } from '@nx/devkit';
import { basename, resolve } from 'path';
import { ImportGeneratorSchema } from '../schema';

/**
 * Normalized options for the import generator.
 * All optional fields are resolved to their final values.
 */
export interface NormalizedImportOptions {
  /** Project name in kebab-case */
  projectName: string;
  /** Project root directory (relative to workspace root) */
  projectRoot: string;
  /** Project directory (same as projectRoot) */
  projectDirectory: string;
  /** Absolute path to source Astro project */
  sourcePath: string;
  /** Original project name from source directory */
  sourceProjectName: string;
  /** Parsed tags array */
  parsedTags: string[];
  /** Whether to skip formatting */
  skipFormat: boolean;
  /** Whether to skip installing dependencies */
  skipInstall: boolean;
  /** TypeScript import path alias */
  importPath?: string;
}

/**
 * Normalizes and processes import generator options.
 *
 * Transforms user-provided options into a consistent, fully-resolved format
 * that the generator can work with. Applies intelligent defaults and performs
 * necessary transformations.
 *
 * ## Processing steps
 * 1. Extracts project name from source directory if not explicitly provided
 * 2. Converts project name to kebab-case for consistency (MyApp → my-app)
 * 3. Sets default directory to apps/{projectName} if not specified
 * 4. Converts source to absolute path (handles relative paths correctly)
 * 5. Parses tags from comma-separated string to array
 * 6. Generates importPath from workspace name if not provided (e.g., @workspace/project-name)
 * 7. Sets default values for boolean flags (skipFormat, skipInstall)
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Raw generator options from schema (user input)
 * @returns Fully normalized options with all defaults applied and paths resolved
 *
 * @example Basic usage with minimal options
 * ```typescript
 * const options = {
 *   source: '/path/to/astro-app',
 * };
 * const normalized = normalizeOptions(tree, options);
 * // Result:
 * // {
 * //   projectName: 'astro-app',
 * //   projectRoot: 'apps/astro-app',
 * //   projectDirectory: 'apps/astro-app',
 * //   sourcePath: '/path/to/astro-app',
 * //   sourceProjectName: 'astro-app',
 * //   parsedTags: [],
 * //   skipFormat: false,
 * //   skipInstall: false,
 * //   importPath: '@workspace/astro-app'
 * // }
 * ```
 *
 * @example With tags and custom name
 * ```typescript
 * const options = {
 *   source: '../my-astro-blog',
 *   name: 'CompanyBlog',
 *   tags: 'astro, web, public-facing',
 *   directory: 'apps/websites'
 * };
 * const normalized = normalizeOptions(tree, options);
 * // Result:
 * // {
 * //   projectName: 'company-blog',  // kebab-case conversion
 * //   projectRoot: 'apps/websites',
 * //   parsedTags: ['astro', 'web', 'public-facing'],  // trimmed and split
 * //   importPath: '@workspace/company-blog',
 * //   ...
 * // }
 * ```
 *
 * @example With custom import path
 * ```typescript
 * const options = {
 *   source: '/projects/shared-ui',
 *   name: 'shared-ui',
 *   importPath: '@mycompany/shared-ui',
 *   directory: 'libs/shared'
 * };
 * const normalized = normalizeOptions(tree, options);
 * // Result: importPath is preserved as '@mycompany/shared-ui'
 * ```
 *
 * @see {@link NormalizedImportOptions} for the complete return type
 * @see {@link ImportGeneratorSchema} for input schema
 */
export function normalizeOptions(
  tree: Tree,
  options: ImportGeneratorSchema
): NormalizedImportOptions {
  // Normalize source path to absolute
  const sourcePath = resolve(options.source);

  // Extract source project name from source path
  const sourceBasename = basename(sourcePath.replace(/\/+$/, '')); // Remove trailing slashes
  const sourceProjectName = sourceBasename;

  // Determine project name: use provided name or extract from source
  const rawProjectName = options.name || sourceProjectName;
  const projectName = names(rawProjectName).fileName; // Convert to kebab-case

  // Determine project directory
  const rawDirectory = options.directory || `apps/${projectName}`;
  // Normalize the directory path: remove leading ./, trailing /, and multiple //
  const projectDirectory = normalizePath(rawDirectory)
    .replace(/^\.\//, '') // Remove leading ./
    .replace(/\/+/g, '/') // Replace multiple / with single /
    .replace(/\/$/, ''); // Remove trailing /
  const projectRoot = projectDirectory;

  // Parse tags
  const parsedTags = options.tags
    ? options.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];

  // Determine import path
  let importPath = options.importPath;
  if (!importPath) {
    // Generate from workspace name
    const workspaceName = getWorkspaceName(tree);
    if (workspaceName) {
      importPath = `@${workspaceName}/${projectName}`;
    }
  }

  // Set boolean defaults
  const skipFormat = options.skipFormat ?? false;
  const skipInstall = options.skipInstall ?? false;

  return {
    projectName,
    projectRoot,
    projectDirectory,
    sourcePath,
    sourceProjectName,
    parsedTags,
    skipFormat,
    skipInstall,
    importPath,
  };
}

/**
 * Gets the workspace name from nx.json or package.json.
 *
 * @param tree - The file system tree
 * @returns Workspace name or undefined
 */
function getWorkspaceName(tree: Tree): string | undefined {
  // Try nx.json first
  try {
    const nxJson = readJson(tree, 'nx.json');
    if (nxJson.npmScope) {
      return nxJson.npmScope;
    }
  } catch {
    // nx.json doesn't exist or doesn't have npmScope
  }

  // Try package.json
  try {
    const packageJson = readJson(tree, 'package.json');
    if (packageJson.name) {
      // Remove @ prefix and scope if present
      const name = packageJson.name.replace(/^@/, '').split('/')[0];
      return name;
    }
  } catch {
    // package.json doesn't exist
  }

  return undefined;
}
