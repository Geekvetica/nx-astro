/**
 * This script cleans up after e2e testing.
 * It is meant to be called in jest's globalTeardown.
 *
 * Cleanup tasks:
 * - Remove temporary directory created for E2E package
 * - Remove tarball created from temp package
 */

import { rmSync } from 'fs';
import { join } from 'path';

export default () => {
  console.log('Starting E2E test cleanup...');

  // Clean up temp directory (created in start-local-registry.ts)
  const tempDir = process.env.E2E_TEMP_DIR;
  if (tempDir) {
    try {
      rmSync(tempDir, { recursive: true, force: true });
      console.log(`✓ Cleaned up E2E temp directory: ${tempDir}`);
    } catch {
      console.warn('Failed to clean temp directory');
    }
  } else {
    console.log('No temp directory to clean (E2E_TEMP_DIR not set)');
  }

  // Clean up tarball in dist directory
  const tarballPath = join(
    process.cwd(),
    'dist',
    'nx-astro',
    'geekvetica-nx-astro-0.0.0-e2e.tgz'
  );

  try {
    rmSync(tarballPath, { force: true });
    console.log(`✓ Cleaned up E2E tarball`);
  } catch {
    console.log('Tarball cleanup skipped (file may not exist)');
  }

  console.log('E2E test cleanup complete');
};
