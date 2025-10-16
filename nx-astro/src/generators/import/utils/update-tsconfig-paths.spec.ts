import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { updateTsconfigPaths } from './update-tsconfig-paths';
import { NormalizedImportOptions } from './normalize-options';

describe('updateTsconfigPaths', () => {
  let tree: Tree;
  let options: NormalizedImportOptions;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    options = {
      projectName: 'my-astro-app',
      projectRoot: 'apps/my-astro-app',
      projectDirectory: 'apps/my-astro-app',
      sourcePath: '/path/to/source',
      sourceProjectName: 'my-astro-app',
      parsedTags: ['astro', 'web'],
      skipFormat: false,
      skipInstall: false,
      importPath: '@myorg/my-astro-app',
    };
  });

  it('should add path alias to tsconfig.base.json', () => {
    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@myorg/my-astro-app']).toEqual([
      'apps/my-astro-app/src/index.ts',
    ]);
  });

  it('should not add path alias when importPath is undefined', () => {
    options.importPath = undefined;

    const originalTsconfig = JSON.parse(
      tree.read('tsconfig.base.json', 'utf-8')!
    );

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig).toEqual(originalTsconfig);
  });

  it('should not duplicate existing path mappings', () => {
    // Add path mapping first time
    updateTsconfigPaths(tree, options);

    // Try to add it again
    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths['@myorg/my-astro-app']).toEqual([
      'apps/my-astro-app/src/index.ts',
    ]);
    // Should still be a single entry, not duplicated
    expect(Object.keys(tsconfig.compilerOptions.paths).length).toBe(1);
  });

  it('should handle missing compilerOptions gracefully', () => {
    // Create tsconfig without compilerOptions
    tree.write('tsconfig.base.json', JSON.stringify({}));

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@myorg/my-astro-app']).toEqual([
      'apps/my-astro-app/src/index.ts',
    ]);
  });

  it('should handle missing paths section', () => {
    // Create tsconfig with compilerOptions but no paths
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          target: 'es2015',
        },
      })
    );

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@myorg/my-astro-app']).toEqual([
      'apps/my-astro-app/src/index.ts',
    ]);
  });

  it('should preserve existing path mappings', () => {
    // Create tsconfig with existing paths
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@existing/lib': ['libs/existing/src/index.ts'],
          },
        },
      })
    );

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths['@existing/lib']).toEqual([
      'libs/existing/src/index.ts',
    ]);
    expect(tsconfig.compilerOptions.paths['@myorg/my-astro-app']).toEqual([
      'apps/my-astro-app/src/index.ts',
    ]);
  });

  it('should use correct path format with projectRoot and src/index.ts', () => {
    options.projectRoot = 'custom/path/my-app';
    options.importPath = '@scope/my-app';

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths['@scope/my-app']).toEqual([
      'custom/path/my-app/src/index.ts',
    ]);
  });

  it('should handle projectRoot without leading slash', () => {
    options.projectRoot = 'apps/test-app';
    options.importPath = '@test/app';

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths['@test/app']).toEqual([
      'apps/test-app/src/index.ts',
    ]);
  });

  it('should update existing path mapping with same importPath', () => {
    // Create tsconfig with existing path for the same importPath
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@myorg/my-astro-app': ['old/path/src/index.ts'],
          },
        },
      })
    );

    updateTsconfigPaths(tree, options);

    const tsconfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8')!);
    expect(tsconfig.compilerOptions.paths['@myorg/my-astro-app']).toEqual([
      'apps/my-astro-app/src/index.ts',
    ]);
  });

  it('should skip gracefully when tsconfig.base.json does not exist', () => {
    // Delete tsconfig.base.json
    tree.delete('tsconfig.base.json');

    // Should not throw
    expect(() => updateTsconfigPaths(tree, options)).not.toThrow();

    // Should not have created the file
    expect(tree.exists('tsconfig.base.json')).toBe(false);
  });
});
