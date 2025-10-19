import { ExecutorContext, logger } from '@nx/devkit';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { TestExecutorSchema } from './schema';
import { buildCommand, buildCommandString } from '../../utils/command-builder';

const execAsync = promisify(exec);

export interface TestExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function testExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext,
): Promise<TestExecutorOutput> {
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

    // Build the vitest command arguments
    const args: string[] = [];

    // Determine command mode: run (default) or watch
    // CI mode forces run mode and disables watch
    const useWatchMode = options.watch && !options.ci;

    if (useWatchMode) {
      args.push('watch');
    } else {
      args.push('run');
    }

    // Add root flag
    args.push('--root', projectRoot);

    // Add optional flags
    if (options.coverage) {
      args.push('--coverage');
    }

    if (options.ci) {
      args.push('--ci');
    }

    if (options.config) {
      args.push('--config', options.config);
    }

    if (options.reporter) {
      args.push('--reporter', options.reporter);
    }

    // Handle verbose option by using verbose reporter
    if (options.verbose && !options.reporter) {
      args.push('--reporter', 'verbose');
    }

    // Add test path pattern if provided (should be last positional argument)
    if (options.testPathPattern) {
      args.push(options.testPathPattern);
    }

    // Add additional arguments
    if (options.additionalArgs && options.additionalArgs.length > 0) {
      args.push(...options.additionalArgs);
    }

    // Watch mode: use spawn (keep running)
    // Run mode: use exec (exit after completion)
    if (useWatchMode) {
      return await runWatchMode(args, context);
    } else {
      return await runTestMode(args, context);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Test execution failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Run tests in non-watch mode (exits after completion)
 */
async function runTestMode(
  args: string[],
  context: ExecutorContext,
): Promise<TestExecutorOutput> {
  const command = buildCommandString('vitest', args, context.root);

  logger.info(`Executing: ${command}`);

  try {
    // Execute the test command
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

    logger.info('Tests completed successfully');

    return { success: true };
  } catch (error: unknown) {
    // Tests failed - this is expected when tests don't pass
    const execError = error as {
      message?: string;
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    const errorMessage = execError.message || String(error);

    // Log the output (which contains the test results)
    if (execError.stdout) {
      logger.error(execError.stdout);
    }

    if (execError.stderr) {
      logger.error(execError.stderr);
    }

    logger.error(`Tests failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Run tests in watch mode (keeps running)
 */
async function runWatchMode(
  args: string[],
  context: ExecutorContext,
): Promise<TestExecutorOutput> {
  return new Promise<TestExecutorOutput>((resolve) => {
    const { command, args: cmdArgs } = buildCommand(
      'vitest',
      args,
      context.root,
    );

    logger.info(`Executing: ${command} ${cmdArgs.join(' ')}`);

    // Spawn the test process in watch mode
    const childProcess: ChildProcess = spawn(command, cmdArgs, {
      cwd: context.root,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env,
    });

    // Stream stdout
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data: Buffer) => {
        process.stdout.write(data);
      });
    }

    // Stream stderr
    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });
    }

    // Handle process events
    childProcess.on('error', (error) => {
      logger.error(`Test process failed: ${error.message}`);
      resolve({
        success: false,
        error: error.message,
      });
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Test process stopped');
        resolve({ success: true });
      } else {
        logger.error(`Test process exited with code ${code}`);
        resolve({
          success: false,
          error: `Process exited with code ${code}`,
        });
      }
    });

    // Handle termination signals
    const killProcess = (signal: NodeJS.Signals) => {
      logger.info(`Received ${signal}, stopping test process...`);
      if (childProcess && !childProcess.killed) {
        childProcess.kill(signal);
      }
    };

    process.on('SIGINT', () => killProcess('SIGINT'));
    process.on('SIGTERM', () => killProcess('SIGTERM'));

    logger.info('Tests are running in watch mode. Press Ctrl+C to stop.');
  });
}
