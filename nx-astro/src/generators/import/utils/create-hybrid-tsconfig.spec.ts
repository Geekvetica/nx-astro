import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { createHybridTsconfig } from './create-hybrid-tsconfig';

describe('createHybridTsconfig', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('creating hybrid TypeScript configuration', () => {
    it('should create tsconfig.base.json in project root', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const baseConfigPath = 'apps/my-app/tsconfig.base.json';
      expect(tree.exists(baseConfigPath)).toBe(true);
    });

    it('should create tsconfig.json in project root', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const configPath = 'apps/my-app/tsconfig.json';
      expect(tree.exists(configPath)).toBe(true);
    });

    it('should generate tsconfig.base.json with correct structure', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const baseConfig = JSON.parse(
        tree.read('apps/my-app/tsconfig.base.json', 'utf-8')!,
      );

      expect(baseConfig.extends).toBe('../../tsconfig.base.json');
      expect(baseConfig.compilerOptions).toBeDefined();
      expect(baseConfig.compilerOptions.jsx).toBe('react-jsx');
      expect(baseConfig.compilerOptions.jsxImportSource).toBe('react');
    });

    it('should generate tsconfig.json that extends local base', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const config = JSON.parse(
        tree.read('apps/my-app/tsconfig.json', 'utf-8')!,
      );

      expect(config.extends).toBe('./tsconfig.base.json');
    });

    it('should generate tsconfig.json with Astro-specific settings', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const config = JSON.parse(
        tree.read('apps/my-app/tsconfig.json', 'utf-8')!,
      );

      expect(config.include).toContain('.astro/types.d.ts');
      expect(config.include).toContain('**/*');
      expect(config.exclude).toContain('dist');
      expect(config.compilerOptions.baseUrl).toBe('.');
      expect(config.compilerOptions.paths).toBeDefined();
    });
  });

  describe('with different project directory structures', () => {
    it('should handle nested app directories', () => {
      createHybridTsconfig(tree, 'apps/websites/marketing');

      expect(tree.exists('apps/websites/marketing/tsconfig.base.json')).toBe(
        true,
      );
      expect(tree.exists('apps/websites/marketing/tsconfig.json')).toBe(true);

      const baseConfig = JSON.parse(
        tree.read('apps/websites/marketing/tsconfig.base.json', 'utf-8')!,
      );
      expect(baseConfig.extends).toBe('../../../tsconfig.base.json');
    });

    it('should handle lib directories', () => {
      createHybridTsconfig(tree, 'libs/shared/ui');

      expect(tree.exists('libs/shared/ui/tsconfig.base.json')).toBe(true);
      expect(tree.exists('libs/shared/ui/tsconfig.json')).toBe(true);

      const baseConfig = JSON.parse(
        tree.read('libs/shared/ui/tsconfig.base.json', 'utf-8')!,
      );
      expect(baseConfig.extends).toBe('../../../tsconfig.base.json');
    });

    it('should handle projects at workspace root', () => {
      createHybridTsconfig(tree, 'my-app');

      expect(tree.exists('my-app/tsconfig.base.json')).toBe(true);
      expect(tree.exists('my-app/tsconfig.json')).toBe(true);

      const baseConfig = JSON.parse(
        tree.read('my-app/tsconfig.base.json', 'utf-8')!,
      );
      expect(baseConfig.extends).toBe('../tsconfig.base.json');
    });

    it('should calculate correct offsetFromRoot for single-level directory', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const baseConfig = JSON.parse(
        tree.read('apps/my-app/tsconfig.base.json', 'utf-8')!,
      );
      // apps/my-app -> ../../
      expect(baseConfig.extends).toBe('../../tsconfig.base.json');
    });

    it('should calculate correct offsetFromRoot for two-level directory', () => {
      createHybridTsconfig(tree, 'apps/group/my-app');

      const baseConfig = JSON.parse(
        tree.read('apps/group/my-app/tsconfig.base.json', 'utf-8')!,
      );
      // apps/group/my-app -> ../../../
      expect(baseConfig.extends).toBe('../../../tsconfig.base.json');
    });
  });

  describe('when existing tsconfig files exist', () => {
    it('should replace existing tsconfig.json', () => {
      const projectRoot = 'apps/my-app';
      tree.write(
        `${projectRoot}/tsconfig.json`,
        JSON.stringify({ extends: 'astro/tsconfigs/strict' }),
      );

      createHybridTsconfig(tree, projectRoot);

      const config = JSON.parse(
        tree.read(`${projectRoot}/tsconfig.json`, 'utf-8')!,
      );
      // Should now extend local base, not astro/tsconfigs/strict
      expect(config.extends).toBe('./tsconfig.base.json');
    });

    it('should create tsconfig.base.json even if tsconfig.json exists', () => {
      const projectRoot = 'apps/my-app';
      tree.write(
        `${projectRoot}/tsconfig.json`,
        JSON.stringify({ extends: 'astro/tsconfigs/strict' }),
      );

      createHybridTsconfig(tree, projectRoot);

      expect(tree.exists(`${projectRoot}/tsconfig.base.json`)).toBe(true);
    });
  });

  describe('generated configuration integrity', () => {
    it('should create valid JSON files', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      // Should not throw when parsing
      expect(() => {
        JSON.parse(tree.read('apps/my-app/tsconfig.base.json', 'utf-8')!);
        JSON.parse(tree.read('apps/my-app/tsconfig.json', 'utf-8')!);
      }).not.toThrow();
    });

    it('should maintain configuration chain: project -> local base -> workspace base', () => {
      createHybridTsconfig(tree, 'apps/my-app');

      const projectConfig = JSON.parse(
        tree.read('apps/my-app/tsconfig.json', 'utf-8')!,
      );
      const localBase = JSON.parse(
        tree.read('apps/my-app/tsconfig.base.json', 'utf-8')!,
      );

      // Project extends local base
      expect(projectConfig.extends).toBe('./tsconfig.base.json');
      // Local base extends workspace base
      expect(localBase.extends).toBe('../../tsconfig.base.json');
    });
  });
});
