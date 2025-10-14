# Release Workflow Setup Guide

This guide explains how to configure and use the GitHub Actions release workflow with npm provenance for the `@geekvetica/nx-astro` package.

## Table of Contents

1. [What is npm Provenance?](#what-is-npm-provenance)
2. [Required Setup](#required-setup)
3. [How to Use the Workflow](#how-to-use-the-workflow)
4. [Workflow Architecture](#workflow-architecture)
5. [Troubleshooting](#troubleshooting)

## What is npm Provenance?

npm provenance is a security feature that:

- **Creates cryptographic attestations** linking published packages to their source code
- **Records the build environment** (GitHub Actions workflow, commit SHA, repository)
- **Provides transparency** allowing users to verify package authenticity
- **Prevents supply chain attacks** by making tampering detectable

When you publish with provenance, npm displays a "Provenance" badge on the package page showing:

- The exact source repository and commit
- The GitHub Actions workflow that built and published the package
- A cryptographically signed attestation

**Benefits:**

- Users can verify your package wasn't tampered with
- Increased trust in the package ecosystem
- Meets security compliance requirements
- Automatic documentation of build provenance

## Required Setup

### 1. GitHub Repository Settings

No special repository settings are required. The workflow uses standard GitHub Actions features.

### 2. Create npm Automation Token

You need an **Automation** token (not a Classic token) for provenance to work.

**Steps:**

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Select "Automation" token type
   - This token type supports provenance attestations
   - It allows publishing from CI/CD environments
4. Copy the token (you won't be able to see it again)

**Why Automation Token?**

- Classic tokens don't support provenance
- Automation tokens are designed for CI/CD workflows
- They enable OIDC authentication required for provenance

### 3. Add NPM_TOKEN Secret to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm automation token
6. Click **Add secret**

**Security Note:** Never commit tokens to your repository or expose them in logs.

### 4. Verify Package Configuration

The `nx-astro/package.json` should have:

```json
{
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

This is already configured in this repository.

## How to Use the Workflow

### Manual Release (Recommended)

1. **Ensure you're on the main branch** with all changes merged
2. **Go to GitHub Actions**

   - Navigate to your repository on GitHub
   - Click the "Actions" tab
   - Select "Release" workflow from the left sidebar

3. **Click "Run workflow"**

   - Select the `main` branch (should be pre-selected)
   - Choose version bump type:
     - **patch**: Bug fixes (0.0.1 → 0.0.2)
     - **minor**: New features (0.0.1 → 0.1.0)
     - **major**: Breaking changes (0.0.1 → 1.0.0)
     - **prerelease**: Pre-release version (0.0.1 → 0.0.2-beta.0)
   - If using prerelease, enter a prerelease identifier (e.g., `beta`, `alpha`, `rc`)

4. **Click "Run workflow"**

5. **Monitor the workflow**
   - The workflow will:
     - Validate you're on the main branch
     - Run full test suite (lint, unit tests, build, e2e)
     - Bump version and generate changelog
     - Build the plugin
     - Publish to npm **with provenance**
     - Create a GitHub release
     - Validate the published package

### Automatic Release (Future Enhancement)

You can also trigger releases on git tags by adding this to the workflow:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

This would automatically publish when you push a version tag like `v1.2.3`.

## Workflow Architecture

### Jobs Overview

The workflow runs 4 sequential jobs:

```
┌─────────────┐
│  Validate   │ ← Verify main branch
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Test     │ ← Run full test suite
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Release   │ ← Version, build, publish with provenance
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validate   │ ← Verify npm package available
│  Release    │
└─────────────┘
```

### Job Details

#### 1. Validate (validate)

- **Purpose**: Prevent accidental releases from wrong branch
- **Checks**: Verifies workflow is running on `main` branch
- **Duration**: ~1 minute

#### 2. Test (test)

- **Purpose**: Ensure package quality before release
- **Runs**:
  - ESLint on all projects
  - Unit tests with coverage
  - Build the plugin
  - E2E tests
- **Duration**: ~15-20 minutes

#### 3. Release and Publish (release)

- **Purpose**: Create and publish the new version
- **Steps**:
  1. Install dependencies
  2. Build the plugin
  3. Run `nx release version` to:
     - Bump version in package.json
     - Generate CHANGELOG.md
     - Create git commit and tag
  4. Push changes and tags to GitHub
  5. **Publish to npm with `--provenance` flag**
  6. Extract changelog for GitHub release
  7. Create GitHub release with changelog
- **Duration**: ~10-15 minutes

#### 4. Validate Release (validate-release)

- **Purpose**: Confirm successful publication
- **Checks**:
  - Package is available on npm registry
  - GitHub release was created
- **Duration**: ~2 minutes

### Key Features

#### DRY Principles

- Uses pnpm caching to avoid redundant installations
- Leverages Nx caching for faster builds
- Reuses build artifacts between jobs
- Single source of truth for version in package.json

#### Security Best Practices

- **Minimal permissions**: Only grants necessary permissions
- **OIDC authentication**: Uses GitHub's OIDC provider for npm
- **No hardcoded secrets**: All secrets via GitHub Secrets
- **Provenance attestations**: Cryptographic verification
- **Branch protection**: Only releases from main branch

#### Performance Optimizations

- Parallel job execution where possible
- Aggressive caching (pnpm, node_modules, Nx)
- Fail-fast strategy to save CI time
- Timeout limits to prevent hanging jobs

#### Error Handling

- Comprehensive validation before publishing
- Helpful error messages on failure
- Post-release validation to catch issues
- Rollback-friendly (can re-run if publish fails)

## Troubleshooting

### Common Issues

#### 1. "Error: Releases can only be created from the main branch"

**Problem**: You're trying to release from a feature branch.

**Solution**:

```bash
git checkout main
git pull origin main
# Then trigger the workflow
```

#### 2. "npm publish failed: 401 Unauthorized"

**Problem**: NPM_TOKEN is invalid or not set.

**Solutions**:

- Verify the token exists in GitHub Secrets
- Ensure you used an **Automation** token (not Classic)
- Check token hasn't expired
- Regenerate the token if needed

#### 3. "Provenance generation failed"

**Problem**: Missing OIDC permissions or wrong token type.

**Solutions**:

- Verify `id-token: write` permission in workflow (already set)
- Ensure you're using an npm **Automation** token
- Check you're publishing from GitHub Actions (not locally)

#### 4. "Tests failed during release"

**Problem**: Code quality issues prevent release.

**Solution**:

```bash
# Run tests locally before releasing
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e
```

#### 5. "GitHub release creation failed"

**Problem**: GITHUB_TOKEN lacks permissions.

**Solution**:

- Check repository settings allow Actions to create releases
- Verify `contents: write` permission in workflow (already set)

#### 6. "Package published but GitHub release missing"

**Problem**: Network issue or API rate limit.

**Solution**:

- Check the workflow logs for specific error
- Manually create GitHub release if needed
- The package is already published, so no need to re-publish

### Verifying Provenance

After publishing, verify provenance was generated:

1. **Via npm CLI:**

   ```bash
   npm view @geekvetica/nx-astro
   ```

   Look for the "Provenance" section

2. **Via npm website:**

   - Go to https://www.npmjs.com/package/@geekvetica/nx-astro
   - Look for the "Provenance" badge
   - Click to see attestation details

3. **Via npm provenance subcommand:**
   ```bash
   npm audit signatures
   ```

### Manual Rollback

If you need to rollback a release:

1. **Unpublish the npm package** (within 72 hours):

   ```bash
   npm unpublish @geekvetica/nx-astro@VERSION
   ```

2. **Delete the GitHub release:**

   - Go to repository releases
   - Delete the release
   - Delete the git tag

3. **Revert the version commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

**Note**: npm doesn't allow re-publishing the same version. You'll need to publish a new version.

## Additional Resources

- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Nx Release Documentation](https://nx.dev/recipes/nx-release)
- [Semantic Versioning](https://semver.org/)

## Release Checklist

Before triggering a release:

- [ ] All changes merged to main branch
- [ ] CI passing on main branch
- [ ] CHANGELOG reviewed (if needed)
- [ ] NPM_TOKEN secret configured in GitHub
- [ ] Decided on version bump type (patch/minor/major)
- [ ] Ready to publish publicly

## Support

If you encounter issues not covered here:

1. Check the GitHub Actions workflow logs for detailed errors
2. Review the [GitHub repository issues](https://github.com/geekvetica/nx-astro/issues)
3. Create a new issue with:
   - Workflow run URL
   - Error messages
   - Steps to reproduce
