import { normalizeOptions } from './normalize-options';
import { ApplicationGeneratorSchema } from '../schema';

describe('normalizeOptions', () => {
  it('should normalize basic project name', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
    };

    const result = normalizeOptions(options);

    expect(result.projectName).toBe('my-app');
    expect(result.projectRoot).toBe('apps/my-app');
    expect(result.projectDirectory).toBe('apps/my-app');
  });

  it('should convert project name to kebab-case', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'MyApp',
    };

    const result = normalizeOptions(options);

    expect(result.projectName).toBe('my-app');
  });

  it('should use provided directory', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      directory: 'packages/web',
    };

    const result = normalizeOptions(options);

    expect(result.projectRoot).toBe('packages/web');
    expect(result.projectDirectory).toBe('packages/web');
  });

  it('should parse comma-separated tags', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      tags: 'web,frontend,astro',
    };

    const result = normalizeOptions(options);

    expect(result.parsedTags).toEqual(['web', 'frontend', 'astro']);
  });

  it('should trim whitespace from tags', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      tags: ' web , frontend , astro ',
    };

    const result = normalizeOptions(options);

    expect(result.parsedTags).toEqual(['web', 'frontend', 'astro']);
  });

  it('should handle empty tags string', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      tags: '',
    };

    const result = normalizeOptions(options);

    expect(result.parsedTags).toEqual([]);
  });

  it('should handle undefined tags', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
    };

    const result = normalizeOptions(options);

    expect(result.parsedTags).toEqual([]);
  });

  it('should use minimal template by default', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
    };

    const result = normalizeOptions(options);

    expect(result.template).toBe('minimal');
  });

  it('should respect provided template', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      template: 'blog',
    };

    const result = normalizeOptions(options);

    expect(result.template).toBe('blog');
  });

  it('should default skipFormat to false', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
    };

    const result = normalizeOptions(options);

    expect(result.skipFormat).toBe(false);
  });

  it('should respect skipFormat option', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      skipFormat: true,
    };

    const result = normalizeOptions(options);

    expect(result.skipFormat).toBe(true);
  });

  it('should default importExisting to false', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
    };

    const result = normalizeOptions(options);

    expect(result.importExisting).toBe(false);
  });

  it('should respect importExisting option', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      importExisting: true,
    };

    const result = normalizeOptions(options);

    expect(result.importExisting).toBe(true);
  });

  it('should throw error for invalid project name with spaces', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'invalid name',
    };

    expect(() => normalizeOptions(options)).toThrow();
  });

  it('should throw error for project name starting with number', () => {
    const options: ApplicationGeneratorSchema = {
      name: '123app',
    };

    expect(() => normalizeOptions(options)).toThrow();
  });

  it('should accept project name with hyphens', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-cool-app',
    };

    const result = normalizeOptions(options);

    expect(result.projectName).toBe('my-cool-app');
  });

  it('should filter out empty tags', () => {
    const options: ApplicationGeneratorSchema = {
      name: 'my-app',
      tags: 'web,,frontend,,',
    };

    const result = normalizeOptions(options);

    expect(result.parsedTags).toEqual(['web', 'frontend']);
  });
});
