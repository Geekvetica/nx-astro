/**
 * This script prepares the plugin for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 *
 * IMPORTANT: This script works in complete isolation and NEVER modifies
 * the repository's source files. Instead, it:
 * - Copies the built package to a temporary directory
 * - Modifies ONLY the temp copy's package.json to 0.0.0-e2e
 * - Creates a tarball from the temp copy
 * - Original repository files remain untouched
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';

export default async () => {
  console.log('Starting E2E test preparation...');

  try {
    // Create temp directory for E2E package (unique per run)
    const tempDir = join(tmpdir(), 'nx-astro-e2e-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
    console.log(`Created temp directory: ${tempDir}`);

    // Copy built package to temp directory
    // NOTE: This assumes the package has already been built (it should be)
    const distPath = join(process.cwd(), 'dist', 'nx-astro');
    console.log(`Copying ${distPath} to ${tempDir}...`);
    cpSync(distPath, tempDir, { recursive: true });

    // Modify ONLY the temp copy's package.json to use e2e version
    const packageJsonPath = join(tempDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const originalVersion = packageJson.version;
    packageJson.version = '0.0.0-e2e';
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(
      `Modified temp package.json version: ${originalVersion} → 0.0.0-e2e`
    );

    // Create tarball from temp directory
    console.log('Creating tarball from temp package...');
    const tarballOutput = execSync('npm pack', {
      cwd: tempDir,
      encoding: 'utf-8',
    }).trim();

    // Move tarball to dist directory for tests to use
    const tarballPath = join(distPath, tarballOutput);
    cpSync(join(tempDir, tarballOutput), tarballPath);
    console.log(`Tarball created: ${tarballPath}`);

    // Store temp dir path for cleanup in globalTeardown
    process.env.E2E_TEMP_DIR = tempDir;

    console.log('E2E preparation complete');
    console.log('✓ Repository files untouched');
    console.log('✓ Tarball ready for testing');
  } catch (error) {
    console.error('Error during E2E preparation:', error);
    throw error;
  }
};
