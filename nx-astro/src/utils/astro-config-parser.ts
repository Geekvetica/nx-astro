import { AstroConfig } from '../types/astro-config';

/**
 * Reports whether a line has a quoted string ('...', "..." or `...`) that
 * contains the given text. Pairs quotes like the lazy regex
 * `/(['"`]).*?\1/g`, but in linear time.
 */
function hasStringLiteralContaining(line: string, text: string): boolean {
  let position = 0;
  while (position < line.length) {
    const quote = line[position];
    if (quote === "'" || quote === '"' || quote === '`') {
      const end = line.indexOf(quote, position + 1);
      if (end !== -1) {
        if (line.slice(position, end + 1).includes(text)) {
          return true;
        }
        position = end + 1;
        continue;
      }
    }
    position++;
  }
  return false;
}

/**
 * Extracts `{ ... }` from `defineConfig ( { ... } )` in linear time.
 * Like the greedy regex `/defineConfig\s*\(\s*({[\s\S]*})\s*\)/`, it uses
 * the first well-formed `defineConfig(` opener and the last `}` that is
 * followed only by whitespace and `)`.
 */
function extractDefineConfigObject(content: string): string | undefined {
  const opener = /defineConfig\s*\(\s*\{/.exec(content);
  if (!opener) {
    return undefined;
  }
  const objectStart = opener.index + opener[0].length - 1;

  for (
    let close = content.lastIndexOf(')');
    close > objectStart;
    close = content.lastIndexOf(')', close - 1)
  ) {
    let objectEnd = close - 1;
    while (objectEnd > objectStart && /\s/.test(content[objectEnd])) {
      objectEnd--;
    }
    if (objectEnd > objectStart && content[objectEnd] === '}') {
      return content.slice(objectStart, objectEnd + 1);
    }
  }
  return undefined;
}

/**
 * Returns the text between an opener such as `server: {` and the next `}`,
 * matching `/key\s*:\s*{([^}]*)}/` in linear time.
 */
function extractFlatObjectBody(
  content: string,
  opener: RegExp,
): string | undefined {
  const match = opener.exec(content);
  if (!match) {
    return undefined;
  }
  const bodyStart = match.index + match[0].length;
  const bodyEnd = content.indexOf('}', bodyStart);
  return bodyEnd === -1 ? undefined : content.slice(bodyStart, bodyEnd);
}

/**
 * Removes block comments in linear time. A lazy regex such as
 * `/\/\*[\s\S]*?\*\//g` is quadratic on many unclosed comment openers.
 * Like that regex, an unclosed opener and everything after it is kept.
 */
function stripBlockComments(content: string): string {
  let result = '';
  let position = 0;
  let start = content.indexOf('/*');
  while (start !== -1) {
    const end = content.indexOf('*/', start + 2);
    if (end === -1) {
      break;
    }
    result += content.slice(position, start);
    position = end + 2;
    start = content.indexOf('/*', position);
  }
  return result + content.slice(position);
}

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
    const content = stripBlockComments(configContent) // Multi-line comments first
      .split('\n')
      .map((line) => {
        // Don't remove // that's inside a string
        if (hasStringLiteralContaining(line, '//')) {
          // Line has // inside a string, don't strip it
          return line;
        }
        // Remove // comments
        const commentStart = line.indexOf('//');
        return commentStart === -1 ? line : line.slice(0, commentStart);
      })
      .join('\n');

    // Extract the config object (everything between { and })
    // Handle both direct export and defineConfig wrapper
    // Find the last opening brace before the closing
    const exportMatch = /export\s+default\s/.exec(content);
    if (!exportMatch) {
      return config;
    }

    let exportContent = content
      .slice(exportMatch.index + exportMatch[0].length)
      .trim();

    // Remove defineConfig wrapper if present
    if (exportContent.startsWith('defineConfig')) {
      const defineConfigObject = extractDefineConfigObject(exportContent);
      if (defineConfigObject !== undefined) {
        exportContent = defineConfigObject;
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
      'static' | 'server' | 'hybrid' | undefined;
    config.srcDir = extractStringValue(configBody, 'srcDir');
    config.publicDir = extractStringValue(configBody, 'publicDir');
    config.outDir = extractStringValue(configBody, 'outDir');
    config.cacheDir = extractStringValue(configBody, 'cacheDir');
    config.site = extractStringValue(configBody, 'site');
    config.base = extractStringValue(configBody, 'base');
    config.root = extractStringValue(configBody, 'root');
    config.trailingSlash = extractStringValue(configBody, 'trailingSlash') as
      'always' | 'never' | 'ignore' | undefined;

    // Parse Astro 7+ top-level options. Only real top-level properties are
    // considered: same-named keys nested in other objects (e.g. vite.define)
    // or appearing inside other string values are ignored.
    const compressHTML = extractTopLevelLiteral(configBody, 'compressHTML');
    if (compressHTML === 'jsx' || typeof compressHTML === 'boolean') {
      config.compressHTML = compressHTML;
    }
    const fetchFile = extractTopLevelLiteral(configBody, 'fetchFile');
    if (typeof fetchFile === 'string') {
      config.fetchFile = fetchFile;
    } else if (fetchFile === null) {
      config.fetchFile = null;
    }

    // Parse server object
    const serverBody = extractFlatObjectBody(configBody, /server\s*:\s*{/);
    if (serverBody !== undefined) {
      config.server = {
        port: extractNumberValue(serverBody, 'port'),
        host: extractStringOrBooleanValue(serverBody, 'host'),
        open: extractStringOrBooleanValue(serverBody, 'open'),
      };
    }

    // Parse build object
    const buildBody = extractFlatObjectBody(configBody, /build\s*:\s*{/);
    if (buildBody !== undefined) {
      config.build = {
        format: extractStringValue(buildBody, 'format') as
          'file' | 'directory' | undefined,
        client: extractStringValue(buildBody, 'client'),
        server: extractStringValue(buildBody, 'server'),
        assets: extractStringValue(buildBody, 'assets'),
        assetsPrefix: extractStringValue(buildBody, 'assetsPrefix'),
        serverEntry: extractStringValue(buildBody, 'serverEntry'),
        redirects: extractBooleanValue(buildBody, 'redirects'),
        inlineStylesheets: extractStringValue(
          buildBody,
          'inlineStylesheets',
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

    // Parse legacy object
    const legacyBody = extractFlatObjectBody(configBody, /legacy\s*:\s*{/);
    if (legacyBody !== undefined) {
      config.legacy = {
        collectionsBackwardsCompat: extractBooleanValue(
          legacyBody,
          'collectionsBackwardsCompat',
        ),
      };
    }

    // Parse session object (Astro 6+)
    const sessionMatch = configBody.match(/session\s*:\s*{/);
    if (sessionMatch && sessionMatch.index !== undefined) {
      const sessionStart = sessionMatch.index + sessionMatch[0].length;
      const sessionBody = extractBalancedBraceContent(configBody, sessionStart);
      if (sessionBody) {
        config.session = {
          driver: extractStringValue(sessionBody, 'driver'),
          ttl: extractNumberValue(sessionBody, 'ttl'),
          options: extractObjectPresence(sessionBody, 'options'),
          cookie: extractObjectPresence(sessionBody, 'cookie'),
        };
      }
    }

    // Parse experimental object
    const experimentalBody = extractFlatObjectBody(
      configBody,
      /experimental\s*:\s*{/,
    );
    if (experimentalBody !== undefined) {
      config.experimental = {
        contentIntellisense: extractBooleanValue(
          experimentalBody,
          'contentIntellisense',
        ),
        responsiveImages: extractBooleanValue(
          experimentalBody,
          'responsiveImages',
        ),
        clientPrerender: extractBooleanValue(
          experimentalBody,
          'clientPrerender',
        ),
        envDirectives: extractBooleanValue(experimentalBody, 'envDirectives'),
        svg: extractBooleanValue(experimentalBody, 'svg'),
        logger: extractExperimentalValue(experimentalBody, 'logger'),
        svgOptimizer: extractExperimentalValue(
          experimentalBody,
          'svgOptimizer',
        ),
      };
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

    if (config.legacy) {
      Object.keys(config.legacy).forEach((key) => {
        const legacyKey = key as keyof NonNullable<AstroConfig['legacy']>;
        if (config.legacy && config.legacy[legacyKey] === undefined) {
          delete config.legacy[legacyKey];
        }
      });
      if (Object.keys(config.legacy).length === 0) {
        delete config.legacy;
      }
    }

    if (config.session) {
      Object.keys(config.session).forEach((key) => {
        const sessionKey = key as keyof NonNullable<AstroConfig['session']>;
        if (config.session && config.session[sessionKey] === undefined) {
          delete config.session[sessionKey];
        }
      });
      if (Object.keys(config.session).length === 0) {
        delete config.session;
      }
    }

    if (config.experimental) {
      Object.keys(config.experimental).forEach((key) => {
        const expKey = key as keyof NonNullable<AstroConfig['experimental']>;
        if (config.experimental && config.experimental[expKey] === undefined) {
          delete config.experimental[expKey];
        }
      });
      if (Object.keys(config.experimental).length === 0) {
        delete config.experimental;
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
    new RegExp(`\\b${escapedKey}\\s*:\\s*'([^']*)'`),
  );
  if (singleQuoteMatch) return singleQuoteMatch[1];

  const doubleQuoteMatch = content.match(
    new RegExp(`\\b${escapedKey}\\s*:\\s*"([^"]*)"`),
  );
  if (doubleQuoteMatch) return doubleQuoteMatch[1];

  const backtickMatch = content.match(
    new RegExp(`\\b${escapedKey}\\s*:\\s*\`([^\`]*)\``),
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
  key: string,
): boolean | undefined {
  const match = content.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  return match ? match[1] === 'true' : undefined;
}

/**
 * Extracts a value that can be either a string or boolean
 */
function extractStringOrBooleanValue(
  content: string,
  key: string,
): string | boolean | undefined {
  // Try boolean first
  const boolMatch = content.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  if (boolMatch) {
    return boolMatch[1] === 'true';
  }

  // Try string
  return extractStringValue(content, key);
}

/**
 * Extracts content between balanced braces starting from a given position.
 */
function extractBalancedBraceContent(
  content: string,
  startIndex: number,
): string | null {
  let depth = 1;
  let i = startIndex;

  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') depth--;
    i++;
  }

  if (depth === 0) {
    return content.substring(startIndex, i - 1);
  }

  return null;
}

/**
 * Returns a copy of an object body where everything except top-level
 * property syntax is blanked out with spaces: string literal contents and the
 * contents of nested objects, arrays and calls. Character positions are
 * preserved so matches can be mapped back to the original text.
 */
function maskNonTopLevelContent(content: string): string {
  const masked = content.split('');
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (quote) {
      if (char === '\\') {
        masked[i] = ' ';
        if (i + 1 < content.length) masked[i + 1] = ' ';
        i++;
        continue;
      }
      if (char === quote) {
        quote = null;
        if (depth > 0) masked[i] = ' ';
      } else {
        masked[i] = ' ';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      if (depth > 0) masked[i] = ' ';
      continue;
    }

    if (char === '{' || char === '[' || char === '(') {
      if (depth > 0) masked[i] = ' ';
      depth++;
      continue;
    }

    if (char === '}' || char === ']' || char === ')') {
      depth = Math.max(0, depth - 1);
      if (depth > 0) masked[i] = ' ';
      continue;
    }

    if (depth > 0) masked[i] = ' ';
  }

  return masked.join('');
}

/**
 * Reads the literal value (string, boolean or null) of a top-level property
 * in an object body. Returns undefined if the property is missing or its
 * value is not a literal.
 */
function extractTopLevelLiteral(
  content: string,
  key: string,
): string | boolean | null | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keyMatch = new RegExp(`(?:^|,)\\s*${escapedKey}\\s*:\\s*`).exec(
    maskNonTopLevelContent(content),
  );
  if (!keyMatch) {
    return undefined;
  }

  const value = content.slice(keyMatch.index + keyMatch[0].length);
  const literalMatch = value.match(
    /^(?:'([^']*)'|"([^"]*)"|`([^`]*)`|(true|false|null)\b)/,
  );
  if (!literalMatch) {
    return undefined;
  }

  const [, single, double, backtick, keyword] = literalMatch;
  if (keyword === 'true') return true;
  if (keyword === 'false') return false;
  if (keyword === 'null') return null;
  return single ?? double ?? backtick;
}

/**
 * Detects if a key has an object value (returns empty object if present)
 */
function extractObjectPresence(
  content: string,
  key: string,
): Record<string, unknown> | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`\\b${escapedKey}\\s*:\\s*{`));
  return match ? {} : undefined;
}

/**
 * Extracts an experimental field value (string, boolean, or presence marker)
 */
function extractExperimentalValue(
  content: string,
  key: string,
): string | boolean | undefined {
  // Try boolean first
  const boolMatch = content.match(new RegExp(`\\b${key}\\s*:\\s*(true|false)`));
  if (boolMatch) {
    return boolMatch[1] === 'true';
  }

  // Try string
  return extractStringValue(content, key);
}
