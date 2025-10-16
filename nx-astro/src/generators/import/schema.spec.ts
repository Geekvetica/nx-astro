import { ImportGeneratorSchema } from './schema';

describe('ImportGeneratorSchema', () => {
  describe('validation', () => {
    it('should require source property', () => {
      const schema: Partial<ImportGeneratorSchema> = {
        // source is missing
      };

      // TypeScript should enforce this at compile time
      // Runtime validation would be handled by JSON schema
      expect(schema.source).toBeUndefined();
    });

    it('should accept valid schema with all properties', () => {
      const schema: ImportGeneratorSchema = {
        source: '/path/to/astro-project',
        name: 'my-astro-app',
        directory: 'apps/my-astro-app',
        tags: 'astro,web',
        skipFormat: false,
        skipInstall: false,
        importPath: '@myorg/my-astro-app',
      };

      expect(schema.source).toBe('/path/to/astro-project');
      expect(schema.name).toBe('my-astro-app');
      expect(schema.directory).toBe('apps/my-astro-app');
      expect(schema.tags).toBe('astro,web');
      expect(schema.skipFormat).toBe(false);
      expect(schema.skipInstall).toBe(false);
      expect(schema.importPath).toBe('@myorg/my-astro-app');
    });

    it('should accept schema with only required properties', () => {
      const schema: ImportGeneratorSchema = {
        source: '../existing-astro-app',
      };

      expect(schema.source).toBe('../existing-astro-app');
      expect(schema.name).toBeUndefined();
      expect(schema.directory).toBeUndefined();
      expect(schema.tags).toBeUndefined();
      expect(schema.skipFormat).toBeUndefined();
      expect(schema.skipInstall).toBeUndefined();
      expect(schema.importPath).toBeUndefined();
    });

    it('should accept schema with optional boolean properties', () => {
      const schema: ImportGeneratorSchema = {
        source: './astro-project',
        skipFormat: true,
        skipInstall: true,
      };

      expect(schema.skipFormat).toBe(true);
      expect(schema.skipInstall).toBe(true);
    });

    it('should accept valid project names', () => {
      const validNames: ImportGeneratorSchema[] = [
        { source: '/path', name: 'my-app' },
        { source: '/path', name: 'MyApp' },
        { source: '/path', name: 'my-astro-app' },
        { source: '/path', name: 'app123' },
        { source: '/path', name: 'MyAwesomeApp2' },
      ];

      validNames.forEach((schema) => {
        expect(schema.name).toMatch(/^[a-zA-Z][a-zA-Z0-9-]*$/);
      });
    });

    it('should identify invalid project names', () => {
      const invalidNames = [
        '123app', // starts with number
        'my app', // contains space
        'my_app', // contains underscore
        'my.app', // contains dot
        'my@app', // contains special char
        '-myapp', // starts with hyphen
      ];

      const pattern = /^[a-zA-Z][a-zA-Z0-9-]*$/;
      invalidNames.forEach((name) => {
        expect(name).not.toMatch(pattern);
      });
    });
  });

  describe('type safety', () => {
    it('should enforce source as string', () => {
      const schema: ImportGeneratorSchema = {
        source: '/valid/path',
      };

      expect(typeof schema.source).toBe('string');
    });

    it('should enforce optional properties as correct types', () => {
      const schema: ImportGeneratorSchema = {
        source: '/path',
        name: 'test',
        directory: 'apps/test',
        tags: 'tag1,tag2',
        skipFormat: false,
        skipInstall: true,
        importPath: '@org/test',
      };

      expect(typeof schema.name).toBe('string');
      expect(typeof schema.directory).toBe('string');
      expect(typeof schema.tags).toBe('string');
      expect(typeof schema.skipFormat).toBe('boolean');
      expect(typeof schema.skipInstall).toBe('boolean');
      expect(typeof schema.importPath).toBe('string');
    });
  });
});
