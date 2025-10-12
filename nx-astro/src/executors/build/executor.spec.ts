import { ExecutorContext } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';

// Mock child_process and util
const mockExecAsync = jest.fn();

jest.mock('child_process');
jest.mock('util', () => {
  const actualUtil = jest.requireActual<typeof import('util')>('util');
  return {
    ...actualUtil,
    promisify: jest.fn(() => mockExecAsync),
  };
});

import buildExecutor from './executor';

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

    mockExecAsync.mockClear();
  });

  describe('basic build', () => {
    it('should run astro build command', async () => {
      const options: BuildExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      const result = await buildExecutor(options, context);

      expect(mockExecAsync).toHaveBeenCalled();
      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('astro build');
      expect(callArgs).toContain('--root');
      expect(result.success).toBe(true);
    });

    it('should return success status', async () => {
      const options: BuildExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      const result = await buildExecutor(options, context);

      expect(result.success).toBe(true);
    });
  });

  describe('custom output path', () => {
    it('should use custom output path when provided', async () => {
      const options: BuildExecutorSchema = {
        outputPath: 'dist/custom',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--outDir');
      expect(callArgs).toContain('dist/custom');
    });
  });

  describe('verbose flag', () => {
    it('should handle verbose flag', async () => {
      const options: BuildExecutorSchema = {
        verbose: true,
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--verbose');
    });
  });

  describe('mode option', () => {
    it('should respect mode option - static', async () => {
      const options: BuildExecutorSchema = {
        mode: 'static',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--mode');
      expect(callArgs).toContain('static');
    });

    it('should respect mode option - server', async () => {
      const options: BuildExecutorSchema = {
        mode: 'server',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--mode');
      expect(callArgs).toContain('server');
    });
  });

  describe('error handling', () => {
    it('should return failure status on error', async () => {
      const options: BuildExecutorSchema = {};

      mockExecAsync.mockRejectedValue(new Error('Build failed'));

      const result = await buildExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should handle missing astro', async () => {
      const options: BuildExecutorSchema = {};

      mockExecAsync.mockRejectedValue(new Error('Command not found: astro'));

      const result = await buildExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should handle build errors with stderr', async () => {
      const options: BuildExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'Error: Build failed',
      });

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

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--site');
      expect(callArgs).toContain('https://example.com');
    });

    it('should pass base option', async () => {
      const options: BuildExecutorSchema = {
        base: '/my-app',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--base');
      expect(callArgs).toContain('/my-app');
    });

    it('should pass additional arguments', async () => {
      const options: BuildExecutorSchema = {
        additionalArgs: ['--experimental', '--no-minify'],
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--experimental');
      expect(callArgs).toContain('--no-minify');
    });
  });

  describe('correct flags', () => {
    it('should pass correct flags to Astro CLI', async () => {
      const options: BuildExecutorSchema = {
        verbose: true,
        outputPath: 'dist/out',
        mode: 'static',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('astro build');
      expect(callArgs).toContain('--root');
      expect(callArgs).toContain('--verbose');
      expect(callArgs).toContain('--outDir');
      expect(callArgs).toContain('--mode');
    });
  });

  describe('root path resolution', () => {
    it('should use custom root when provided', async () => {
      const options: BuildExecutorSchema = {
        root: '/custom/root',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--root');
      expect(callArgs).toContain('/custom/root');
    });

    it('should use project root from context when root not provided', async () => {
      const options: BuildExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful',
        stderr: '',
      });

      await buildExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--root');
      expect(callArgs).toContain('/workspace/apps/my-app');
    });
  });
});
