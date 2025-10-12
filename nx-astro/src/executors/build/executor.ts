import { ExecutorContext, logger } from '@nx/devkit';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { BuildExecutorSchema } from './schema';

const execAsync = promisify(exec);

export interface BuildExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
): Promise<BuildExecutorOutput> {
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

    // Build the astro build command
    const args: string[] = ['astro', 'build'];

    // Add root flag
    args.push('--root', projectRoot);

    // Add optional flags
    if (options.outputPath) {
      args.push('--outDir', options.outputPath);
    }

    if (options.mode) {
      args.push('--mode', options.mode);
    }

    if (options.verbose) {
      args.push('--verbose');
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

    // Add additional arguments
    if (options.additionalArgs && options.additionalArgs.length > 0) {
      args.push(...options.additionalArgs);
    }

    // Build the command string
    const command = args.join(' ');

    logger.info(`Executing: ${command}`);

    // Execute the build command
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

    logger.info('Build completed successfully');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Build failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
