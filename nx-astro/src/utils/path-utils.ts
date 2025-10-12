/**
 * Normalizes a project root path by removing leading and trailing slashes.
 * @param projectRoot - The project root path to normalize
 * @returns The normalized project root path
 */
export function normalizeProjectRoot(projectRoot: string): string {
  return projectRoot.replace(/^\/+|\/+$/g, '');
}

/**
 * Extracts the project name from an Astro config file path.
 * @param configPath - Path to the astro.config file
 * @returns The project name (directory containing the config file)
 */
export function getProjectNameFromPath(configPath: string): string {
  const parts = configPath.split('/');
  // Remove the config filename
  parts.pop();
  // Return the last directory name, or empty string if none
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/**
 * Joins path fragments with forward slashes, removing duplicate slashes.
 * @param fragments - Path fragments to join
 * @returns The joined path
 */
export function joinPathFragments(...fragments: string[]): string {
  return fragments
    .filter((fragment) => fragment !== '')
    .map((fragment) => fragment.replace(/^\/+|\/+$/g, ''))
    .filter((fragment) => fragment !== '')
    .join('/');
}

/**
 * Resolves the output path for a project based on a pattern.
 * Supports {projectRoot} and {projectName} placeholders.
 * @param projectRoot - The project root directory
 * @param pattern - The output path pattern (defaults to "dist/{projectRoot}")
 * @param projectName - Optional project name for {projectName} placeholder
 * @returns The resolved output path
 */
export function resolveOutputPath(
  projectRoot: string,
  pattern?: string,
  projectName?: string
): string {
  const outputPattern = pattern || 'dist/{projectRoot}';

  const resolved = outputPattern
    .replace(/{projectRoot}/g, projectRoot)
    .replace(/{projectName}/g, projectName || '');

  // Normalize the path
  return normalizeProjectRoot(resolved);
}
