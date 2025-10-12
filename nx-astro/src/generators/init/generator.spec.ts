import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readJson, updateJson } from '@nx/devkit';
import { initGenerator } from './generator';
import { InitGeneratorSchema } from './schema';

describe('init generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('plugin registration', () => {
    it('should add plugin to nx.json plugins array', async () => {
      await initGenerator(tree, {});

      const nxJson = readJson(tree, 'nx.json');
      expect(nxJson.plugins).toBeDefined();
      expect(Array.isArray(nxJson.plugins)).toBe(true);
      expect(nxJson.plugins.length).toBeGreaterThan(0);
    });

    it('should add plugin with default options', async () => {
      await initGenerator(tree, {});

      const nxJson = readJson(tree, 'nx.json');
      const plugin = nxJson.plugins.find(
        (p: any) =>
          (typeof p === 'object' && p.plugin === '@geekvetica/nx-astro') || p === '@geekvetica/nx-astro'
      );

      expect(plugin).toBeDefined();
      if (typeof plugin === 'object') {
        expect(plugin.options).toBeDefined();
        expect(plugin.options.devTargetName).toBe('dev');
        expect(plugin.options.buildTargetName).toBe('build');
        expect(plugin.options.previewTargetName).toBe('preview');
        expect(plugin.options.checkTargetName).toBe('check');
        expect(plugin.options.testTargetName).toBe('test');
        expect(plugin.options.syncTargetName).toBe('sync');
      }
    });

    it('should not duplicate plugin if already registered', async () => {
      // Register plugin first time
      await initGenerator(tree, {});

      // Try to register again
      await initGenerator(tree, {});

      const nxJson = readJson(tree, 'nx.json');
      const pluginCount = nxJson.plugins.filter(
        (p: any) =>
          (typeof p === 'object' && p.plugin === '@geekvetica/nx-astro') || p === '@geekvetica/nx-astro'
      ).length;

      expect(pluginCount).toBe(1);
    });

    it('should work with empty plugins array', async () => {
      // Ensure plugins array is empty
      updateJson(tree, 'nx.json', (json) => {
        json.plugins = [];
        return json;
      });

      await initGenerator(tree, {});

      const nxJson = readJson(tree, 'nx.json');
      expect(nxJson.plugins.length).toBe(1);
    });

    it('should work with undefined plugins property', async () => {
      // Remove plugins property
      updateJson(tree, 'nx.json', (json) => {
        delete json.plugins;
        return json;
      });

      await initGenerator(tree, {});

      const nxJson = readJson(tree, 'nx.json');
      expect(nxJson.plugins).toBeDefined();
      expect(nxJson.plugins.length).toBe(1);
    });

    it('should preserve existing plugins', async () => {
      // Add some existing plugins
      updateJson(tree, 'nx.json', (json) => {
        json.plugins = ['@nx/jest', '@nx/webpack'];
        return json;
      });

      await initGenerator(tree, {});

      const nxJson = readJson(tree, 'nx.json');
      expect(nxJson.plugins.length).toBe(3);
      expect(nxJson.plugins).toContain('@nx/jest');
      expect(nxJson.plugins).toContain('@nx/webpack');
    });
  });

  describe('dependency management', () => {
    it('should add Astro dependencies to package.json', async () => {
      await initGenerator(tree, {});

      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['astro']).toBeDefined();
      expect(packageJson.dependencies['@astrojs/node']).toBeDefined();
    });

    it('should add dependencies with correct versions', async () => {
      await initGenerator(tree, {});

      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies['astro']).toMatch(/^\^?\d+\.\d+\.\d+$/);
      expect(packageJson.dependencies['@astrojs/node']).toMatch(
        /^\^?\d+\.\d+\.\d+$/
      );
    });

    it('should respect skipPackageJson option', async () => {
      const options: InitGeneratorSchema = { skipPackageJson: true };

      await initGenerator(tree, options);

      const packageJson = readJson(tree, 'package.json');
      expect(packageJson.dependencies?.['astro']).toBeUndefined();
      expect(packageJson.dependencies?.['@astrojs/node']).toBeUndefined();
    });

    it('should not overwrite existing Astro dependencies', async () => {
      // Add existing Astro dependency
      updateJson(tree, 'package.json', (json) => {
        json.dependencies = json.dependencies || {};
        json.dependencies['astro'] = '^4.0.0';
        return json;
      });

      await initGenerator(tree, {});

      const packageJson = readJson(tree, 'package.json');
      // Should keep existing version
      expect(packageJson.dependencies['astro']).toBe('^4.0.0');
    });
  });

  describe('error handling', () => {
    it('should handle missing nx.json gracefully', async () => {
      // Remove nx.json
      tree.delete('nx.json');

      await expect(initGenerator(tree, {})).rejects.toThrow();
    });

    it('should handle missing package.json when not skipping', async () => {
      // Remove package.json
      tree.delete('package.json');

      await expect(initGenerator(tree, {})).rejects.toThrow();
    });

    it('should not fail when package.json is missing but skipPackageJson is true', async () => {
      // Remove package.json
      tree.delete('package.json');

      await expect(
        initGenerator(tree, { skipPackageJson: true })
      ).resolves.not.toThrow();
    });
  });
});
