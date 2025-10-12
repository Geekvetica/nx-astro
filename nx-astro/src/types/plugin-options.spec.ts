import { AstroPluginOptions } from './plugin-options';

describe('AstroPluginOptions', () => {
  it('should allow creating options with all task inference flags', () => {
    const options: AstroPluginOptions = {
      devTargetName: 'dev',
      buildTargetName: 'build',
      previewTargetName: 'preview',
      checkTargetName: 'check',
      testTargetName: 'test',
      syncTargetName: 'sync',
    };

    expect(options.devTargetName).toBe('dev');
    expect(options.buildTargetName).toBe('build');
    expect(options.previewTargetName).toBe('preview');
    expect(options.checkTargetName).toBe('check');
    expect(options.testTargetName).toBe('test');
    expect(options.syncTargetName).toBe('sync');
  });

  it('should allow creating options with custom target names', () => {
    const options: AstroPluginOptions = {
      devTargetName: 'serve',
      buildTargetName: 'compile',
      previewTargetName: 'serve-prod',
      checkTargetName: 'type-check',
      testTargetName: 'unit-test',
      syncTargetName: 'generate-types',
    };

    expect(options.devTargetName).toBe('serve');
    expect(options.buildTargetName).toBe('compile');
  });

  it('should allow partial options', () => {
    const options: AstroPluginOptions = {
      buildTargetName: 'build',
    };

    expect(options.buildTargetName).toBe('build');
    expect(options.devTargetName).toBeUndefined();
  });

  it('should allow empty options object', () => {
    const options: AstroPluginOptions = {};

    expect(options).toBeDefined();
  });
});
