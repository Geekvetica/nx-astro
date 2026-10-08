import { detectAstroVersion, parseMajorVersion } from './version-detector';

export interface AstroVersionFlags {
  majorVersion: number;
  supportsHybridOutput: boolean;
  supportsAstroGlob: boolean;
  requiresNode22: boolean;
  supportsLegacyContentCollections: boolean;
  supportsCjsConfig: boolean;
  usesVite7: boolean;
  usesZod4: boolean;
  usesVite8: boolean;
  usesRustCompiler: boolean;
  usesSatteriMarkdown: boolean;
  supportsAstroDb: boolean;
  defaultCompressHTML: boolean | 'jsx';
}

export function getCompatibilityFlags(majorVersion: number): AstroVersionFlags {
  return {
    majorVersion,
    supportsHybridOutput: majorVersion < 6,
    supportsAstroGlob: majorVersion < 6,
    requiresNode22: majorVersion >= 6,
    supportsLegacyContentCollections: majorVersion < 6,
    supportsCjsConfig: majorVersion < 6,
    usesVite7: majorVersion === 6,
    usesZod4: majorVersion >= 6,
    usesVite8: majorVersion >= 7,
    usesRustCompiler: majorVersion >= 7,
    usesSatteriMarkdown: majorVersion >= 7,
    supportsAstroDb: majorVersion < 7,
    defaultCompressHTML: majorVersion >= 7 ? 'jsx' : true,
  };
}

export function getCompatibilityFlagsFromPath(
  packageJsonPath: string,
): AstroVersionFlags | null {
  const version = detectAstroVersion(packageJsonPath);
  if (!version) {
    return null;
  }

  const majorVersion = parseMajorVersion(version);
  if (majorVersion === 0) {
    return null;
  }
  return getCompatibilityFlags(majorVersion);
}
