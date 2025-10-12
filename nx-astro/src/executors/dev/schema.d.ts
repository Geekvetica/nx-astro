export interface DevExecutorSchema {
  /**
   * Development server port
   * @default 4321
   */
  port?: number;

  /**
   * Host address to bind the server to
   * @default "localhost"
   */
  host?: string | boolean;

  /**
   * Open browser on server start
   * @default false
   */
  open?: string | boolean;

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
   * Site URL for absolute URLs
   */
  site?: string;

  /**
   * Base path for deployment
   */
  base?: string;

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
