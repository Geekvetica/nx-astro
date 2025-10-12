import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { normalizeOptions } from './normalize-options';
import { ComponentGeneratorSchema } from '../schema';

describe('normalizeOptions', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should normalize component name to kebab-case for fileName', () => {
    const options: ComponentGeneratorSchema = {
      name: 'UserProfile',
      project: 'my-app',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.fileName).toBe('UserProfile');
  });

  it('should normalize component name to PascalCase for className', () => {
    const options: ComponentGeneratorSchema = {
      name: 'user-profile',
      project: 'my-app',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.className).toBe('UserProfile');
  });

  it('should set correct component path without directory', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Button',
      project: 'my-app',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.componentPath).toBe('apps/my-app/src/components');
  });

  it('should set correct component path with directory', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Button',
      project: 'my-app',
      directory: 'ui',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.componentPath).toBe('apps/my-app/src/components/ui');
  });

  it('should set correct component path with nested directory', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Input',
      project: 'my-app',
      directory: 'ui/forms',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.componentPath).toBe(
      'apps/my-app/src/components/ui/forms'
    );
  });

  it('should set correct relative path for exports without directory', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Button',
      project: 'my-app',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.relativeToComponents).toBe('./Button.astro');
  });

  it('should set correct relative path for exports with directory', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Input',
      project: 'my-app',
      directory: 'ui/forms',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.relativeToComponents).toBe('./ui/forms/Input.astro');
  });

  it('should handle mixed case component names', () => {
    const options: ComponentGeneratorSchema = {
      name: 'myComponent',
      project: 'my-app',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.className).toBe('MyComponent');
    expect(normalized.fileName).toBe('myComponent');
  });

  it('should handle underscores in component names', () => {
    const options: ComponentGeneratorSchema = {
      name: 'user_card',
      project: 'my-app',
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.fileName).toBe('user_card');
  });

  it('should preserve export option', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Button',
      project: 'my-app',
      export: true,
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.export).toBe(true);
  });

  it('should preserve skipFormat option', () => {
    const options: ComponentGeneratorSchema = {
      name: 'Button',
      project: 'my-app',
      skipFormat: true,
    };

    const normalized = normalizeOptions(tree, options, 'apps/my-app');

    expect(normalized.skipFormat).toBe(true);
  });
});
