import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readJson } from '@nx/devkit';
import { normalizeOptions } from './normalize-options';
import { ImportGeneratorSchema } from '../schema';

describe('normalizeOptions', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('project name normalization', () => {
    it('should use provided name when given', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-custom-name',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectName).toBe('my-custom-name');
    });

    it('should extract name from source directory when not provided', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/my-astro-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectName).toBe('my-astro-app');
    });

    it('should convert name to kebab-case', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'MyAstroApp',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectName).toBe('my-astro-app');
    });

    it('should handle source paths with trailing slashes', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/my-project/',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectName).toBe('my-project');
    });
  });

  describe('directory normalization', () => {
    it('should use provided directory when given', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
        directory: 'packages/apps/my-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectRoot).toBe('packages/apps/my-app');
      expect(normalized.projectDirectory).toBe('packages/apps/my-app');
    });

    it('should default to apps/{projectName} when not provided', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectRoot).toBe('apps/my-app');
      expect(normalized.projectDirectory).toBe('apps/my-app');
    });

    it('should normalize directory paths', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
        directory: './apps//my-app/',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.projectRoot).toBe('apps/my-app');
    });
  });

  describe('source path normalization', () => {
    it('should convert relative paths to absolute', () => {
      const options: ImportGeneratorSchema = {
        source: './my-project',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.sourcePath).toContain('my-project');
      expect(normalized.sourcePath).toMatch(/^\//); // Should start with /
    });

    it('should preserve absolute paths', () => {
      const options: ImportGeneratorSchema = {
        source: '/absolute/path/to/project',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.sourcePath).toBe('/absolute/path/to/project');
    });

    it('should extract source project name from path', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/my-source-project',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.sourceProjectName).toBe('my-source-project');
    });
  });

  describe('tags parsing', () => {
    it('should parse comma-separated tags', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        tags: 'astro,web,public-facing',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.parsedTags).toEqual(['astro', 'web', 'public-facing']);
    });

    it('should trim whitespace from tags', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        tags: 'astro , web , frontend',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.parsedTags).toEqual(['astro', 'web', 'frontend']);
    });

    it('should filter out empty tags', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        tags: 'astro,,web,',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.parsedTags).toEqual(['astro', 'web']);
    });

    it('should return empty array when tags not provided', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.parsedTags).toEqual([]);
    });

    it('should return empty array when tags is empty string', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        tags: '',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.parsedTags).toEqual([]);
    });
  });

  describe('boolean flags', () => {
    it('should default skipFormat to false', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.skipFormat).toBe(false);
    });

    it('should respect skipFormat when provided', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        skipFormat: true,
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.skipFormat).toBe(true);
    });

    it('should default skipInstall to false', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.skipInstall).toBe(false);
    });

    it('should respect skipInstall when provided', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        skipInstall: true,
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.skipInstall).toBe(true);
    });
  });

  describe('import path generation', () => {
    it('should use provided importPath when given', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
        importPath: '@custom/my-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.importPath).toBe('@custom/my-app');
    });

    it('should generate importPath from workspace name and project name', () => {
      // Update nx.json to set workspace name
      tree.write(
        'nx.json',
        JSON.stringify({
          npmScope: 'myorg',
        })
      );

      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.importPath).toBe('@myorg/my-app');
    });

    it('should handle missing npmScope in nx.json', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
      };

      const normalized = normalizeOptions(tree, options);

      // Should use project name from package.json or default
      expect(normalized.importPath).toBeDefined();
    });

    it('should read workspace name from root package.json if nx.json has no npmScope', () => {
      // Set package.json name
      const packageJson = readJson(tree, 'package.json');
      packageJson.name = 'workspace-name';
      tree.write('package.json', JSON.stringify(packageJson));

      const options: ImportGeneratorSchema = {
        source: '/path/to/project',
        name: 'my-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized.importPath).toBe('@workspace-name/my-app');
    });
  });

  describe('complete normalization', () => {
    it('should return all normalized properties', () => {
      const options: ImportGeneratorSchema = {
        source: '/path/to/my-source-app',
        name: 'my-app',
        directory: 'apps/my-app',
        tags: 'astro,web',
        skipFormat: true,
        skipInstall: false,
        importPath: '@myorg/my-app',
      };

      const normalized = normalizeOptions(tree, options);

      expect(normalized).toEqual({
        projectName: 'my-app',
        projectRoot: 'apps/my-app',
        projectDirectory: 'apps/my-app',
        sourcePath: '/path/to/my-source-app',
        sourceProjectName: 'my-source-app',
        parsedTags: ['astro', 'web'],
        skipFormat: true,
        skipInstall: false,
        importPath: '@myorg/my-app',
      });
    });
  });
});
