/**
 * This script cleans up after e2e testing.
 * It is meant to be called in jest's globalTeardown.
 */

/// <reference path="registry.d.ts" />

import { unlinkSync } from 'fs';
import { join } from 'path';

export default () => {
  // Clean up the tarball created during E2E preparation
  const tarballPath = join(
    process.cwd(),
    'dist',
    'nx-astro',
    'geekvetica-nx-astro-0.0.0-e2e.tgz'
  );

  try {
    unlinkSync(tarballPath);
    console.log(`Cleaned up E2E tarball: ${tarballPath}`);
  } catch (error) {
    // It's okay if the file doesn't exist (test might have failed before creating it)
    console.log(`Tarball cleanup skipped (file may not exist): ${tarballPath}`);
  }
};
