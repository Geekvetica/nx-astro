import { detectPackageManager } from './dependency-checker';

/**
 * Returns the command prefix for running node_modules binaries based on package manager
 * @param packageManager - Package manager type ('bun', 'pnpm', 'yarn', 'npm')
 * @returns Array of command prefix parts
 *
 * @example
 * getCommandPrefix('bun')    // ['bunx']
 * getCommandPrefix('pnpm')   // ['pnpm', 'exec']
 * getCommandPrefix('yarn')   // ['yarn']
 * getCommandPrefix('npm')    // ['npx']
 */
export function getCommandPrefix(
  packageManager: 'bun' | 'pnpm' | 'yarn' | 'npm',
): string[] {
  switch (packageManager) {
    case 'bun':
      return ['bunx'];
    case 'pnpm':
      return ['pnpm', 'exec'];
    case 'yarn':
      return ['yarn'];
    case 'npm':
      return ['npx'];
  }
}

/**
 * Builds an Astro command with the appropriate package manager prefix
 * @param subcommand - Astro subcommand (e.g., 'check', 'build', 'dev', 'sync')
 * @param args - Additional arguments for the command
 * @param rootDir - Root directory of the workspace (for package manager detection)
 * @returns Object containing the command executable and arguments array
 *
 * @example
 * buildAstroCommand('check', ['--root', '/path'], '/project')
 * // For Bun: { command: 'bunx', args: ['astro', 'check', '--root', '/path'] }
 * // For pnpm: { command: 'pnpm', args: ['exec', 'astro', 'check', '--root', '/path'] }
 */
export function buildAstroCommand(
  subcommand: string,
  args: string[],
  rootDir: string,
): { command: string; args: string[] } {
  const packageManager = detectPackageManager(rootDir);
  const prefix = getCommandPrefix(packageManager);
  const fullArgs = [...prefix.slice(1), 'astro', subcommand, ...args];

  return {
    command: prefix[0],
    args: fullArgs,
  };
}

/**
 * Builds an Astro command string with the appropriate package manager prefix
 * @param subcommand - Astro subcommand (e.g., 'check', 'build', 'dev', 'sync')
 * @param args - Additional arguments for the command
 * @param rootDir - Root directory of the workspace (for package manager detection)
 * @returns Complete command string ready for execution
 *
 * @example
 * buildAstroCommandString('check', ['--root', '/path'], '/project')
 * // For Bun: 'bunx astro check --root /path'
 * // For pnpm: 'pnpm exec astro check --root /path'
 */
export function buildAstroCommandString(
  subcommand: string,
  args: string[],
  rootDir: string,
): string {
  const { command, args: cmdArgs } = buildAstroCommand(
    subcommand,
    args,
    rootDir,
  );
  return [command, ...cmdArgs].join(' ');
}

/**
 * Builds a command with the appropriate package manager prefix for any binary
 * @param binary - Binary to execute (e.g., 'vitest', 'eslint', 'prettier')
 * @param args - Arguments for the command
 * @param rootDir - Root directory of the workspace (for package manager detection)
 * @returns Object containing the command executable and arguments array
 *
 * @example
 * buildCommand('vitest', ['run', '--coverage'], '/project')
 * // For Bun: { command: 'bunx', args: ['vitest', 'run', '--coverage'] }
 * // For pnpm: { command: 'pnpm', args: ['exec', 'vitest', 'run', '--coverage'] }
 */
export function buildCommand(
  binary: string,
  args: string[],
  rootDir: string,
): { command: string; args: string[] } {
  const packageManager = detectPackageManager(rootDir);
  const prefix = getCommandPrefix(packageManager);
  const fullArgs = [...prefix.slice(1), binary, ...args];

  return {
    command: prefix[0],
    args: fullArgs,
  };
}

/**
 * Builds a command string with the appropriate package manager prefix for any binary
 * @param binary - Binary to execute (e.g., 'vitest', 'eslint', 'prettier')
 * @param args - Arguments for the command
 * @param rootDir - Root directory of the workspace (for package manager detection)
 * @returns Complete command string ready for execution
 *
 * @example
 * buildCommandString('vitest', ['run', '--coverage'], '/project')
 * // For Bun: 'bunx vitest run --coverage'
 * // For pnpm: 'pnpm exec vitest run --coverage'
 */
export function buildCommandString(
  binary: string,
  args: string[],
  rootDir: string,
): string {
  const { command, args: cmdArgs } = buildCommand(binary, args, rootDir);
  return [command, ...cmdArgs].join(' ');
}
