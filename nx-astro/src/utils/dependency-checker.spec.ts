import { vol } from 'memfs';
import {
  isPackageInstalled,
  detectPackageManager,
  getInstallCommand,
} from './dependency-checker';

// Mock fs module
jest.mock('fs', () => {
  const memfs = require('memfs');
  return memfs.fs;
});

describe('dependency-checker', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('isPackageInstalled', () => {
    it('should return true when package exists', () => {
      // Arrange
      vol.fromJSON({
        '/project/node_modules/astro/package.json': '{}',
      });

      // Act
      const result = isPackageInstalled('astro', '/project');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when package does not exist', () => {
      // Arrange
      vol.fromJSON({
        '/project/node_modules/.keep': '',
      });

      // Act
      const result = isPackageInstalled('astro', '/project');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle scoped packages correctly', () => {
      // Arrange
      vol.fromJSON({
        '/project/node_modules/@astrojs/check/package.json': '{}',
      });

      // Act
      const result = isPackageInstalled('@astrojs/check', '/project');

      // Assert
      expect(result).toBe(true);
    });

    it('should handle nested package paths', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/project/node_modules/@nx/devkit/package.json': '{}',
      });

      // Act
      const result = isPackageInstalled('@nx/devkit', '/workspace/project');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('detectPackageManager', () => {
    it('should detect bun from bun.lockb', () => {
      // Arrange
      vol.fromJSON({
        '/project/bun.lockb': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('bun');
    });

    it('should detect pnpm from pnpm-lock.yaml', () => {
      // Arrange
      vol.fromJSON({
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('pnpm');
    });

    it('should detect yarn from yarn.lock', () => {
      // Arrange
      vol.fromJSON({
        '/project/yarn.lock': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('yarn');
    });

    it('should default to npm when no lock files', () => {
      // Arrange
      vol.fromJSON({
        '/project/.keep': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('npm');
    });

    it('should prioritize lock files over packageManager field', () => {
      // NEW behavior: Lock files are now checked first, before packageManager field
      // This ensures we trust the actual project state (lock file) over metadata

      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'pnpm@9.0.0',
        }),
        '/project/bun.lockb': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      // Lock file (bun.lockb) takes precedence over packageManager field (pnpm)
      expect(result).toBe('bun');
    });

    it('should use packageManager field when no lock files exist', () => {
      // When no lock files are present, fall back to packageManager field

      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'bun@1.0.0',
        }),
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('bun');
    });

    it('should fallback to lock file when packageManager is invalid', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'invalid-pm',
        }),
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('pnpm');
    });

    it('should fallback to lock file when package.json parsing fails', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': 'invalid json{',
        '/project/yarn.lock': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      expect(result).toBe('yarn');
    });

    it('should prioritize lock file over packageManager field for reliability', () => {
      // This test ensures lock files (actual project state) take precedence
      // over packageManager field (which might be incorrectly set)
      //
      // Real-world scenario: create-nx-workspace might set packageManager: "bun@..."
      // even when workspace was created with pnpm (has pnpm-lock.yaml)
      // We should trust the lock file as the source of truth

      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          packageManager: 'bun@1.0.0',
        }),
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      // NEW behavior: Lock file takes precedence for reliability
      expect(result).toBe('pnpm');
    });

    it('should handle priority when both bun.lockb and pnpm-lock.yaml exist', () => {
      // Arrange - no packageManager field, multiple lock files
      vol.fromJSON({
        '/project/bun.lockb': '',
        '/project/pnpm-lock.yaml': '',
      });

      // Act
      const result = detectPackageManager('/project');

      // Assert
      // Current behavior: First lock file checked (bun) wins
      expect(result).toBe('bun');
    });
  });

  describe('getInstallCommand', () => {
    it('should generate correct command for bun dev', () => {
      // Act
      const result = getInstallCommand('@astrojs/check', 'bun', true);

      // Assert
      expect(result).toBe('bun add -d @astrojs/check');
    });

    it('should generate correct command for bun prod', () => {
      // Act
      const result = getInstallCommand('astro', 'bun', false);

      // Assert
      expect(result).toBe('bun add astro');
    });

    it('should generate correct command for pnpm dev', () => {
      // Act
      const result = getInstallCommand('@astrojs/check', 'pnpm', true);

      // Assert
      expect(result).toBe('pnpm add -D @astrojs/check');
    });

    it('should generate correct command for pnpm prod', () => {
      // Act
      const result = getInstallCommand('astro', 'pnpm', false);

      // Assert
      expect(result).toBe('pnpm add astro');
    });

    it('should generate correct command for yarn dev', () => {
      // Act
      const result = getInstallCommand('@astrojs/check', 'yarn', true);

      // Assert
      expect(result).toBe('yarn add -D @astrojs/check');
    });

    it('should generate correct command for yarn prod', () => {
      // Act
      const result = getInstallCommand('astro', 'yarn', false);

      // Assert
      expect(result).toBe('yarn add astro');
    });

    it('should generate correct command for npm dev', () => {
      // Act
      const result = getInstallCommand('@astrojs/check', 'npm', true);

      // Assert
      expect(result).toBe('npm install --save-dev @astrojs/check');
    });

    it('should generate correct command for npm prod', () => {
      // Act
      const result = getInstallCommand('astro', 'npm', false);

      // Assert
      expect(result).toBe('npm install astro');
    });

    it('should default to dev=true when not specified', () => {
      // Act
      const result = getInstallCommand('@astrojs/check', 'bun');

      // Assert
      expect(result).toBe('bun add -d @astrojs/check');
    });

    it('should handle unknown package manager by defaulting to npm dev', () => {
      // Act
      const result = getInstallCommand('astro', 'unknown-pm', true);

      // Assert
      expect(result).toBe('npm install --save-dev astro');
    });

    it('should handle unknown package manager by defaulting to npm prod', () => {
      // Act
      const result = getInstallCommand('astro', 'unknown-pm', false);

      // Assert
      expect(result).toBe('npm install astro');
    });
  });
});
