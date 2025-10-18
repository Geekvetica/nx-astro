import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { vol } from 'memfs';
import { importGenerator } from './generator';
import { ImportGeneratorSchema } from './schema';

// Mock the fs module for source filesystem operations
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

// Mock formatFiles and addDependenciesToPackageJson since we don't need to test Nx's formatting and package installation
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn().mockResolvedValue(undefined),
  addDependenciesToPackageJson: jest
    .fn()
    .mockReturnValue(() => Promise.resolve()),
}));

describe('importGenerator', () => {
  let tree: Tree;
  const sourcePath = '/external/my-astro-app';

  beforeEach(() => {
    // Create empty Nx workspace
    tree = createTreeWithEmptyWorkspace();

    // Reset memfs
    vol.reset();

    // Setup a valid Astro project in memfs
    vol.fromJSON({
      [`${sourcePath}/astro.config.mjs`]: 'export default {};',
      [`${sourcePath}/package.json`]: JSON.stringify({
        name: 'my-astro-app',
        dependencies: { astro: '^5.0.0' },
      }),
      [`${sourcePath}/src/pages/index.astro`]: '<h1>Hello</h1>',
      [`${sourcePath}/src/components/Button.astro`]: '<button>Click</button>',
      [`${sourcePath}/tsconfig.json`]: JSON.stringify({ compilerOptions: {} }),
      [`${sourcePath}/README.md`]: '# My Astro App',
    });
  });

  afterEach(() => {
    vol.reset();
  });

  describe('happy path', () => {
    it('should successfully import a valid Astro project', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await expect(importGenerator(tree, options)).resolves.not.toThrow();
    });

    it('should copy project files to target directory', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'imported-app',
      };

      await importGenerator(tree, options);

      expect(tree.exists('apps/imported-app/astro.config.mjs')).toBe(true);
      expect(tree.exists('apps/imported-app/package.json')).toBe(true);
      expect(tree.exists('apps/imported-app/src/pages/index.astro')).toBe(true);
      expect(tree.exists('apps/imported-app/src/components/Button.astro')).toBe(
        true,
      );
      expect(tree.exists('apps/imported-app/tsconfig.json')).toBe(true);
      expect(tree.exists('apps/imported-app/README.md')).toBe(true);
    });

    it('should create project.json with correct configuration', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'imported-app',
      };

      await importGenerator(tree, options);

      expect(tree.exists('apps/imported-app/project.json')).toBe(true);

      const projectConfig = readProjectConfiguration(tree, 'imported-app');
      expect(projectConfig).toBeDefined();
      expect(projectConfig.name).toBe('imported-app');
      expect(projectConfig.root).toBe('apps/imported-app');
      expect(projectConfig.projectType).toBe('application');
      expect(projectConfig.sourceRoot).toBe('apps/imported-app/src');
    });

    it('should register project in workspace', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-app',
      };

      await importGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig).toBeDefined();
      expect(projectConfig.name).toBe('my-app');
    });

    it('should update tsconfig.base.json paths when importPath is provided', async () => {
      // Create a minimal tsconfig.base.json
      tree.write(
        'tsconfig.base.json',
        JSON.stringify({
          compilerOptions: {
            paths: {},
          },
        }),
      );

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-app',
        importPath: '@myorg/my-app',
      };

      await importGenerator(tree, options);

      const tsConfig = readJson(tree, 'tsconfig.base.json');
      expect(tsConfig.compilerOptions.paths['@myorg/my-app']).toEqual([
        'apps/my-app/src/index.ts',
      ]);
    });

    it('should call formatFiles when skipFormat is false', async () => {
      const formatFiles = require('@nx/devkit').formatFiles;

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        skipFormat: false,
      };

      await importGenerator(tree, options);

      expect(formatFiles).toHaveBeenCalledWith(tree);
    });

    it('should not call formatFiles when skipFormat is true', async () => {
      const formatFiles = require('@nx/devkit').formatFiles;
      formatFiles.mockClear();

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        skipFormat: true,
      };

      await importGenerator(tree, options);

      expect(formatFiles).not.toHaveBeenCalled();
    });
  });

  describe('validation failures', () => {
    it('should throw when source path does not exist', async () => {
      const options: ImportGeneratorSchema = {
        source: '/nonexistent/path',
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /does not exist/i,
      );
    });

    it('should throw when source does not have Astro config', async () => {
      const invalidSource = '/invalid-project';
      vol.fromJSON({
        [`${invalidSource}/package.json`]: JSON.stringify({
          dependencies: { astro: '^5.0.0' },
        }),
      });

      const options: ImportGeneratorSchema = {
        source: invalidSource,
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /no Astro configuration file found/i,
      );
    });

    it('should throw when project name already exists', async () => {
      // Create an existing project
      tree.write(
        'apps/existing-app/project.json',
        JSON.stringify({
          name: 'existing-app',
          root: 'apps/existing-app',
        }),
      );

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'existing-app',
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /project.*existing-app.*already exists/i,
      );
    });

    it('should throw when project name is invalid', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: '123-invalid', // Starts with a number
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /invalid project name/i,
      );
    });

    it('should throw when target directory already exists', async () => {
      // Create a directory at the target location
      tree.write('apps/my-astro-app/existing-file.txt', 'content');

      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /target directory.*already exists/i,
      );
    });
  });

  describe('options handling', () => {
    it('should use custom project name', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'custom-name',
      };

      await importGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'custom-name');
      expect(projectConfig.name).toBe('custom-name');
      expect(projectConfig.root).toBe('apps/custom-name');
    });

    it('should use custom directory', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-app',
        directory: 'packages/websites/my-app',
      };

      await importGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig.root).toBe('packages/websites/my-app');
      expect(tree.exists('packages/websites/my-app/astro.config.mjs')).toBe(
        true,
      );
    });

    it('should parse and apply custom tags', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-app',
        tags: 'astro,web,public-facing',
      };

      await importGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig.tags).toEqual(['astro', 'web', 'public-facing']);
    });

    it('should handle skipFormat flag', async () => {
      const formatFiles = require('@nx/devkit').formatFiles;
      formatFiles.mockClear();

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        skipFormat: true,
      };

      await importGenerator(tree, options);

      expect(formatFiles).not.toHaveBeenCalled();
    });

    it('should handle importPath option', async () => {
      tree.write(
        'tsconfig.base.json',
        JSON.stringify({
          compilerOptions: {
            paths: {},
          },
        }),
      );

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-app',
        importPath: '@custom/import-path',
      };

      await importGenerator(tree, options);

      const tsConfig = readJson(tree, 'tsconfig.base.json');
      expect(
        tsConfig.compilerOptions.paths['@custom/import-path'],
      ).toBeDefined();
    });

    it('should work without importPath option', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-app',
      };

      await expect(importGenerator(tree, options)).resolves.not.toThrow();
    });
  });

  describe('file operations', () => {
    it('should exclude node_modules from copying', async () => {
      vol.fromJSON({
        [`${sourcePath}/node_modules/some-package/index.js`]: 'content',
      });

      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await importGenerator(tree, options);

      expect(
        tree.exists('apps/my-astro-app/node_modules/some-package/index.js'),
      ).toBe(false);
    });

    it('should exclude dist directory from copying', async () => {
      vol.fromJSON({
        [`${sourcePath}/dist/index.html`]: '<html></html>',
      });

      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await importGenerator(tree, options);

      expect(tree.exists('apps/my-astro-app/dist/index.html')).toBe(false);
    });

    it('should exclude .astro directory from copying', async () => {
      vol.fromJSON({
        [`${sourcePath}/.astro/types.d.ts`]: 'type definitions',
      });

      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await importGenerator(tree, options);

      expect(tree.exists('apps/my-astro-app/.astro/types.d.ts')).toBe(false);
    });

    it('should preserve directory structure when copying', async () => {
      vol.fromJSON({
        [`${sourcePath}/src/pages/blog/post-1.astro`]: 'post 1',
        [`${sourcePath}/src/pages/blog/post-2.astro`]: 'post 2',
        [`${sourcePath}/src/layouts/MainLayout.astro`]: 'layout',
      });

      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await importGenerator(tree, options);

      expect(tree.exists('apps/my-astro-app/src/pages/blog/post-1.astro')).toBe(
        true,
      );
      expect(tree.exists('apps/my-astro-app/src/pages/blog/post-2.astro')).toBe(
        true,
      );
      expect(
        tree.exists('apps/my-astro-app/src/layouts/MainLayout.astro'),
      ).toBe(true);
    });

    it('should copy file contents correctly', async () => {
      const expectedContent = '<h1>Test Content</h1>';
      vol.fromJSON({
        [`${sourcePath}/src/pages/test.astro`]: expectedContent,
      });

      const options: ImportGeneratorSchema = {
        source: sourcePath,
      };

      await importGenerator(tree, options);

      const actualContent = tree.read(
        'apps/my-astro-app/src/pages/test.astro',
        'utf-8',
      );
      expect(actualContent).toBe(expectedContent);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete import workflow with all options', async () => {
      tree.write(
        'tsconfig.base.json',
        JSON.stringify({
          compilerOptions: {
            paths: {},
          },
        }),
      );

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'my-website',
        directory: 'apps/websites/my-website',
        tags: 'astro,production,web',
        importPath: '@myorg/website',
        skipFormat: false,
      };

      await importGenerator(tree, options);

      // Verify project configuration
      const projectConfig = readProjectConfiguration(tree, 'my-website');
      expect(projectConfig.name).toBe('my-website');
      expect(projectConfig.root).toBe('apps/websites/my-website');
      expect(projectConfig.tags).toEqual(['astro', 'production', 'web']);

      // Verify files were copied
      expect(tree.exists('apps/websites/my-website/astro.config.mjs')).toBe(
        true,
      );
      expect(tree.exists('apps/websites/my-website/package.json')).toBe(true);

      // Verify tsconfig was updated
      const tsConfig = readJson(tree, 'tsconfig.base.json');
      expect(tsConfig.compilerOptions.paths['@myorg/website']).toBeDefined();
    });

    it('should derive project name from source directory when name not provided', async () => {
      const options: ImportGeneratorSchema = {
        source: sourcePath, // basename is 'my-astro-app'
      };

      await importGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-astro-app');
      expect(projectConfig.name).toBe('my-astro-app');
    });

    it('should handle source path with trailing slash', async () => {
      const options: ImportGeneratorSchema = {
        source: `${sourcePath}/`, // With trailing slash
      };

      await expect(importGenerator(tree, options)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should provide helpful error message when source is not valid', async () => {
      const options: ImportGeneratorSchema = {
        source: '/not/a/directory',
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /does not exist/i,
      );
    });

    it('should provide helpful error message when project name conflicts', async () => {
      tree.write(
        'apps/conflict-app/project.json',
        JSON.stringify({
          name: 'conflict-app',
          root: 'apps/conflict-app',
        }),
      );

      const options: ImportGeneratorSchema = {
        source: sourcePath,
        name: 'conflict-app',
      };

      await expect(importGenerator(tree, options)).rejects.toThrow(
        /conflict-app/i,
      );
    });
  });
});
