import { Tree, readProjectConfiguration } from '@nx/devkit';

/**
 * Valid project name pattern.
 * Must start with a letter and contain only letters, numbers, and hyphens.
 */
const PROJECT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * Validates that the project name is valid and doesn't already exist in the workspace.
 *
 * Ensures the project name follows Nx naming conventions and doesn't conflict with
 * existing projects. This prevents duplicate projects and ensures consistent naming
 * across the workspace.
 *
 * ## Validation checks
 * 1. The name matches the valid pattern (starts with letter, contains only letters/numbers/hyphens)
 * 2. The name doesn't conflict with an existing project in the workspace
 *
 * @param tree - The Nx virtual file system tree
 * @param projectName - The proposed project name to validate
 * @throws {Error} If the project name is invalid or already exists with detailed error message
 *
 * @example Valid project names
 * ```typescript
 * // These will pass validation (assuming no conflicts)
 * validateProjectName(tree, 'my-astro-app');
 * validateProjectName(tree, 'MyAstroApp');
 * validateProjectName(tree, 'app123');
 * validateProjectName(tree, 'marketing-site-2024');
 * ```
 *
 * @example Invalid project names
 * ```typescript
 * validateProjectName(tree, '123-app');
 * // Throws: Invalid project name: "123-app"
 * //         Project names must start with a letter...
 *
 * validateProjectName(tree, 'my_app');
 * // Throws: Invalid project name: "my_app"
 * //         Project names must start with a letter...
 *
 * validateProjectName(tree, 'my app');
 * // Throws: Invalid project name: "my app"
 * //         Project names must start with a letter...
 * ```
 *
 * @example Duplicate project name
 * ```typescript
 * validateProjectName(tree, 'existing-app');
 * // Throws: Project "existing-app" already exists in the workspace.
 * //         Please choose a different name or remove the existing project first.
 * ```
 *
 * @see {@link PROJECT_NAME_PATTERN} for the exact validation regex
 */
export function validateProjectName(tree: Tree, projectName: string): void {
  // Check if name matches valid pattern
  if (!PROJECT_NAME_PATTERN.test(projectName)) {
    throw new Error(
      `Invalid project name: "${projectName}"\n` +
        `Project names must start with a letter and contain only letters, numbers, and hyphens.\n` +
        `Examples: my-app, MyApp, app123, my-astro-app`
    );
  }

  // Check if project already exists
  try {
    readProjectConfiguration(tree, projectName);
    // If we get here, the project exists
    throw new Error(
      `Project "${projectName}" already exists in the workspace.\n` +
        `Please choose a different name or remove the existing project first.`
    );
  } catch (error) {
    // If the error is about the project already existing, re-throw it
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    // Otherwise, the project doesn't exist (which is what we want)
    // readProjectConfiguration throws an error when project doesn't exist
  }

  // Validation passed
}
