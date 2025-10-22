import { vol } from 'memfs';
import {
  getCommandPrefix,
  buildAstroCommand,
  buildAstroCommandString,
  buildCommand,
  buildCommandString,
} from './command-builder';

// Mock fs module
jest.mock('fs', () => {
  const memfs = require('memfs');
  return memfs.fs;
});

describe('command-builder', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('getCommandPrefix', () => {
    it('should return bunx for bun', () => {
      // Act
      const result = getCommandPrefix('bun');

      // Assert
      expect(result).toEqual(['bunx']);
    });

    it('should return pnpm exec for pnpm', () => {
      // Act
      const result = getCommandPrefix('pnpm');

      // Assert
      expect(result).toEqual(['pnpm', 'exec']);
    });

    it('should return yarn for yarn', () => {
      // Act
      const result = getCommandPrefix('yarn');

      // Assert
      expect(result).toEqual(['yarn']);
    });

    it('should return npx for npm', () => {
      // Act
      const result = getCommandPrefix('npm');

      // Assert
      expect(result).toEqual(['npx']);
    });
  });

  describe('buildAstroCommand', () => {
    it('should build command for bun with check subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildAstroCommand('check', [], '/project');

      // Assert
      expect(result).toEqual({
        command: 'bunx',
        args: ['astro', 'check'],
      });
    });

    it('should build command for pnpm with build subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildAstroCommand('build', [], '/project');

      // Assert
      expect(result).toEqual({
        command: 'pnpm',
        args: ['exec', 'astro', 'build'],
      });
    });

    it('should build command for yarn with dev subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildAstroCommand('dev', [], '/project');

      // Assert
      expect(result).toEqual({
        command: 'yarn',
        args: ['astro', 'dev'],
      });
    });

    it('should build command for npm with sync subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/.keep': '',
      });

      // Act
      const result = buildAstroCommand('sync', [], '/project');

      // Assert
      expect(result).toEqual({
        command: 'npx',
        args: ['astro', 'sync'],
      });
    });

    it('should include additional arguments for bun', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildAstroCommand(
        'check',
        ['--root', '/path'],
        '/project',
      );

      // Assert
      expect(result).toEqual({
        command: 'bunx',
        args: ['astro', 'check', '--root', '/path'],
      });
    });

    it('should include additional arguments for pnpm', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildAstroCommand(
        'build',
        ['--mode', 'production'],
        '/project',
      );

      // Assert
      expect(result).toEqual({
        command: 'pnpm',
        args: ['exec', 'astro', 'build', '--mode', 'production'],
      });
    });

    it('should include multiple arguments', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildAstroCommand(
        'dev',
        ['--host', '0.0.0.0', '--port', '3000'],
        '/project',
      );

      // Assert
      expect(result).toEqual({
        command: 'yarn',
        args: ['astro', 'dev', '--host', '0.0.0.0', '--port', '3000'],
      });
    });

    it('should handle empty arguments array', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildAstroCommand('preview', [], '/project');

      // Assert
      expect(result).toEqual({
        command: 'bunx',
        args: ['astro', 'preview'],
      });
    });

    it('should prioritize lock files over packageManager field', () => {
      // NEW behavior: Lock files take precedence

      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'pnpm@9.0.0',
        }),
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildAstroCommand('check', [], '/project');

      // Assert
      // Lock file (bun.lockb) takes precedence over packageManager field (pnpm)
      expect(result).toEqual({
        command: 'bunx',
        args: ['astro', 'check'],
      });
    });
  });

  describe('buildAstroCommandString', () => {
    it('should build command string for bun with check subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildAstroCommandString('check', [], '/project');

      // Assert
      expect(result).toBe('bunx astro check');
    });

    it('should build command string for pnpm with build subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildAstroCommandString('build', [], '/project');

      // Assert
      expect(result).toBe('pnpm exec astro build');
    });

    it('should build command string for yarn with dev subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildAstroCommandString('dev', [], '/project');

      // Assert
      expect(result).toBe('yarn astro dev');
    });

    it('should build command string for npm with sync subcommand', () => {
      // Arrange
      vol.fromJSON({
        '/project/.keep': '',
      });

      // Act
      const result = buildAstroCommandString('sync', [], '/project');

      // Assert
      expect(result).toBe('npx astro sync');
    });

    it('should include additional arguments in command string', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildAstroCommandString(
        'check',
        ['--root', '/path'],
        '/project',
      );

      // Assert
      expect(result).toBe('bunx astro check --root /path');
    });

    it('should include multiple arguments in command string', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildAstroCommandString(
        'dev',
        ['--host', '0.0.0.0', '--port', '3000'],
        '/project',
      );

      // Assert
      expect(result).toBe('pnpm exec astro dev --host 0.0.0.0 --port 3000');
    });

    it('should handle empty arguments array', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildAstroCommandString('preview', [], '/project');

      // Assert
      expect(result).toBe('yarn astro preview');
    });

    it('should prioritize lock files over packageManager field in command string', () => {
      // NEW behavior: Lock files take precedence

      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'bun@1.0.0',
        }),
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildAstroCommandString('build', [], '/project');

      // Assert
      // Lock file (pnpm-lock.yaml) takes precedence over packageManager field (bun)
      expect(result).toBe('pnpm exec astro build');
    });
  });

  describe('buildCommand', () => {
    it('should build command for vitest with bun', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildCommand('vitest', ['run'], '/project');

      // Assert
      expect(result).toEqual({
        command: 'bunx',
        args: ['vitest', 'run'],
      });
    });

    it('should build command for vitest with pnpm', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildCommand('vitest', ['run', '--coverage'], '/project');

      // Assert
      expect(result).toEqual({
        command: 'pnpm',
        args: ['exec', 'vitest', 'run', '--coverage'],
      });
    });

    it('should build command for vitest with yarn', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildCommand('vitest', ['watch'], '/project');

      // Assert
      expect(result).toEqual({
        command: 'yarn',
        args: ['vitest', 'watch'],
      });
    });

    it('should build command for vitest with npm', () => {
      // Arrange
      vol.fromJSON({
        '/project/.keep': '',
      });

      // Act
      const result = buildCommand('vitest', ['run', '--ci'], '/project');

      // Assert
      expect(result).toEqual({
        command: 'npx',
        args: ['vitest', 'run', '--ci'],
      });
    });

    it('should handle empty arguments array', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildCommand('vitest', [], '/project');

      // Assert
      expect(result).toEqual({
        command: 'bunx',
        args: ['vitest'],
      });
    });

    it('should work with different binaries like eslint', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildCommand('eslint', ['.', '--fix'], '/project');

      // Assert
      expect(result).toEqual({
        command: 'pnpm',
        args: ['exec', 'eslint', '.', '--fix'],
      });
    });

    it('should prioritize lock files over packageManager field', () => {
      // NEW behavior: Lock files take precedence

      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'yarn@4.0.0',
        }),
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildCommand('vitest', ['run'], '/project');

      // Assert
      // Lock file (bun.lockb) takes precedence over packageManager field (yarn)
      expect(result).toEqual({
        command: 'bunx',
        args: ['vitest', 'run'],
      });
    });
  });

  describe('buildCommandString', () => {
    it('should build command string for vitest with bun', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildCommandString('vitest', ['run'], '/project');

      // Assert
      expect(result).toBe('bunx vitest run');
    });

    it('should build command string for vitest with pnpm', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = buildCommandString(
        'vitest',
        ['run', '--coverage'],
        '/project',
      );

      // Assert
      expect(result).toBe('pnpm exec vitest run --coverage');
    });

    it('should build command string for vitest with yarn', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildCommandString('vitest', ['watch'], '/project');

      // Assert
      expect(result).toBe('yarn vitest watch');
    });

    it('should build command string for vitest with npm', () => {
      // Arrange
      vol.fromJSON({
        '/project/.keep': '',
      });

      // Act
      const result = buildCommandString('vitest', ['run', '--ci'], '/project');

      // Assert
      expect(result).toBe('npx vitest run --ci');
    });

    it('should handle empty arguments array', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = buildCommandString('vitest', [], '/project');

      // Assert
      expect(result).toBe('bunx vitest');
    });

    it('should work with different binaries', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = buildCommandString(
        'prettier',
        ['--write', '.'],
        '/project',
      );

      // Assert
      expect(result).toBe('yarn prettier --write .');
    });
  });
});
