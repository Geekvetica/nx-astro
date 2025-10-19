import { ProjectConfiguration } from '@nx/devkit';
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
    expect(buildTarget.outputs).toContain('{projectRoot}/.astro');
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
    expect(syncTarget.outputs).toContain('{projectRoot}/.astro');
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
});
