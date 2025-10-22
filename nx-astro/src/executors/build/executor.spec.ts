import { ExecutorContext } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';

// Mock child_process
const mockExec = jest.fn();

jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return {
    ...actual,
    exec: mockExec,
  };
});

// Mock command-builder
const mockBuildAstroCommandString = jest.fn();

jest.mock('../../utils/command-builder', () => ({
  buildAstroCommandString: mockBuildAstroCommandString,
}));

// Mock sync-astrojs-deps
const mockSyncAstrojsDependencies = jest.fn();

jest.mock('../../utils/sync-astrojs-deps', () => ({
  syncAstrojsDependencies: mockSyncAstrojsDependencies,
}));

// Mock util with proper promisify implementation
jest.mock('util', () => {
  const actual = jest.requireActual('util');
  return {
    ...actual,
    promisify: jest.fn((fn) => {
      // Return a promisified version that returns what mockExec returns
      return (...args: any[]) => {
        return new Promise((resolve, reject) => {
          fn(...args, (error: any, result: any) => {
            if (error) {
              // Make the error include stdout/stderr like exec does
              error.stdout = result?.stdout || '';
              error.stderr = result?.stderr || '';
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
      };
    }),
  };
});

import buildExecutor from './executor';
import { syncAstrojsDependencies } from '../../utils/sync-astrojs-deps';

describe('Build Executor', () => {
  let context: ExecutorContext;

  beforeEach(() => {
    context = {
      root: '/workspace',
      projectName: 'my-app',
      targetName: 'build',
      projectsConfigurations: {
        version: 2,
        projects: {
          'my-app': {
            root: 'apps/my-app',
            sourceRoot: 'apps/my-app/src',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        nodes: {},
        dependencies: {},
      },
      cwd: '/workspace',
      isVerbose: false,
    } as ExecutorContext;

    mockExec.mockClear();
    mockBuildAstroCommandString.mockClear();
    mockSyncAstrojsDependencies.mockClear();

    // Default mock implementation - returns a command string
    mockBuildAstroCommandString.mockReturnValue(
      'bunx astro build --root /workspace/apps/my-app',
    );

    // Default mockExec implementation - calls callback with success
    mockExec.mockImplementation((cmd: string, options: any, callback: any) => {
      callback(null, { stdout: 'Build successful', stderr: '' });
      return {} as any;
    });
  });

  describe('basic build', () => {
    it('should run astro build command using command-builder', async () => {
      const options: BuildExecutorSchema = {};

      const result = await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with correct parameters
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app'],
        '/workspace',
      );

      // Verify the built command string was passed to execAsync
      expect(mockExec).toHaveBeenCalled();
      const callArgs = mockExec.mock.calls[0];
      expect(callArgs[0]).toBe(
        'bunx astro build --root /workspace/apps/my-app',
      );

      expect(result.success).toBe(true);
    });

    it('should return success status', async () => {
      const options: BuildExecutorSchema = {};

      const result = await buildExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });

  describe('dependency synchronization', () => {
    it('should sync @astrojs/* dependencies before build', async () => {
      const options: BuildExecutorSchema = {};

      await buildExecutor(options, context);

      // Verify syncAstrojsDependencies was called with correct arguments
      expect(mockSyncAstrojsDependencies).toHaveBeenCalledWith(
        'apps/my-app',
        '/workspace',
      );
    });

    it('should sync dependencies before executing build command', async () => {
      const options: BuildExecutorSchema = {};
      const callOrder: string[] = [];

      // Track call order
      mockSyncAstrojsDependencies.mockImplementation(() => {
        callOrder.push('sync');
      });

      mockExec.mockImplementation(
        (cmd: string, options: any, callback: any) => {
          callOrder.push('build');
          callback(null, { stdout: 'Build successful', stderr: '' });
          return {} as any;
        },
      );

      await buildExecutor(options, context);

      // Verify sync was called before build
      expect(callOrder).toEqual(['sync', 'build']);
    });

    it('should sync dependencies when using custom root', async () => {
      const options: BuildExecutorSchema = {
        root: '/custom/root',
      };

      await buildExecutor(options, context);

      // Verify syncAstrojsDependencies was called with custom root
      expect(mockSyncAstrojsDependencies).toHaveBeenCalledWith(
        '/custom/root',
        '/workspace',
      );
    });
  });

  describe('custom output path', () => {
    it('should use custom output path when provided', async () => {
      const options: BuildExecutorSchema = {
        outputPath: 'dist/custom',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with outputPath in args
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--outDir', 'dist/custom'],
        '/workspace',
      );
    });
  });

  describe('verbose flag', () => {
    it('should handle verbose flag', async () => {
      const options: BuildExecutorSchema = {
        verbose: true,
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with verbose flag
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--verbose'],
        '/workspace',
      );
    });
  });

  describe('mode option', () => {
    it('should respect mode option - static', async () => {
      const options: BuildExecutorSchema = {
        mode: 'static',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with mode flag
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--mode', 'static'],
        '/workspace',
      );
    });

    it('should respect mode option - server', async () => {
      const options: BuildExecutorSchema = {
        mode: 'server',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with mode flag
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--mode', 'server'],
        '/workspace',
      );
    });
  });

  describe('error handling', () => {
    it('should return failure status on error', async () => {
      const options: BuildExecutorSchema = {};

      // Mock exec to call callback with error
      mockExec.mockImplementation(
        (cmd: string, options: any, callback: any) => {
          callback(new Error('Build failed'), null);
          return {} as any;
        },
      );

      const result = await buildExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should handle missing astro', async () => {
      const options: BuildExecutorSchema = {};

      // Mock exec to call callback with error
      mockExec.mockImplementation(
        (cmd: string, options: any, callback: any) => {
          callback(new Error('Command not found: astro'), null);
          return {} as any;
        },
      );

      const result = await buildExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should handle build errors with stderr', async () => {
      const options: BuildExecutorSchema = {};

      // Mock exec to succeed but with stderr
      mockExec.mockImplementation(
        (cmd: string, options: any, callback: any) => {
          callback(null, { stdout: '', stderr: 'Error: Build failed' });
          return {} as any;
        },
      );

      const result = await buildExecutor(options, context);

      // Build may succeed even with stderr warnings
      expect(result).toBeDefined();
    });
  });

  describe('additional options', () => {
    it('should pass site option', async () => {
      const options: BuildExecutorSchema = {
        site: 'https://example.com',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with site flag
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--site', 'https://example.com'],
        '/workspace',
      );
    });

    it('should pass base option', async () => {
      const options: BuildExecutorSchema = {
        base: '/my-app',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with base flag
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--base', '/my-app'],
        '/workspace',
      );
    });

    it('should pass additional arguments', async () => {
      const options: BuildExecutorSchema = {
        additionalArgs: ['--experimental', '--no-minify'],
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with additional args
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app', '--experimental', '--no-minify'],
        '/workspace',
      );
    });
  });

  describe('correct flags', () => {
    it('should pass correct flags to Astro CLI', async () => {
      const options: BuildExecutorSchema = {
        verbose: true,
        outputPath: 'dist/out',
        mode: 'static',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with all flags
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        [
          '--root',
          '/workspace/apps/my-app',
          '--outDir',
          'dist/out',
          '--mode',
          'static',
          '--verbose',
        ],
        '/workspace',
      );
    });
  });

  describe('root path resolution', () => {
    it('should use custom root when provided', async () => {
      const options: BuildExecutorSchema = {
        root: '/custom/root',
      };

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with custom root
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/custom/root'],
        '/workspace',
      );
    });

    it('should use project root from context when root not provided', async () => {
      const options: BuildExecutorSchema = {};

      await buildExecutor(options, context);

      // Verify buildAstroCommandString was called with project root
      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'build',
        ['--root', '/workspace/apps/my-app'],
        '/workspace',
      );
    });
  });

  describe('package manager detection', () => {
    it('should pass workspace root to buildAstroCommandString for package manager detection', async () => {
      const options: BuildExecutorSchema = {};

      await buildExecutor(options, context);

      // Verify buildAstroCommandString receives the workspace root for PM detection
      const calls = mockBuildAstroCommandString.mock.calls;
      expect(calls[0][2]).toBe('/workspace');
    });
  });
});
