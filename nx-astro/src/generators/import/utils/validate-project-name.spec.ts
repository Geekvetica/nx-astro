import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, addProjectConfiguration } from '@nx/devkit';
import { validateProjectName } from './validate-project-name';

describe('validateProjectName', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('valid project names', () => {
    it('should accept kebab-case names', () => {
      expect(() => validateProjectName(tree, 'my-astro-app')).not.toThrow();
    });

    it('should accept PascalCase names', () => {
      expect(() => validateProjectName(tree, 'MyAstroApp')).not.toThrow();
    });

    it('should accept camelCase names', () => {
      expect(() => validateProjectName(tree, 'myAstroApp')).not.toThrow();
    });

    it('should accept names with numbers', () => {
      expect(() => validateProjectName(tree, 'app123')).not.toThrow();
      expect(() => validateProjectName(tree, 'my-app-v2')).not.toThrow();
    });

    it('should accept names starting with capital letters', () => {
      expect(() => validateProjectName(tree, 'App')).not.toThrow();
      expect(() => validateProjectName(tree, 'MyApp')).not.toThrow();
    });

    it('should accept names starting with lowercase letters', () => {
      expect(() => validateProjectName(tree, 'app')).not.toThrow();
      expect(() => validateProjectName(tree, 'myApp')).not.toThrow();
    });
  });

  describe('invalid project names', () => {
    it('should throw if name starts with a number', () => {
      expect(() => validateProjectName(tree, '123app')).toThrow(
        /invalid.*project name/i
      );
    });

    it('should throw if name contains spaces', () => {
      expect(() => validateProjectName(tree, 'my app')).toThrow(
        /invalid.*project name/i
      );
    });

    it('should throw if name contains underscores', () => {
      expect(() => validateProjectName(tree, 'my_app')).toThrow(
        /invalid.*project name/i
      );
    });

    it('should throw if name contains dots', () => {
      expect(() => validateProjectName(tree, 'my.app')).toThrow(
        /invalid.*project name/i
      );
    });

    it('should throw if name contains special characters', () => {
      expect(() => validateProjectName(tree, 'my@app')).toThrow(
        /invalid.*project name/i
      );
      expect(() => validateProjectName(tree, 'my$app')).toThrow(
        /invalid.*project name/i
      );
      expect(() => validateProjectName(tree, 'my#app')).toThrow(
        /invalid.*project name/i
      );
    });

    it('should throw if name starts with hyphen', () => {
      expect(() => validateProjectName(tree, '-myapp')).toThrow(
        /invalid.*project name/i
      );
    });

    it('should throw if name is empty', () => {
      expect(() => validateProjectName(tree, '')).toThrow(
        /invalid.*project name/i
      );
    });
  });

  describe('existing projects', () => {
    it('should throw if project name already exists', () => {
      // Add a project to the workspace
      addProjectConfiguration(tree, 'existing-app', {
        root: 'apps/existing-app',
      });

      expect(() => validateProjectName(tree, 'existing-app')).toThrow(
        /already exists/i
      );
    });

    it('should not throw if project name is unique', () => {
      // Add a different project
      addProjectConfiguration(tree, 'other-app', {
        root: 'apps/other-app',
      });

      expect(() => validateProjectName(tree, 'my-new-app')).not.toThrow();
    });

    it('should provide helpful error message for existing projects', () => {
      addProjectConfiguration(tree, 'my-app', {
        root: 'apps/my-app',
      });

      expect(() => validateProjectName(tree, 'my-app')).toThrow('my-app');
    });
  });

  describe('error messages', () => {
    it('should include the invalid name in error message', () => {
      const invalidName = '123-invalid';
      expect(() => validateProjectName(tree, invalidName)).toThrow(invalidName);
    });

    it('should describe the naming pattern requirements', () => {
      expect(() => validateProjectName(tree, '_invalid')).toThrow(
        /must start with.*letter/i
      );
    });

    it('should suggest valid naming patterns', () => {
      expect(() => validateProjectName(tree, 'my_app')).toThrow(
        /letters.*numbers.*hyphens/i
      );
    });
  });
});
