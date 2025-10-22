import { buildAstroTasks, NormalizedOptions } from './task-builder';
import { AstroConfig } from '../types/astro-config';
import * as fs from 'fs';

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
    let existsSyncSpy: jest.SpyInstance;
    let readFileSyncSpy: jest.SpyInstance;

    beforeEach(() => {
      existsSyncSpy = jest.spyOn(fs, 'existsSync');
      readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
    });

    afterEach(() => {
      existsSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
    });

    it('should build all default tasks when vitest is installed', () => {
      const astroConfig: Partial<AstroConfig> = {};

      // Mock vitest being in project package.json
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(
        JSON.stringify({
          devDependencies: { vitest: '^1.0.0' },
        }),
      );

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks).toHaveProperty('dev');
      expect(tasks).toHaveProperty('build');
      expect(tasks).toHaveProperty('preview');
      expect(tasks).toHaveProperty('check');
      expect(tasks).toHaveProperty('sync');
      expect(tasks).toHaveProperty('test');
    });

    it('should not include test task when vitest is not installed', () => {
      const astroConfig: Partial<AstroConfig> = {};

      // Mock no vitest in package.json
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(
        JSON.stringify({
          devDependencies: { typescript: '^5.0.0' },
        }),
      );

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks).toHaveProperty('dev');
      expect(tasks).toHaveProperty('build');
      expect(tasks).toHaveProperty('preview');
      expect(tasks).toHaveProperty('check');
      expect(tasks).toHaveProperty('sync');
      expect(tasks).not.toHaveProperty('test');
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
      expect(tasks.build.outputs).toContain(
        `{workspaceRoot}/dist/{projectRoot}`,
      );
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
      expect(tasks.sync.outputs).toEqual([]);
    });

    it('should configure test task when vitest is installed', () => {
      const astroConfig: Partial<AstroConfig> = {};

      // Mock vitest being in project package.json
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(
        JSON.stringify({
          devDependencies: { vitest: '^1.0.0' },
        }),
      );

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      expect(tasks.test).toBeDefined();
      expect(tasks.test.executor).toBe('@geekvetica/nx-astro:test');
      expect(tasks.test.cache).toBe(true);
    });

    it('should detect vitest in workspace package.json', () => {
      const astroConfig: Partial<AstroConfig> = {};
      const workspaceRoot = '/workspace/root';

      // Mock no vitest in project, but vitest in workspace
      existsSyncSpy.mockImplementation(() => {
        return true; // Both files exist
      });
      readFileSyncSpy.mockImplementation((path: string) => {
        if (path.includes(mockProjectRoot)) {
          return JSON.stringify({ devDependencies: {} });
        } else {
          return JSON.stringify({ devDependencies: { vitest: '^1.0.0' } });
        }
      });

      const tasks = buildAstroTasks(
        mockProjectRoot,
        astroConfig,
        mockOptions,
        workspaceRoot,
      );

      expect(tasks.test).toBeDefined();
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

      // Mock vitest being in project package.json
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(
        JSON.stringify({
          devDependencies: { vitest: '^1.0.0' },
        }),
      );

      const tasks = buildAstroTasks(
        mockProjectRoot,
        astroConfig,
        customOptions,
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

    it('should use workspace-relative build outputs', () => {
      const astroConfig: Partial<AstroConfig> = {};

      const tasks = buildAstroTasks(mockProjectRoot, astroConfig, mockOptions);

      // Build outputs should be workspace-relative ({workspaceRoot}/dist/{projectRoot})
      expect(tasks.build.outputs).toContain(
        `{workspaceRoot}/dist/{projectRoot}`,
      );
      expect(tasks.build.outputs).toHaveLength(1);
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

    describe('build task inputs', () => {
      it('should include package.json in build inputs for cache tracking', () => {
        const tasks = buildAstroTasks(mockProjectRoot, {}, mockOptions);

        expect(tasks.build.inputs).toBeDefined();
        expect(tasks.build.inputs).toContainEqual('{projectRoot}/package.json');
      });

      it('should include all necessary inputs for proper caching', () => {
        const tasks = buildAstroTasks(mockProjectRoot, {}, mockOptions);

        expect(tasks.build.inputs).toContain('production');
        expect(tasks.build.inputs).toContain('^production');
        expect(tasks.build.inputs).toContainEqual('{projectRoot}/package.json');
        expect(tasks.build.inputs).toContainEqual(
          expect.objectContaining({
            externalDependencies: ['astro'],
          }),
        );
      });
    });

    describe('build task outputs', () => {
      it('should only include dist directory in outputs, not .astro', () => {
        const tasks = buildAstroTasks(mockProjectRoot, {}, mockOptions);

        expect(tasks.build.outputs).toBeDefined();
        expect(tasks.build.outputs).toHaveLength(1);
        expect(tasks.build.outputs).toContain(
          '{workspaceRoot}/dist/{projectRoot}',
        );
        expect(tasks.build.outputs).not.toContainEqual(
          expect.stringContaining('.astro'),
        );
      });
    });

    describe('sync task outputs', () => {
      it('should have empty outputs array since sync generates internal metadata', () => {
        const tasks = buildAstroTasks(mockProjectRoot, {}, mockOptions);

        expect(tasks.sync.outputs).toBeDefined();
        expect(tasks.sync.outputs).toEqual([]);
      });
    });
  });
});
