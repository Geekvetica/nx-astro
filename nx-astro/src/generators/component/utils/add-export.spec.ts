import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { addExportToIndex } from './add-export';

describe('addExportToIndex', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create index.ts if it does not exist', () => {
    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Button',
      './Button.astro'
    );

    expect(tree.exists('apps/my-app/src/components/index.ts')).toBe(true);
  });

  it('should add export statement to new index.ts', () => {
    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Button',
      './Button.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    expect(indexContent).toContain(
      "export { default as Button } from './Button.astro';"
    );
  });

  it('should append to existing index.ts', () => {
    tree.write(
      'apps/my-app/src/components/index.ts',
      "export { default as Card } from './Card.astro';\n"
    );

    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Button',
      './Button.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    expect(indexContent).toContain('export { default as Card }');
    expect(indexContent).toContain('export { default as Button }');
  });

  it('should not add duplicate export', () => {
    tree.write(
      'apps/my-app/src/components/index.ts',
      "export { default as Button } from './Button.astro';\n"
    );

    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Button',
      './Button.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    const buttonExports = (indexContent.match(/export.*Button/g) || []).length;
    expect(buttonExports).toBe(1);
  });

  it('should handle exports with subdirectory paths', () => {
    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Input',
      './ui/forms/Input.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    expect(indexContent).toContain(
      "export { default as Input } from './ui/forms/Input.astro';"
    );
  });

  it('should preserve existing exports when adding new one', () => {
    tree.write(
      'apps/my-app/src/components/index.ts',
      "export { default as Card } from './Card.astro';\nexport { default as Header } from './Header.astro';\n"
    );

    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Button',
      './Button.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    expect(indexContent).toContain('export { default as Card }');
    expect(indexContent).toContain('export { default as Header }');
    expect(indexContent).toContain('export { default as Button }');
  });

  it('should sort exports alphabetically', () => {
    tree.write(
      'apps/my-app/src/components/index.ts',
      "export { default as Card } from './Card.astro';\n"
    );

    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'Button',
      './Button.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    const lines = indexContent.trim().split('\n');
    expect(lines[0]).toContain('Button');
    expect(lines[1]).toContain('Card');
  });

  it('should handle export with different component name format', () => {
    addExportToIndex(
      tree,
      'apps/my-app/src/components',
      'UserProfile',
      './user-profile.astro'
    );

    const indexContent = tree.read(
      'apps/my-app/src/components/index.ts',
      'utf-8'
    );
    expect(indexContent).toContain(
      "export { default as UserProfile } from './user-profile.astro';"
    );
  });
});
