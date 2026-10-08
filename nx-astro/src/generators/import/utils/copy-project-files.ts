import { Tree, joinPathFragments } from '@nx/devkit';
import {
  closeSync,
  constants,
  Dirent,
  existsSync,
  fstatSync,
  openSync,
  readdirSync,
  readFileSync,
} from 'fs';
import { join, relative } from 'path';
import { shouldIncludeFile } from './file-filter';

/**
 * Recursively copies files from a source directory to a target location in the workspace.
 *
 * Intelligently copies all relevant project files while excluding generated content,
 * dependencies, and environment-specific files. Preserves directory structure and
 * handles file reading errors gracefully.
 *
 * ## What it copies
 * - Source code (src/, public/, etc.)
 * - Configuration files (astro.config.*, tsconfig.json, etc.)
 * - Documentation (README.md, docs/, etc.)
 * - Package metadata (package.json)
 * - Example environment files (.env.example, .env.template)
 *
 * ## What it excludes
 * - Dependencies (node_modules/)
 * - Build outputs (dist/, build/, .astro/)
 * - Lock files (package-lock.json, yarn.lock, pnpm-lock.yaml)
 * - Version control (.git/)
 * - IDE directories (.vscode/, .idea/)
 * - OS files (.DS_Store, Thumbs.db)
 * - Actual environment files (.env, .env.local)
 *
 * @param sourcePath - Absolute path to source directory on file system
 * @param targetPath - Target path in workspace (relative to workspace root)
 * @param tree - Nx virtual file system tree (changes are staged until commit)
 * @throws {Error} If source path doesn't exist
 *
 * @example Basic usage
 * ```typescript
 * // Copy entire Astro project to workspace
 * copyProjectFiles('/Users/dev/my-astro-app', 'apps/my-app', tree);
 * // Result: All files copied to workspace at apps/my-app/
 * ```
 *
 * @example With custom target path
 * ```typescript
 * // Copy to nested directory structure
 * copyProjectFiles(
 *   '/projects/astro-blog',
 *   'apps/websites/blog',
 *   tree
 * );
 * // Result: Files copied to apps/websites/blog/
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   copyProjectFiles('/nonexistent/path', 'apps/my-app', tree);
 * } catch (error) {
 *   console.error('Failed to copy files:', error.message);
 *   // Error: Source path does not exist: /nonexistent/path
 *   //        Please verify the path is correct.
 * }
 * ```
 *
 * @example What gets copied vs excluded
 * ```typescript
 * // Directory structure:
 * // /source/
 * //   src/               ✓ Copied
 * //   public/            ✓ Copied
 * //   astro.config.mjs   ✓ Copied
 * //   package.json       ✓ Copied
 * //   .env.example       ✓ Copied
 * //   node_modules/      ✗ Excluded
 * //   dist/              ✗ Excluded
 * //   .astro/            ✗ Excluded
 * //   package-lock.json  ✗ Excluded
 * //   .env               ✗ Excluded
 * //   .git/              ✗ Excluded
 *
 * copyProjectFiles('/source', 'apps/target', tree);
 * // Only the checked (✓) items are copied
 * ```
 *
 * @see {@link shouldIncludeFile} for the complete filtering logic
 */
export function copyProjectFiles(
  sourcePath: string,
  targetPath: string,
  tree: Tree,
): void {
  // Validate source exists
  if (!existsSync(sourcePath)) {
    throw new Error(
      `Source path does not exist: ${sourcePath}\n` +
        `Please verify the path is correct.`,
    );
  }

  // Recursively copy files
  copyDirectory(sourcePath, targetPath, sourcePath, tree);
}

/**
 * Internal recursive function to copy directory contents.
 *
 * @param currentPath - Current directory being processed (absolute)
 * @param targetBasePath - Base target path in workspace
 * @param sourceBasePath - Base source path (for calculating relative paths)
 * @param tree - Nx virtual file system
 */
function copyDirectory(
  currentPath: string,
  targetBasePath: string,
  sourceBasePath: string,
  tree: Tree,
): void {
  // Read directory contents with their types, so entries are classified
  // without following symlinks and without a separate stat call
  let entries: Dirent[];
  try {
    entries = readdirSync(currentPath, { withFileTypes: true });
  } catch (error) {
    // If we can't read the directory, skip it
    return;
  }

  // Process each entry
  for (const entry of entries) {
    const fullPath = join(currentPath, entry.name);
    const relativePath = relative(sourceBasePath, fullPath);

    // Check if this file/directory should be included
    if (!shouldIncludeFile(relativePath)) {
      continue; // Skip excluded files/directories
    }

    if (entry.isSymbolicLink()) {
      // Never follow symlinks: they may point outside the source project
      console.warn(`Warning: Skipping symbolic link ${relativePath}`);
    } else if (entry.isDirectory()) {
      // Recursively copy directory. Node cannot open a directory without
      // following a symlink, so a directory swapped for a symlink between
      // listing and recursion is not detected; this needs concurrent write
      // access to the source project.
      copyDirectory(fullPath, targetBasePath, sourceBasePath, tree);
    } else if (entry.isFile()) {
      // Copy file
      const targetFilePath = joinPathFragments(targetBasePath, relativePath);

      try {
        const content = readRegularFile(fullPath);
        tree.write(targetFilePath, content);
      } catch (error) {
        // Log warning but continue (don't fail entire import for one file)
        console.warn(
          `Warning: Could not copy file ${relativePath}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    // Skip other special files (sockets, FIFOs, devices)
  }
}

/**
 * Reads a regular file without following a symlink at its path.
 *
 * Opening with O_NOFOLLOW and checking the opened descriptor closes the
 * window in which the file could be replaced by a symlink after it was
 * listed. O_NONBLOCK keeps a file swapped for a FIFO from blocking the open;
 * the regular-file check then rejects it. Both flags are unavailable on
 * Windows, where 0 leaves the flags as-is.
 *
 * @param filePath - Absolute path to the file
 * @returns File content
 * @throws If the path is a symlink (ELOOP) or not a regular file
 */
function readRegularFile(filePath: string): Buffer {
  const fd = openSync(
    filePath,
    constants.O_RDONLY |
      (constants.O_NOFOLLOW ?? 0) |
      (constants.O_NONBLOCK ?? 0),
  );
  try {
    if (!fstatSync(fd).isFile()) {
      throw new Error('not a regular file');
    }
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}
