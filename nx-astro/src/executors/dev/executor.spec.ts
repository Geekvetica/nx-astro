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
    mockSpawn.mockReturnValue(mockChildProcess);
  });

  describe('basic functionality', () => {
    it('should run astro dev command', async () => {
      const options: DevExecutorSchema = {};

      // Simulate clean exit
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      const result = await devExecutor(options, context);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnCall = mockSpawn.mock.calls[0];
      const command = spawnCall[0];
      const args = spawnCall[1];

      expect(command).toBe('astro');
      expect(args).toContain('dev');
      expect(args).toContain('--root');
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

  describe('port configuration', () => {
    it('should use custom port when provided', async () => {
      const options: DevExecutorSchema = {
        port: 3000,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--port');
      expect(args).toContain('3000');
    });

    it('should pass port flag to Astro CLI', async () => {
      const options: DevExecutorSchema = {
        port: 8080,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      const portIndex = args.indexOf('--port');
      expect(portIndex).toBeGreaterThan(-1);
      expect(args[portIndex + 1]).toBe('8080');
    });
  });

  describe('host configuration', () => {
    it('should use custom host string when provided', async () => {
      const options: DevExecutorSchema = {
        host: '192.168.1.100',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--host');
      expect(args).toContain('192.168.1.100');
    });

    it('should use --host flag for boolean true (0.0.0.0)', async () => {
      const options: DevExecutorSchema = {
        host: true,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--host');
      // When host is boolean true, only --host flag is passed (no value)
      const hostIndex = args.indexOf('--host');
      expect(hostIndex).toBeGreaterThan(-1);
    });

    it('should omit host flag for boolean false (localhost)', async () => {
      const options: DevExecutorSchema = {
        host: false,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).not.toContain('--host');
    });
  });

  describe('open configuration', () => {
    it('should use --open flag for boolean true', async () => {
      const options: DevExecutorSchema = {
        open: true,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--open');
    });

    it('should use --open=/path for string values', async () => {
      const options: DevExecutorSchema = {
        open: '/about',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--open');
      expect(args).toContain('/about');
    });

    it('should omit open flag for boolean false', async () => {
      const options: DevExecutorSchema = {
        open: false,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).not.toContain('--open');
    });
  });

  describe('additional options', () => {
    it('should handle site option', async () => {
      const options: DevExecutorSchema = {
        site: 'https://example.com',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--site');
      expect(args).toContain('https://example.com');
    });

    it('should handle base option', async () => {
      const options: DevExecutorSchema = {
        base: '/my-app',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--base');
      expect(args).toContain('/my-app');
    });

    it('should handle verbose option', async () => {
      const options: DevExecutorSchema = {
        verbose: true,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--verbose');
    });

    it('should handle additional args', async () => {
      const options: DevExecutorSchema = {
        additionalArgs: ['--experimental', '--custom-flag'],
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--experimental');
      expect(args).toContain('--custom-flag');
    });

    it('should handle config option', async () => {
      const options: DevExecutorSchema = {
        config: 'custom.config.mjs',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--config');
      expect(args).toContain('custom.config.mjs');
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

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--root');
      expect(args).toContain('/custom/root');
    });

    it('should use project root from context when root not provided', async () => {
      const options: DevExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--root');
      expect(args).toContain('/workspace/apps/my-app');
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

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChildProcess;
      });

      await devExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('dev');
      expect(args).toContain('--port');
      expect(args).toContain('3000');
      expect(args).toContain('--host');
      expect(args).toContain('--open');
      expect(args).toContain('--verbose');
    });
  });
});
