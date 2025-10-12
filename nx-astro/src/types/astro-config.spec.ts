import { AstroConfig, AstroIntegration } from './astro-config';

describe('AstroConfig types', () => {
  it('should allow creating a basic static site config', () => {
    const config: AstroConfig = {
      output: 'static',
      outDir: './dist',
    };

    expect(config.output).toBe('static');
    expect(config.outDir).toBe('./dist');
  });

  it('should allow creating a server-side rendering config', () => {
    const config: AstroConfig = {
      output: 'server',
      adapter: {
        name: 'node',
      },
    };

    expect(config.output).toBe('server');
    expect(config.adapter?.name).toBe('node');
  });

  it('should allow configuring server options', () => {
    const config: AstroConfig = {
      server: {
        host: 'localhost',
        port: 4321,
        open: true,
      },
    };

    expect(config.server?.port).toBe(4321);
    expect(config.server?.host).toBe('localhost');
    expect(config.server?.open).toBe(true);
  });

  it('should allow configuring build options', () => {
    const config: AstroConfig = {
      build: {
        format: 'directory',
        client: './dist/client',
        server: './dist/server',
        assets: '_astro',
      },
    };

    expect(config.build?.format).toBe('directory');
    expect(config.build?.client).toBe('./dist/client');
  });

  it('should allow configuring integrations', () => {
    const integration: AstroIntegration = {
      name: 'react',
      hooks: {},
    };

    const config: AstroConfig = {
      integrations: [integration],
    };

    expect(config.integrations).toHaveLength(1);
    expect(config.integrations?.[0].name).toBe('react');
  });

  it('should allow empty config', () => {
    const config: AstroConfig = {};

    expect(config).toBeDefined();
  });

  it('should support all directory configuration options', () => {
    const config: AstroConfig = {
      root: './my-project',
      srcDir: './src',
      publicDir: './public',
      outDir: './dist',
      cacheDir: './cache',
    };

    expect(config.root).toBe('./my-project');
    expect(config.srcDir).toBe('./src');
    expect(config.publicDir).toBe('./public');
    expect(config.outDir).toBe('./dist');
    expect(config.cacheDir).toBe('./cache');
  });

  it('should support site and base configuration', () => {
    const config: AstroConfig = {
      site: 'https://example.com',
      base: '/blog',
      trailingSlash: 'always',
    };

    expect(config.site).toBe('https://example.com');
    expect(config.base).toBe('/blog');
    expect(config.trailingSlash).toBe('always');
  });
});
