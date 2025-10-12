import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, addProjectConfiguration } from '@nx/devkit';
import { componentGenerator } from './generator';
import { ComponentGeneratorSchema } from './schema';

describe('component generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('basic functionality', () => {
    beforeEach(() => {
      // Create a mock Astro project
      addProjectConfiguration(tree, 'my-app', {
        root: 'apps/my-app',
        sourceRoot: 'apps/my-app/src',
        projectType: 'application',
        targets: {},
      });
      tree.write('apps/my-app/astro.config.mjs', 'export default {}');
      tree.write('apps/my-app/src/pages/index.astro', '<html></html>');
    });

    it('should create component file in project', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/Button.astro')).toBe(true);
    });

    it('should create component in src/components directory', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Card',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      const componentContent = tree.read(
        'apps/my-app/src/components/Card.astro',
        'utf-8'
      );
      expect(componentContent).toBeTruthy();
      expect(componentContent).toContain('Card Component');
    });

    it('should use provided component name', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'UserProfile',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      const componentContent = tree.read(
        'apps/my-app/src/components/UserProfile.astro',
        'utf-8'
      );
      expect(componentContent).toContain('UserProfile Component');
    });

    it('should normalize component name - kebab-case for file', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'user-profile',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/user-profile.astro')).toBe(
        true
      );
    });

    it('should normalize component name - PascalCase for class', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'user-profile',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      const componentContent = tree.read(
        'apps/my-app/src/components/user-profile.astro',
        'utf-8'
      );
      expect(componentContent).toContain('UserProfile Component');
    });

    it('should create component in subdirectory when specified', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
        directory: 'ui',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/ui/Button.astro')).toBe(
        true
      );
    });

    it('should format files by default', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      // If formatting runs, the component should be created
      expect(tree.exists('apps/my-app/src/components/Button.astro')).toBe(true);
    });

    it('should skip formatting when requested', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
        skipFormat: true,
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/Button.astro')).toBe(true);
    });
  });

  describe('project validation', () => {
    it('should throw error if project does not exist', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'non-existent',
      };

      await expect(componentGenerator(tree, options)).rejects.toThrow(
        'non-existent'
      );
    });

    it('should throw error if project is not an Astro project', async () => {
      addProjectConfiguration(tree, 'react-app', {
        root: 'apps/react-app',
        sourceRoot: 'apps/react-app/src',
        projectType: 'application',
        targets: {},
      });
      tree.write('apps/react-app/src/index.tsx', 'export default {}');

      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'react-app',
      };

      await expect(componentGenerator(tree, options)).rejects.toThrow('Astro');
    });

    it('should create src/components directory if it does not exist', async () => {
      addProjectConfiguration(tree, 'new-app', {
        root: 'apps/new-app',
        sourceRoot: 'apps/new-app/src',
        projectType: 'application',
        targets: {},
      });
      tree.write('apps/new-app/astro.config.mjs', 'export default {}');
      tree.write('apps/new-app/src/pages/index.astro', '<html></html>');

      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'new-app',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/new-app/src/components/Button.astro')).toBe(
        true
      );
    });
  });

  describe('export functionality', () => {
    beforeEach(() => {
      addProjectConfiguration(tree, 'my-app', {
        root: 'apps/my-app',
        sourceRoot: 'apps/my-app/src',
        projectType: 'application',
        targets: {},
      });
      tree.write('apps/my-app/astro.config.mjs', 'export default {}');
      tree.write('apps/my-app/src/pages/index.astro', '<html></html>');
    });

    it('should create components/index.ts when export=true', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
        export: true,
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/index.ts')).toBe(true);
      const indexContent = tree.read(
        'apps/my-app/src/components/index.ts',
        'utf-8'
      );
      expect(indexContent).toContain('export { default as Button }');
      expect(indexContent).toContain("from './Button.astro'");
    });

    it('should append to existing index.ts without duplicates', async () => {
      tree.write(
        'apps/my-app/src/components/index.ts',
        "export { default as Card } from './Card.astro';\n"
      );

      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
        export: true,
      };

      await componentGenerator(tree, options);

      const indexContent = tree.read(
        'apps/my-app/src/components/index.ts',
        'utf-8'
      );
      expect(indexContent).toContain('export { default as Card }');
      expect(indexContent).toContain('export { default as Button }');
    });

    it('should not create index.ts when export=false', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
        export: false,
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/index.ts')).toBe(false);
    });

    it('should not add duplicate export entries', async () => {
      tree.write(
        'apps/my-app/src/components/index.ts',
        "export { default as Button } from './Button.astro';\n"
      );
      tree.write('apps/my-app/src/components/Button.astro', '<div></div>');

      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
        export: true,
      };

      await componentGenerator(tree, options);

      const indexContent = tree.read(
        'apps/my-app/src/components/index.ts',
        'utf-8'
      );
      const buttonExports = (indexContent.match(/export.*Button/g) || [])
        .length;
      expect(buttonExports).toBe(1);
    });

    it('should use correct export path for subdirectories', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Input',
        project: 'my-app',
        directory: 'ui/forms',
        export: true,
      };

      await componentGenerator(tree, options);

      const indexContent = tree.read(
        'apps/my-app/src/components/index.ts',
        'utf-8'
      );
      expect(indexContent).toContain('export { default as Input }');
      expect(indexContent).toContain("from './ui/forms/Input.astro'");
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      addProjectConfiguration(tree, 'my-app', {
        root: 'apps/my-app',
        sourceRoot: 'apps/my-app/src',
        projectType: 'application',
        targets: {},
      });
      tree.write('apps/my-app/astro.config.mjs', 'export default {}');
      tree.write('apps/my-app/src/pages/index.astro', '<html></html>');
    });

    it('should handle nested subdirectories', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'Input',
        project: 'my-app',
        directory: 'ui/buttons',
      };

      await componentGenerator(tree, options);

      expect(
        tree.exists('apps/my-app/src/components/ui/buttons/Input.astro')
      ).toBe(true);
    });

    it('should handle component names with hyphens', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'user-card',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/user-card.astro')).toBe(
        true
      );
      const componentContent = tree.read(
        'apps/my-app/src/components/user-card.astro',
        'utf-8'
      );
      expect(componentContent).toContain('UserCard Component');
    });

    it('should handle component names with mixed case', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'UserProfile',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/UserProfile.astro')).toBe(
        true
      );
      const componentContent = tree.read(
        'apps/my-app/src/components/UserProfile.astro',
        'utf-8'
      );
      expect(componentContent).toContain('UserProfile Component');
    });

    it('should handle component names with underscores', async () => {
      const options: ComponentGeneratorSchema = {
        name: 'user_card',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      expect(tree.exists('apps/my-app/src/components/user_card.astro')).toBe(
        true
      );
    });

    it('should overwrite existing component file', async () => {
      tree.write(
        'apps/my-app/src/components/Button.astro',
        '<div>Old content</div>'
      );

      const options: ComponentGeneratorSchema = {
        name: 'Button',
        project: 'my-app',
      };

      await componentGenerator(tree, options);

      const componentContent = tree.read(
        'apps/my-app/src/components/Button.astro',
        'utf-8'
      );
      expect(componentContent).toContain('Button Component');
      expect(componentContent).not.toContain('Old content');
    });
  });
});
