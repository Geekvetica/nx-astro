import { existsSync, readFileSync } from 'fs';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function readPackageJson(packageJsonPath: string): PackageJson | null {
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function extractBaseVersion(versionRange: string): string {
  const match = versionRange.match(/^[\^~>=<]*\s*(\d+\.\d+\.\d+)/);
  return match ? match[1] : versionRange;
}

function getAstroVersion(
  packageJson: PackageJson,
): { version: string; range: string } | null {
  const deps = packageJson.dependencies;
  const devDeps = packageJson.devDependencies;

  const astroVersion = deps?.['astro'] ?? devDeps?.['astro'];

  if (!astroVersion) {
    return null;
  }

  return {
    version: extractBaseVersion(astroVersion),
    range: astroVersion,
  };
}

export function detectAstroVersion(packageJsonPath: string): string | null {
  const packageJson = readPackageJson(packageJsonPath);
  if (!packageJson) {
    return null;
  }

  const astroVersion = getAstroVersion(packageJson);
  return astroVersion?.version ?? null;
}

export function parseMajorVersion(version: string): number {
  const match = version.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function getAstroVersionRange(packageJsonPath: string): string | null {
  const packageJson = readPackageJson(packageJsonPath);
  if (!packageJson) {
    return null;
  }

  const astroVersion = getAstroVersion(packageJson);
  return astroVersion?.range ?? null;
}
