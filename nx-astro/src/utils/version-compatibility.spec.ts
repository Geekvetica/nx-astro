import { vol } from 'memfs';
import {
  getCompatibilityFlags,
  getCompatibilityFlagsFromPath,
  type AstroVersionFlags,
} from './version-compatibility';

jest.mock('fs', () => {
  const memfs = require('memfs');
  return memfs.fs;
});

describe('version-compatibility', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('getCompatibilityFlags', () => {
    it('should return correct flags for Astro 4.x', () => {
      // Act
      const result = getCompatibilityFlags(4);

      // Assert
      expect(result.majorVersion).toBe(4);
      expect(result.supportsHybridOutput).toBe(true);
      expect(result.supportsAstroGlob).toBe(true);
      expect(result.requiresNode22).toBe(false);
      expect(result.supportsLegacyContentCollections).toBe(true);
      expect(result.supportsCjsConfig).toBe(true);
      expect(result.usesVite7).toBe(false);
      expect(result.usesZod4).toBe(false);
    });

    it('should return correct flags for Astro 5.x', () => {
      // Act
      const result = getCompatibilityFlags(5);

      // Assert
      expect(result.majorVersion).toBe(5);
      expect(result.supportsHybridOutput).toBe(false);
      expect(result.supportsAstroGlob).toBe(false);
      expect(result.requiresNode22).toBe(false);
      expect(result.supportsLegacyContentCollections).toBe(true);
      expect(result.supportsCjsConfig).toBe(true);
      expect(result.usesVite7).toBe(false);
      expect(result.usesZod4).toBe(false);
    });

    it('should return correct flags for Astro 6.x', () => {
      // Act
      const result = getCompatibilityFlags(6);

      // Assert
      expect(result.majorVersion).toBe(6);
      expect(result.supportsHybridOutput).toBe(false);
      expect(result.supportsAstroGlob).toBe(false);
      expect(result.requiresNode22).toBe(true);
      expect(result.supportsLegacyContentCollections).toBe(false);
      expect(result.supportsCjsConfig).toBe(false);
      expect(result.usesVite7).toBe(true);
      expect(result.usesZod4).toBe(true);
    });

    it('should handle unknown future versions with Astro 6+ flags', () => {
      // Act
      const result = getCompatibilityFlags(7);

      // Assert
      expect(result.majorVersion).toBe(7);
      expect(result.supportsHybridOutput).toBe(false);
      expect(result.supportsAstroGlob).toBe(false);
      expect(result.requiresNode22).toBe(true);
      expect(result.supportsLegacyContentCollections).toBe(false);
      expect(result.supportsCjsConfig).toBe(false);
      expect(result.usesVite7).toBe(true);
      expect(result.usesZod4).toBe(true);
    });

    it('should handle Astro 3.x with legacy flags', () => {
      // Act
      const result = getCompatibilityFlags(3);

      // Assert
      expect(result.majorVersion).toBe(3);
      expect(result.supportsHybridOutput).toBe(true);
      expect(result.supportsAstroGlob).toBe(true);
      expect(result.requiresNode22).toBe(false);
      expect(result.supportsLegacyContentCollections).toBe(true);
      expect(result.supportsCjsConfig).toBe(true);
      expect(result.usesVite7).toBe(false);
      expect(result.usesZod4).toBe(false);
    });
  });

  describe('getCompatibilityFlagsFromPath', () => {
    it('should return null when package.json does not exist', () => {
      // Arrange
      vol.fromJSON({});

      // Act
      const result = getCompatibilityFlagsFromPath('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when astro is not in dependencies', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            express: '^4.18.0',
          },
        }),
      });

      // Act
      const result = getCompatibilityFlagsFromPath('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });

    it('should return flags for Astro 5.x project', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '^5.0.0',
          },
        }),
      });

      // Act
      const result = getCompatibilityFlagsFromPath('/project/package.json');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.majorVersion).toBe(5);
      expect(result!.supportsCjsConfig).toBe(true);
      expect(result!.usesVite7).toBe(false);
    });

    it('should return flags for Astro 6.x project', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          devDependencies: {
            astro: '^6.0.0',
          },
        }),
      });

      // Act
      const result = getCompatibilityFlagsFromPath('/project/package.json');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.majorVersion).toBe(6);
      expect(result!.requiresNode22).toBe(true);
      expect(result!.usesZod4).toBe(true);
    });

    it('should handle invalid package.json gracefully', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': 'not valid json',
      });

      // Act
      const result = getCompatibilityFlagsFromPath('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('AstroVersionFlags interface', () => {
    it('should be assignable with all required fields', () => {
      // Arrange & Act
      const flags: AstroVersionFlags = {
        majorVersion: 5,
        supportsHybridOutput: false,
        supportsAstroGlob: false,
        requiresNode22: false,
        supportsLegacyContentCollections: true,
        supportsCjsConfig: true,
        usesVite7: false,
        usesZod4: false,
      };

      // Assert
      expect(flags.majorVersion).toBe(5);
    });
  });
});
