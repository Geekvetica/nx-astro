import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, logger } from '@nx/devkit';
import { vol } from 'memfs';
import { createMinimalPackageJson } from './create-minimal-package-json';

// Mock the fs module
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

describe('createMinimalPackageJson', () => {
  let tree: Tree;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    vol.reset();
    loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
  });

  afterEach(() => {
    vol.reset();
    loggerSpy.mockRestore();
  });

  describe('basic functionality', () => {
    it('should create minimal package.json with @astrojs/* dependencies from dependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          name: 'original-project',
          version: '2.0.0',
          dependencies: {
            '@astrojs/react': '^3.0.0',
            '@astrojs/sitemap': '^2.0.0',
            react: '^18.0.0',
            'other-package': '^1.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson).toEqual({
        name: 'my-project',
        version: '0.1.0',
        private: true,
        type: 'module',
        dependencies: {
          '@astrojs/react': '^3.0.0',
          '@astrojs/sitemap': '^2.0.0',
        },
      });
    });

    it('should use basename of projectRoot as package name', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/nested/deeply/my-app';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/node': '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.name).toBe('my-app');
    });

    it('should extract @astrojs/* dependencies from devDependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          devDependencies: {
            '@astrojs/check': '^0.5.0',
            '@astrojs/ts-plugin': '^1.0.0',
            typescript: '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({
        '@astrojs/check': '^0.5.0',
        '@astrojs/ts-plugin': '^1.0.0',
      });
    });

    it('should merge @astrojs/* dependencies from both dependencies and devDependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
            react: '^18.0.0',
          },
          devDependencies: {
            '@astrojs/check': '^0.5.0',
            typescript: '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({
        '@astrojs/react': '^3.0.0',
        '@astrojs/check': '^0.5.0',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle source package.json with no @astrojs/* dependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            react: '^18.0.0',
            vue: '^3.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson).toEqual({
        name: 'my-project',
        version: '0.1.0',
        private: true,
        type: 'module',
        dependencies: {},
      });
    });

    it('should handle source package.json with empty dependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {},
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({});
    });

    it('should handle source package.json with no dependencies or devDependencies fields', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          name: 'minimal-package',
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({});
    });

    it('should handle source package.json with null dependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: null,
          devDependencies: null,
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({});
    });

    it('should handle only @astrojs/* dependencies in devDependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            react: '^18.0.0',
          },
          devDependencies: {
            '@astrojs/mdx': '^2.0.0',
            '@astrojs/rss': '^4.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({
        '@astrojs/mdx': '^2.0.0',
        '@astrojs/rss': '^4.0.0',
      });
    });
  });

  describe('package.json structure', () => {
    it('should always set version to 0.1.0', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          version: '99.99.99',
          dependencies: {
            '@astrojs/node': '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.version).toBe('0.1.0');
    });

    it('should always set private to true', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          private: false,
          dependencies: {
            '@astrojs/node': '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.private).toBe(true);
    });

    it('should always set type to module', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          type: 'commonjs',
          dependencies: {
            '@astrojs/node': '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.type).toBe('module');
    });

    it('should write package.json to correct path in tree', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/node': '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      expect(tree.exists(`${projectRoot}/package.json`)).toBe(true);
    });

    it('should format package.json with 2-space indentation', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/node': '^5.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const content = tree.read(
        `${projectRoot}/package.json`,
        'utf-8',
      ) as string;

      // Check that it's properly formatted with indentation
      expect(content).toContain('{\n  "name"');
      expect(content).toContain('\n  "version"');
      expect(content).toContain('\n  "private"');
    });
  });

  describe('logging', () => {
    it('should log number of @astrojs/* dependencies added', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
            '@astrojs/sitemap': '^2.0.0',
            react: '^18.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('2'));
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('@astrojs/'),
      );
    });

    it('should log when no @astrojs/* dependencies found', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            react: '^18.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('0'));
    });

    it('should log correct count when dependencies come from both dependencies and devDependencies', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
          devDependencies: {
            '@astrojs/check': '^0.5.0',
            '@astrojs/ts-plugin': '^1.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('3'));
    });
  });

  describe('dependency extraction', () => {
    it('should only extract packages starting with @astrojs/', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
            '@astro/something': '^1.0.0', // Different scope
            'astrojs-plugin': '^1.0.0', // No scope
            '@other/astrojs': '^1.0.0', // Different scope
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({
        '@astrojs/react': '^3.0.0',
      });
    });

    it('should preserve exact version strings from source', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
            '@astrojs/sitemap': '~2.5.1',
            '@astrojs/mdx': '2.0.0',
            '@astrojs/rss': 'workspace:*',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(packageJson.dependencies).toEqual({
        '@astrojs/react': '^3.0.0',
        '@astrojs/sitemap': '~2.5.1',
        '@astrojs/mdx': '2.0.0',
        '@astrojs/rss': 'workspace:*',
      });
    });

    it('should handle multiple @astrojs/* packages', () => {
      const sourcePath = '/source-project/package.json';
      const projectRoot = 'apps/my-project';

      vol.fromJSON({
        [sourcePath]: JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
            '@astrojs/svelte': '^5.0.0',
            '@astrojs/preact': '^3.0.0',
            '@astrojs/solid-js': '^4.0.0',
            '@astrojs/alpinejs': '^0.4.0',
            '@astrojs/lit': '^4.0.0',
          },
        }),
      });

      createMinimalPackageJson(tree, projectRoot, sourcePath);

      const packageJson = JSON.parse(
        tree.read(`${projectRoot}/package.json`, 'utf-8') as string,
      );

      expect(Object.keys(packageJson.dependencies)).toHaveLength(7);
      expect(packageJson.dependencies).toHaveProperty('@astrojs/react');
      expect(packageJson.dependencies).toHaveProperty('@astrojs/vue');
      expect(packageJson.dependencies).toHaveProperty('@astrojs/svelte');
    });
  });
});
