import { parseAstroConfig } from './astro-config-parser';

describe('astro-config-parser', () => {
  describe('parseAstroConfig', () => {
    it('should parse basic static config', () => {
      const configContent = `
        export default {
          output: 'static',
          outDir: './dist'
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.output).toBe('static');
      expect(config.outDir).toBe('./dist');
    });

    it('should parse config with defineConfig wrapper', () => {
      const configContent = `
        import { defineConfig } from 'astro/config';

        export default defineConfig({
          output: 'server',
          site: 'https://example.com'
        });
      `;

      const config = parseAstroConfig(configContent);

      expect(config.output).toBe('server');
      expect(config.site).toBe('https://example.com');
    });

    it('should parse server configuration', () => {
      const configContent = `
        export default {
          server: {
            port: 4321,
            host: 'localhost'
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.server?.port).toBe(4321);
      expect(config.server?.host).toBe('localhost');
    });

    it('should parse build configuration', () => {
      const configContent = `
        export default {
          build: {
            format: 'directory',
            client: './dist/client',
            server: './dist/server'
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.build?.format).toBe('directory');
      expect(config.build?.client).toBe('./dist/client');
      expect(config.build?.server).toBe('./dist/server');
    });

    it('should parse config with integrations', () => {
      const configContent = `
        import react from '@astrojs/react';
        import vue from '@astrojs/vue';

        export default {
          integrations: [react(), vue()]
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.integrations).toBeDefined();
      expect(Array.isArray(config.integrations)).toBe(true);
    });

    it('should handle empty config', () => {
      const configContent = `
        export default {};
      `;

      const config = parseAstroConfig(configContent);

      expect(config).toBeDefined();
      expect(Object.keys(config).length).toBe(0);
    });

    it('should extract srcDir and publicDir', () => {
      const configContent = `
        export default {
          srcDir: './src',
          publicDir: './public',
          outDir: './dist'
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.srcDir).toBe('./src');
      expect(config.publicDir).toBe('./public');
      expect(config.outDir).toBe('./dist');
    });

    it('should parse hybrid output mode', () => {
      const configContent = `
        export default {
          output: 'hybrid'
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.output).toBe('hybrid');
    });

    it('should handle config with adapter', () => {
      const configContent = `
        import node from '@astrojs/node';

        export default {
          output: 'server',
          adapter: node()
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.output).toBe('server');
      expect(config.adapter).toBeDefined();
    });

    it('should parse base and site configuration', () => {
      const configContent = `
        export default {
          site: 'https://example.com',
          base: '/blog',
          trailingSlash: 'always'
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.site).toBe('https://example.com');
      expect(config.base).toBe('/blog');
      expect(config.trailingSlash).toBe('always');
    });

    it('should handle malformed config gracefully', () => {
      const configContent = `
        this is not valid javascript
      `;

      const config = parseAstroConfig(configContent);

      // Should return empty config object without throwing
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should handle config with comments', () => {
      const configContent = `
        // This is a comment
        export default {
          // Development port
          server: {
            port: 4321
          },
          /* Multi-line comment */
          output: 'static'
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.server?.port).toBe(4321);
      expect(config.output).toBe('static');
    });

    it('should parse legacy config with collectionsBackwardsCompat', () => {
      const configContent = `
        export default {
          output: 'server',
          legacy: {
            collectionsBackwardsCompat: true
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.legacy).toBeDefined();
      expect(config.legacy?.collectionsBackwardsCompat).toBe(true);
    });

    it('should parse legacy config with collectionsBackwardsCompat set to false', () => {
      const configContent = `
        export default {
          legacy: {
            collectionsBackwardsCompat: false
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.legacy?.collectionsBackwardsCompat).toBe(false);
    });

    it('should parse session config with Astro 6 shape', () => {
      const configContent = `
        export default {
          output: 'server',
          session: {
            driver: '@astrojs/session/dynamodb',
            ttl: 3600
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.session).toBeDefined();
      expect(config.session?.driver).toBe('@astrojs/session/dynamodb');
      expect(config.session?.ttl).toBe(3600);
    });

    it('should parse session config with options and cookie', () => {
      const configContent = `
        export default {
          session: {
            driver: '@astrojs/session/memory',
            options: { max: 100 },
            cookie: { secure: true, sameSite: 'strict' }
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.session?.driver).toBe('@astrojs/session/memory');
      expect(config.session?.options).toBeDefined();
      expect(config.session?.cookie).toBeDefined();
    });

    it('should detect experimental.logger presence', () => {
      const configContent = `
        export default {
          experimental: {
            logger: 'debug'
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.experimental).toBeDefined();
      expect(config.experimental?.logger).toBeDefined();
    });

    it('should detect experimental.svgOptimizer presence', () => {
      const configContent = `
        export default {
          experimental: {
            svgOptimizer: true
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.experimental).toBeDefined();
      expect(config.experimental?.svgOptimizer).toBeDefined();
    });

    it('should parse multiple experimental fields together', () => {
      const configContent = `
        export default {
          experimental: {
            clientPrerender: true,
            logger: 'verbose',
            svgOptimizer: true
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.experimental?.clientPrerender).toBe(true);
      expect(config.experimental?.logger).toBeDefined();
      expect(config.experimental?.svgOptimizer).toBeDefined();
    });

    it('should return empty config when no braces present', () => {
      const configContent = `
        export default undefined;
      `;

      const config = parseAstroConfig(configContent);

      expect(Object.keys(config).length).toBe(0);
    });

    it('should remove empty server object when all values are undefined', () => {
      const configContent = `
        export default {
          server: {}
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.server).toBeUndefined();
    });

    it('should remove empty build object when all values are undefined', () => {
      const configContent = `
        export default {
          build: {}
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.build).toBeUndefined();
    });

    it('should remove empty legacy object when all values are undefined', () => {
      const configContent = `
        export default {
          legacy: {}
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.legacy).toBeUndefined();
    });

    it('should remove empty session object when all values are undefined', () => {
      const configContent = `
        export default {
          session: {}
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.session).toBeUndefined();
    });

    it('should remove empty experimental object when all values are undefined', () => {
      const configContent = `
        export default {
          experimental: {}
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.experimental).toBeUndefined();
    });

    it('should parse server host as boolean true', () => {
      const configContent = `
        export default {
          server: {
            port: 3000,
            host: true
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.server?.host).toBe(true);
    });

    it('should handle session with nested options that have unclosed braces gracefully', () => {
      const configContent = `
        export default {
          session: {
            driver: '@astrojs/session/memory',
            options: { broken
          }
        };
      `;

      const config = parseAstroConfig(configContent);

      expect(config.session).toBeUndefined();
    });
  });
});
