import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { validateTargetDirectory } from './validate-target-directory';

describe('validateTargetDirectory', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('valid directories', () => {
    it('should accept non-existent directory paths', () => {
      expect(() =>
        validateTargetDirectory(tree, 'apps/my-new-app')
      ).not.toThrow();
    });

    it('should accept nested directory paths', () => {
      expect(() =>
        validateTargetDirectory(tree, 'apps/websites/my-site')
      ).not.toThrow();
      expect(() =>
        validateTargetDirectory(tree, 'packages/libs/shared')
      ).not.toThrow();
    });

    it('should accept directories with hyphens', () => {
      expect(() =>
        validateTargetDirectory(tree, 'apps/my-astro-app')
      ).not.toThrow();
    });

    it('should accept directories starting with letters', () => {
      expect(() => validateTargetDirectory(tree, 'myapps/test')).not.toThrow();
    });
  });

  describe('existing directories', () => {
    it('should throw if directory already exists', () => {
      // Create a directory with a file in it
      tree.write('apps/existing-app/README.md', '# Existing App');

      expect(() => validateTargetDirectory(tree, 'apps/existing-app')).toThrow(
        /already exists/i
      );
    });

    it('should throw if directory exists with multiple files', () => {
      tree.write('apps/my-app/package.json', '{}');
      tree.write('apps/my-app/src/index.ts', '');

      expect(() => validateTargetDirectory(tree, 'apps/my-app')).toThrow(
        /already exists/i
      );
    });

    it('should not throw if parent directory exists but target does not', () => {
      tree.write('apps/other-app/README.md', '# Other App');

      expect(() =>
        validateTargetDirectory(tree, 'apps/my-new-app')
      ).not.toThrow();
    });

    it('should throw if deeply nested directory exists', () => {
      tree.write('apps/websites/public/my-site/index.html', '<html></html>');

      expect(() =>
        validateTargetDirectory(tree, 'apps/websites/public/my-site')
      ).toThrow(/already exists/i);
    });
  });

  describe('path normalization', () => {
    it('should normalize paths with trailing slashes', () => {
      tree.write('apps/my-app/README.md', '');

      expect(() => validateTargetDirectory(tree, 'apps/my-app/')).toThrow(
        /already exists/i
      );
    });

    it('should normalize paths with multiple slashes', () => {
      tree.write('apps/my-app/README.md', '');

      expect(() => validateTargetDirectory(tree, 'apps//my-app')).toThrow(
        /already exists/i
      );
    });

    it('should handle relative path notation', () => {
      expect(() =>
        validateTargetDirectory(tree, './apps/new-app')
      ).not.toThrow();
    });
  });

  describe('error messages', () => {
    it('should include directory path in error message', () => {
      const dirPath = 'apps/my-app';
      tree.write(`${dirPath}/README.md`, '');

      expect(() => validateTargetDirectory(tree, dirPath)).toThrow(dirPath);
    });

    it('should provide helpful error message for existing directory', () => {
      tree.write('apps/my-app/package.json', '{}');

      expect(() => validateTargetDirectory(tree, 'apps/my-app')).toThrow(
        /choose.*different.*directory/i
      );
    });
  });
});
