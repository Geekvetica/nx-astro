import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
} from '@nx/devkit';
import { ComponentGeneratorSchema } from './schema';
import { validateProject } from './utils/validate-project';
import { normalizeOptions } from './utils/normalize-options';
import { addExportToIndex } from './utils/add-export';

/**
 * Generates a new Astro component in an existing Astro project.
 *
 * Creates a new `.astro` component file with boilerplate code in the specified
 * project's components directory. Optionally adds an export to the components index file.
 *
 * @param tree - The virtual file system tree
 * @param options - Generator options including component name, project, and directory
 *
 * @example
 * ```typescript
 * // Generate a Button component
 * await componentGenerator(tree, {
 *   name: 'Button',
 *   project: 'my-app',
 *   directory: 'ui'
 * });
 * ```
 *
 * @throws {Error} If the specified project doesn't exist or isn't an Astro project
 *
 * @remarks
 * This generator will:
 * - Validate the target project exists and is an Astro project
 * - Create the component file in src/components/ (or custom directory)
 * - Optionally add export to components/index.ts
 * - Format files unless skipFormat is true
 */
export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
): Promise<void> {
  // 1. Validate that the project exists and is an Astro project
  const projectConfig = validateProject(tree, options.project);

  // 2. Normalize options
  const normalizedOptions = normalizeOptions(tree, options, projectConfig.root);

  // 3. Generate component file from template
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    normalizedOptions.componentPath,
    {
      ...normalizedOptions,
      tmpl: '',
    }
  );

  // 4. Optionally add export to index.ts
  if (options.export) {
    const componentsDir = joinPathFragments(
      projectConfig.root,
      'src/components'
    );
    addExportToIndex(
      tree,
      componentsDir,
      normalizedOptions.className,
      normalizedOptions.relativeToComponents
    );
  }

  // 5. Format files if not skipFormat
  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}

export default componentGenerator;
