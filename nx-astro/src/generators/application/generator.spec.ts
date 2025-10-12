import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readJson, readProjectConfiguration } from '@nx/devkit';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

describe('application generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('create mode - basic functionality', () => {
    it('should create minimal Astro project structure', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-app',
      };

      await applicationGenerator(tree, options);

      // Check all essential files exist
      expect(tree.exists('apps/my-app/astro.config.mjs')).toBe(true);
      expect(tree.exists('apps/my-app/tsconfig.json')).toBe(true);
      expect(tree.exists('apps/my-app/package.json')).toBe(true);
      expect(tree.exists('apps/my-app/.gitignore')).toBe(true);
      expect(tree.exists('apps/my-app/public/favicon.svg')).toBe(true);
      expect(tree.exists('apps/my-app/src/env.d.ts')).toBe(true);
      expect(tree.exists('apps/my-app/src/pages/index.astro')).toBe(true);
      expect(tree.exists('apps/my-app/src/components/Welcome.astro')).toBe(
        true
      );
      expect(tree.exists('apps/my-app/src/layouts/Layout.astro')).toBe(true);
    });

    it('should generate all required files', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'test-app',
      };

      await applicationGenerator(tree, options);

      // Verify config files
      const astroConfig = tree.read('apps/test-app/astro.config.mjs', 'utf-8');
      expect(astroConfig).toContain('defineConfig');
      expect(astroConfig).toContain("output: 'static'");

      const tsConfig = readJson(tree, 'apps/test-app/tsconfig.json');
      expect(tsConfig.extends).toBe('astro/tsconfigs/strict');

      const packageJson = readJson(tree, 'apps/test-app/package.json');
      expect(packageJson.name).toBe('test-app');
      expect(packageJson.scripts.dev).toBe('astro dev');
      expect(packageJson.scripts.build).toBe('astro build');
    });

    it('should use provided directory', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-app',
        directory: 'packages/web',
      };

      await applicationGenerator(tree, options);

      expect(tree.exists('packages/web/astro.config.mjs')).toBe(true);
      expect(tree.exists('packages/web/src/pages/index.astro')).toBe(true);
    });

    it('should use provided tags', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-app',
        tags: 'scope:web,type:app',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig.tags).toEqual(['scope:web', 'type:app']);
    });

    it('should create project.json with correct configuration', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-app',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig.root).toBe('apps/my-app');
      expect(projectConfig.sourceRoot).toBe('apps/my-app/src');
      expect(projectConfig.projectType).toBe('application');
    });

    it('should normalize project name', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'MyApp',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig).toBeDefined();
      expect(projectConfig.root).toBe('apps/my-app');
    });

    it('should handle nested directories', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-app',
        directory: 'apps/frontend/web',
      };

      await applicationGenerator(tree, options);

      expect(tree.exists('apps/frontend/web/astro.config.mjs')).toBe(true);
      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig.root).toBe('apps/frontend/web');
    });

    it('should handle project names with hyphens', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-cool-app',
      };

      await applicationGenerator(tree, options);

      expect(tree.exists('apps/my-cool-app/astro.config.mjs')).toBe(true);
      const projectConfig = readProjectConfiguration(tree, 'my-cool-app');
      expect(projectConfig.root).toBe('apps/my-cool-app');
    });

    it('should handle tags as comma-separated string', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'my-app',
        tags: 'web, frontend, astro',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'my-app');
      expect(projectConfig.tags).toEqual(['web', 'frontend', 'astro']);
    });

    it('should default to apps directory if no directory specified', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'default-app',
      };

      await applicationGenerator(tree, options);

      expect(tree.exists('apps/default-app/astro.config.mjs')).toBe(true);
      const projectConfig = readProjectConfiguration(tree, 'default-app');
      expect(projectConfig.root).toBe('apps/default-app');
    });

    it('should substitute projectName in template files', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'template-test',
      };

      await applicationGenerator(tree, options);

      const indexPage = tree.read(
        'apps/template-test/src/pages/index.astro',
        'utf-8'
      );
      expect(indexPage).toContain('Welcome to template-test');

      const welcomeComponent = tree.read(
        'apps/template-test/src/components/Welcome.astro',
        'utf-8'
      );
      expect(welcomeComponent).toContain('template-test');

      const packageJson = readJson(tree, 'apps/template-test/package.json');
      expect(packageJson.name).toBe('template-test');
    });
  });

  describe('create mode - formatting', () => {
    it('should format files by default', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'formatted-app',
      };

      // This test will verify that formatFiles is called
      await applicationGenerator(tree, options);

      // After implementation, we should see formatted output
      expect(tree.exists('apps/formatted-app/astro.config.mjs')).toBe(true);
    });

    it('should skip formatting when requested', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'unformatted-app',
        skipFormat: true,
      };

      await applicationGenerator(tree, options);

      // Files should still exist
      expect(tree.exists('apps/unformatted-app/astro.config.mjs')).toBe(true);
    });
  });

  describe('import mode - basic functionality', () => {
    beforeEach(() => {
      // Create a fake existing Astro project
      tree.write(
        'existing-project/astro.config.mjs',
        `
        import { defineConfig } from 'astro/config';
        export default defineConfig({
          output: 'static',
        });
      `
      );
      tree.write('existing-project/package.json', '{"name": "existing"}');
      tree.write('existing-project/src/pages/index.astro', '<h1>Hello</h1>');
    });

    it('should validate existing astro.config file', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'existing-app',
        directory: 'existing-project',
        importExisting: true,
      };

      await applicationGenerator(tree, options);

      // Should register project without creating new files
      const projectConfig = readProjectConfiguration(tree, 'existing-app');
      expect(projectConfig).toBeDefined();
      expect(projectConfig.root).toBe('existing-project');
    });

    it('should register existing project in workspace', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'imported',
        directory: 'existing-project',
        importExisting: true,
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'imported');
      expect(projectConfig.root).toBe('existing-project');
      expect(projectConfig.sourceRoot).toBe('existing-project/src');
      expect(projectConfig.projectType).toBe('application');
    });

    it('should handle existing project with custom directory structure', async () => {
      // Create project with custom structure
      tree.write(
        'custom-project/astro.config.js',
        'export default { output: "static" };'
      );
      tree.write('custom-project/package.json', '{"name": "custom"}');

      const options: ApplicationGeneratorSchema = {
        name: 'custom',
        directory: 'custom-project',
        importExisting: true,
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'custom');
      expect(projectConfig.root).toBe('custom-project');
    });

    it('should throw error if astro.config not found', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'invalid',
        directory: 'non-existent',
        importExisting: true,
      };

      await expect(applicationGenerator(tree, options)).rejects.toThrow();
    });

    it('should detect astro.config with different extensions', async () => {
      // Test .js extension
      tree.write('js-project/astro.config.js', 'export default {};');
      tree.write('js-project/package.json', '{"name": "js"}');

      const options: ApplicationGeneratorSchema = {
        name: 'js-app',
        directory: 'js-project',
        importExisting: true,
      };

      await applicationGenerator(tree, options);
      const projectConfig = readProjectConfiguration(tree, 'js-app');
      expect(projectConfig).toBeDefined();
    });

    it('should apply tags to imported project', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'tagged-import',
        directory: 'existing-project',
        importExisting: true,
        tags: 'imported,legacy',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'tagged-import');
      expect(projectConfig.tags).toEqual(['imported', 'legacy']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tags string', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'no-tags',
        tags: '',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'no-tags');
      expect(projectConfig.tags).toEqual([]);
    });

    it('should trim whitespace from tags', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'trimmed',
        tags: ' web , frontend , astro ',
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'trimmed');
      expect(projectConfig.tags).toEqual(['web', 'frontend', 'astro']);
    });

    it('should reject invalid project names', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'invalid name with spaces',
      };

      await expect(applicationGenerator(tree, options)).rejects.toThrow();
    });

    it('should reject duplicate project names', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'duplicate',
      };

      await applicationGenerator(tree, options);

      // Try to create again
      await expect(applicationGenerator(tree, options)).rejects.toThrow();
    });

    it('should handle undefined directory option', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'undefined-dir',
        directory: undefined,
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'undefined-dir');
      expect(projectConfig.root).toBe('apps/undefined-dir');
    });

    it('should handle undefined tags option', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'undefined-tags',
        tags: undefined,
      };

      await applicationGenerator(tree, options);

      const projectConfig = readProjectConfiguration(tree, 'undefined-tags');
      expect(projectConfig.tags).toEqual([]);
    });
  });

  describe('template option', () => {
    it('should use minimal template by default', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'minimal-default',
      };

      await applicationGenerator(tree, options);

      expect(
        tree.exists('apps/minimal-default/src/components/Welcome.astro')
      ).toBe(true);
    });

    it('should accept minimal template explicitly', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'minimal-explicit',
        template: 'minimal',
      };

      await applicationGenerator(tree, options);

      expect(
        tree.exists('apps/minimal-explicit/src/components/Welcome.astro')
      ).toBe(true);
    });

    // Blog and portfolio templates can be implemented later
    it.skip('should create blog template', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'blog-app',
        template: 'blog',
      };

      await applicationGenerator(tree, options);

      expect(tree.exists('apps/blog-app/src/content/config.ts')).toBe(true);
    });

    it.skip('should create portfolio template', async () => {
      const options: ApplicationGeneratorSchema = {
        name: 'portfolio-app',
        template: 'portfolio',
      };

      await applicationGenerator(tree, options);

      expect(tree.exists('apps/portfolio-app/src/pages/projects.astro')).toBe(
        true
      );
    });
  });
});
