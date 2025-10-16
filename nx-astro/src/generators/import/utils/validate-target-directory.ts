import { Tree, normalizePath } from '@nx/devkit';

/**
 * Validates that the target directory doesn't already exist in the workspace.
 *
 * Prevents overwriting existing projects by ensuring the target directory is empty
 * or doesn't exist. This is a safety check to avoid accidental data loss.
 *
 * ## Validation checks
 * 1. The target directory doesn't exist as a file
 * 2. The target directory doesn't contain any files
 *
 * @param tree - The Nx virtual file system tree
 * @param targetDirectory - The target directory path (relative to workspace root)
 * @throws {Error} If the target directory already exists with files
 *
 * @example Valid target directories (will pass validation)
 * ```typescript
 * // These will pass if the directories don't exist
 * validateTargetDirectory(tree, 'apps/my-astro-app');
 * validateTargetDirectory(tree, 'packages/websites/my-site');
 * validateTargetDirectory(tree, 'libs/shared/components');
 * ```
 *
 * @example Error: Directory already exists
 * ```typescript
 * validateTargetDirectory(tree, 'apps/existing-app');
 * // Throws: Target directory already exists: apps/existing-app
 * //         The directory "apps/existing-app" already contains files.
 * //         Please choose a different directory or remove the existing one first.
 * ```
 *
 * @example Common usage pattern
 * ```typescript
 * // Typical import flow
 * const targetDir = 'apps/imported-app';
 * try {
 *   validateTargetDirectory(tree, targetDir);
 *   // Safe to proceed with import
 *   copyProjectFiles(sourcePath, targetDir, tree);
 * } catch (error) {
 *   // Handle error: directory already exists
 *   console.error(error.message);
 * }
 * ```
 */
export function validateTargetDirectory(
  tree: Tree,
  targetDirectory: string
): void {
  // Normalize the path to handle trailing slashes, multiple slashes, etc.
  const normalizedPath = normalizePath(targetDirectory);

  // Check if directory exists by checking if it has any children
  // A directory exists if we can list its children
  if (tree.exists(normalizedPath)) {
    throw new Error(
      `Target directory already exists: ${targetDirectory}\n` +
        `The directory "${normalizedPath}" already contains files.\n` +
        `Please choose a different directory or remove the existing one first.`
    );
  }

  // Additional check: see if there are any files under this path
  try {
    const children = tree.children(normalizedPath);
    if (children.length > 0) {
      throw new Error(
        `Target directory already exists: ${targetDirectory}\n` +
          `The directory "${normalizedPath}" already contains files.\n` +
          `Please choose a different directory or remove the existing one first.`
      );
    }
  } catch (error) {
    // If we can't list children, the directory doesn't exist (which is good)
    // Ignore the error
  }

  // Validation passed
}
