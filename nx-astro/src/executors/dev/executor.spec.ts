import { ExecutorContext } from '@nx/devkit';
import { DevExecutorSchema } from './schema';
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

import devExecutor from './executor';

describe('Dev Executor', () => {
  let context: ExecutorContext;
  let mockChildProcess: Partial<ChildProcess>;

  beforeEach(() => {
    context = {
      root: '/workspace',
      projectName: 'my-app',
      targetName: 'dev',
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
      args: ['exec', 'astro', 'dev'],
    });
  });

  describe('basic functionality', () => {
    it('should run astro dev command using buildAstroCommand', async () => {
      const options: DevExecutorSchema = {};

      // Simulate clean exit
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      const result = await devExecutor(options, context);

      // Verify buildAstroCommand was called with correct parameters
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--root', '/workspace/apps/my-app']),
        '/workspace',
      );

      // Verify spawn was called with command and args from buildAstroCommand
      expect(mockSpawn).toHaveBeenCalled();
      const spawnCall = mockSpawn.mock.calls[0];
      const command = spawnCall[0];
      const args = spawnCall[1];

      expect(command).toBe('pnpm');
      expect(args).toEqual(['exec', 'astro', 'dev']);
      expect(result.success).toBe(true);
    });

    it('should use default port (4321) when not specified', async () => {
      const options: DevExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      // When port is not specified, it should not be in the args
      // (Astro will use its default)
      expect(args).not.toContain('--port');
    });

    it('should keep server running until interrupted', async () => {
      const options: DevExecutorSchema = {};

      let closeCallback: any;
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          closeCallback = callback;
        }
        return mockChildProcess;
      });

      const resultPromise = devExecutor(options, context);

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

    it('should return success on clean exit', async () => {
      const options: DevExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      const result = await devExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });

  describe('package manager integration', () => {
    it('should use buildAstroCommand for npm', async () => {
      const options: DevExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'npx',
        args: ['astro', 'dev', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.any(Array),
        '/workspace',
      );

      const spawnCall = mockSpawn.mock.calls[0];
      expect(spawnCall[0]).toBe('npx');
      expect(spawnCall[1]).toContain('astro');
      expect(spawnCall[1]).toContain('dev');
    });

    it('should use buildAstroCommand for bun', async () => {
      const options: DevExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'bunx',
        args: ['astro', 'dev', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.any(Array),
        '/workspace',
      );

      const spawnCall = mockSpawn.mock.calls[0];
      expect(spawnCall[0]).toBe('bunx');
      expect(spawnCall[1]).toContain('astro');
      expect(spawnCall[1]).toContain('dev');
    });

    it('should use buildAstroCommand for yarn', async () => {
      const options: DevExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'yarn',
        args: ['astro', 'dev', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.any(Array),
        '/workspace',
      );

      const spawnCall = mockSpawn.mock.calls[0];
      expect(spawnCall[0]).toBe('yarn');
      expect(spawnCall[1]).toContain('astro');
      expect(spawnCall[1]).toContain('dev');
    });

    it('should pass all arguments to buildAstroCommand', async () => {
      const options: DevExecutorSchema = {
        port: 3000,
        host: true,
        open: '/about',
        site: 'https://example.com',
        base: '/my-app',
        config: 'custom.config.mjs',
        verbose: true,
        additionalArgs: ['--experimental'],
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '3000',
          '--host',
          '--open',
          '/about',
          '--site',
          'https://example.com',
          '--base',
          '/my-app',
          '--config',
          'custom.config.mjs',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with all arguments
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining([
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '3000',
          '--host',
          '--open',
          '/about',
          '--site',
          'https://example.com',
          '--base',
          '/my-app',
          '--config',
          'custom.config.mjs',
          '--verbose',
          '--experimental',
        ]),
        '/workspace',
      );
    });
  });

  describe('port configuration', () => {
    it('should use custom port when provided', async () => {
      const options: DevExecutorSchema = {
        port: 3000,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with port argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--port', '3000']),
        '/workspace',
      );
    });

    it('should pass port flag to Astro CLI', async () => {
      const options: DevExecutorSchema = {
        port: 8080,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '8080',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with port argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--port', '8080']),
        '/workspace',
      );
    });
  });

  describe('host configuration', () => {
    it('should use custom host string when provided', async () => {
      const options: DevExecutorSchema = {
        host: '192.168.1.100',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
          '--root',
          '/workspace/apps/my-app',
          '--host',
          '192.168.1.100',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with host argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--host', '192.168.1.100']),
        '/workspace',
      );
    });

    it('should use --host flag for boolean true (0.0.0.0)', async () => {
      const options: DevExecutorSchema = {
        host: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with host flag (no value)
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--host']),
        '/workspace',
      );
    });

    it('should omit host flag for boolean false (localhost)', async () => {
      const options: DevExecutorSchema = {
        host: false,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: ['exec', 'astro', 'dev', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called without host argument
      const callArgs = mockBuildAstroCommand.mock.calls[0][1];
      expect(callArgs).not.toContain('--host');
    });
  });

  describe('open configuration', () => {
    it('should use --open flag for boolean true', async () => {
      const options: DevExecutorSchema = {
        open: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with open flag
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--open']),
        '/workspace',
      );
    });

    it('should use --open=/path for string values', async () => {
      const options: DevExecutorSchema = {
        open: '/about',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
          '--root',
          '/workspace/apps/my-app',
          '--open',
          '/about',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with open argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--open', '/about']),
        '/workspace',
      );
    });

    it('should omit open flag for boolean false', async () => {
      const options: DevExecutorSchema = {
        open: false,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: ['exec', 'astro', 'dev', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called without open argument
      const callArgs = mockBuildAstroCommand.mock.calls[0][1];
      expect(callArgs).not.toContain('--open');
    });
  });

  describe('additional options', () => {
    it('should handle site option', async () => {
      const options: DevExecutorSchema = {
        site: 'https://example.com',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with site argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--site', 'https://example.com']),
        '/workspace',
      );
    });

    it('should handle base option', async () => {
      const options: DevExecutorSchema = {
        base: '/my-app',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with base argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--base', '/my-app']),
        '/workspace',
      );
    });

    it('should handle verbose option', async () => {
      const options: DevExecutorSchema = {
        verbose: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with verbose flag
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--verbose']),
        '/workspace',
      );
    });

    it('should handle additional args', async () => {
      const options: DevExecutorSchema = {
        additionalArgs: ['--experimental', '--custom-flag'],
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
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

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with additional args
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--experimental', '--custom-flag']),
        '/workspace',
      );
    });

    it('should handle config option', async () => {
      const options: DevExecutorSchema = {
        config: 'custom.config.mjs',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
          '--root',
          '/workspace/apps/my-app',
          '--config',
          'custom.config.mjs',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with config argument
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--config', 'custom.config.mjs']),
        '/workspace',
      );
    });
  });

  describe('error handling', () => {
    it('should handle server startup errors', async () => {
      const options: DevExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          callback(new Error('Server startup failed'));
        }
        return mockChildProcess;
      });

      const result = await devExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server startup failed');
    });

    it('should handle process errors', async () => {
      const options: DevExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          callback(new Error('Process error'));
        }
        return mockChildProcess;
      });

      const result = await devExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should return failure on non-zero exit code', async () => {
      const options: DevExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(1);
        }
        return mockChildProcess;
      });

      const result = await devExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Process exited with code 1');
    });
  });

  describe('process management', () => {
    it('should handle SIGINT for graceful shutdown', async () => {
      const options: DevExecutorSchema = {};

      let signalCallback: any;
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

      const resultPromise = devExecutor(options, context);

      // Wait a bit
      await new Promise((resolve) => setImmediate(resolve));

      // Simulate SIGINT
      if (signalCallback) {
        signalCallback();
      }

      // Should have called kill on the child process
      expect(mockKill).toHaveBeenCalledWith('SIGINT');

      processOnSpy.mockRestore();
    });

    it('should clean up child process on exit', async () => {
      const options: DevExecutorSchema = {};

      let signalCallback: any;
      const processOnSpy = jest.spyOn(process, 'on');

      processOnSpy.mockImplementation((event: any, callback: any) => {
        if (event === 'SIGTERM') {
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

      const resultPromise = devExecutor(options, context);

      // Wait a bit
      await new Promise((resolve) => setImmediate(resolve));

      // Simulate SIGTERM
      if (signalCallback) {
        signalCallback();
      }

      // Should have called kill on the child process
      expect(mockKill).toHaveBeenCalledWith('SIGTERM');

      processOnSpy.mockRestore();
    });
  });

  describe('root path resolution', () => {
    it('should use custom root when provided', async () => {
      const options: DevExecutorSchema = {
        root: '/custom/root',
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: ['exec', 'astro', 'dev', '--root', '/custom/root'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with custom root
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--root', '/custom/root']),
        '/workspace',
      );
    });

    it('should use project root from context when root not provided', async () => {
      const options: DevExecutorSchema = {};

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: ['exec', 'astro', 'dev', '--root', '/workspace/apps/my-app'],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with project root from context
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining(['--root', '/workspace/apps/my-app']),
        '/workspace',
      );
    });
  });

  describe('combined options', () => {
    it('should handle multiple options together', async () => {
      const options: DevExecutorSchema = {
        port: 3000,
        host: true,
        open: true,
        verbose: true,
      };

      mockBuildAstroCommand.mockReturnValue({
        command: 'pnpm',
        args: [
          'exec',
          'astro',
          'dev',
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '3000',
          '--host',
          '--open',
          '--verbose',
        ],
      });

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      // Verify buildAstroCommand was called with all arguments
      expect(mockBuildAstroCommand).toHaveBeenCalledWith(
        'dev',
        expect.arrayContaining([
          '--root',
          '/workspace/apps/my-app',
          '--port',
          '3000',
          '--host',
          '--open',
          '--verbose',
        ]),
        '/workspace',
      );
    });
  });
});
