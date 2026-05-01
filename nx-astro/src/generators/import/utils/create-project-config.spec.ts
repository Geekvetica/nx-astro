import { ProjectConfiguration, Tree } from '@nx/devkit';
import { createProjectConfig } from './create-project-config';
import { NormalizedImportOptions } from './normalize-options';

describe('createProjectConfig', () => {
  let options: NormalizedImportOptions;

  beforeEach(() => {
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

  it('should return a valid ProjectConfiguration object', () => {
    const config = createProjectConfig(options);

    expect(config).toBeDefined();
    expect(config.root).toBeDefined();
    expect(config.sourceRoot).toBeDefined();
    expect(config.projectType).toBeDefined();
    expect(config.targets).toBeDefined();
  });

  it('should set correct root and sourceRoot', () => {
    const config = createProjectConfig(options);

    expect(config.root).toBe('apps/my-astro-app');
    expect(config.sourceRoot).toBe('apps/my-astro-app/src');
  });

  it('should set projectType to application', () => {
    const config = createProjectConfig(options);

    expect(config.projectType).toBe('application');
  });

  it('should apply tags from options', () => {
    const config = createProjectConfig(options);

    expect(config.tags).toEqual(['astro', 'web']);
  });

  it('should include all required targets', () => {
    const config = createProjectConfig(options);

    expect(config.targets).toBeDefined();
    expect(config.targets!.build).toBeDefined();
    expect(config.targets!.dev).toBeDefined();
    expect(config.targets!.preview).toBeDefined();
    expect(config.targets!.check).toBeDefined();
    expect(config.targets!.sync).toBeDefined();
  });

  it('should use correct executors from @geekvetica/nx-astro', () => {
    const config = createProjectConfig(options);

    expect(config.targets!.build.executor).toBe('@geekvetica/nx-astro:build');
    expect(config.targets!.dev.executor).toBe('@geekvetica/nx-astro:dev');
    expect(config.targets!.preview.executor).toBe(
      '@geekvetica/nx-astro:preview',
    );
    expect(config.targets!.check.executor).toBe('@geekvetica/nx-astro:check');
    expect(config.targets!.sync.executor).toBe('@geekvetica/nx-astro:sync');
  });

  it('should configure build target with caching and dependencies', () => {
    const config = createProjectConfig(options);

    const buildTarget = config.targets!.build;
    expect(buildTarget.cache).toBe(true);
    expect(buildTarget.dependsOn).toEqual(['^build']);
    expect(buildTarget.inputs).toBeDefined();
    expect(buildTarget.outputs).toBeDefined();
  });

  it('should configure build target with correct outputs', () => {
    const config = createProjectConfig(options);

    const buildTarget = config.targets!.build;
    expect(buildTarget.outputs).toContain('{workspaceRoot}/dist/{projectRoot}');
    expect(buildTarget.outputs).toHaveLength(1);
  });

  it('should configure dev target without caching', () => {
    const config = createProjectConfig(options);

    const devTarget = config.targets!.dev;
    expect(devTarget.cache).toBe(false);
  });

  it('should configure preview target to depend on build', () => {
    const config = createProjectConfig(options);

    const previewTarget = config.targets!.preview;
    expect(previewTarget.dependsOn).toEqual(['build']);
    expect(previewTarget.cache).toBe(false);
  });

  it('should configure check target to depend on sync', () => {
    const config = createProjectConfig(options);

    const checkTarget = config.targets!.check;
    expect(checkTarget.dependsOn).toEqual(['sync']);
    expect(checkTarget.cache).toBe(true);
  });

  it('should configure sync target with caching', () => {
    const config = createProjectConfig(options);

    const syncTarget = config.targets!.sync;
    expect(syncTarget.cache).toBe(true);
    expect(syncTarget.outputs).toEqual([]);
  });

  it('should configure sync target with Astro-specific metadata', () => {
    const config = createProjectConfig(options);

    const syncTarget = config.targets!.sync;
    expect(syncTarget.metadata).toBeDefined();
    expect(syncTarget.metadata).toHaveProperty('technologies');
    expect(syncTarget.metadata).toHaveProperty('description');
  });

  it('should mark sync target with astro technology in metadata', () => {
    const config = createProjectConfig(options);

    const syncTarget = config.targets!.sync;
    expect(syncTarget.metadata?.technologies).toContain('astro');
  });

  it('should include description about Astro sync in metadata', () => {
    const config = createProjectConfig(options);

    const syncTarget = config.targets!.sync;
    expect(syncTarget.metadata?.description).toMatch(/astro/i);
    expect(syncTarget.metadata?.description).toMatch(/sync/i);
  });

  it('should NOT include syncGenerators property in sync target', () => {
    const config = createProjectConfig(options);

    const syncTarget = config.targets!.sync;
    expect(syncTarget).not.toHaveProperty('syncGenerators');
  });

  it('should handle options with empty tags', () => {
    options.parsedTags = [];
    const config = createProjectConfig(options);

    expect(config.tags).toEqual([]);
  });

  it('should handle options without importPath', () => {
    options.importPath = undefined;
    const config = createProjectConfig(options);

    expect(config).toBeDefined();
    expect(config.targets).toBeDefined();
  });

  describe('build target inputs', () => {
    it('should include package.json in build inputs for cache tracking', () => {
      const config = createProjectConfig(options);

      expect(config.targets!.build.inputs).toBeDefined();
      expect(config.targets!.build.inputs).toContainEqual(
        '{projectRoot}/package.json',
      );
    });
  });

  describe('build target outputs for imported projects', () => {
    it('should only include dist directory in outputs', () => {
      const config = createProjectConfig(options);

      expect(config.targets!.build.outputs).toBeDefined();
      expect(config.targets!.build.outputs).toHaveLength(1);
      expect(config.targets!.build.outputs).toContain(
        '{workspaceRoot}/dist/{projectRoot}',
      );
      expect(config.targets!.build.outputs).not.toContainEqual(
        expect.stringContaining('.astro'),
      );
    });
  });

  describe('sync target outputs for imported projects', () => {
    it('should have empty outputs array since sync generates internal metadata', () => {
      const config = createProjectConfig(options);

      expect(config.targets!.sync.outputs).toBeDefined();
      expect(config.targets!.sync.outputs).toEqual([]);
    });
  });

  describe('Bun package manager support', () => {
    function createMockTree(files: Record<string, string>): Tree {
      return {
        exists: (path: string) => path in files,
        read: (path: string) => files[path] || null,
        write: jest.fn(),
        delete: jest.fn(),
        rename: jest.fn(),
        listChanges: jest.fn(),
        readFile: jest.fn(),
        isFile: jest.fn(),
        children: jest.fn(),
        root: '.',
      } as unknown as Tree;
    }

    it('should use bun.lockb in inputs when packageManager is bun', () => {
      const tree = createMockTree({
        'package.json': JSON.stringify({ packageManager: 'bun@1.0.0' }),
      });

      const config = createProjectConfig(options, tree);

      const buildInputs = config.targets!.build.inputs;
      expect(buildInputs).toContain('{workspaceRoot}/bun.lockb');
      expect(buildInputs).not.toContainEqual(
        expect.objectContaining({ externalDependencies: expect.any(Array) }),
      );

      const checkInputs = config.targets!.check.inputs;
      expect(checkInputs).toContain('{workspaceRoot}/bun.lockb');

      const syncInputs = config.targets!.sync.inputs;
      expect(syncInputs).toContain('{workspaceRoot}/bun.lockb');
    });

    it('should use externalDependencies when packageManager is pnpm', () => {
      const tree = createMockTree({
        'package.json': JSON.stringify({ packageManager: 'pnpm@8.0.0' }),
      });

      const config = createProjectConfig(options, tree);

      const buildInputs = config.targets!.build.inputs;
      expect(buildInputs).toContainEqual({
        externalDependencies: ['astro'],
      });
      expect(buildInputs).not.toContain('{workspaceRoot}/bun.lockb');
    });

    it('should use externalDependencies when pnpm-lock.yaml exists', () => {
      const tree = createMockTree({
        'pnpm-lock.yaml': 'lockfileVersion: 5.4',
      });

      const config = createProjectConfig(options, tree);

      const buildInputs = config.targets!.build.inputs;
      expect(buildInputs).toContainEqual({
        externalDependencies: ['astro'],
      });
    });

    it('should use externalDependencies when yarn.lock exists', () => {
      const tree = createMockTree({
        'yarn.lock': '# yarn lockfile v1',
      });

      const config = createProjectConfig(options, tree);

      const buildInputs = config.targets!.build.inputs;
      expect(buildInputs).toContainEqual({
        externalDependencies: ['astro'],
      });
    });

    it('should default to npm (externalDependencies) when no tree provided', () => {
      const config = createProjectConfig(options);

      const buildInputs = config.targets!.build.inputs;
      expect(buildInputs).toContainEqual({
        externalDependencies: ['astro'],
      });
    });

    it('should use externalDependencies when package-lock.json exists (npm)', () => {
      const tree = createMockTree({
        'package-lock.json': JSON.stringify({ lockfileVersion: 2 }),
      });

      const config = createProjectConfig(options, tree);

      const buildInputs = config.targets!.build.inputs;
      expect(buildInputs).toContainEqual({
        externalDependencies: ['astro'],
      });
    });
  });
});
