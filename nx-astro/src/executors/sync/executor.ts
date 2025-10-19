import { ExecutorContext, logger } from '@nx/devkit';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { SyncExecutorSchema } from './schema';
import { buildAstroCommandString } from '../../utils/command-builder';

const execAsync = promisify(exec);

export interface SyncExecutorOutput {
  success: boolean;
  error?: string;
}

export default async function syncExecutor(
  options: SyncExecutorSchema,
  context: ExecutorContext,
): Promise<SyncExecutorOutput> {
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

    // Build command arguments array (without 'astro' and 'sync')
    const commandArgs: string[] = [];

    // Add root flag
    commandArgs.push('--root', projectRoot);

    // Add optional flags
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

    // Build command string with package manager prefix
    const commandString = buildAstroCommandString(
      'sync',
      commandArgs,
      context.root,
    );

    logger.info(`Executing: ${commandString}`);

    // Execute the sync command
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

    logger.info('Type generation completed successfully');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Sync failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
