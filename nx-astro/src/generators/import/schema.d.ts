/**
 * Schema for the import generator.
 * Used to import an existing Astro application into the Nx workspace.
 */
export interface ImportGeneratorSchema {
  /**
   * Absolute or relative path to the existing Astro project to import.
   * Can be outside the workspace.
   *
   * @example '../my-astro-app'
   * @example '/Users/username/projects/astro-app'
   */
  source: string;

  /**
   * Name for the project in the Nx workspace.
   * If not provided, will be derived from the source directory name.
   * Must start with a letter and contain only letters, numbers, and hyphens.
   *
   * @example 'my-astro-app'
   */
  name?: string;

  /**
   * Directory where the project will be placed in the workspace.
   * Relative to the workspace root.
   * If not provided, defaults to `apps/{name}`.
   *
   * @example 'apps/my-astro-app'
   * @example 'packages/websites/my-site'
   */
  directory?: string;

  /**
   * Comma-separated tags to apply to the project.
   * Used for organizing and filtering projects in the workspace.
   *
   * @example 'astro,web,public-facing'
   */
  tags?: string;

  /**
   * Skip formatting files after generation.
   * Useful for debugging or when you want to format manually.
   *
   * @default false
   */
  skipFormat?: boolean;

  /**
   * Skip installing dependencies after import.
   * Dependencies will need to be installed manually.
   *
   * @default false
   */
  skipInstall?: boolean;

  /**
   * Custom TypeScript path alias for importing from this project.
   * If not provided, will be generated as `@{workspaceName}/{projectName}`.
   *
   * @example '@myorg/my-astro-app'
   */
  importPath?: string;
}
