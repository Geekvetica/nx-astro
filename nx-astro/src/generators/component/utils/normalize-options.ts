import { Tree, names, joinPathFragments } from '@nx/devkit';
import { ComponentGeneratorSchema } from '../schema';

export interface NormalizedOptions extends ComponentGeneratorSchema {
  fileName: string;
  className: string;
  componentPath: string;
  relativeToComponents: string;
}

export function normalizeOptions(
  tree: Tree,
  options: ComponentGeneratorSchema,
  projectRoot: string
): NormalizedOptions {
  const nameTransforms = names(options.name);

  // For Astro components, use the original name format (preserve case)
  // If it's PascalCase, keep it. If it's kebab-case, keep it.
  const fileName = options.name;

  const directory = options.directory || '';
  const componentPath = joinPathFragments(
    projectRoot,
    'src/components',
    directory
  );

  const relativeToComponents = directory
    ? `./${directory}/${fileName}.astro`
    : `./${fileName}.astro`;

  return {
    ...options,
    fileName,
    className: nameTransforms.className,
    componentPath,
    relativeToComponents,
  };
}
