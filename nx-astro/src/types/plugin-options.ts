/**
 * Configuration options for the Nx-Astro plugin.
 * These options control how the plugin infers tasks and configures Astro projects.
 */
export interface AstroPluginOptions {
  /**
   * Name of the target for running the Astro development server.
   * @default "dev"
   */
  devTargetName?: string;

  /**
   * Name of the target for building the Astro project for production.
   * @default "build"
   */
  buildTargetName?: string;

  /**
   * Name of the target for previewing the built Astro project.
   * @default "preview"
   */
  previewTargetName?: string;

  /**
   * Name of the target for running Astro type checking.
   * @default "check"
   */
  checkTargetName?: string;

  /**
   * Name of the target for running tests.
   * @default "test"
   */
  testTargetName?: string;

  /**
   * Name of the target for syncing content collections.
   * @default "sync"
   */
  syncTargetName?: string;
}
