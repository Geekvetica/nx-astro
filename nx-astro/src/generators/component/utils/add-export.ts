import { Tree, joinPathFragments } from '@nx/devkit';

export function addExportToIndex(
  tree: Tree,
  componentsDir: string,
  componentClassName: string,
  relativePath: string
): void {
  const indexPath = joinPathFragments(componentsDir, 'index.ts');
  const exportStatement = `export { default as ${componentClassName} } from '${relativePath}';`;

  let content = '';
  if (tree.exists(indexPath)) {
    content = tree.read(indexPath, 'utf-8') || '';
  }

  // Check if export already exists
  const exportPattern = new RegExp(
    `export\\s*{[^}]*default\\s+as\\s+${componentClassName}[^}]*}\\s*from`
  );
  if (exportPattern.test(content)) {
    // Export already exists, don't add duplicate
    return;
  }

  // Parse existing exports
  const exportLines = content
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0);

  // Add new export
  exportLines.push(exportStatement);

  // Sort alphabetically by component name
  exportLines.sort((a, b) => {
    const nameA = a.match(/as\s+(\w+)/)?.[1] || '';
    const nameB = b.match(/as\s+(\w+)/)?.[1] || '';
    return nameA.localeCompare(nameB);
  });

  // Write back to file
  tree.write(indexPath, exportLines.join('\n') + '\n');
}
