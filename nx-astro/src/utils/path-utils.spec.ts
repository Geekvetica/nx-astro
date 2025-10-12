import {
  normalizeProjectRoot,
  getProjectNameFromPath,
  joinPathFragments,
  resolveOutputPath,
} from './path-utils';

describe('path-utils', () => {
  describe('normalizeProjectRoot', () => {
    it('should normalize project root by removing leading slash', () => {
      expect(normalizeProjectRoot('/apps/my-app')).toBe('apps/my-app');
    });

    it('should handle project root without leading slash', () => {
      expect(normalizeProjectRoot('apps/my-app')).toBe('apps/my-app');
    });

    it('should handle project root with trailing slash', () => {
      expect(normalizeProjectRoot('apps/my-app/')).toBe('apps/my-app');
    });

    it('should handle both leading and trailing slashes', () => {
      expect(normalizeProjectRoot('/apps/my-app/')).toBe('apps/my-app');
    });

    it('should handle root directory', () => {
      expect(normalizeProjectRoot('/')).toBe('');
    });

    it('should handle empty string', () => {
      expect(normalizeProjectRoot('')).toBe('');
    });
  });

  describe('getProjectNameFromPath', () => {
    it('should extract project name from config path', () => {
      expect(getProjectNameFromPath('apps/my-app/astro.config.mjs')).toBe(
        'my-app'
      );
    });

    it('should handle nested directories', () => {
      expect(
        getProjectNameFromPath('apps/frontend/my-app/astro.config.mjs')
      ).toBe('my-app');
    });

    it('should handle root config file', () => {
      expect(getProjectNameFromPath('astro.config.mjs')).toBe('');
    });

    it('should handle different config file extensions', () => {
      expect(getProjectNameFromPath('apps/my-app/astro.config.js')).toBe(
        'my-app'
      );
      expect(getProjectNameFromPath('apps/my-app/astro.config.ts')).toBe(
        'my-app'
      );
    });
  });

  describe('joinPathFragments', () => {
    it('should join path fragments with forward slashes', () => {
      expect(joinPathFragments('apps', 'my-app', 'src')).toBe(
        'apps/my-app/src'
      );
    });

    it('should handle fragments with slashes', () => {
      expect(joinPathFragments('apps/', '/my-app', 'src/')).toBe(
        'apps/my-app/src'
      );
    });

    it('should handle single fragment', () => {
      expect(joinPathFragments('apps')).toBe('apps');
    });

    it('should handle empty fragments', () => {
      expect(joinPathFragments('apps', '', 'my-app')).toBe('apps/my-app');
    });

    it('should return empty string for no fragments', () => {
      expect(joinPathFragments()).toBe('');
    });
  });

  describe('resolveOutputPath', () => {
    it('should resolve output path with default pattern', () => {
      const result = resolveOutputPath('apps/my-app', undefined);
      expect(result).toBe('dist/apps/my-app');
    });

    it('should resolve output path with custom pattern', () => {
      const result = resolveOutputPath('apps/my-app', 'build/{projectRoot}');
      expect(result).toBe('build/apps/my-app');
    });

    it('should handle projectName placeholder', () => {
      const result = resolveOutputPath(
        'apps/my-app',
        'dist/{projectName}',
        'my-app'
      );
      expect(result).toBe('dist/my-app');
    });

    it('should handle both projectRoot and projectName placeholders', () => {
      const result = resolveOutputPath(
        'apps/frontend/my-app',
        'dist/{projectName}/{projectRoot}',
        'my-app'
      );
      expect(result).toBe('dist/my-app/apps/frontend/my-app');
    });

    it('should handle pattern without placeholders', () => {
      const result = resolveOutputPath('apps/my-app', 'dist/static');
      expect(result).toBe('dist/static');
    });
  });
});
