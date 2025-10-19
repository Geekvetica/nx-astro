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

// Mock command-builder
const mockBuildAstroCommand = jest.fn();
const mockBuildAstroCommandString = jest.fn();

jest.mock('../../utils/command-builder', () => ({
  buildAstroCommand: mockBuildAstroCommand,
  buildAstroCommandString: mockBuildAstroCommandString,
}));

// Mock fs module for dependency checker
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
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
    mockBuildAstroCommand.mockClear();
    mockBuildAstroCommandString.mockClear();

    // Default: Mock @astrojs/check as INSTALLED for all tests
    // Individual test suites can override this behavior
    mockExistsSync.mockImplementation((path: string) => {
      // By default, package is installed
      if (path.includes('node_modules/@astrojs/check')) return true;
      if (path.includes('package.json')) return true;
      return false;
    });

    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        dependencies: {},
        devDependencies: {
          astro: '^4.0.0',
          '@astrojs/check': '^0.3.0',
        },
      }),
    );

    // Default command-builder mock implementations
    mockBuildAstroCommandString.mockImplementation(
      (subcommand: string, args: string[], rootDir: string) => {
        return `bunx astro ${subcommand} ${args.join(' ')}`;
      },
    );

    mockBuildAstroCommand.mockImplementation(
      (subcommand: string, args: string[], rootDir: string) => {
        return {
          command: 'bunx',
          args: ['astro', subcommand, ...args],
        };
      },
    );
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
          callback(0);
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
          callback(0);
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
          callback(0);
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
          callback(0);
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
          callback(0);
        }
        return mockChildProcess;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });

  describe('Missing @astrojs/check Dependency', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockExistsSync.mockReset();
      mockReadFileSync.mockReset();
    });

    it('should fail with helpful error when @astrojs/check is missing', async () => {
      const options: CheckExecutorSchema = {};

      // Mock @astrojs/check not in node_modules, but package.json exists
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('package.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('@astrojs/check');
      expect(result.error).toContain('install');
    });

    it('should detect Bun package manager from bun.lockb', async () => {
      const options: CheckExecutorSchema = {};

      // Mock bun.lockb exists, @astrojs/check not in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('bun.lockb')) return true;
        if (path.includes('package.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('bun add -d @astrojs/check');
    });

    it('should detect pnpm package manager from pnpm-lock.yaml', async () => {
      const options: CheckExecutorSchema = {};

      // Mock pnpm-lock.yaml exists, @astrojs/check not in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('pnpm-lock.yaml')) return true;
        if (path.includes('package.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('pnpm add -D @astrojs/check');
    });

    it('should detect yarn package manager from yarn.lock', async () => {
      const options: CheckExecutorSchema = {};

      // Mock yarn.lock exists, @astrojs/check not in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('yarn.lock')) return true;
        if (path.includes('package.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('yarn add -D @astrojs/check');
    });

    it('should default to npm when no lock files', async () => {
      const options: CheckExecutorSchema = {};

      // Mock no lock files, only package.json, @astrojs/check not in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('package.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('npm install --save-dev @astrojs/check');
    });

    it('should succeed when @astrojs/check is installed', async () => {
      const options: CheckExecutorSchema = {};

      // Mock @astrojs/check EXISTS in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        // Package is installed in node_modules
        if (path.includes('node_modules/@astrojs/check')) return true;
        if (path.includes('package.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
            '@astrojs/check': '^0.3.0',
          },
        }),
      );

      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        callback(null, { stdout: 'No errors', stderr: '' });
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });

  describe('Auto-Install Feature', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockExistsSync.mockReset();
      mockReadFileSync.mockReset();
    });

    it('should auto-install when autoInstall: true', async () => {
      const options: CheckExecutorSchema = {
        autoInstall: true,
      };

      // Mock missing @astrojs/check in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('package.json')) return true;
        if (path.includes('bun.lockb')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      // Mock successful installation
      let installCalled = false;
      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        if (cmd.includes('bun add')) {
          installCalled = true;
          callback(null, { stdout: 'Package installed', stderr: '' });
        } else if (cmd.includes('astro check')) {
          callback(null, { stdout: 'No errors', stderr: '' });
        }
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(installCalled).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should handle auto-install failures gracefully', async () => {
      const options: CheckExecutorSchema = {
        autoInstall: true,
      };

      // Mock missing @astrojs/check in node_modules
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules/@astrojs/check')) return false;
        if (path.includes('package.json')) return true;
        if (path.includes('npm-shrinkwrap.json')) return true;
        return false;
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: {},
          devDependencies: {
            astro: '^4.0.0',
          },
        }),
      );

      // Mock installation failure
      mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
        if (cmd.includes('npm install')) {
          const error: any = new Error('Installation failed');
          error.code = 1;
          callback(error, { stdout: '', stderr: 'Network error' });
        }
        return {} as any;
      });

      const result = await checkExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('install');
      expect(result.error).toContain('fail');
    });
  });

  describe('Command Builder Integration', () => {
    describe('runCheckMode (non-watch mode)', () => {
      it('should use buildAstroCommandString for command execution', async () => {
        const options: CheckExecutorSchema = {};

        mockBuildAstroCommandString.mockReturnValue(
          'bunx astro check --root /workspace/apps/my-app',
        );

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        // Verify buildAstroCommandString was called
        expect(mockBuildAstroCommandString).toHaveBeenCalled();

        // Verify it was called with correct arguments (subcommand='check', args without 'check', rootDir)
        const calls = mockBuildAstroCommandString.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const [subcommand, args] = calls[0];
        expect(subcommand).toBe('check');
        expect(args).not.toContain('check'); // 'check' should not be in args since it's the subcommand
      });

      it('should execute command string returned by buildAstroCommandString', async () => {
        const options: CheckExecutorSchema = {};
        const expectedCommand =
          'bunx astro check --root /workspace/apps/my-app';

        mockBuildAstroCommandString.mockReturnValue(expectedCommand);

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        // Verify execAsync was called with the command string from buildAstroCommandString
        expect(mockExec).toHaveBeenCalledWith(
          expectedCommand,
          expect.objectContaining({
            cwd: '/workspace',
            env: process.env,
          }),
          expect.any(Function),
        );
      });

      it('should work with Bun package manager', async () => {
        const options: CheckExecutorSchema = {};

        mockBuildAstroCommandString.mockReturnValue(
          'bunx astro check --root /workspace/apps/my-app',
        );

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        const executedCommand = mockExec.mock.calls[0][0];
        expect(executedCommand).toContain('bunx');
      });

      it('should work with pnpm package manager', async () => {
        const options: CheckExecutorSchema = {};

        mockBuildAstroCommandString.mockReturnValue(
          'pnpm exec astro check --root /workspace/apps/my-app',
        );

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        const executedCommand = mockExec.mock.calls[0][0];
        expect(executedCommand).toContain('pnpm exec');
      });

      it('should work with yarn package manager', async () => {
        const options: CheckExecutorSchema = {};

        mockBuildAstroCommandString.mockReturnValue(
          'yarn astro check --root /workspace/apps/my-app',
        );

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        const executedCommand = mockExec.mock.calls[0][0];
        expect(executedCommand).toContain('yarn');
      });

      it('should work with npm package manager', async () => {
        const options: CheckExecutorSchema = {};

        mockBuildAstroCommandString.mockReturnValue(
          'npx astro check --root /workspace/apps/my-app',
        );

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        const executedCommand = mockExec.mock.calls[0][0];
        expect(executedCommand).toContain('npx');
      });

      it('should pass all options correctly through command builder', async () => {
        const options: CheckExecutorSchema = {
          tsconfig: './tsconfig.strict.json',
          verbose: true,
          config: 'custom.config.mjs',
        };

        mockBuildAstroCommandString.mockReturnValue(
          'bunx astro check --root /workspace/apps/my-app --tsconfig ./tsconfig.strict.json --verbose --config custom.config.mjs',
        );

        mockExec.mockImplementation((cmd: string, opts: any, callback: any) => {
          callback(null, { stdout: 'No errors', stderr: '' });
          return {} as any;
        });

        await checkExecutor(options, context);

        // Verify args passed to buildAstroCommandString include all options
        const [, args] = mockBuildAstroCommandString.mock.calls[0];
        expect(args).toContain('--root');
        expect(args).toContain('--tsconfig');
        expect(args).toContain('--verbose');
        expect(args).toContain('--config');
      });
    });

    describe('runWatchMode (watch mode)', () => {
      it('should use buildAstroCommand for spawn execution', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
        };

        mockBuildAstroCommand.mockReturnValue({
          command: 'bunx',
          args: [
            'astro',
            'check',
            '--root',
            '/workspace/apps/my-app',
            '--watch',
          ],
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        // Verify buildAstroCommand was called
        expect(mockBuildAstroCommand).toHaveBeenCalled();

        // Verify it was called with correct arguments
        const [subcommand, args] = mockBuildAstroCommand.mock.calls[0];
        expect(subcommand).toBe('check');
        expect(args).not.toContain('check'); // 'check' should not be in args since it's the subcommand
      });

      it('should spawn with command and args from buildAstroCommand', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
        };

        const expectedCommand = 'bunx';
        const expectedArgs = [
          'astro',
          'check',
          '--root',
          '/workspace/apps/my-app',
          '--watch',
        ];

        mockBuildAstroCommand.mockReturnValue({
          command: expectedCommand,
          args: expectedArgs,
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        // Verify spawn was called with the command and args from buildAstroCommand
        expect(mockSpawn).toHaveBeenCalledWith(
          expectedCommand,
          expectedArgs,
          expect.objectContaining({
            cwd: '/workspace',
            stdio: 'inherit',
            env: process.env,
          }),
        );
      });

      it('should work with Bun package manager in watch mode', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
        };

        mockBuildAstroCommand.mockReturnValue({
          command: 'bunx',
          args: [
            'astro',
            'check',
            '--root',
            '/workspace/apps/my-app',
            '--watch',
          ],
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        const [command, args] = mockSpawn.mock.calls[0];
        expect(command).toBe('bunx');
        expect(args).toContain('astro');
      });

      it('should work with pnpm package manager in watch mode', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
        };

        mockBuildAstroCommand.mockReturnValue({
          command: 'pnpm',
          args: [
            'exec',
            'astro',
            'check',
            '--root',
            '/workspace/apps/my-app',
            '--watch',
          ],
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        const [command, args] = mockSpawn.mock.calls[0];
        expect(command).toBe('pnpm');
        expect(args[0]).toBe('exec');
        expect(args).toContain('astro');
      });

      it('should work with yarn package manager in watch mode', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
        };

        mockBuildAstroCommand.mockReturnValue({
          command: 'yarn',
          args: [
            'astro',
            'check',
            '--root',
            '/workspace/apps/my-app',
            '--watch',
          ],
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        const [command, args] = mockSpawn.mock.calls[0];
        expect(command).toBe('yarn');
        expect(args).toContain('astro');
      });

      it('should work with npm package manager in watch mode', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
        };

        mockBuildAstroCommand.mockReturnValue({
          command: 'npx',
          args: [
            'astro',
            'check',
            '--root',
            '/workspace/apps/my-app',
            '--watch',
          ],
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        const [command, args] = mockSpawn.mock.calls[0];
        expect(command).toBe('npx');
        expect(args).toContain('astro');
      });

      it('should pass all options correctly through command builder in watch mode', async () => {
        const options: CheckExecutorSchema = {
          watch: true,
          tsconfig: './tsconfig.json',
          verbose: true,
        };

        mockBuildAstroCommand.mockReturnValue({
          command: 'bunx',
          args: [
            'astro',
            'check',
            '--root',
            '/workspace/apps/my-app',
            '--watch',
            '--tsconfig',
            './tsconfig.json',
            '--verbose',
          ],
        });

        mockSpawn.mockReturnValue(mockChildProcess);
        mockOn.mockImplementation((event: string, callback: any) => {
          if (event === 'close') {
            callback(0);
          }
          return mockChildProcess;
        });

        await checkExecutor(options, context);

        // Verify args passed to buildAstroCommand include all options
        const [, args] = mockBuildAstroCommand.mock.calls[0];
        expect(args).toContain('--root');
        expect(args).toContain('--watch');
        expect(args).toContain('--tsconfig');
        expect(args).toContain('--verbose');
      });
    });
  });
});
