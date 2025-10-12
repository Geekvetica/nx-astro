import { ExecutorContext, logger } from '@nx/devkit';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { PreviewExecutorSchema } from './schema';

export interface PreviewExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function previewExecutor(
  options: PreviewExecutorSchema,
  context: ExecutorContext
): Promise<PreviewExecutorOutput> {
  return new Promise<PreviewExecutorOutput>((resolve) => {
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

      // Build the astro preview command arguments
      const args: string[] = ['preview'];

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

      if (options.site) {
        args.push('--site', options.site);
      }

      if (options.base) {
        args.push('--base', options.base);
      }

      if (options.config) {
        args.push('--config', options.config);
      }

      if (options.outputPath) {
        args.push('--outDir', options.outputPath);
      }

      if (options.verbose) {
        args.push('--verbose');
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

      // Add additional arguments
      if (options.additionalArgs && options.additionalArgs.length > 0) {
        args.push(...options.additionalArgs);
      }

      logger.info(`Executing: astro ${args.join(' ')}`);

      // Spawn the preview server process
      const childProcess: ChildProcess = spawn('astro', args, {
        cwd: context.root,
        stdio: 'inherit',
        env: process.env,
      });

      // Handle process events
      childProcess.on('error', (error) => {
        logger.error(`Preview server failed: ${error.message}`);
        resolve({
          success: false,
          error: error.message,
        });
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Preview server stopped');
          resolve({ success: true });
        } else {
          logger.error(`Preview server exited with code ${code}`);
          resolve({
            success: false,
            error: `Process exited with code ${code}`,
          });
        }
      });

      // Handle termination signals
      const killProcess = (signal: NodeJS.Signals) => {
        logger.info(`Received ${signal}, stopping preview server...`);
        if (childProcess && !childProcess.killed) {
          childProcess.kill(signal);
        }
      };

      process.on('SIGINT', () => killProcess('SIGINT'));
      process.on('SIGTERM', () => killProcess('SIGTERM'));

      logger.info('Preview server is running. Press Ctrl+C to stop.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to start preview server: ${errorMessage}`);

      resolve({
        success: false,
        error: errorMessage,
      });
    }
  });
}
