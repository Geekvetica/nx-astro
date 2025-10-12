import { ExecutorContext } from '@nx/devkit';
import { CheckExecutorSchema } from './schema';
import { ChildProcess } from 'child_process';

// Mock child_process
const mockExec = jest.fn();
const mockSpawn = jest.fn();
const mockOn = jest.fn();
const mockKill = jest.fn();

jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return {
    ...actual,
    exec: mockExec,
    spawn: mockSpawn,
  };
});

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

import checkExecutor from './executor';

describe('Check Executor', () => {
  let context: ExecutorContext;
  let mockChildProcess: Partial<ChildProcess>;

  beforeEach(() => {
    context = {
      root: '/workspace',
      projectName: 'my-app',
      targetName: 'check',
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

    // Create mock child process for spawn
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

    mockExec.mockClear();
    mockSpawn.mockClear();
    mockOn.mockClear();
    mockKill.mockClear();
  });

  describe('basic functionality', () => {
    it('should run astro check command', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'No errors', stderr: '' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(mockExec).toHaveBeenCalled();
      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];

      expect(command).toContain('astro check');
      expect(command).toContain('--root');
      expect(result.success).toBe(true);
    });

    it('should return success when no type errors', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Result (0 errors)', stderr: '' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(true);
    });

    it('should return failure when type errors found', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error: any = new Error('Command failed');
        error.code = 1;
        callback(error, { stdout: '', stderr: 'Type error found' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should complete and exit (not stay running) in non-watch mode', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(mockExec).toHaveBeenCalled();
      expect(mockSpawn).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('watch mode', () => {
    it('should use --watch flag when watch=true', async () => {
      const options: CheckExecutorSchema = {
        watch: true,
      };

      mockSpawn.mockReturnValue(mockChildProcess);
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      const result = await checkExecutor(options, context);

      expect(mockSpawn).toHaveBeenCalled();
      expect(mockExec).not.toHaveBeenCalled();
      const spawnCall = mockSpawn.mock.calls[0];
      const args = spawnCall[1];
      expect(args).toContain('--watch');
    });

    it('should keep running in watch mode', async () => {
      const options: CheckExecutorSchema = {
        watch: true,
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      let closeCallback: any;
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          closeCallback = callback;
        }
        return mockChildProcess;
      });

      const resultPromise = checkExecutor(options, context);

      // Let it run for a bit
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Verify spawn was called
      expect(mockSpawn).toHaveBeenCalled();

      // Trigger close
      if (closeCallback) {
        closeCallback(0);
      }

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });

    it('should handle watch mode interruption (SIGINT)', async () => {
      const options: CheckExecutorSchema = {
        watch: true,
      };

      mockSpawn.mockReturnValue(mockChildProcess);

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
          setTimeout(() => callback(0), 50);
        }
        return mockChildProcess;
      });

      const resultPromise = checkExecutor(options, context);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate SIGINT
      if (signalCallback) {
        signalCallback();
      }

      // Should have called kill on the child process
      expect(mockKill).toHaveBeenCalledWith('SIGINT');

      processOnSpy.mockRestore();
    });
  });

  describe('tsconfig option', () => {
    it('should use custom tsconfig when provided', async () => {
      const options: CheckExecutorSchema = {
        tsconfig: './tsconfig.strict.json',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--tsconfig');
      expect(command).toContain('./tsconfig.strict.json');
    });

    it('should pass tsconfig path to Astro CLI', async () => {
      const options: CheckExecutorSchema = {
        tsconfig: 'custom.tsconfig.json',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--tsconfig');
      expect(command).toContain('custom.tsconfig.json');
    });
  });

  describe('additional options', () => {
    it('should handle verbose flag', async () => {
      const options: CheckExecutorSchema = {
        verbose: true,
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--verbose');
    });

    it('should handle config option', async () => {
      const options: CheckExecutorSchema = {
        config: 'custom.config.mjs',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--config');
      expect(command).toContain('custom.config.mjs');
    });

    it('should handle additional args', async () => {
      const options: CheckExecutorSchema = {
        additionalArgs: ['--experimental', '--custom-flag'],
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--experimental');
      expect(command).toContain('--custom-flag');
    });
  });

  describe('error handling', () => {
    it('should handle missing astro CLI', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error: any = new Error('astro: command not found');
        error.code = 127;
        callback(error, { stdout: '', stderr: 'astro: command not found' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('astro: command not found');
    });

    it('should handle type check failures', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error: any = new Error('Check failed');
        error.code = 1;
        callback(error, { stdout: '', stderr: 'Type errors found' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should parse and report diagnostics', async () => {
      const options: CheckExecutorSchema = {};

      const diagnosticOutput = `
        src/pages/index.astro:10:5 - error: Type 'number' is not assignable to type 'string'
        Result: 1 error
      `;

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error: any = new Error('Check failed');
        error.code = 1;
        callback(error, { stdout: diagnosticOutput, stderr: '' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should return proper exit codes', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error: any = new Error('Command failed');
        error.code = 1;
        callback(error, { stdout: '', stderr: 'Error' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
    });
  });

  describe('root path', () => {
    it('should resolve root path correctly', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--root');
      expect(command).toContain('/workspace/apps/my-app');
    });

    it('should use project root from context', async () => {
      const options: CheckExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--root');
    });

    it('should use custom root when provided', async () => {
      const options: CheckExecutorSchema = {
        root: '/custom/root',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('--root');
      expect(command).toContain('/custom/root');
    });
  });

  describe('combined options', () => {
    it('should handle multiple options together in non-watch mode', async () => {
      const options: CheckExecutorSchema = {
        tsconfig: './tsconfig.strict.json',
        verbose: true,
        config: 'custom.config.mjs',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Check complete', stderr: '' });
        return {} as any;
      });

      await checkExecutor(options, context);

      const execCall = mockExec.mock.calls[0];
      const command = execCall[0];
      expect(command).toContain('astro check');
      expect(command).toContain('--tsconfig');
      expect(command).toContain('./tsconfig.strict.json');
      expect(command).toContain('--verbose');
      expect(command).toContain('--config');
      expect(command).toContain('custom.config.mjs');
    });

    it('should handle multiple options together in watch mode', async () => {
      const options: CheckExecutorSchema = {
        watch: true,
        tsconfig: './tsconfig.json',
        verbose: true,
      };

      mockSpawn.mockReturnValue(mockChildProcess);
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await checkExecutor(options, context);

      const spawnCall = mockSpawn.mock.calls[0];
      const args = spawnCall[1];
      expect(args).toContain('check');
      expect(args).toContain('--watch');
      expect(args).toContain('--tsconfig');
      expect(args).toContain('./tsconfig.json');
      expect(args).toContain('--verbose');
    });
  });

  describe('process management in watch mode', () => {
    it('should handle SIGTERM for graceful shutdown', async () => {
      const options: CheckExecutorSchema = {
        watch: true,
      };

      mockSpawn.mockReturnValue(mockChildProcess);

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
          setTimeout(() => callback(0), 50);
        }
        return mockChildProcess;
      });

      const resultPromise = checkExecutor(options, context);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate SIGTERM
      if (signalCallback) {
        signalCallback();
      }

      // Should have called kill on the child process
      expect(mockKill).toHaveBeenCalledWith('SIGTERM');

      processOnSpy.mockRestore();
    });

    it('should clean up child process on exit', async () => {
      const options: CheckExecutorSchema = {
        watch: true,
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });
});
