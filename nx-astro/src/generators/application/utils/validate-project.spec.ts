import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  validateExistingProject,
  findAstroConfigFile,
} from './validate-project';

describe('validate-project', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('validateExistingProject', () => {
    it('should validate project with astro.config.mjs', () => {
      tree.write('my-project/astro.config.mjs', 'export default {}');

      expect(() => validateExistingProject(tree, 'my-project')).not.toThrow();
    });

    it('should validate project with astro.config.js', () => {
      tree.write('my-project/astro.config.js', 'export default {}');

      expect(() => validateExistingProject(tree, 'my-project')).not.toThrow();
    });

    it('should validate project with astro.config.ts', () => {
      tree.write('my-project/astro.config.ts', 'export default {}');

      expect(() => validateExistingProject(tree, 'my-project')).not.toThrow();
    });

    it('should throw error when no config file exists', () => {
      expect(() => validateExistingProject(tree, 'my-project')).toThrow(
        'Cannot import project'
      );
    });

    it('should throw error with helpful message', () => {
      expect(() => validateExistingProject(tree, 'my-project')).toThrow(
        'astro.config.mjs, astro.config.js, astro.config.ts'
      );
    });

    it('should include project path in error message', () => {
      expect(() => validateExistingProject(tree, 'custom-path')).toThrow(
        'custom-path'
      );
    });
  });

  describe('findAstroConfigFile', () => {
    it('should find astro.config.mjs', () => {
      tree.write('my-project/astro.config.mjs', 'export default {}');

      const result = findAstroConfigFile(tree, 'my-project');

      expect(result).toBe('astro.config.mjs');
    });

    it('should find astro.config.js', () => {
      tree.write('my-project/astro.config.js', 'export default {}');

      const result = findAstroConfigFile(tree, 'my-project');

      expect(result).toBe('astro.config.js');
    });

    it('should find astro.config.ts', () => {
      tree.write('my-project/astro.config.ts', 'export default {}');

      const result = findAstroConfigFile(tree, 'my-project');

      expect(result).toBe('astro.config.ts');
    });

    it('should return null when no config found', () => {
      const result = findAstroConfigFile(tree, 'my-project');

      expect(result).toBeNull();
    });

    it('should prefer .mjs over .js when both exist', () => {
      tree.write('my-project/astro.config.mjs', 'export default {}');
      tree.write('my-project/astro.config.js', 'export default {}');

      const result = findAstroConfigFile(tree, 'my-project');

      expect(result).toBe('astro.config.mjs');
    });

    it('should work with nested paths', () => {
      tree.write('packages/web/astro.config.mjs', 'export default {}');

      const result = findAstroConfigFile(tree, 'packages/web');

      expect(result).toBe('astro.config.mjs');
    });
  });
});
