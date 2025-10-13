/**
 * This script prepares the plugin for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 *
 * Instead of publishing to a registry, we create a tarball that can be
 * installed directly in the test workspace. This approach:
 * - Avoids npm authentication issues
 * - Is faster and more reliable
 * - Still validates packaging (package.json, files, exports)
 */

/// <reference path="registry.d.ts" />

import { execSync } from 'child_process';
import { join } from 'path';
import { releaseVersion } from 'nx/release';

export default async () => {
  console.log('Starting E2E test preparation...');

  try {
    // Update version to a unique e2e version
    console.log('Creating release version 0.0.0-e2e...');
    await releaseVersion({
      specifier: '0.0.0-e2e',
      stageChanges: false,
      gitCommit: false,
      gitTag: false,
      firstRelease: true,
      versionActionsOptionsOverrides: {
        skipLockFileUpdate: true,
      },
    });
    console.log('Release version created');

    // Create tarball from built package
    console.log('Creating tarball from built package...');
    const distPath = join(process.cwd(), 'dist', 'nx-astro');
    const tarballOutput = execSync('npm pack', {
      cwd: distPath,
      encoding: 'utf-8',
    }).trim();

    const tarballPath = join(distPath, tarballOutput);
    console.log(`Tarball created: ${tarballOutput}`);
    console.log(`E2E preparation complete. Tarball available at: ${tarballPath}`);
  } catch (error) {
    console.error('Error during E2E preparation:', error);
    throw error;
  }
};
