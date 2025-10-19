import { ExecutorContext, logger } from '@nx/devkit';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { DevExecutorSchema } from './schema';
import { buildAstroCommand } from '../../utils/command-builder';

export interface DevExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function devExecutor(
  options: DevExecutorSchema,
  context: ExecutorContext,
): Promise<DevExecutorOutput> {
  return new Promise<DevExecutorOutput>((resolve) => {
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

      // Build the command arguments (exclude 'dev' - it's the subcommand)
      const commandArgs: string[] = [];

      // Add root flag
      commandArgs.push('--root', projectRoot);

      // Add optional flags
      if (options.port !== undefined) {
        commandArgs.push('--port', String(options.port));
      }

      if (options.host !== undefined) {
        if (typeof options.host === 'boolean') {
          if (options.host) {
            commandArgs.push('--host');
          }
        } else {
          commandArgs.push('--host', options.host);
        }
      }

      if (options.open !== undefined) {
        if (typeof options.open === 'boolean') {
          if (options.open) {
            commandArgs.push('--open');
          }
        } else {
          commandArgs.push('--open', options.open);
        }
      }

      if (options.site) {
        commandArgs.push('--site', options.site);
      }

      if (options.base) {
        commandArgs.push('--base', options.base);
      }

      if (options.config) {
        commandArgs.push('--config', options.config);
      }

      if (options.verbose) {
        commandArgs.push('--verbose');
      }

      // Add additional arguments
      if (options.additionalArgs && options.additionalArgs.length > 0) {
        commandArgs.push(...options.additionalArgs);
      }

      // Build command with package manager prefix
      const { command, args: fullArgs } = buildAstroCommand(
        'dev',
        commandArgs,
        context.root,
      );
      logger.info(`Executing: ${command} ${fullArgs.join(' ')}`);

      // Spawn the dev server process
      const childProcess: ChildProcess = spawn(command, fullArgs, {
        cwd: context.root,
        stdio: 'inherit',
        env: process.env,
      });

      // Handle process events
      childProcess.on('error', (error) => {
        logger.error(`Dev server failed: ${error.message}`);
        resolve({
          success: false,
          error: error.message,
        });
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Dev server stopped');
          resolve({ success: true });
        } else {
          logger.error(`Dev server exited with code ${code}`);
          resolve({
            success: false,
            error: `Process exited with code ${code}`,
          });
        }
      });

      // Handle termination signals
      const killProcess = (signal: NodeJS.Signals) => {
        logger.info(`Received ${signal}, stopping dev server...`);
        if (childProcess && !childProcess.killed) {
          childProcess.kill(signal);
        }
      };

      process.on('SIGINT', () => killProcess('SIGINT'));
      process.on('SIGTERM', () => killProcess('SIGTERM'));

      logger.info('Dev server is running. Press Ctrl+C to stop.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to start dev server: ${errorMessage}`);

      resolve({
        success: false,
        error: errorMessage,
      });
    }
  });
}
