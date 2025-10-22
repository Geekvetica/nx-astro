import { ExecutorContext, logger } from '@nx/devkit';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { CheckExecutorSchema } from './schema';
import {
  isPackageInstalled,
  detectPackageManager,
  getInstallCommand,
} from '../../utils/dependency-checker';
import {
  buildAstroCommand,
  buildAstroCommandString,
} from '../../utils/command-builder';

const execAsync = promisify(exec);

export interface CheckExecutorOutput {
  success: boolean;
  error?: string;
}

/**
 * Validates that astro package is installed in the workspace.
 *
 * This function checks if the astro package is available. If not installed,
 * it returns an error with installation instructions.
 *
 * @param context - Nx executor context containing workspace root and configuration
 * @returns Error result if validation fails, undefined if validation passes
 *
 * @example
 * ```typescript
 * const error = validateAstroDependency(context);
 * if (error) {
 *   return error; // Package not installed, user must install manually
 * }
 * ```
 */
function validateAstroDependency(
  context: ExecutorContext,
): CheckExecutorOutput | undefined {
  const isAstroInstalled = isPackageInstalled('astro', context.root);

  if (isAstroInstalled) {
    return undefined; // Validation passed
  }

  // Package is not installed
  const packageManager = detectPackageManager(context.root);
  const installCommand = getInstallCommand('astro', packageManager, true);

  // Show installation instructions
  const errorMessage = [
    'The astro package is required to run type checking.',
    '',
    'Install it by running:',
    `  ${installCommand}`,
    '',
    'Alternatively, add it to your package.json devDependencies and run install:',
    '  "astro": "latest"',
  ].join('\n');

  logger.error(errorMessage);

  return {
    success: false,
    error: `astro package is required. Run: ${installCommand}`,
  };
}

/**
 * Validates that @astrojs/check package is installed in the workspace.
 *
 * This function checks if the @astrojs/check package is available. If not installed:
 * - When autoInstall is true: Automatically installs the package using the detected package manager
 * - When autoInstall is false: Returns an error with installation instructions
 *
 * @param context - Nx executor context containing workspace root and configuration
 * @param options - Executor options containing the autoInstall flag
 * @returns Error result if validation fails or auto-install fails, undefined if validation passes
 *
 * @example
 * ```typescript
 * // Check without auto-install
 * const error = await validateCheckDependency(context, { autoInstall: false });
 * if (error) {
 *   return error; // Package not installed, user must install manually
 * }
 *
 * // Check with auto-install enabled
 * const error = await validateCheckDependency(context, { autoInstall: true });
 * if (error) {
 *   return error; // Auto-install failed
 * }
 * // Package is now installed and ready to use
 * ```
 */
async function validateCheckDependency(
  context: ExecutorContext,
  options: CheckExecutorSchema,
): Promise<CheckExecutorOutput | undefined> {
  const isCheckInstalled = isPackageInstalled('@astrojs/check', context.root);

  if (isCheckInstalled) {
    return undefined; // Validation passed
  }

  // Package is not installed
  const packageManager = detectPackageManager(context.root);
  const installCommand = getInstallCommand(
    '@astrojs/check',
    packageManager,
    true,
  );

  // Auto-install if enabled
  if (options.autoInstall) {
    logger.info('Installing @astrojs/check...');
    try {
      await execAsync(installCommand, {
        cwd: context.root,
        env: process.env,
      });
      logger.info('@astrojs/check installed successfully');
      return undefined; // Installation successful, validation passed
    } catch (error) {
      const installError = error as { message?: string; stderr?: string };
      const errorMessage = installError.message || String(error);
      logger.error('Failed to install @astrojs/check automatically');
      if (installError.stderr) {
        logger.error(installError.stderr);
      }
      return {
        success: false,
        error: `Auto-install failed: ${errorMessage}`,
      };
    }
  }

  // Auto-install disabled, show installation instructions
  const errorMessage = [
    'The @astrojs/check package is required to run type checking.',
    '',
    'Install it by running:',
    `  ${installCommand}`,
    '',
    'Alternatively, add it to your package.json devDependencies and run install:',
    '  "@astrojs/check": "latest"',
  ].join('\n');

  logger.error(errorMessage);

  return {
    success: false,
    error: `@astrojs/check is not installed. Run: ${installCommand}`,
  };
}

/**
 * Executes the Astro type checking command for a project.
 *
 * This executor runs the `astro check` command to perform TypeScript type checking
 * on an Astro project. It supports both one-time checks and watch mode for continuous
 * type checking during development.
 *
 * The executor automatically validates that @astrojs/check is installed and can
 * optionally auto-install it if the autoInstall option is enabled.
 *
 * @param options - Executor options including watch mode, tsconfig path, and autoInstall
 * @param context - Nx executor context containing workspace and project information
 * @returns Result object indicating success or failure with optional error message
 *
 * @example
 * ```typescript
 * // One-time type check
 * await checkExecutor({ autoInstall: true }, context);
 *
 * // Watch mode with custom tsconfig
 * await checkExecutor({
 *   watch: true,
 *   tsconfig: './tsconfig.custom.json',
 *   autoInstall: true
 * }, context);
 * ```
 */
export default async function checkExecutor(
  options: CheckExecutorSchema,
  context: ExecutorContext,
): Promise<CheckExecutorOutput> {
  try {
    // Get project configuration
    const projectName = context.projectName;
    if (!projectName) {
      throw new Error('Project name is not defined in executor context');
    }

    const projectConfig =
      context.projectsConfigurations?.projects?.[projectName];
    if (!projectConfig) {
      throw new Error(`Project configuration not found for ${projectName}`);
    }

    // Determine project root
    const projectRoot =
      options.root || path.join(context.root, projectConfig.root);

    // Validate astro package is installed
    const astroValidationError = validateAstroDependency(context);
    if (astroValidationError) {
      return astroValidationError;
    }

    // Validate @astrojs/check is installed (with optional auto-install)
    const checkValidationError = await validateCheckDependency(
      context,
      options,
    );
    if (checkValidationError) {
      return checkValidationError;
    }

    // Build the astro check command arguments
    const args: string[] = ['check'];

    // Add root flag
    args.push('--root', projectRoot);

    // Add optional flags
    if (options.watch) {
      args.push('--watch');
    }

    if (options.tsconfig) {
      args.push('--tsconfig', options.tsconfig);
    }

    if (options.config) {
      args.push('--config', options.config);
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    // Add additional arguments
    if (options.additionalArgs && options.additionalArgs.length > 0) {
      args.push(...options.additionalArgs);
    }

    // Watch mode: use spawn (keep running)
    // Non-watch mode: use exec (exit after completion)
    if (options.watch) {
      return await runWatchMode(args, context);
    } else {
      return await runCheckMode(args, context);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Check failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Run check in non-watch mode (exits after completion)
 */
async function runCheckMode(
  args: string[],
  context: ExecutorContext,
): Promise<CheckExecutorOutput> {
  // args array is ['check', '--root', projectRoot, ...other options]
  // We need to extract 'check' as the subcommand and pass the rest as args
  const subcommand = 'check';
  const commandArgs = args.slice(1); // Remove 'check' from the beginning

  const commandString = buildAstroCommandString(
    subcommand,
    commandArgs,
    context.root,
  );

  logger.info(`Executing: ${commandString}`);

  try {
    // Execute the check command
    const { stdout, stderr } = await execAsync(commandString, {
      cwd: context.root,
      env: process.env,
    });

    if (stdout) {
      logger.info(stdout);
    }

    if (stderr) {
      logger.warn(stderr);
    }

    logger.info('Type check completed successfully');

    return { success: true };
  } catch (error: unknown) {
    // Check failed - this is expected when there are type errors
    const execError = error as {
      message?: string;
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    const errorMessage = execError.message || String(error);

    // Log the output (which contains the diagnostic errors)
    if (execError.stdout) {
      logger.error(execError.stdout);
    }

    if (execError.stderr) {
      logger.error(execError.stderr);
    }

    logger.error(`Type check failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Run check in watch mode (keeps running)
 */
async function runWatchMode(
  args: string[],
  context: ExecutorContext,
): Promise<CheckExecutorOutput> {
  return new Promise<CheckExecutorOutput>((resolve) => {
    // args array is ['check', '--root', projectRoot, ...other options]
    // We need to extract 'check' as the subcommand and pass the rest as args
    const subcommand = 'check';
    const commandArgs = args.slice(1); // Remove 'check' from the beginning

    const { command, args: fullArgs } = buildAstroCommand(
      subcommand,
      commandArgs,
      context.root,
    );

    logger.info(`Executing: ${command} ${fullArgs.join(' ')}`);

    // Spawn the check process in watch mode
    const childProcess: ChildProcess = spawn(command, fullArgs, {
      cwd: context.root,
      stdio: 'inherit',
      env: process.env,
    });

    // Handle process events
    childProcess.on('error', (error) => {
      logger.error(`Check process failed: ${error.message}`);
      resolve({
        success: false,
        error: error.message,
      });
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Check process stopped');
        resolve({ success: true });
      } else {
        logger.error(`Check process exited with code ${code}`);
        resolve({
          success: false,
          error: `Process exited with code ${code}`,
        });
      }
    });

    // Handle termination signals
    const killProcess = (signal: NodeJS.Signals) => {
      logger.info(`Received ${signal}, stopping check process...`);
      if (childProcess && !childProcess.killed) {
        childProcess.kill(signal);
      }
    };

    process.on('SIGINT', () => killProcess('SIGINT'));
    process.on('SIGTERM', () => killProcess('SIGTERM'));

    logger.info('Check is running in watch mode. Press Ctrl+C to stop.');
  });
}
