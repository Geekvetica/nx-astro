import { ExecutorContext } from '@nx/devkit';
import { SyncExecutorSchema } from './schema';

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

// Mock command-builder
const mockBuildAstroCommandString = jest.fn();

jest.mock('../../utils/command-builder', () => ({
  buildAstroCommandString: mockBuildAstroCommandString,
}));

import syncExecutor from './executor';

describe('Sync Executor', () => {
  let context: ExecutorContext;

  beforeEach(() => {
    context = {
      root: '/workspace',
      projectName: 'my-app',
      targetName: 'sync',
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
    mockBuildAstroCommandString.mockClear();

    // Default implementation for buildAstroCommandString
    mockBuildAstroCommandString.mockImplementation(
      (subcommand: string, args: string[], rootDir: string) => {
        return `bunx astro ${subcommand} ${args.join(' ')}`;
      },
    );
  });

  describe('command-builder integration', () => {
    it('should use buildAstroCommandString with sync subcommand', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'sync',
        expect.arrayContaining(['--root', '/workspace/apps/my-app']),
        '/workspace',
      );
    });

    it('should pass correct args to buildAstroCommandString with config option', async () => {
      const options: SyncExecutorSchema = {
        config: 'astro.config.custom.mjs',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'sync',
        expect.arrayContaining([
          '--root',
          '/workspace/apps/my-app',
          '--config',
          'astro.config.custom.mjs',
        ]),
        '/workspace',
      );
    });

    it('should pass correct args to buildAstroCommandString with verbose flag', async () => {
      const options: SyncExecutorSchema = {
        verbose: true,
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'sync',
        expect.arrayContaining([
          '--root',
          '/workspace/apps/my-app',
          '--verbose',
        ]),
        '/workspace',
      );
    });

    it('should pass correct args to buildAstroCommandString with additional args', async () => {
      const options: SyncExecutorSchema = {
        additionalArgs: ['--force', '--experimental'],
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'sync',
        expect.arrayContaining([
          '--root',
          '/workspace/apps/my-app',
          '--force',
          '--experimental',
        ]),
        '/workspace',
      );
    });

    it('should pass correct args to buildAstroCommandString with all options', async () => {
      const options: SyncExecutorSchema = {
        root: '/custom/root',
        config: 'astro.config.custom.mjs',
        verbose: true,
        additionalArgs: ['--force'],
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockBuildAstroCommandString).toHaveBeenCalledWith(
        'sync',
        expect.arrayContaining([
          '--root',
          '/custom/root',
          '--config',
          'astro.config.custom.mjs',
          '--verbose',
          '--force',
        ]),
        '/workspace',
      );
    });

    it('should execute the command string returned by buildAstroCommandString', async () => {
      const options: SyncExecutorSchema = {};
      const mockCommandString = 'bunx astro sync --root /workspace/apps/my-app';

      mockBuildAstroCommandString.mockReturnValue(mockCommandString);
      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockExecAsync).toHaveBeenCalledWith(
        mockCommandString,
        expect.objectContaining({
          cwd: '/workspace',
          env: process.env,
        }),
      );
    });
  });

  describe('basic functionality', () => {
    it('should run astro sync command', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      const result = await syncExecutor(options, context);

      expect(mockExecAsync).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return success when sync completes', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(true);
    });

    it('should return failure when sync fails', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockRejectedValue(new Error('Sync failed'));

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should complete and exit', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      const result = await syncExecutor(options, context);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('config option', () => {
    it('should handle config option', async () => {
      const options: SyncExecutorSchema = {
        config: 'astro.config.custom.mjs',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--config');
      expect(callArgs).toContain('astro.config.custom.mjs');
    });
  });

  describe('verbose flag', () => {
    it('should handle verbose flag', async () => {
      const options: SyncExecutorSchema = {
        verbose: true,
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--verbose');
    });
  });

  describe('additional arguments', () => {
    it('should handle additional args', async () => {
      const options: SyncExecutorSchema = {
        additionalArgs: ['--force', '--experimental'],
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--force');
      expect(callArgs).toContain('--experimental');
    });
  });

  describe('error handling', () => {
    it('should handle missing astro CLI', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockRejectedValue(new Error('Command not found: astro'));

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command not found: astro');
    });

    it('should handle sync failures', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockRejectedValue(new Error('Failed to generate types'));

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return proper exit codes', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockRejectedValue(
        new Error('Sync failed with exit code 1'),
      );

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(false);
    });

    it('should parse error messages', async () => {
      const options: SyncExecutorSchema = {};

      const error = new Error('Type generation failed');
      mockExecAsync.mockRejectedValue(error);

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Type generation failed');
    });
  });

  describe('root path', () => {
    it('should resolve root path correctly', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--root');
      expect(callArgs).toContain('/workspace/apps/my-app');
    });

    it('should use project root from context', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('apps/my-app');
    });

    it('should use custom root when provided', async () => {
      const options: SyncExecutorSchema = {
        root: '/custom/root',
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('--root');
      expect(callArgs).toContain('/custom/root');
    });
  });

  describe('output', () => {
    it('should log sync command', async () => {
      const options: SyncExecutorSchema = {};

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      expect(mockExecAsync).toHaveBeenCalled();
      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('astro sync');
    });

    it('should log sync results', async () => {
      const options: SyncExecutorSchema = {};

      const mockOutput = 'Types generated successfully';
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: '' });

      const result = await syncExecutor(options, context);

      expect(result.success).toBe(true);
    });

    it('should stream output', async () => {
      const options: SyncExecutorSchema = {};

      const mockOutput = 'Generating types...\nTypes generated successfully';
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: '' });

      await syncExecutor(options, context);

      expect(mockExecAsync).toHaveBeenCalled();
    });
  });

  describe('combined options', () => {
    it('should handle all options combined', async () => {
      const options: SyncExecutorSchema = {
        root: '/custom/root',
        config: 'astro.config.custom.mjs',
        verbose: true,
        additionalArgs: ['--force'],
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      await syncExecutor(options, context);

      const callArgs = mockExecAsync.mock.calls[0][0] as string;
      expect(callArgs).toContain('astro sync');
      expect(callArgs).toContain('--root');
      expect(callArgs).toContain('/custom/root');
      expect(callArgs).toContain('--config');
      expect(callArgs).toContain('astro.config.custom.mjs');
      expect(callArgs).toContain('--verbose');
      expect(callArgs).toContain('--force');
    });
  });

  describe('missing context', () => {
    it('should handle missing project name', async () => {
      const options: SyncExecutorSchema = {};
      const invalidContext = { ...context, projectName: undefined };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      const result = await syncExecutor(
        options,
        invalidContext as ExecutorContext,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project name is not defined');
    });

    it('should handle missing project configuration', async () => {
      const options: SyncExecutorSchema = {};
      const invalidContext = {
        ...context,
        projectsConfigurations: {
          version: 2,
          projects: {},
        },
      };

      mockExecAsync.mockResolvedValue({
        stdout: 'Types generated successfully',
        stderr: '',
      });

      const result = await syncExecutor(
        options,
        invalidContext as ExecutorContext,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project configuration not found');
    });
  });
});
