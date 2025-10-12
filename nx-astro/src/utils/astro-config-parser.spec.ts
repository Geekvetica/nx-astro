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
  });
});
