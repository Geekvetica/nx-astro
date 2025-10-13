/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */

/// <reference path="registry.d.ts" />

import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { releasePublish, releaseVersion } from 'nx/release';

export default async () => {
  console.log('Starting local registry setup...');

  // local registry target to run
  const localRegistryTarget = '@geekvetica/source:local-registry';
  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';

  console.log('Starting verdaccio registry...');
  global.stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: true,
  });
  console.log('Registry started successfully');

  try {
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

    console.log('Publishing to local registry...');
    await releasePublish({
      tag: 'e2e',
      firstRelease: true,
      registry: 'http://localhost:4873',
    });
    console.log('Package published successfully');
  } catch (error) {
    console.error('Error during release:', error);
    throw error;
  }
};
