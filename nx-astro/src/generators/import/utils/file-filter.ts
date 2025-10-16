/**
 * Directories that should be excluded when copying project files.
 * These are typically generated, cached, or environment-specific directories.
 */
const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  '.astro',
  '.vercel',
  '.netlify',
  'build',
  'out',
  '.idea',
  '.vscode',
  '.vs',
  '.cache',
  '.nx',
  '.turbo',
  '.next',
  '.nuxt',
  'coverage',
  '.nyc_output',
] as const;

/**
 * File patterns that should be excluded when copying project files.
 * These are typically lock files, OS files, or environment-specific files.
 */
const EXCLUDED_FILE_PATTERNS = [
  // Lock files
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^pnpm-lock\.yaml$/,
  /^bun\.lockb$/,

  // OS files
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /^desktop\.ini$/,

  // Editor backup files
  /\.swp$/,
  /\.swo$/,
  /~$/,

  // Log files
  /^npm-debug\.log/,
  /^yarn-debug\.log/,
  /^yarn-error\.log/,
  /^\.pnpm-debug\.log/,
  /\.log$/,

  // Environment files (exclude actual env files, keep examples)
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.development\.local$/,
  /^\.env\.test\.local$/,
  /^\.env\.production\.local$/,
] as const;

/**
 * Determines whether a file or directory should be included when copying a project.
 *
 * Implements intelligent filtering to copy only source files and configuration while
 * excluding generated content, dependencies, and environment-specific files. This
 * ensures clean imports without unnecessary files.
 *
 * ## Exclusion rules
 * - **Generated directories**: node_modules, dist, build, .astro, .nx, .turbo, coverage
 * - **Version control**: .git
 * - **IDE directories**: .idea, .vscode, .vs
 * - **Deployment artifacts**: .vercel, .netlify
 * - **Lock files**: package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb
 * - **OS files**: .DS_Store, Thumbs.db, desktop.ini
 * - **Log files**: *.log, npm-debug.log, yarn-error.log
 * - **Editor backups**: *.swp, *.swo, *~
 * - **Environment files**: .env, .env.local, .env.*.local (but .env.example is kept)
 *
 * @param path - The file or directory path to check (can be relative or nested)
 * @returns true if the file should be included, false if it should be excluded
 *
 * @example Source code files (included)
 * ```typescript
 * shouldIncludeFile('src/index.ts');              // true
 * shouldIncludeFile('src/components/Button.astro'); // true
 * shouldIncludeFile('public/favicon.ico');        // true
 * shouldIncludeFile('astro.config.mjs');          // true
 * shouldIncludeFile('package.json');              // true
 * shouldIncludeFile('README.md');                 // true
 * shouldIncludeFile('.env.example');              // true
 * shouldIncludeFile('.env.template');             // true
 * ```
 *
 * @example Generated content (excluded)
 * ```typescript
 * shouldIncludeFile('node_modules/astro');        // false
 * shouldIncludeFile('node_modules/react/index.js'); // false
 * shouldIncludeFile('dist/index.html');           // false
 * shouldIncludeFile('.astro/types.d.ts');         // false
 * shouldIncludeFile('coverage/lcov.info');        // false
 * ```
 *
 * @example Lock files (excluded)
 * ```typescript
 * shouldIncludeFile('package-lock.json');         // false
 * shouldIncludeFile('yarn.lock');                 // false
 * shouldIncludeFile('pnpm-lock.yaml');            // false
 * shouldIncludeFile('bun.lockb');                 // false
 * ```
 *
 * @example IDE and OS files (excluded)
 * ```typescript
 * shouldIncludeFile('.vscode/settings.json');     // false
 * shouldIncludeFile('.idea/workspace.xml');       // false
 * shouldIncludeFile('.DS_Store');                 // false
 * shouldIncludeFile('Thumbs.db');                 // false
 * ```
 *
 * @example Environment files (conditional)
 * ```typescript
 * shouldIncludeFile('.env');                      // false (excluded)
 * shouldIncludeFile('.env.local');                // false (excluded)
 * shouldIncludeFile('.env.production.local');     // false (excluded)
 * shouldIncludeFile('.env.example');              // true (kept)
 * shouldIncludeFile('.env.template');             // true (kept)
 * ```
 *
 * @example Nested paths
 * ```typescript
 * shouldIncludeFile('src/node_modules/local');    // false (contains 'node_modules')
 * shouldIncludeFile('libs/ui/.git/config');       // false (contains '.git')
 * shouldIncludeFile('apps/web/dist/main.js');     // false (contains 'dist')
 * ```
 *
 * @see {@link EXCLUDED_DIRECTORIES} for the complete directory exclusion list
 * @see {@link EXCLUDED_FILE_PATTERNS} for the complete file pattern exclusion list
 */
export function shouldIncludeFile(path: string): boolean {
  // Empty path - include by default
  if (!path || path.length === 0) {
    return true;
  }

  // Check if path contains any excluded directory
  const pathParts = path.split('/');
  for (const part of pathParts) {
    if (EXCLUDED_DIRECTORIES.includes(part as any)) {
      return false;
    }
  }

  // Get the filename (last part of the path)
  const filename = pathParts[pathParts.length - 1];

  // Check against excluded file patterns
  for (const pattern of EXCLUDED_FILE_PATTERNS) {
    if (pattern.test(filename)) {
      return false;
    }
  }

  // File should be included
  return true;
}
