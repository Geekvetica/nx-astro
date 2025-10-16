import { shouldIncludeFile } from './file-filter';

describe('shouldIncludeFile', () => {
  describe('excluded directories', () => {
    it('should exclude node_modules', () => {
      expect(shouldIncludeFile('node_modules')).toBe(false);
      expect(shouldIncludeFile('src/node_modules')).toBe(false);
      expect(shouldIncludeFile('node_modules/package')).toBe(false);
    });

    it('should exclude .git directory', () => {
      expect(shouldIncludeFile('.git')).toBe(false);
      expect(shouldIncludeFile('.git/config')).toBe(false);
      expect(shouldIncludeFile('src/.git')).toBe(false);
    });

    it('should exclude build output directories', () => {
      expect(shouldIncludeFile('dist')).toBe(false);
      expect(shouldIncludeFile('.astro')).toBe(false);
      expect(shouldIncludeFile('.vercel')).toBe(false);
      expect(shouldIncludeFile('.netlify')).toBe(false);
      expect(shouldIncludeFile('build')).toBe(false);
      expect(shouldIncludeFile('out')).toBe(false);
    });

    it('should exclude IDE directories', () => {
      expect(shouldIncludeFile('.idea')).toBe(false);
      expect(shouldIncludeFile('.vscode')).toBe(false);
      expect(shouldIncludeFile('.vs')).toBe(false);
    });

    it('should exclude cache directories', () => {
      expect(shouldIncludeFile('.cache')).toBe(false);
      expect(shouldIncludeFile('.nx')).toBe(false);
      expect(shouldIncludeFile('.turbo')).toBe(false);
    });
  });

  describe('excluded files', () => {
    it('should exclude lock files', () => {
      expect(shouldIncludeFile('package-lock.json')).toBe(false);
      expect(shouldIncludeFile('yarn.lock')).toBe(false);
      expect(shouldIncludeFile('pnpm-lock.yaml')).toBe(false);
      expect(shouldIncludeFile('bun.lockb')).toBe(false);
    });

    it('should exclude OS files', () => {
      expect(shouldIncludeFile('.DS_Store')).toBe(false);
      expect(shouldIncludeFile('Thumbs.db')).toBe(false);
      expect(shouldIncludeFile('desktop.ini')).toBe(false);
    });

    it('should exclude editor backup files', () => {
      expect(shouldIncludeFile('file.swp')).toBe(false);
      expect(shouldIncludeFile('.file.swo')).toBe(false);
      expect(shouldIncludeFile('file~')).toBe(false);
    });

    it('should exclude log files', () => {
      expect(shouldIncludeFile('npm-debug.log')).toBe(false);
      expect(shouldIncludeFile('yarn-debug.log')).toBe(false);
      expect(shouldIncludeFile('yarn-error.log')).toBe(false);
      expect(shouldIncludeFile('.pnpm-debug.log')).toBe(false);
    });

    it('should exclude environment files', () => {
      expect(shouldIncludeFile('.env')).toBe(false);
      expect(shouldIncludeFile('.env.local')).toBe(false);
      expect(shouldIncludeFile('.env.development.local')).toBe(false);
    });
  });

  describe('included files', () => {
    it('should include source files', () => {
      expect(shouldIncludeFile('src/index.ts')).toBe(true);
      expect(shouldIncludeFile('src/components/Button.astro')).toBe(true);
      expect(shouldIncludeFile('src/pages/index.astro')).toBe(true);
    });

    it('should include configuration files', () => {
      expect(shouldIncludeFile('astro.config.mjs')).toBe(true);
      expect(shouldIncludeFile('tsconfig.json')).toBe(true);
      expect(shouldIncludeFile('package.json')).toBe(true);
      expect(shouldIncludeFile('.gitignore')).toBe(true);
      expect(shouldIncludeFile('.npmrc')).toBe(true);
    });

    it('should include public assets', () => {
      expect(shouldIncludeFile('public/favicon.svg')).toBe(true);
      expect(shouldIncludeFile('public/images/logo.png')).toBe(true);
      expect(shouldIncludeFile('public/robots.txt')).toBe(true);
    });

    it('should include documentation', () => {
      expect(shouldIncludeFile('README.md')).toBe(true);
      expect(shouldIncludeFile('docs/guide.md')).toBe(true);
      expect(shouldIncludeFile('CHANGELOG.md')).toBe(true);
    });

    it('should include test files', () => {
      expect(shouldIncludeFile('src/components/Button.test.ts')).toBe(true);
      expect(shouldIncludeFile('tests/integration.spec.ts')).toBe(true);
    });

    it('should include example environment file', () => {
      expect(shouldIncludeFile('.env.example')).toBe(true);
      expect(shouldIncludeFile('.env.template')).toBe(true);
    });
  });

  describe('nested paths', () => {
    it('should handle deeply nested excluded paths', () => {
      expect(shouldIncludeFile('a/b/c/node_modules/package')).toBe(false);
      expect(shouldIncludeFile('deep/path/dist/bundle.js')).toBe(false);
    });

    it('should handle deeply nested included paths', () => {
      expect(shouldIncludeFile('src/components/ui/forms/Input.astro')).toBe(
        true
      );
      expect(shouldIncludeFile('docs/guides/advanced/deployment.md')).toBe(
        true
      );
    });
  });

  describe('edge cases', () => {
    it('should handle paths with similar names to excluded items', () => {
      expect(shouldIncludeFile('node_modules.txt')).toBe(true); // Not the directory
      expect(shouldIncludeFile('my-dist/file.js')).toBe(true); // Not 'dist' directory
    });

    it('should handle empty path', () => {
      expect(shouldIncludeFile('')).toBe(true); // Assume include if unknown
    });

    it('should handle root level files', () => {
      expect(shouldIncludeFile('README.md')).toBe(true);
      expect(shouldIncludeFile('.gitignore')).toBe(true);
    });
  });
});
