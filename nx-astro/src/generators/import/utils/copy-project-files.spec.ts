import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { vol } from 'memfs';
import { copyProjectFiles } from './copy-project-files';

// Mock the fs module
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

describe('copyProjectFiles', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe('basic file copying', () => {
    it('should copy files from source to target', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/README.md`]: '# My Project',
        [`${sourcePath}/package.json`]: '{"name": "my-project"}',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/README.md`)).toBe(true);
      expect(tree.exists(`${targetPath}/package.json`)).toBe(true);
      expect(tree.read(`${targetPath}/README.md`, 'utf-8')).toBe(
        '# My Project'
      );
    });

    it('should preserve directory structure', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/src/index.ts`]: 'console.log("hello");',
        [`${sourcePath}/src/components/Button.astro`]: '<button />',
        [`${sourcePath}/public/favicon.svg`]: '<svg />',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/src/index.ts`)).toBe(true);
      expect(tree.exists(`${targetPath}/src/components/Button.astro`)).toBe(
        true
      );
      expect(tree.exists(`${targetPath}/public/favicon.svg`)).toBe(true);
    });

    it('should handle nested directories', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/a/b/c/deep.ts`]: 'deep file',
        [`${sourcePath}/x/y/z/file.ts`]: 'another deep file',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/a/b/c/deep.ts`)).toBe(true);
      expect(tree.exists(`${targetPath}/x/y/z/file.ts`)).toBe(true);
    });
  });

  describe('file filtering', () => {
    it('should exclude node_modules', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/src/index.ts`]: 'code',
        [`${sourcePath}/node_modules/package/index.js`]: 'dependency',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/src/index.ts`)).toBe(true);
      expect(tree.exists(`${targetPath}/node_modules/package/index.js`)).toBe(
        false
      );
    });

    it('should exclude build outputs', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/src/index.ts`]: 'source',
        [`${sourcePath}/dist/bundle.js`]: 'built',
        [`${sourcePath}/.astro/types.d.ts`]: 'generated',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/src/index.ts`)).toBe(true);
      expect(tree.exists(`${targetPath}/dist/bundle.js`)).toBe(false);
      expect(tree.exists(`${targetPath}/.astro/types.d.ts`)).toBe(false);
    });

    it('should exclude .git directory', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/README.md`]: 'readme',
        [`${sourcePath}/.git/config`]: 'git config',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/README.md`)).toBe(true);
      expect(tree.exists(`${targetPath}/.git/config`)).toBe(false);
    });

    it('should exclude lock files', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/package.json`]: '{}',
        [`${sourcePath}/package-lock.json`]: '{}',
        [`${sourcePath}/yarn.lock`]: '',
        [`${sourcePath}/pnpm-lock.yaml`]: '',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/package.json`)).toBe(true);
      expect(tree.exists(`${targetPath}/package-lock.json`)).toBe(false);
      expect(tree.exists(`${targetPath}/yarn.lock`)).toBe(false);
      expect(tree.exists(`${targetPath}/pnpm-lock.yaml`)).toBe(false);
    });
  });

  describe('file content preservation', () => {
    it('should preserve text file content', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';
      const content = 'This is the file content\nWith multiple lines\n';

      vol.fromJSON({
        [`${sourcePath}/file.txt`]: content,
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.read(`${targetPath}/file.txt`, 'utf-8')).toBe(content);
    });

    it('should preserve JSON formatting', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';
      const content = '{\n  "name": "test",\n  "version": "1.0.0"\n}';

      vol.fromJSON({
        [`${sourcePath}/package.json`]: content,
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.read(`${targetPath}/package.json`, 'utf-8')).toBe(content);
    });
  });

  describe('empty directories', () => {
    it('should handle source with only excluded files', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/node_modules/package/index.js`]: 'dep',
        [`${sourcePath}/.git/config`]: 'git',
      });

      // Should not throw
      expect(() =>
        copyProjectFiles(sourcePath, targetPath, tree)
      ).not.toThrow();
    });

    it('should handle mixed included and excluded files', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/src/index.ts`]: 'source',
        [`${sourcePath}/node_modules/dep/index.js`]: 'excluded',
        [`${sourcePath}/README.md`]: 'readme',
        [`${sourcePath}/dist/bundle.js`]: 'excluded',
      });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/src/index.ts`)).toBe(true);
      expect(tree.exists(`${targetPath}/README.md`)).toBe(true);
      expect(tree.exists(`${targetPath}/node_modules/dep/index.js`)).toBe(
        false
      );
      expect(tree.exists(`${targetPath}/dist/bundle.js`)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw if source path does not exist', () => {
      const sourcePath = '/nonexistent';
      const targetPath = 'apps/target';

      expect(() => copyProjectFiles(sourcePath, targetPath, tree)).toThrow(
        /does not exist/i
      );
    });

    it('should provide helpful error message', () => {
      const sourcePath = '/missing-project';
      const targetPath = 'apps/target';

      expect(() => copyProjectFiles(sourcePath, targetPath, tree)).toThrow(
        sourcePath
      );
    });
  });
});
