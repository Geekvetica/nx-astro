import { ExecutorContext } from '@nx/devkit';
import { TestExecutorSchema } from './schema';

// Mock child_process
const mockExec = jest.fn();
const mockSpawn = jest.fn();

jest.mock('child_process', () => ({
  exec: (...args: any[]) => (mockExec as any)(...args),
  spawn: (...args: any[]) => (mockSpawn as any)(...args),
}));

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

import executor from './executor';

describe('Test Executor', () => {
  let context: ExecutorContext;
  let loggerInfoSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    context = {
      root: '/workspace',
      cwd: '/workspace',
      isVerbose: false,
      projectName: 'my-app',
      targetName: 'test',
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
    } as ExecutorContext;

    // Mock logger from @nx/devkit
    const { logger } = require('@nx/devkit');
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should run vitest command', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      expect(mockExec).toHaveBeenCalled();
      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('vitest');
    });

    it('should return success when tests pass', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      const result = await executor(options, context);

      expect(result.success).toBe(true);
    });

    it('should return failure when tests fail', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error = new Error('Tests failed') as any;
        error.code = 1;
        callback(error, { stdout: '', stderr: 'Test failure' });
        return {} as any;
      });

      const result = await executor(options, context);

      expect(result.success).toBe(false);
    });

    it('should complete and exit in run mode', async () => {
      const options: TestExecutorSchema = { run: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalled();
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });

  describe('Watch Mode', () => {
    it('should use watch mode when watch=true', async () => {
      const options: TestExecutorSchema = { watch: true };

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: any) => {
          if (event === 'close') {
            setImmediate(() => handler(0));
          }
        }),
        kill: jest.fn(),
      } as any;

      mockSpawn.mockReturnValue(mockProcess);

      const resultPromise = executor(options, context);

      // Wait for async operations to complete
      await new Promise((resolve) => setImmediate(resolve));

      const result = await resultPromise;

      expect(mockSpawn).toHaveBeenCalled();
      const command = mockSpawn.mock.calls[0][0];
      const args = mockSpawn.mock.calls[0][1];
      expect(command).toBe('vitest');
      expect(args).toContain('watch');
    });

    it('should keep running in watch mode', async () => {
      const options: TestExecutorSchema = { watch: true };

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: any) => {
          // Don't call close immediately - simulates long-running process
        }),
        kill: jest.fn(),
      } as any;

      mockSpawn.mockReturnValue(mockProcess);

      // Start executor but don't await (it should keep running)
      const resultPromise = executor(options, context);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSpawn).toHaveBeenCalled();

      // Trigger close to clean up
      const onHandler = mockProcess.on.mock.calls.find(
        (call: any) => call[0] === 'close',
      );
      if (onHandler) {
        onHandler[1](0);
      }

      await resultPromise;
    });

    it('should handle watch mode interruption (SIGINT)', async () => {
      const options: TestExecutorSchema = { watch: true };

      let sigintHandler: any;
      const originalOn = process.on;
      jest
        .spyOn(process, 'on')
        .mockImplementation((event: any, handler: any) => {
          if (event === 'SIGINT' || event === 'SIGTERM') {
            sigintHandler = handler;
          }
          return process;
        });

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: any) => {
          if (event === 'close') {
            setImmediate(() => handler(0));
          }
        }),
        kill: jest.fn(),
      } as any;

      mockSpawn.mockReturnValue(mockProcess);

      const resultPromise = executor(options, context);

      // Simulate SIGINT
      if (sigintHandler) {
        sigintHandler();
      }

      await new Promise((resolve) => setImmediate(resolve));
      await resultPromise;

      expect(mockProcess.kill).toHaveBeenCalled();

      (process.on as jest.Mock).mockRestore();
    });

    it('should not use watch when ci=true', async () => {
      const options: TestExecutorSchema = { watch: true, ci: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      expect(mockExec).toHaveBeenCalled();
      const command = mockExec.mock.calls[0][0];
      expect(command).not.toContain('watch');
      expect(command).toContain('run');
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });

  describe('Coverage', () => {
    it('should generate coverage when coverage=true', async () => {
      const options: TestExecutorSchema = { coverage: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--coverage');
    });

    it('should pass --coverage flag to Vitest', async () => {
      const options: TestExecutorSchema = { coverage: true, run: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('vitest');
      expect(command).toContain('--coverage');
    });
  });

  describe('CI Mode', () => {
    it('should enable CI mode with ci=true', async () => {
      const options: TestExecutorSchema = { ci: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--ci');
    });

    it('should disable watch in CI mode', async () => {
      const options: TestExecutorSchema = { ci: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).not.toContain('watch');
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('should pass --run flag in CI mode', async () => {
      const options: TestExecutorSchema = { ci: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('run');
    });
  });

  describe('Test Path Pattern', () => {
    it('should filter tests by pattern when provided', async () => {
      const options: TestExecutorSchema = { testPathPattern: 'Button' };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('Button');
    });

    it('should pass pattern to Vitest CLI', async () => {
      const options: TestExecutorSchema = {
        testPathPattern: 'components/*.spec.ts',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('components/*.spec.ts');
    });
  });

  describe('Additional Options', () => {
    it('should handle config option', async () => {
      const options: TestExecutorSchema = { config: 'vitest.config.custom.ts' };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--config');
      expect(command).toContain('vitest.config.custom.ts');
    });

    it('should handle reporter option', async () => {
      const options: TestExecutorSchema = { reporter: 'verbose' };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--reporter');
      expect(command).toContain('verbose');
    });

    it('should handle verbose flag', async () => {
      const options: TestExecutorSchema = { verbose: true };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--reporter');
      expect(command).toContain('verbose');
    });

    it('should handle additional args', async () => {
      const options: TestExecutorSchema = {
        additionalArgs: ['--no-coverage', '--silent'],
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--no-coverage');
      expect(command).toContain('--silent');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing vitest CLI', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error = new Error('vitest: command not found') as any;
        error.code = 127;
        callback(error, { stdout: '', stderr: 'vitest: command not found' });
        return {} as any;
      });

      const result = await executor(options, context);

      expect(result.success).toBe(false);
    });

    it('should handle test failures', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error = new Error('Test failed') as any;
        error.code = 1;
        callback(error, { stdout: '5 tests failed', stderr: '' });
        return {} as any;
      });

      const result = await executor(options, context);

      expect(result.success).toBe(false);
    });

    it('should return proper exit codes', async () => {
      const options: TestExecutorSchema = {};

      // Test success case (exit code 0)
      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      const successResult = await executor(options, context);
      expect(successResult.success).toBe(true);

      // Test failure case (exit code 1)
      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        const error = new Error('Failed') as any;
        error.code = 1;
        callback(error, { stdout: '', stderr: 'Failed' });
        return {} as any;
      });

      const failureResult = await executor(options, context);
      expect(failureResult.success).toBe(false);
    });
  });

  describe('Root Path', () => {
    it('should resolve root path correctly', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--root');
      expect(command).toContain('/workspace/apps/my-app');
    });

    it('should use project root from context', async () => {
      const options: TestExecutorSchema = {};

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('/workspace/apps/my-app');
    });

    it('should use custom root when provided', async () => {
      const options: TestExecutorSchema = { root: '/custom/path' };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('/custom/path');
    });
  });

  describe('Combined Options', () => {
    it('should handle multiple options together', async () => {
      const options: TestExecutorSchema = {
        coverage: true,
        ci: true,
        reporter: 'json',
        config: 'vitest.custom.ts',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('--coverage');
      expect(command).toContain('--ci');
      expect(command).toContain('--reporter');
      expect(command).toContain('json');
      expect(command).toContain('--config');
      expect(command).toContain('vitest.custom.ts');
    });

    it('should handle run mode with coverage and pattern', async () => {
      const options: TestExecutorSchema = {
        run: true,
        coverage: true,
        testPathPattern: 'Button.spec.ts',
      };

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
        return {} as any;
      });

      await executor(options, context);

      const command = mockExec.mock.calls[0][0];
      expect(command).toContain('run');
      expect(command).toContain('--coverage');
      expect(command).toContain('Button.spec.ts');
    });
  });

  describe('Output Streaming', () => {
    it('should stream stdout in watch mode', async () => {
      const options: TestExecutorSchema = { watch: true };
      const stdoutWriteSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation();

      const mockProcess = {
        stdout: {
          on: jest.fn((event: string, handler: any) => {
            if (event === 'data') {
              handler(Buffer.from('Test output'));
            }
          }),
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, handler: any) => {
          if (event === 'close') {
            setImmediate(() => handler(0));
          }
        }),
        kill: jest.fn(),
      } as any;

      mockSpawn.mockReturnValue(mockProcess);

      await executor(options, context);

      expect(mockProcess.stdout.on).toHaveBeenCalledWith(
        'data',
        expect.any(Function),
      );
      expect(stdoutWriteSpy).toHaveBeenCalled();

      stdoutWriteSpy.mockRestore();
    });

    it('should stream stderr in watch mode', async () => {
      const options: TestExecutorSchema = { watch: true };
      const stderrWriteSpy = jest
        .spyOn(process.stderr, 'write')
        .mockImplementation();

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event: string, handler: any) => {
            if (event === 'data') {
              handler(Buffer.from('Error output'));
            }
          }),
        },
        on: jest.fn((event: string, handler: any) => {
          if (event === 'close') {
            setImmediate(() => handler(0));
          }
        }),
        kill: jest.fn(),
      } as any;

      mockSpawn.mockReturnValue(mockProcess);

      await executor(options, context);

      expect(mockProcess.stderr.on).toHaveBeenCalledWith(
        'data',
        expect.any(Function),
      );
      expect(stderrWriteSpy).toHaveBeenCalled();

      stderrWriteSpy.mockRestore();
    });
  });
});
