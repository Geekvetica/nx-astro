import { Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { validateProject } from './validate-project';

describe('validateProject', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should throw error if project does not exist', () => {
    expect(() => validateProject(tree, 'non-existent')).toThrow(
      'Project "non-existent" does not exist'
    );
  });

  it('should throw error if project is not an Astro project', () => {
    addProjectConfiguration(tree, 'react-app', {
      root: 'apps/react-app',
      sourceRoot: 'apps/react-app/src',
      projectType: 'application',
      targets: {},
    });
    tree.write('apps/react-app/src/index.tsx', 'export default {}');

    expect(() => validateProject(tree, 'react-app')).toThrow(
      'Project "react-app" is not an Astro project'
    );
  });

  it('should not throw if project has astro.config.mjs', () => {
    addProjectConfiguration(tree, 'my-app', {
      root: 'apps/my-app',
      sourceRoot: 'apps/my-app/src',
      projectType: 'application',
      targets: {},
    });
    tree.write('apps/my-app/astro.config.mjs', 'export default {}');

    expect(() => validateProject(tree, 'my-app')).not.toThrow();
  });

  it('should not throw if project has astro.config.js', () => {
    addProjectConfiguration(tree, 'my-app', {
      root: 'apps/my-app',
      sourceRoot: 'apps/my-app/src',
      projectType: 'application',
      targets: {},
    });
    tree.write('apps/my-app/astro.config.js', 'export default {}');

    expect(() => validateProject(tree, 'my-app')).not.toThrow();
  });

  it('should not throw if project has astro.config.ts', () => {
    addProjectConfiguration(tree, 'my-app', {
      root: 'apps/my-app',
      sourceRoot: 'apps/my-app/src',
      projectType: 'application',
      targets: {},
    });
    tree.write('apps/my-app/astro.config.ts', 'export default {}');

    expect(() => validateProject(tree, 'my-app')).not.toThrow();
  });

  it('should return project configuration', () => {
    addProjectConfiguration(tree, 'my-app', {
      root: 'apps/my-app',
      sourceRoot: 'apps/my-app/src',
      projectType: 'application',
      targets: {},
    });
    tree.write('apps/my-app/astro.config.mjs', 'export default {}');

    const config = validateProject(tree, 'my-app');

    expect(config.root).toBe('apps/my-app');
    expect(config.sourceRoot).toBe('apps/my-app/src');
  });
});
