import { ExecutorContext, logger } from '@nx/devkit';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { DevExecutorSchema } from './schema';

export interface DevExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function devExecutor(
  options: DevExecutorSchema,
  context: ExecutorContext
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

      // Build the astro dev command arguments
      const args: string[] = ['dev'];

      // Add root flag
      args.push('--root', projectRoot);

      // Add optional flags
      if (options.port !== undefined) {
        args.push('--port', String(options.port));
      }

      if (options.host !== undefined) {
        if (typeof options.host === 'boolean') {
          if (options.host) {
            args.push('--host');
          }
        } else {
          args.push('--host', options.host);
        }
      }

      if (options.open !== undefined) {
        if (typeof options.open === 'boolean') {
          if (options.open) {
            args.push('--open');
          }
        } else {
          args.push('--open', options.open);
        }
      }

      if (options.site) {
        args.push('--site', options.site);
      }

      if (options.base) {
        args.push('--base', options.base);
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

      logger.info(`Executing: astro ${args.join(' ')}`);

      // Spawn the dev server process
      const childProcess: ChildProcess = spawn('astro', args, {
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
