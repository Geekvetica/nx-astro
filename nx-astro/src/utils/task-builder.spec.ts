import { buildAstroTasks, NormalizedOptions } from './task-builder';
import { AstroConfig } from '../types/astro-config';

describe('task-builder', () => {
  const mockOptions: NormalizedOptions = {
    devTargetName: 'dev',
    buildTargetName: 'build',
    previewTargetName: 'preview',
    checkTargetName: 'check',
    testTargetName: 'test',
    syncTargetName: 'sync',
  };

  const mockProjectRoot = 'apps/my-app';

  describe('buildAstroTasks', () => {
    it('should build all default tasks', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks).toHaveProperty('dev');
      expect(tasks).toHaveProperty('build');
      expect(tasks).toHaveProperty('preview');
      expect(tasks).toHaveProperty('check');
      expect(tasks).toHaveProperty('sync');
      expect(tasks).toHaveProperty('test');
    });

    it('should configure dev task correctly', () => {
      const astroConfig: Partial<AstroConfig> = {
        server: { port: 4321, host: 'localhost' },
      };

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.dev).toBeDefined();
      expect(tasks.dev.executor).toBe('@geekvetica/nx-astro:dev');
      expect(tasks.dev.options).toEqual({});
    });

    it('should configure build task with correct outputs', () => {
      const astroConfig: Partial<AstroConfig> = {
        outDir: './dist',
      };

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.build).toBeDefined();
      expect(tasks.build.executor).toBe('@geekvetica/nx-astro:build');
      expect(tasks.build.outputs).toContain(`{projectRoot}/dist`);
    });

    it('should configure preview task to depend on build', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.preview).toBeDefined();
      expect(tasks.preview.executor).toBe('@geekvetica/nx-astro:preview');
      expect(tasks.preview.dependsOn).toContain('build');
    });

    it('should configure check task', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.check).toBeDefined();
      expect(tasks.check.executor).toBe('@geekvetica/nx-astro:check');
    });

    it('should configure sync task with correct outputs', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.sync).toBeDefined();
      expect(tasks.sync.executor).toBe('@geekvetica/nx-astro:sync');
      expect(tasks.sync.outputs).toContain(`{projectRoot}/.astro`);
    });

    it('should configure test task', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.test).toBeDefined();
      expect(tasks.test.executor).toBe('@geekvetica/nx-astro:test');
      expect(tasks.test.cache).toBe(true);
    });

    it('should use custom target names from options', () => {
      const customOptions: NormalizedOptions = {
        devTargetName: 'serve',
        buildTargetName: 'compile',
        previewTargetName: 'serve-prod',
        checkTargetName: 'type-check',
        testTargetName: 'unit-test',
        syncTargetName: 'generate-types',
      };

      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(
        mockProjectRoot,
        astroConfig,
        customOptions
      );

      expect(tasks).toHaveProperty('serve');
      expect(tasks).toHaveProperty('compile');
      expect(tasks).toHaveProperty('serve-prod');
      expect(tasks).toHaveProperty('type-check');
      expect(tasks).toHaveProperty('unit-test');
      expect(tasks).toHaveProperty('generate-types');
    });

    it('should configure build inputs correctly', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.build.inputs).toBeDefined();
      expect(tasks.build.inputs).toContain('production');
      expect(tasks.build.inputs).toContain('^production');
    });

    it('should set cache: true for cacheable tasks', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.build.cache).toBe(true);
      expect(tasks.check.cache).toBe(true);
      expect(tasks.sync.cache).toBe(true);
    });

    it('should set cache: false for non-cacheable tasks', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.dev.cache).toBe(false);
      expect(tasks.preview.cache).toBe(false);
    });

    it('should handle custom outDir in config', () => {
      const astroConfig: Partial<AstroConfig> = {
        outDir: './custom-dist',
      };

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.build.outputs).toContain(`{projectRoot}/custom-dist`);
    });

    it('should build task dependencies correctly', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      // Build depends on sync and upstream builds
      expect(tasks.build.dependsOn).toContain('^build');

      // Preview depends on build
      expect(tasks.preview.dependsOn).toContain('build');

      // Check depends on sync
      expect(tasks.check.dependsOn).toContain('sync');
    });
  });
});
