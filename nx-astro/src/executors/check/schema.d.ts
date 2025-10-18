export interface CheckExecutorSchema {
  /**
   * Run in watch mode for continuous checking
   * @default false
   */
  watch?: boolean;

  /**
   * Path to tsconfig.json file
   */
  tsconfig?: string;

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

  /**
   * Automatically install @astrojs/check if missing
   * @default false
   */
  autoInstall?: boolean;
}
