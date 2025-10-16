import { existsSync, lstatSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Supported Astro configuration file names.
 */
const ASTRO_CONFIG_FILES = [
  'astro.config.mjs',
  'astro.config.js',
  'astro.config.ts',
  'astro.config.cjs',
  'astro.config.mts',
  'astro.config.cts',
] as const;

/**
 * Validates that the source path points to a valid Astro project.
 *
 * Performs comprehensive validation to ensure the source is a legitimate Astro project
 * before attempting to import it. This prevents copying non-Astro projects or corrupted
 * directories into the workspace.
 *
 * ## Validation checks
 * 1. The source path exists and is a directory (not a file or symlink)
 * 2. An Astro configuration file exists (astro.config.{mjs,js,ts,cjs,mts,cts})
 * 3. A package.json file exists and is valid JSON
 * 4. The package.json contains 'astro' in dependencies or devDependencies
 *
 * @param sourcePath - Path to the Astro project (can be relative or absolute)
 * @throws {Error} If the source is not a valid Astro project with detailed error message
 *
 * @example Valid Astro project
 * ```typescript
 * // These will pass validation
 * validateSource('/absolute/path/to/astro-project');
 * validateSource('./relative/path/to/my-astro-app');
 * validateSource('../sibling-directory/astro-site');
 * ```
 *
 * @example Error: Path doesn't exist
 * ```typescript
 * validateSource('/nonexistent/path');
 * // Throws: Source path does not exist: /nonexistent/path
 * //         Resolved to: /nonexistent/path
 * //         Please verify the path and try again.
 * ```
 *
 * @example Error: Not a directory
 * ```typescript
 * validateSource('./package.json');
 * // Throws: Source path is not a directory: ./package.json
 * //         The import generator can only import from directories containing Astro projects.
 * ```
 *
 * @example Error: Missing Astro config
 * ```typescript
 * validateSource('./regular-node-project');
 * // Throws: No Astro configuration file found in: ./regular-node-project
 * //         Expected one of: astro.config.mjs, astro.config.js, ...
 * //         This does not appear to be an Astro project.
 * ```
 *
 * @example Error: Missing Astro dependency
 * ```typescript
 * validateSource('./has-config-but-no-astro-dependency');
 * // Throws: Astro not found in dependencies in: ./has-config-but-no-astro-dependency
 * //         Expected 'astro' to be listed in dependencies or devDependencies in package.json.
 * //         This does not appear to be an Astro project.
 * ```
 *
 * @see {@link ASTRO_CONFIG_FILES} for supported configuration file names
 */
export function validateSource(sourcePath: string): void {
  // Normalize to absolute path
  const absolutePath = resolve(sourcePath);

  // Check if path exists
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Source path does not exist: ${sourcePath}\n` +
        `Resolved to: ${absolutePath}\n` +
        `Please verify the path and try again.`
    );
  }

  // Check if path is a directory
  const stats = lstatSync(absolutePath);
  if (!stats.isDirectory()) {
    throw new Error(
      `Source path is not a directory: ${sourcePath}\n` +
        `The import generator can only import from directories containing Astro projects.`
    );
  }

  // Check for Astro config file
  const hasAstroConfig = ASTRO_CONFIG_FILES.some((configFile) => {
    const configPath = resolve(absolutePath, configFile);
    return existsSync(configPath);
  });

  if (!hasAstroConfig) {
    throw new Error(
      `No Astro configuration file found in: ${sourcePath}\n` +
        `Expected one of: ${ASTRO_CONFIG_FILES.join(', ')}\n` +
        `This does not appear to be an Astro project.`
    );
  }

  // Check for package.json
  const packageJsonPath = resolve(absolutePath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error(
      `package.json not found in: ${sourcePath}\n` +
        `Expected location: ${packageJsonPath}\n` +
        `An Astro project must have a package.json file.`
    );
  }

  // Parse and validate package.json
  let packageJson: any;
  try {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  } catch (error) {
    throw new Error(
      `Invalid package.json in: ${sourcePath}\n` +
        `The package.json file could not be parsed as valid JSON.\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Check for Astro dependency
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const hasAstroDependency =
    'astro' in dependencies || 'astro' in devDependencies;

  if (!hasAstroDependency) {
    throw new Error(
      `Astro not found in dependencies in: ${sourcePath}\n` +
        `Expected 'astro' to be listed in dependencies or devDependencies in package.json.\n` +
        `This does not appear to be an Astro project.`
    );
  }

  // Validation passed
}
