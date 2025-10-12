import { names } from '@nx/devkit';
import { ApplicationGeneratorSchema } from '../schema';

export interface NormalizedOptions {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  template: 'minimal' | 'blog' | 'portfolio';
  skipFormat: boolean;
  importExisting: boolean;
}

export function normalizeOptions(
  options: ApplicationGeneratorSchema
): NormalizedOptions {
  // Validate project name
  const projectNamePattern = /^[a-zA-Z][a-zA-Z0-9-]*$/;
  if (!projectNamePattern.test(options.name)) {
    throw new Error(
      `Project name "${options.name}" is invalid. It must start with a letter and contain only letters, numbers, and hyphens.`
    );
  }

  // Normalize project name (convert to kebab-case)
  const projectName = names(options.name).fileName;

  // Determine project directory
  let projectDirectory: string;
  if (options.directory) {
    projectDirectory = options.directory;
  } else {
    projectDirectory = `apps/${projectName}`;
  }

  // Parse tags
  const parsedTags = options.tags
    ? options.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];

  // Set defaults
  const template = options.template || 'minimal';
  const skipFormat = options.skipFormat || false;
  const importExisting = options.importExisting || false;

  return {
    projectName,
    projectRoot: projectDirectory,
    projectDirectory,
    parsedTags,
    template,
    skipFormat,
    importExisting,
  };
}
