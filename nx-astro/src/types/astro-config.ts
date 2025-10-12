/**
 * Represents an Astro adapter for server-side rendering.
 */
export interface AstroAdapter {
  /**
   * Name of the adapter (e.g., 'node', 'netlify', 'vercel')
   */
  name: string;

  /**
   * Adapter hooks for build-time and runtime behavior
   */
  hooks?: Record<string, (...args: unknown[]) => unknown>;
}

/**
 * Represents an Astro integration.
 */
export interface AstroIntegration {
  /**
   * Name of the integration (e.g., 'react', 'vue', 'tailwind')
   */
  name: string;

  /**
   * Integration hooks for extending Astro functionality
   */
  hooks?: Record<string, (...args: unknown[]) => unknown>;
}

/**
 * Astro configuration object.
 * This interface represents the structure of astro.config.mjs files.
 */
export interface AstroConfig {
  /**
   * Project root directory
   */
  root?: string;

  /**
   * Source directory for Astro components and pages
   * @default "./src"
   */
  srcDir?: string;

  /**
   * Public directory for static assets
   * @default "./public"
   */
  publicDir?: string;

  /**
   * Output directory for built files
   * @default "./dist"
   */
  outDir?: string;

  /**
   * Cache directory for Astro build artifacts
   * @default "./node_modules/.astro"
   */
  cacheDir?: string;

  /**
   * Site URL for generating absolute URLs
   */
  site?: string;

  /**
   * Base path for deployment
   */
  base?: string;

  /**
   * Trailing slash behavior for URLs
   */
  trailingSlash?: 'always' | 'never' | 'ignore';

  /**
   * Output mode for the Astro project
   * - static: Pre-rendered static site
   * - server: Full server-side rendering
   * - hybrid: Mix of static and server-rendered pages
   */
  output?: 'static' | 'server' | 'hybrid';

  /**
   * Adapter for server-side rendering
   */
  adapter?: AstroAdapter;

  /**
   * Astro integrations
   */
  integrations?: AstroIntegration[];

  /**
   * Development server configuration
   */
  server?: {
    /**
     * Host to bind the dev server to
     */
    host?: string | boolean;

    /**
     * Port for the dev server
     */
    port?: number;

    /**
     * Open browser on server start
     */
    open?: string | boolean;
  };

  /**
   * Build configuration
   */
  build?: {
    /**
     * Output format for built files
     */
    format?: 'file' | 'directory';

    /**
     * Client-side output directory
     */
    client?: string;

    /**
     * Server-side output directory (for SSR)
     */
    server?: string;

    /**
     * Assets directory name
     */
    assets?: string;

    /**
     * Assets prefix for CDN deployment
     */
    assetsPrefix?: string;

    /**
     * Server entry point file
     */
    serverEntry?: string;

    /**
     * Generate redirects file
     */
    redirects?: boolean;

    /**
     * Inline stylesheet behavior
     */
    inlineStylesheets?: 'always' | 'auto' | 'never';
  };

  /**
   * Vite configuration
   */
  vite?: Record<string, unknown>;

  /**
   * Markdown configuration
   */
  markdown?: Record<string, unknown>;

  /**
   * Experimental features
   */
  experimental?: Record<string, unknown>;
}
