export interface SyncExecutorSchema {
  /**
   * Project root path (usually provided by Nx)
   */
  root?: string;

  /**
   * Path to Astro config file
   * @default "astro.config.mjs"
   */
  config?: string;

  /**
   * Enable verbose output
   * @default false
   */
  verbose?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];
}
