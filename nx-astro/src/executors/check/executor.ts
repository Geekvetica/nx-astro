import { ExecutorContext, logger } from '@nx/devkit';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { CheckExecutorSchema } from './schema';

const execAsync = promisify(exec);

export interface CheckExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function checkExecutor(
  options: CheckExecutorSchema,
  context: ExecutorContext
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
  context: ExecutorContext
): Promise<CheckExecutorOutput> {
  const command = ['astro', ...args].join(' ');

  logger.info(`Executing: ${command}`);

  try {
    // Execute the check command
    const { stdout, stderr } = await execAsync(command, {
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
  context: ExecutorContext
): Promise<CheckExecutorOutput> {
  return new Promise<CheckExecutorOutput>((resolve) => {
    logger.info(`Executing: astro ${args.join(' ')}`);

    // Spawn the check process in watch mode
    const childProcess: ChildProcess = spawn('astro', args, {
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
