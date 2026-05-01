import { vol } from 'memfs';
import {
  detectAstroVersion,
  parseMajorVersion,
  getAstroVersionRange,
} from './version-detector';

jest.mock('fs', () => {
  const memfs = require('memfs');
  return memfs.fs;
});

describe('version-detector', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('detectAstroVersion', () => {
    it('should return null when package.json does not exist', () => {
      // Arrange
      vol.fromJSON({});

      // Act
      const result = detectAstroVersion('/project/package.json');

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
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });

    it('should detect astro version from dependencies', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '5.14.5',
          },
        }),
      });

      // Act
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBe('5.14.5');
    });

    it('should detect astro version from devDependencies', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          devDependencies: {
            astro: '6.2.0',
          },
        }),
      });

      // Act
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBe('6.2.0');
    });

    it('should prefer dependencies over devDependencies', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '5.14.5',
          },
          devDependencies: {
            astro: '6.2.0',
          },
        }),
      });

      // Act
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBe('5.14.5');
    });

    it('should extract base version from caret range', () => {
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
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBe('5.0.0');
    });

    it('should extract base version from tilde range', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '~6.1.0',
          },
        }),
      });

      // Act
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBe('6.1.0');
    });

    it('should extract base version from >= range', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '>=5.0.0',
          },
        }),
      });

      // Act
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBe('5.0.0');
    });

    it('should handle invalid package.json gracefully', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': 'not valid json',
      });

      // Act
      const result = detectAstroVersion('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('parseMajorVersion', () => {
    it('should parse major version from semver string', () => {
      // Act & Assert
      expect(parseMajorVersion('5.14.5')).toBe(5);
      expect(parseMajorVersion('6.2.0')).toBe(6);
      expect(parseMajorVersion('4.16.1')).toBe(4);
    });

    it('should handle versions with pre-release tags', () => {
      // Act & Assert
      expect(parseMajorVersion('5.0.0-beta.1')).toBe(5);
      expect(parseMajorVersion('6.0.0-alpha.0')).toBe(6);
    });

    it('should handle versions with build metadata', () => {
      // Act & Assert
      expect(parseMajorVersion('5.0.0+build.123')).toBe(5);
    });

    it('should return 0 for invalid version strings', () => {
      // Act & Assert
      expect(parseMajorVersion('invalid')).toBe(0);
      expect(parseMajorVersion('')).toBe(0);
      expect(parseMajorVersion('not-a-version')).toBe(0);
    });
  });

  describe('getAstroVersionRange', () => {
    it('should return null when package.json does not exist', () => {
      // Arrange
      vol.fromJSON({});

      // Act
      const result = getAstroVersionRange('/project/package.json');

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
      const result = getAstroVersionRange('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });

    it('should return version range from dependencies', () => {
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
      const result = getAstroVersionRange('/project/package.json');

      // Assert
      expect(result).toBe('^5.0.0');
    });

    it('should return version range from devDependencies', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          devDependencies: {
            astro: '>=5.0.0 <7.0.0',
          },
        }),
      });

      // Act
      const result = getAstroVersionRange('/project/package.json');

      // Assert
      expect(result).toBe('>=5.0.0 <7.0.0');
    });

    it('should prefer dependencies over devDependencies', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '^5.0.0',
          },
          devDependencies: {
            astro: '^6.0.0',
          },
        }),
      });

      // Act
      const result = getAstroVersionRange('/project/package.json');

      // Assert
      expect(result).toBe('^5.0.0');
    });

    it('should handle exact version', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            astro: '5.14.5',
          },
        }),
      });

      // Act
      const result = getAstroVersionRange('/project/package.json');

      // Assert
      expect(result).toBe('5.14.5');
    });

    it('should handle invalid package.json gracefully', () => {
      // Arrange
      vol.fromJSON({
        '/project/package.json': 'not valid json',
      });

      // Act
      const result = getAstroVersionRange('/project/package.json');

      // Assert
      expect(result).toBeNull();
    });
  });
});
