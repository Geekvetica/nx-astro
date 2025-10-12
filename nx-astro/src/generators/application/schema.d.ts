export interface ApplicationGeneratorSchema {
  /**
   * Application name
   */
  name: string;

  /**
   * Directory where the application will be placed (e.g., 'apps/my-app')
   */
  directory?: string;

  /**
   * Tags to add to the project (comma-separated)
   */
  tags?: string;

  /**
   * Import an existing Astro project into the workspace
   * @default false
   */
  importExisting?: boolean;

  /**
   * Starter template to use
   * @default "minimal"
   */
  template?: 'minimal' | 'blog' | 'portfolio';

  /**
   * Skip formatting files after generation
   * @default false
   */
  skipFormat?: boolean;
}
