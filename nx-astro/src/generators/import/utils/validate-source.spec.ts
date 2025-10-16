import { vol } from 'memfs';
import { validateSource } from './validate-source';

// Mock the fs module
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

describe('validateSource', () => {
  beforeEach(() => {
    // Reset the in-memory file system before each test
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe('valid Astro projects', () => {
    it('should accept valid Astro project with astro.config.mjs', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });

    it('should accept valid Astro project with astro.config.js', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.js`]: 'module.exports = {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });

    it('should accept valid Astro project with astro.config.ts', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.ts`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });

    it('should accept valid Astro project with astro.config.cjs', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.cjs`]: 'module.exports = {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });

    it('should accept valid Astro project with astro.config.mts', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mts`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });

    it('should accept valid Astro project with astro.config.cts', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.cts`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });

    it('should accept project with Astro in devDependencies', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          devDependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });
  });

  describe('invalid Astro projects', () => {
    it('should throw if source path does not exist', () => {
      const sourcePath = '/nonexistent-project';

      expect(() => validateSource(sourcePath)).toThrow(/does not exist/i);
    });

    it('should throw if source path is not a directory', () => {
      const sourcePath = '/test-file.txt';
      vol.fromJSON({
        [sourcePath]: 'just a file',
      });

      expect(() => validateSource(sourcePath)).toThrow(/is not a directory/i);
    });

    it('should throw if no Astro config file exists', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
        [`${sourcePath}/src/index.ts`]: '',
      });

      expect(() => validateSource(sourcePath)).toThrow(
        /no Astro configuration file found/i
      );
    });

    it('should throw if package.json does not exist', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/src/index.ts`]: '',
      });

      expect(() => validateSource(sourcePath)).toThrow(
        /package\.json.*not found/i
      );
    });

    it('should throw if package.json is invalid JSON', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/package.json`]: 'invalid json{',
      });

      expect(() => validateSource(sourcePath)).toThrow(
        /invalid package\.json/i
      );
    });

    it('should throw if Astro is not in dependencies or devDependencies', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { react: '^18.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).toThrow(
        /Astro.*not found.*dependencies/i
      );
    });

    it('should throw if package.json has neither dependencies nor devDependencies', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          name: 'test-project',
        }),
      });

      expect(() => validateSource(sourcePath)).toThrow(
        /Astro.*not found.*dependencies/i
      );
    });
  });

  describe('path normalization', () => {
    it('should accept absolute paths', () => {
      // This test verifies that the function works with absolute paths
      // Relative path resolution is handled by Node.js path.resolve
      const sourcePath = '/absolute/path/to/project';
      vol.fromJSON({
        [`${sourcePath}/astro.config.mjs`]: 'export default {};',
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).not.toThrow();
    });
  });

  describe('error messages', () => {
    it('should include source path in error messages', () => {
      const sourcePath = '/my-project';

      expect(() => validateSource(sourcePath)).toThrow(sourcePath);
    });

    it('should list expected Astro config file names', () => {
      const sourcePath = '/test-project';
      vol.fromJSON({
        [`${sourcePath}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      expect(() => validateSource(sourcePath)).toThrow(
        /astro\.config\.(mjs|js|ts|cjs|mts|cts)/i
      );
    });
  });
});
