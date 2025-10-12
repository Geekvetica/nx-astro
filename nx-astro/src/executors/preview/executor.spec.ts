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
    mockSpawn.mockReturnValue(mockChildProcess);
  });

  describe('basic preview', () => {
    it('should run astro preview command', async () => {
      const options: PreviewExecutorSchema = {};

      // Simulate clean exit
      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      const result = await previewExecutor(options, context);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnCall = mockSpawn.mock.calls[0];
      const command = spawnCall[0];
      const args = spawnCall[1];

      expect(command).toBe('astro');
      expect(args).toContain('preview');
      expect(args).toContain('--root');
      expect(result.success).toBe(true);
    });

    it('should return success on clean exit', async () => {
      const options: PreviewExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
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

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--port');
      expect(args).toContain('3000');
    });
  });

  describe('custom host', () => {
    it('should use custom host when provided', async () => {
      const options: PreviewExecutorSchema = {
        host: '0.0.0.0',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--host');
      expect(args).toContain('0.0.0.0');
    });

    it('should handle boolean host value', async () => {
      const options: PreviewExecutorSchema = {
        host: true,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--host');
    });
  });

  describe('error handling', () => {
    it('should handle server errors', async () => {
      const options: PreviewExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Server failed')), 10);
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
          setTimeout(() => callback(1), 10);
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

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--site');
      expect(args).toContain('https://example.com');
    });

    it('should pass base option', async () => {
      const options: PreviewExecutorSchema = {
        base: '/my-app',
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--base');
      expect(args).toContain('/my-app');
    });

    it('should pass verbose flag', async () => {
      const options: PreviewExecutorSchema = {
        verbose: true,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--verbose');
    });

    it('should pass open flag', async () => {
      const options: PreviewExecutorSchema = {
        open: true,
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--open');
    });

    it('should pass additional arguments', async () => {
      const options: PreviewExecutorSchema = {
        additionalArgs: ['--experimental', '--custom-flag'],
      };

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--experimental');
      expect(args).toContain('--custom-flag');
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
      await new Promise((resolve) => setTimeout(resolve, 20));

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
          setTimeout(() => callback(0), 50);
        }
        return mockChildProcess;
      });

      const resultPromise = previewExecutor(options, context);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

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

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--root');
      expect(args).toContain('/custom/root');
    });

    it('should use project root from context when root not provided', async () => {
      const options: PreviewExecutorSchema = {};

      mockOn.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });

      await previewExecutor(options, context);

      const args = mockSpawn.mock.calls[0][1];
      expect(args).toContain('--root');
      expect(args).toContain('/workspace/apps/my-app');
    });
  });
});
