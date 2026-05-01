import { extractDependencies } from './extract-dependencies';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('extractDependencies', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(process.cwd(), 'nx-astro-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should extract dependencies and devDependencies', () => {
    const packageJson = {
      dependencies: { astro: '^5.0.0', react: '^18.0.0' },
      devDependencies: { vitest: '^2.0.0', '@types/react': '^18.0.0' },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({
      astro: '^5.0.0',
      react: '^18.0.0',
    });
    expect(result.devDependencies).toEqual({
      vitest: '^2.0.0',
      '@types/react': '^18.0.0',
    });
  });

  it('should merge optionalDependencies into devDependencies', () => {
    const packageJson = {
      dependencies: { astro: '^5.0.0' },
      optionalDependencies: { sharp: '^0.33.0' },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({ astro: '^5.0.0' });
    expect(result.devDependencies).toEqual({ sharp: '^0.33.0' });
  });

  it('should filter out workspace: protocol dependencies', () => {
    const packageJson = {
      dependencies: {
        astro: '^5.0.0',
        'shared-lib': 'workspace:*',
        'another-lib': 'workspace:^',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({ astro: '^5.0.0' });
  });

  it('should filter out file: protocol dependencies', () => {
    const packageJson = {
      dependencies: {
        astro: '^5.0.0',
        'local-pkg': 'file:../local-pkg',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({ astro: '^5.0.0' });
  });

  it('should filter out link: protocol dependencies', () => {
    const packageJson = {
      dependencies: {
        astro: '^5.0.0',
        'linked-pkg': 'link:../linked-pkg',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({ astro: '^5.0.0' });
  });

  it('should filter out empty version strings', () => {
    const packageJson = {
      dependencies: {
        astro: '^5.0.0',
        'empty-version': '',
        'whitespace-version': '   ',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({ astro: '^5.0.0' });
  });

  it('should handle missing dependencies and devDependencies fields', () => {
    const packageJson = { name: 'test-project' };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({});
    expect(result.devDependencies).toEqual({});
  });

  it('should handle empty package.json dependencies', () => {
    const packageJson = {
      dependencies: {},
      devDependencies: {},
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({});
    expect(result.devDependencies).toEqual({});
  });

  it('should throw error when package.json does not exist', () => {
    expect(() => extractDependencies('/nonexistent/path')).toThrow(
      'package.json not found at /nonexistent/path/package.json',
    );
  });

  it('should throw error when package.json is invalid JSON', () => {
    writeFileSync(join(tempDir, 'package.json'), '{ invalid json }');

    expect(() => extractDependencies(tempDir)).toThrow(
      'Failed to parse package.json',
    );
  });

  it('should filter all incompatible protocols from devDependencies', () => {
    const packageJson = {
      devDependencies: {
        vitest: '^2.0.0',
        'workspace-dep': 'workspace:^',
        'file-dep': 'file:../local',
        'link-dep': 'link:../linked',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.devDependencies).toEqual({ vitest: '^2.0.0' });
  });

  it('should handle a realistic Astro project package.json', () => {
    const packageJson = {
      name: 'my-astro-app',
      dependencies: {
        astro: '^5.14.5',
        '@astrojs/node': '^9.5.0',
        'shared-ui': 'workspace:*',
      },
      devDependencies: {
        '@astrojs/check': '^0.5.0',
        typescript: '^5.0.0',
        'local-tool': 'file:../tools',
      },
      optionalDependencies: {
        sharp: '^0.33.0',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = extractDependencies(tempDir);

    expect(result.dependencies).toEqual({
      astro: '^5.14.5',
      '@astrojs/node': '^9.5.0',
    });
    expect(result.devDependencies).toEqual({
      '@astrojs/check': '^0.5.0',
      typescript: '^5.0.0',
      sharp: '^0.33.0',
    });
  });
});
