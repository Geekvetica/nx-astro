import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { vol } from 'memfs';
import * as fs from 'fs';
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
        '# My Project',
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
        true,
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
        false,
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
        copyProjectFiles(sourcePath, targetPath, tree),
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
        false,
      );
      expect(tree.exists(`${targetPath}/dist/bundle.js`)).toBe(false);
    });
  });

  describe('symbolic links', () => {
    it('should not copy symlinked files, even when they point outside the source', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/README.md`]: '# My Project',
        '/outside/secret.txt': 'secret',
      });
      vol.symlinkSync('/outside/secret.txt', `${sourcePath}/linked-secret.txt`);

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/README.md`)).toBe(true);
      expect(tree.exists(`${targetPath}/linked-secret.txt`)).toBe(false);
    });

    it('should not follow symlinked directories', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';

      vol.fromJSON({
        [`${sourcePath}/src/index.ts`]: 'export {};',
        '/outside/dir/file.txt': 'outside',
      });
      vol.symlinkSync('/outside/dir', `${sourcePath}/linked-dir`);

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/src/index.ts`)).toBe(true);
      expect(tree.exists(`${targetPath}/linked-dir/file.txt`)).toBe(false);
    });

    it('should not copy a file swapped for a symlink after it was listed', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';
      const warn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      vol.fromJSON({
        [`${sourcePath}/README.md`]: '# My Project',
        '/outside/secret.txt': 'secret',
      });
      const realOpenSync = fs.openSync;
      const openSync = jest
        .spyOn(fs, 'openSync')
        .mockImplementationOnce((path, flags) => {
          // Simulate the race: swap the listed file just before it is opened
          vol.unlinkSync(path as string);
          vol.symlinkSync('/outside/secret.txt', path as string);
          return realOpenSync(path, flags);
        });

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/README.md`)).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not copy file README.md'),
      );
      openSync.mockRestore();
      warn.mockRestore();
    });

    it('should not copy an entry that is no longer a regular file when opened', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';
      const warn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      vol.fromJSON({ [`${sourcePath}/README.md`]: '# My Project' });
      const fstatSync = jest
        .spyOn(fs, 'fstatSync')
        .mockImplementationOnce(() => ({ isFile: () => false }) as fs.Stats);

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(tree.exists(`${targetPath}/README.md`)).toBe(false);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not copy file README.md'),
      );
      fstatSync.mockRestore();
      warn.mockRestore();
    });

    it('should warn about each skipped symlink', () => {
      const sourcePath = '/source-project';
      const targetPath = 'apps/target-project';
      const warn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      vol.fromJSON({
        [`${sourcePath}/README.md`]: '# My Project',
        '/outside/secret.txt': 'secret',
      });
      vol.symlinkSync('/outside/secret.txt', `${sourcePath}/linked-secret.txt`);

      copyProjectFiles(sourcePath, targetPath, tree);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping symbolic link linked-secret.txt'),
      );
      warn.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should throw if source path does not exist', () => {
      const sourcePath = '/nonexistent';
      const targetPath = 'apps/target';

      expect(() => copyProjectFiles(sourcePath, targetPath, tree)).toThrow(
        /does not exist/i,
      );
    });

    it('should provide helpful error message', () => {
      const sourcePath = '/missing-project';
      const targetPath = 'apps/target';

      expect(() => copyProjectFiles(sourcePath, targetPath, tree)).toThrow(
        sourcePath,
      );
    });
  });
});
