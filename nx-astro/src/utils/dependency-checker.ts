import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Checks if a package is installed in node_modules
 * @param packageName - Name of the npm package (e.g., '@astrojs/check')
 * @param rootDir - Root directory of the workspace
 * @returns true if package exists in node_modules, false otherwise
 */
export function isPackageInstalled(
  packageName: string,
  rootDir: string,
): boolean {
  const packagePath = join(rootDir, 'node_modules', packageName);
  return existsSync(packagePath);
}

/**
 * Detects the package manager used in the workspace
 * Priority: package.json packageManager field > lock files
 * @param rootDir - Root directory of the workspace
 * @returns Package manager name: 'bun', 'pnpm', 'yarn', or 'npm'
 */
export function detectPackageManager(
  rootDir: string,
): 'bun' | 'pnpm' | 'yarn' | 'npm' {
  // First check package.json for packageManager field
  const packageJsonPath = join(rootDir, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.packageManager) {
        // Extract package manager name before '@' (e.g., "bun@1.0.0" → "bun")
        const pmName = packageJson.packageManager.split('@')[0];
        if (
          pmName === 'bun' ||
          pmName === 'pnpm' ||
          pmName === 'yarn' ||
          pmName === 'npm'
        ) {
          return pmName;
        }
      }
    } catch {
      // If package.json parsing fails, fall through to lock file detection
    }
  }

  // Fallback to lock file detection
  if (existsSync(join(rootDir, 'bun.lockb'))) {
    return 'bun';
  }
  if (existsSync(join(rootDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(rootDir, 'yarn.lock'))) {
    return 'yarn';
  }

  return 'npm';
}

/**
 * Generates the installation command for a package
 * @param packageName - Name of the npm package to install
 * @param packageManager - Package manager to use
 * @param dev - Whether to install as devDependency (default: true)
 * @returns Installation command string (e.g., 'bun add -d @astrojs/check')
 */
export function getInstallCommand(
  packageName: string,
  packageManager: string,
  dev = true,
): string {
  switch (packageManager) {
    case 'bun':
      return dev ? `bun add -d ${packageName}` : `bun add ${packageName}`;
    case 'pnpm':
      return dev ? `pnpm add -D ${packageName}` : `pnpm add ${packageName}`;
    case 'yarn':
      return dev ? `yarn add -D ${packageName}` : `yarn add ${packageName}`;
    case 'npm':
      return dev
        ? `npm install --save-dev ${packageName}`
        : `npm install ${packageName}`;
    default:
      // Default to npm if unknown package manager
      return dev
        ? `npm install --save-dev ${packageName}`
        : `npm install ${packageName}`;
  }
}
