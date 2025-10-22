import { vol } from 'memfs';
import { logger } from '@nx/devkit';
import { syncAstrojsDependencies } from './sync-astrojs-deps';

// Mock fs module
jest.mock('fs', () => {
  const memfs = require('memfs');
  return memfs.fs;
});

// Mock logger
jest.mock('@nx/devkit', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('syncAstrojsDependencies', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });

  describe('basic synchronization', () => {
    it('should sync astro and @astrojs/* dependencies from root to project', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
            react: '^18.0.0',
          },
          devDependencies: {
            '@astrojs/check': '^0.5.0',
            typescript: '^5.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            astro: '^4.0.0',
            '@astrojs/react': '^2.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/react': '^3.0.0',
        '@astrojs/vue': '^4.0.0',
        '@astrojs/check': '^0.5.0',
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Synced 4 Astro-related'),
      );
    });

    it('should preserve non-Astro dependencies in project', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            astro: '^4.0.0',
            '@astrojs/react': '^2.0.0',
            react: '^18.0.0',
            lodash: '^4.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/react': '^3.0.0',
        react: '^18.0.0',
        lodash: '^4.0.0',
      });
    });
  });

  describe('already in sync', () => {
    it('should skip write when dependencies are already in sync', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
            react: '^18.0.0',
          },
        }),
      });

      const originalContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      );

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      );
      expect(updatedContent).toBe(originalContent);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('already in sync'),
      );
    });
  });

  describe('missing project package.json', () => {
    it('should warn and skip when project package.json does not exist', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('package.json not found'),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('apps/my-app/package.json'),
      );
    });
  });

  describe('no Astro-related dependencies in root', () => {
    it('should clear Astro-related dependencies from project when root has none', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            react: '^18.0.0',
            vue: '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^2.0.0',
            '@astrojs/vue': '^3.0.0',
            react: '^18.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        react: '^18.0.0',
      });
      expect(updatedPackageJson.dependencies).not.toHaveProperty('astro');
      expect(updatedPackageJson.dependencies).not.toHaveProperty(
        '@astrojs/react',
      );
      expect(updatedPackageJson.dependencies).not.toHaveProperty(
        '@astrojs/vue',
      );
    });
  });

  describe('project missing Astro-related dependencies', () => {
    it('should add missing Astro-related dependencies to project', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
            '@astrojs/svelte': '^5.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            '@astrojs/react': '^3.0.0',
            react: '^18.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/react': '^3.0.0',
        '@astrojs/vue': '^4.0.0',
        '@astrojs/svelte': '^5.0.0',
        react: '^18.0.0',
      });
    });
  });

  describe('project has extra Astro-related dependencies', () => {
    it('should remove Astro-related dependencies not in root', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
            '@astrojs/svelte': '^5.0.0',
            react: '^18.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/react': '^3.0.0',
        react: '^18.0.0',
      });
      expect(updatedPackageJson.dependencies).not.toHaveProperty(
        '@astrojs/vue',
      );
      expect(updatedPackageJson.dependencies).not.toHaveProperty(
        '@astrojs/svelte',
      );
    });
  });

  describe('mixed changes', () => {
    it('should handle add, update, and remove operations in single sync', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0', // update
            '@astrojs/react': '^3.0.0', // update
            '@astrojs/vue': '^4.0.0', // add
          },
          devDependencies: {
            '@astrojs/check': '^0.5.0', // add
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            astro: '^4.0.0', // should update
            '@astrojs/react': '^2.0.0', // should update
            '@astrojs/svelte': '^5.0.0', // should remove
            react: '^18.0.0', // should keep
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/react': '^3.0.0',
        '@astrojs/vue': '^4.0.0',
        '@astrojs/check': '^0.5.0',
        react: '^18.0.0',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle project with no dependencies field', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            astro: '^5.0.0',
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/react': '^3.0.0',
      });
    });

    it('should handle root with no dependencies or devDependencies', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          name: 'root',
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            '@astrojs/react': '^2.0.0',
            react: '^18.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        react: '^18.0.0',
      });
    });

    it('should preserve other package.json fields when syncing', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          description: 'My awesome app',
          private: true,
          scripts: {
            build: 'astro build',
          },
          dependencies: {
            '@astrojs/react': '^2.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.name).toBe('my-app');
      expect(updatedPackageJson.version).toBe('0.1.0');
      expect(updatedPackageJson.description).toBe('My awesome app');
      expect(updatedPackageJson.private).toBe(true);
      expect(updatedPackageJson.scripts).toEqual({ build: 'astro build' });
    });

    it('should handle empty project dependencies object', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {},
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/my-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        '@astrojs/react': '^3.0.0',
      });
    });
  });

  describe('filesystem write optimization', () => {
    it('should only write to filesystem when changes are needed', () => {
      // Arrange
      const writeFileSyncSpy = jest.spyOn(require('fs'), 'writeFileSync');

      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            '@astrojs/react': '^3.0.0',
            react: '^18.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('already in sync'),
      );

      writeFileSyncSpy.mockRestore();
    });

    it('should write to filesystem when changes are detected', () => {
      // Arrange
      const writeFileSyncSpy = jest.spyOn(require('fs'), 'writeFileSync');

      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            '@astrojs/react': '^2.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Synced'),
      );

      writeFileSyncSpy.mockRestore();
    });
  });

  describe('logging behavior', () => {
    it('should log info message with count when syncing dependencies', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
            '@astrojs/vue': '^4.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {},
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Synced 2 Astro-related dependencies to apps/my-app/package.json',
      );
    });

    it('should use singular form for single dependency', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {},
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Synced 1 Astro-related dependency to apps/my-app/package.json',
      );
    });

    it('should log already in sync message when no changes needed', () => {
      // Arrange
      vol.fromJSON({
        '/workspace/package.json': JSON.stringify({
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
        '/workspace/apps/my-app/package.json': JSON.stringify({
          name: 'my-app',
          version: '0.1.0',
          dependencies: {
            '@astrojs/react': '^3.0.0',
          },
        }),
      });

      // Act
      syncAstrojsDependencies('apps/my-app', '/workspace');

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Astro-related dependencies already in sync for apps/my-app/package.json',
      );
    });
  });

  describe('devDependencies handling', () => {
    it('should check devDependencies when comparing sync status', () => {
      // Arrange - Project has @astrojs/check in devDependencies
      const projectPackageJson = {
        name: 'test-app',
        dependencies: {},
        devDependencies: {
          '@astrojs/check': '^0.9.4',
        },
      };

      const rootPackageJson = {
        dependencies: {},
        devDependencies: {
          '@astrojs/check': '^0.9.4', // Same version as project
        },
      };

      vol.fromJSON({
        '/workspace/apps/test-app/package.json': JSON.stringify(
          projectPackageJson,
          null,
          2,
        ),
        '/workspace/package.json': JSON.stringify(rootPackageJson, null, 2),
      });

      const writeFileSyncSpy = jest.spyOn(require('fs'), 'writeFileSync');

      // Act
      syncAstrojsDependencies('apps/test-app', '/workspace');

      // Assert - Should NOT write because dependencies are already in sync
      expect(writeFileSyncSpy).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('already in sync'),
      );

      writeFileSyncSpy.mockRestore();
    });

    it('should extract from both dependencies and devDependencies', () => {
      // Arrange
      const projectPackageJson = {
        name: 'test-app',
        dependencies: {
          astro: '^5.0.0',
        },
        devDependencies: {
          '@astrojs/check': '^0.9.4',
        },
      };

      const rootPackageJson = {
        dependencies: {
          astro: '^5.0.0',
        },
        devDependencies: {
          '@astrojs/check': '^0.9.4',
        },
      };

      vol.fromJSON({
        '/workspace/apps/test-app/package.json': JSON.stringify(
          projectPackageJson,
          null,
          2,
        ),
        '/workspace/package.json': JSON.stringify(rootPackageJson, null, 2),
      });

      const writeFileSyncSpy = jest.spyOn(require('fs'), 'writeFileSync');

      // Act
      syncAstrojsDependencies('apps/test-app', '/workspace');

      // Assert - Should log "already in sync" message
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('already in sync'),
      );
      expect(writeFileSyncSpy).not.toHaveBeenCalled();

      writeFileSyncSpy.mockRestore();
    });

    it('should sync devDependencies from root when project is missing them', () => {
      // Arrange
      const projectPackageJson = {
        name: 'test-app',
        dependencies: {
          astro: '^5.0.0',
        },
      };

      const rootPackageJson = {
        dependencies: {
          astro: '^5.0.0',
        },
        devDependencies: {
          '@astrojs/check': '^0.9.4',
        },
      };

      vol.fromJSON({
        '/workspace/apps/test-app/package.json': JSON.stringify(
          projectPackageJson,
          null,
          2,
        ),
        '/workspace/package.json': JSON.stringify(rootPackageJson, null, 2),
      });

      // Act
      syncAstrojsDependencies('apps/test-app', '/workspace');

      // Assert
      const updatedContent = vol.readFileSync(
        '/workspace/apps/test-app/package.json',
        'utf-8',
      ) as string;
      const updatedPackageJson = JSON.parse(updatedContent);

      expect(updatedPackageJson.dependencies).toEqual({
        astro: '^5.0.0',
        '@astrojs/check': '^0.9.4',
      });
    });
  });
});
