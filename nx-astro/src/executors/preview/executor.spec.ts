import { ExecutorContext } from '@nx/devkit';
import { PreviewExecutorSchema } from './schema';
import { ChildProcess } from 'child_process';

// Mock child_process
const mockSpawn = jest.fn();
const mockOn = jest.fn();
const mockKill = jest.fn();

jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return {
    ...actual,
    spawn: mockSpawn,
  };
});

// Mock command-builder
const mockBuildAstroCommand = jest.fn();
jest.mock('../../utils/command-builder', () => ({
  buildAstroCommand: mockBuildAstroCommand,
}));

import previewExecutor from './executor';

describe('Preview Executor', () => {
  let context: ExecutorContext;
  let mockChildProcess: Partial<ChildProcess>;

  beforeEach(() => {
    context = {
      root: '/workspace',
      projectName: 'my-app',
      targetName: 'preview',
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

    // Create mock child process
    mockChildProcess = {
      on: mockOn,
      kill: mockKill,
      stdout: {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any,
      stderr: {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any,
    };

    mockSpawn.mockClear();
    mockOn.mockClear();
    mockKill.mockClear();
    mockBuildAstroCommand.mockClear();
    mockSpawn.mockReturnValue(mockChildProcess);

    // Default mock return value for buildAstroCommand (simulating pnpm)
    mockBuildAstroCommand.mockReturnValue({
      command: 'pnpm',
      args: ['exec', 'astro', 'preview'],
    });
  });

  describe('basic preview', () => {
    it('should run astro preview command using buildAstroCommand', async () => {
      const options: PreviewExecutorSchema = {};

      // Simulate clean exit
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      const result = await previewExecutor(options, context);

      // Verify buildAstroCommand was called with correct parameters
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--root', '/workspace/apps/my-app']),
        '/workspace',
      );

      // Verify spawn was called with command and args from buildAstroCommand
      expect(mockSpawn).toHaveBeenCalled();
      const spawnCall = mockSpawn.mock.calls[0];
      const command = spawnCall[0];
      const args = spawnCall[1];

      expect(command).toBe('pnpm');
      expect(args).toEqual(['exec', 'astro', 'preview']);
      expect(result.success).toBe(true);
    });

    it('should return success on clean exit', async () => {
      const options: PreviewExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      const result = await previewExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });

  describe('custom port', () => {
    it('should use custom port when provided', async () => {
      const options: PreviewExecutorSchema = {
        port: 3000,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '3000',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with port argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--port', '3000']),
        '/workspace',
      );
    });
  });

  describe('custom host', () => {
    it('should use custom host when provided', async () => {
      const options: PreviewExecutorSchema = {
        host: '0.0.0.0',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--host',
          '0.0.0.0',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with host argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--host', '0.0.0.0']),
        '/workspace',
      );
    });

    it('should handle boolean host value', async () => {
      const options: PreviewExecutorSchema = {
        host: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--host',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with host flag (no value)
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--host']),
        '/workspace',
      );
    });
  });

  describe('package manager integration', () => {
    it('should use buildAstroCommand for npm', async () => {
      const options: PreviewExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'npx',
        args: ['astro', 'preview', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.any(Array),
        '/workspace',
      );

      const spawnCall = mockSpawn.mock.calls[0];
      expect(spawnCall[0]).toBe('npx');
      expect(spawnCall[1]).toContain('astro');
      expect(spawnCall[1]).toContain('preview');
    });

    it('should use buildAstroCommand for bun', async () => {
      const options: PreviewExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'bunx',
        args: ['astro', 'preview', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.any(Array),
        '/workspace',
      );

      const spawnCall = mockSpawn.mock.calls[0];
      expect(spawnCall[0]).toBe('bunx');
      expect(spawnCall[1]).toContain('astro');
      expect(spawnCall[1]).toContain('preview');
    });

    it('should use buildAstroCommand for yarn', async () => {
      const options: PreviewExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'yarn',
        args: ['astro', 'preview', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.any(Array),
        '/workspace',
      );

      const spawnCall = mockSpawn.mock.calls[0];
      expect(spawnCall[0]).toBe('yarn');
      expect(spawnCall[1]).toContain('astro');
      expect(spawnCall[1]).toContain('preview');
    });

    it('should pass all arguments to buildAstroCommand', async () => {
      const options: PreviewExecutorSchema = {
        port: 4173,
        host: true,
        open: '/docs',
        site: 'https://example.com',
        base: '/my-app',
        config: 'custom.config.mjs',
        verbose: true,
        outputPath: 'dist',
        additionalArgs: ['--experimental'],
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '4173',
          '--host',
          '--open',
          '/docs',
          '--site',
          'https://example.com',
          '--base',
          '/my-app',
          '--config',
          'custom.config.mjs',
          '--outDir',
          'dist',
          '--verbose',
          '--experimental',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with all arguments
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining([
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '4173',
          '--host',
          '--open',
          '/docs',
          '--site',
          'https://example.com',
          '--base',
          '/my-app',
          '--config',
          'custom.config.mjs',
          '--outDir',
          'dist',
          '--verbose',
          '--experimental',
        ]),
        '/workspace',
      );
    });
  });

  describe('error handling', () => {
    it('should handle server errors', async () => {
      const options: PreviewExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          callback(new Error('Server failed'));
        }
        return mockChildProcess;
      });

      const result = await previewExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should return failure on non-zero exit code', async () => {
      const options: PreviewExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(1);
        }
        return mockChildProcess;
      });

      const result = await previewExecutor(options, context);

      expect(result.success).toBe(false);
    });
  });

  describe('additional options', () => {
    it('should pass site option', async () => {
      const options: PreviewExecutorSchema = {
        site: 'https://example.com',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--site',
          'https://example.com',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with site argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--site', 'https://example.com']),
        '/workspace',
      );
    });

    it('should pass base option', async () => {
      const options: PreviewExecutorSchema = {
        base: '/my-app',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--base',
          '/my-app',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with base argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--base', '/my-app']),
        '/workspace',
      );
    });

    it('should pass verbose flag', async () => {
      const options: PreviewExecutorSchema = {
        verbose: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--verbose',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with verbose flag
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--verbose']),
        '/workspace',
      );
    });

    it('should pass open flag', async () => {
      const options: PreviewExecutorSchema = {
        open: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--open',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with open flag
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--open']),
        '/workspace',
      );
    });

    it('should pass additional arguments', async () => {
      const options: PreviewExecutorSchema = {
        additionalArgs: ['--experimental', '--custom-flag'],
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'preview',
          '--root',
          '/workspace/apps/my-app',
          '--experimental',
          '--custom-flag',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with additional args
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--experimental', '--custom-flag']),
        '/workspace',
      );
    });
  });

  describe('process management', () => {
    it('should keep server running until interrupted', async () => {
      const options: PreviewExecutorSchema = {};

      let closeCallback: any;
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          closeCallback = callback;
        }
        return mockChildProcess;
      });

      const resultPromise = previewExecutor(options, context);

      // Let it run for a bit
      await new Promise((resolve) => setImmediate(resolve));

      // Simulate server still running
      expect(mockSpawn).toHaveBeenCalled();

      // Trigger close
      if (closeCallback) {
        closeCallback(0);
      }

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });

    it('should handle SIGINT signal', async () => {
      const options: PreviewExecutorSchema = {};

      let signalCallback: any;
      const originalProcessOn = process.on;
      const processOnSpy = jest.spyOn(process, 'on');

      processOnSpy.mockImplementation((event: any, callback: any) => {
        if (event === 'SIGINT') {
          signalCallback = callback;
        }
        return process;
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      const resultPromise = previewExecutor(options, context);

      // Wait a bit
      await new Promise((resolve) => setImmediate(resolve));

      // Simulate SIGINT
      if (signalCallback) {
        signalCallback();
      }

      // Should have called kill on the child process
      expect(mockKill).toHaveBeenCalledWith('SIGINT');

      processOnSpy.mockRestore();
    }, 10000);
  });

  describe('root path resolution', () => {
    it('should use custom root when provided', async () => {
      const options: PreviewExecutorSchema = {
        root: '/custom/root',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: ['exec', 'astro', 'preview', '--root', '/custom/root'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with custom root
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--root', '/custom/root']),
        '/workspace',
      );
    });

    it('should use project root from context when root not provided', async () => {
      const options: PreviewExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: ['exec', 'astro', 'preview', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      // Verify buildAstroCommand was called with project root from context
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'preview',
        expect.arrayContaining(['--root', '/workspace/apps/my-app']),
        '/workspace',
      );
    });
  });
});
