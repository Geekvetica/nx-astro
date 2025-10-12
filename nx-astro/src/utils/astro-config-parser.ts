import { AstroConfig } from '../types/astro-config';

/**
 * Parses an Astro configuration file content and extracts configuration values.
 * This uses a simple regex-based approach to extract common configuration values
 * without requiring a full JavaScript parser or evaluation.
 *
 * @param configContent - The content of the astro.config file
 * @returns Parsed Astro configuration object
 */
export function parseAstroConfig(configContent: string): Partial<AstroConfig> {
  const config: Partial<AstroConfig> = {};

  try {
    // Remove comments (but preserve // inside strings)
    const content = configContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments first
      .split('\n')
      .map((line) => {
        // Don't remove // that's inside a string
        const stringMatch = line.match(/(['"`]).*?\1/g);
        if (stringMatch && stringMatch.some((s) => s.includes('//'))) {
          // Line has // inside a string, don't strip it
          return line;
        }
        // Remove // comments
        return line.replace(/\/\/.*$/, '');
      })
      .join('\n');

    // Extract the config object (everything between { and })
    // Handle both direct export and defineConfig wrapper
    // Find the last opening brace before the closing
    const exportMatch = content.match(/export\s+default\s+([\s\S]+)$/);
    if (!exportMatch) {
      return config;
    }

    let exportContent = exportMatch[1].trim();

    // Remove defineConfig wrapper if present
    if (exportContent.startsWith('defineConfig')) {
      const defineMatch = exportContent.match(
        /defineConfig\s*\(\s*({[\s\S]*})\s*\)/
      );
      if (defineMatch) {
        exportContent = defineMatch[1];
      }
    }

    // Extract the config object body
    const openBrace = exportContent.indexOf('{');
    const closeBrace = exportContent.lastIndexOf('}');

    if (openBrace === -1 || closeBrace === -1) {
      return config;
    }

    const configBody = exportContent.substring(openBrace + 1, closeBrace);

    // Parse simple string values
    config.output = extractStringValue(configBody, 'output') as
      | 'static'
      | 'server'
      | 'hybrid'
      | undefined;
    config.srcDir = extractStringValue(configBody, 'srcDir');
    config.publicDir = extractStringValue(configBody, 'publicDir');
    config.outDir = extractStringValue(configBody, 'outDir');
    config.cacheDir = extractStringValue(configBody, 'cacheDir');
    config.site = extractStringValue(configBody, 'site');
    config.base = extractStringValue(configBody, 'base');
    config.root = extractStringValue(configBody, 'root');
    config.trailingSlash = extractStringValue(configBody, 'trailingSlash') as
      | 'always'
      | 'never'
      | 'ignore'
      | undefined;

    // Parse server object
    const serverMatch = configBody.match(/server\s*:\s*{([^}]*)}/);
    if (serverMatch) {
      const serverBody = serverMatch[1];
      config.server = {
        port: extractNumberValue(serverBody, 'port'),
        host: extractStringOrBooleanValue(serverBody, 'host'),
        open: extractStringOrBooleanValue(serverBody, 'open'),
      };
    }

    // Parse build object
    const buildMatch = configBody.match(/build\s*:\s*{([^}]*)}/);
    if (buildMatch) {
      const buildBody = buildMatch[1];
      config.build = {
        format: extractStringValue(buildBody, 'format') as
          | 'file'
          | 'directory'
          | undefined,
        client: extractStringValue(buildBody, 'client'),
        server: extractStringValue(buildBody, 'server'),
        assets: extractStringValue(buildBody, 'assets'),
        assetsPrefix: extractStringValue(buildBody, 'assetsPrefix'),
        serverEntry: extractStringValue(buildBody, 'serverEntry'),
        redirects: extractBooleanValue(buildBody, 'redirects'),
        inlineStylesheets: extractStringValue(
          buildBody,
          'inlineStylesheets'
        ) as 'always' | 'auto' | 'never' | undefined,
      };
    }

    // Check for adapter (just mark it as present if we find adapter: keyword)
    if (/adapter\s*:\s*\w+\s*\(/.test(configBody)) {
      config.adapter = { name: 'detected' };
    }

    // Check for integrations (mark as present if we find integrations array)
    if (/integrations\s*:\s*\[/.test(configBody)) {
      config.integrations = [];
    }

    // Clean up undefined values
    Object.keys(config).forEach((key) => {
      const configKey = key as keyof AstroConfig;
      if (config[configKey] === undefined) {
        delete config[configKey];
      }
    });

    // Clean up nested objects with undefined values
    if (config.server) {
      Object.keys(config.server).forEach((key) => {
        const serverKey = key as keyof NonNullable<AstroConfig['server']>;
        if (config.server && config.server[serverKey] === undefined) {
          delete config.server[serverKey];
        }
      });
      if (Object.keys(config.server).length === 0) {
        delete config.server;
      }
    }

    if (config.build) {
      Object.keys(config.build).forEach((key) => {
        const buildKey = key as keyof NonNullable<AstroConfig['build']>;
        if (config.build && config.build[buildKey] === undefined) {
          delete config.build[buildKey];
        }
      });
      if (Object.keys(config.build).length === 0) {
        delete config.build;
      }
    }
  } catch {
    // Return empty config on parse error
    return {};
  }

  return config;
}

/**
 * Extracts a string value from a configuration body
 */
function extractStringValue(content: string, key: string): string | undefined {
  // Escape special regex characters in key
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match key followed by colon, then capture everything between quotes
  // Use word boundary to ensure we match the exact key
  const singleQuoteMatch = content.match(
    new RegExp(`\\b${escapedKey}\\s*:\\s*'([^']*)'`)
  );
  if (singleQuoteMatch) return singleQuoteMatch[1];

  const doubleQuoteMatch = content.match(
    new RegExp(`\\b${escapedKey}\\s*:\\s*"([^"]*)"`)
  );
  if (doubleQuoteMatch) return doubleQuoteMatch[1];

  const backtickMatch = content.match(
    new RegExp(`\\b${escapedKey}\\s*:\\s*\`([^\`]*)\``)
  );
  if (backtickMatch) return backtickMatch[1];

  return undefined;
}

/**
 * Extracts a number value from a configuration body
 */
function extractNumberValue(content: string, key: string): number | undefined {
  const match = content.match(new RegExp(`${key}\\s*:\\s*(\\d+)`));
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Extracts a boolean value from a configuration body
 */
function extractBooleanValue(
  content: string,
  key: string
): boolean | undefined {
  const match = content.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  return match ? match[1] === 'true' : undefined;
}

/**
 * Extracts a value that can be either a string or boolean
 */
function extractStringOrBooleanValue(
  content: string,
  key: string
): string | boolean | undefined {
  // Try boolean first
  const boolMatch = content.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  if (boolMatch) {
    return boolMatch[1] === 'true';
  }

  // Try string
  return extractStringValue(content, key);
}
