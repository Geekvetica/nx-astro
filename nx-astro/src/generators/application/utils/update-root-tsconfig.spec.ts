import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { updateRootTsconfig } from './update-root-tsconfig';

describe('updateRootTsconfig', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('when root tsconfig.json does not exist', () => {
    it('should create root tsconfig.json with correct structure', () => {
      updateRootTsconfig(tree, 'apps/my-app');

      expect(tree.exists('tsconfig.json')).toBe(true);
      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);

      expect(content).toEqual({
        extends: './tsconfig.base.json',
        compileOnSave: false,
        files: [],
        include: [],
        references: [{ path: './apps/my-app' }],
      });
    });

    it('should add project reference when creating new root tsconfig', () => {
      updateRootTsconfig(tree, 'apps/test-app');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toContainEqual({ path: './apps/test-app' });
    });
  });

  describe('when root tsconfig.json already exists', () => {
    beforeEach(() => {
      tree.write(
        'tsconfig.json',
        JSON.stringify({
          extends: './tsconfig.base.json',
          compileOnSave: false,
          files: [],
          include: [],
          references: [{ path: './apps/existing-app' }],
        }),
      );
    });

    it('should add new project reference to existing references', () => {
      updateRootTsconfig(tree, 'apps/new-app');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toHaveLength(2);
      expect(content.references).toContainEqual({
        path: './apps/existing-app',
      });
      expect(content.references).toContainEqual({ path: './apps/new-app' });
    });

    it('should not duplicate existing project reference', () => {
      updateRootTsconfig(tree, 'apps/existing-app');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toHaveLength(1);
      expect(content.references).toContainEqual({
        path: './apps/existing-app',
      });
    });

    it('should preserve other tsconfig properties', () => {
      tree.write(
        'tsconfig.json',
        JSON.stringify({
          extends: './tsconfig.base.json',
          compileOnSave: false,
          files: [],
          include: [],
          references: [],
          customProperty: 'custom-value',
        }),
      );

      updateRootTsconfig(tree, 'apps/my-app');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.customProperty).toBe('custom-value');
      expect(content.references).toHaveLength(1);
    });
  });

  describe('when root tsconfig.json exists but has no references array', () => {
    it('should create references array and add project', () => {
      tree.write(
        'tsconfig.json',
        JSON.stringify({
          extends: './tsconfig.base.json',
          compileOnSave: false,
          files: [],
          include: [],
        }),
      );

      updateRootTsconfig(tree, 'apps/my-app');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toBeDefined();
      expect(content.references).toEqual([{ path: './apps/my-app' }]);
    });
  });

  describe('with different project directory structures', () => {
    it('should handle nested app directories', () => {
      updateRootTsconfig(tree, 'apps/websites/marketing');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toContainEqual({
        path: './apps/websites/marketing',
      });
    });

    it('should handle lib directories', () => {
      updateRootTsconfig(tree, 'libs/shared/ui');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toContainEqual({ path: './libs/shared/ui' });
    });

    it('should handle projects at workspace root', () => {
      updateRootTsconfig(tree, 'my-app');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toContainEqual({ path: './my-app' });
    });
  });

  describe('with multiple projects', () => {
    it('should handle adding multiple projects sequentially', () => {
      updateRootTsconfig(tree, 'apps/app1');
      updateRootTsconfig(tree, 'apps/app2');
      updateRootTsconfig(tree, 'libs/lib1');

      const content = JSON.parse(tree.read('tsconfig.json', 'utf-8')!);
      expect(content.references).toHaveLength(3);
      expect(content.references).toContainEqual({ path: './apps/app1' });
      expect(content.references).toContainEqual({ path: './apps/app2' });
      expect(content.references).toContainEqual({ path: './libs/lib1' });
    });
  });
});
