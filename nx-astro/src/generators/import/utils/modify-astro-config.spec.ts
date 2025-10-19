import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { modifyAstroConfig } from './modify-astro-config';

describe('modifyAstroConfig', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('when astro.config.mjs exists', () => {
    it('should inject outDir into simple config export', () => {
      // Arrange
      const projectRoot = 'apps/my-app';
      const offsetFromRoot = '../../';
      const configContent = `export default {
  integrations: [],
};`;

      tree.write(`${projectRoot}/astro.config.mjs`, configContent);

      // Act
      modifyAstroConfig(tree, projectRoot, offsetFromRoot);

      // Assert
      const modifiedContent = tree.read(
        `${projectRoot}/astro.config.mjs`,
        'utf-8',
      );
      expect(modifiedContent).toContain('outDir');
      expect(modifiedContent).toContain('../../dist/apps/my-app');
    });

    it('should inject outDir into defineConfig wrapper', () => {
      // Arrange
      const projectRoot = 'apps/my-app';
      const offsetFromRoot = '../../';
      const configContent = `import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [],
});`;

      tree.write(`${projectRoot}/astro.config.mjs`, configContent);

      // Act
      modifyAstroConfig(tree, projectRoot, offsetFromRoot);

      // Assert
      const modifiedContent = tree.read(
        `${projectRoot}/astro.config.mjs`,
        'utf-8',
      );
      expect(modifiedContent).toContain('outDir');
      expect(modifiedContent).toContain('../../dist/apps/my-app');
      expect(modifiedContent).toContain('defineConfig');
    });

    it('should preserve existing properties', () => {
      // Arrange
      const projectRoot = 'apps/my-app';
      const offsetFromRoot = '../../';
      const configContent = `export default {
  output: 'server',
  integrations: [],
  vite: { build: { target: 'esnext' } },
};`;

      tree.write(`${projectRoot}/astro.config.mjs`, configContent);

      // Act
      modifyAstroConfig(tree, projectRoot, offsetFromRoot);

      // Assert
      const modifiedContent = tree.read(
        `${projectRoot}/astro.config.mjs`,
        'utf-8',
      );
      expect(modifiedContent).toContain('outDir');
      expect(modifiedContent).toContain("output: 'server'");
      expect(modifiedContent).toContain('integrations: []');
      expect(modifiedContent).toContain('vite:');
    });

    it('should calculate correct relative path for nested projects', () => {
      // Arrange
      const projectRoot = 'apps/websites/marketing';
      const offsetFromRoot = '../../../';
      const configContent = `export default {
  integrations: [],
};`;

      tree.write(`${projectRoot}/astro.config.mjs`, configContent);

      // Act
      modifyAstroConfig(tree, projectRoot, offsetFromRoot);

      // Assert
      const modifiedContent = tree.read(
        `${projectRoot}/astro.config.mjs`,
        'utf-8',
      );
      expect(modifiedContent).toContain('outDir');
      expect(modifiedContent).toContain(
        '../../../dist/apps/websites/marketing',
      );
    });

    it('should not inject outDir if it already exists', () => {
      // Arrange
      const projectRoot = 'apps/my-app';
      const offsetFromRoot = '../../';
      const configContent = `export default {
  outDir: './custom-dist',
  integrations: [],
};`;

      tree.write(`${projectRoot}/astro.config.mjs`, configContent);

      // Act
      modifyAstroConfig(tree, projectRoot, offsetFromRoot);

      // Assert
      const modifiedContent = tree.read(
        `${projectRoot}/astro.config.mjs`,
        'utf-8',
      );
      // Should still have the original outDir
      expect(modifiedContent).toContain('outDir');
      expect(modifiedContent).toContain('./custom-dist');
      // Should NOT have duplicated outDir
      const outDirCount = (modifiedContent.match(/outDir/g) || []).length;
      expect(outDirCount).toBe(1);
    });
  });

  describe('when astro.config.mjs does not exist', () => {
    it('should do nothing if config file is missing', () => {
      // Arrange
      const projectRoot = 'apps/my-app';
      const offsetFromRoot = '../../';

      // Act & Assert - should not throw
      expect(() => {
        modifyAstroConfig(tree, projectRoot, offsetFromRoot);
      }).not.toThrow();
    });
  });
});
