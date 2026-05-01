export interface BuildExecutorSchema {
  /**
   * Override the default output directory
   */
  outputPath?: string;

  /**
   * Build mode: 'static' for static site generation, 'server' for SSR
   */
  mode?: 'static' | 'server';

  /**
   * Enable verbose output
   * @default false
   */
  verbose?: boolean;

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
   * Generate source maps
   * @default false
   */
  sourcemap?: boolean;

  /**
   * Clean output directory before build
   * @default true
   */
  clean?: boolean;

  /**
   * Additional CLI arguments to pass to Astro
   */
  additionalArgs?: string[];

  /**
   * Generate package.json and lockfile in the output path
   * @default false
   */
  generatePackageJson?: boolean;

  /**
   * Include devDependencies in generated package.json
   * @default false
   */
  includeDevDependenciesInPackageJson?: boolean;

  /**
   * Skip overrides field in generated package.json
   * @default false
   */
  skipOverrides?: boolean;

  /**
   * Skip packageManager field in generated package.json
   * @default false
   */
  skipPackageManager?: boolean;
}
