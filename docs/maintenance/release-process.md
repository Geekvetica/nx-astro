# Release Process

This document describes the automated release process for `@geekvetica/nx-astro` and how to trigger and manage releases.

## Overview

The `@geekvetica/nx-astro` plugin uses an automated release workflow powered by GitHub Actions and Nx Release. The release process handles:

- Version bumping (semver)
- Changelog generation
- Git tagging
- npm publishing
- GitHub release creation
- Post-release validation

## Release Types

The release workflow supports semantic versioning with the following bump types:

- **Patch** (`0.0.x`): Bug fixes and minor improvements
- **Minor** (`0.x.0`): New features, backward compatible changes
- **Major** (`x.0.0`): Breaking changes
- **Prerelease** (`0.0.0-beta.x`): Pre-release versions for testing

## Prerequisites

Before triggering a release, ensure:

1. You have write access to the repository
2. All CI checks are passing on the `main` branch
3. The `main` branch is up to date
4. Required secrets are configured:
   - `NPM_TOKEN` - Authentication token for npm registry
   - `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## How to Trigger a Release

### 1. Navigate to GitHub Actions

1. Go to the repository: https://github.com/geekvetica/nx-astro
2. Click on the **Actions** tab
3. Select **Release** workflow from the left sidebar

### 2. Run the Workflow

1. Click **Run workflow** button (top right)
2. Select the version bump type:
   - **patch**: For bug fixes (e.g., 1.0.0 → 1.0.1)
   - **minor**: For new features (e.g., 1.0.0 → 1.1.0)
   - **major**: For breaking changes (e.g., 1.0.0 → 2.0.0)
   - **prerelease**: For pre-release versions (e.g., 1.0.0 → 1.0.1-beta.0)
3. If selecting **prerelease**, enter a prerelease identifier (default: `beta`)
4. Click **Run workflow**

### 3. Monitor the Release

The workflow consists of four jobs:

1. **Validate Release Conditions** (~5 minutes)
   - Verifies you're on the `main` branch
   - Ensures the repository is in a releasable state

2. **Run Full Test Suite** (~20 minutes)
   - Runs linting on all projects
   - Executes unit tests with coverage
   - Builds the plugin
   - Runs E2E tests

3. **Release and Publish** (~15 minutes)
   - Bumps version using Nx Release
   - Generates changelog from git commits
   - Creates and pushes git tag
   - Publishes to npm registry
   - Creates GitHub release

4. **Validate Release** (~10 minutes)
   - Waits for npm registry propagation
   - Verifies package is available on npm
   - Confirms GitHub release was created

## Release Workflow Details

### Job 1: Validate Release Conditions

```yaml
Purpose: Ensure we're on the main branch and ready to release
Steps:
  - Checkout repository
  - Verify we're on the main branch
  - Fail fast if on wrong branch
```

**What it checks:**
- Current branch is `main`
- No uncommitted changes

**Why it matters:**
- Prevents accidental releases from feature branches
- Ensures consistent release source

### Job 2: Run Full Test Suite

```yaml
Purpose: Validate code quality and functionality before release
Steps:
  - Install dependencies
  - Run linting on all projects
  - Run unit tests with coverage
  - Build the plugin
  - Run E2E tests
```

**What it validates:**
- No linting errors
- All unit tests pass
- Code coverage meets thresholds
- Plugin builds successfully
- E2E tests verify plugin functionality

**Why it matters:**
- Ensures we only release working code
- Prevents broken versions from being published

### Job 3: Release and Publish

```yaml
Purpose: Version, tag, publish, and create release
Steps:
  - Configure Git user
  - Build the plugin
  - Run Nx release version
  - Push tags to repository
  - Publish to npm registry
  - Extract changelog
  - Create GitHub release
```

**What it does:**

1. **Version Bump**: Uses Nx Release to bump version in `package.json`
2. **Changelog Generation**: Generates changelog from conventional commits
3. **Git Tagging**: Creates annotated git tag (e.g., `v1.0.0`)
4. **npm Publishing**: Publishes built package to npm registry
5. **GitHub Release**: Creates release with changelog and installation instructions

**Key files modified:**
- `nx-astro/package.json` - Version bumped
- `dist/nx-astro/package.json` - Built package version
- `CHANGELOG.md` - Updated with new version (if configured)

### Job 4: Validate Release

```yaml
Purpose: Verify release was successful
Steps:
  - Wait for npm propagation
  - Verify package on npm
  - Verify GitHub release exists
```

**What it validates:**
- Package is available on npm registry
- GitHub release was created successfully
- Release assets are accessible

**Why it matters:**
- Catches publishing failures early
- Ensures users can install the new version

## Version Determination

The workflow uses **Nx Release** to determine the next version:

```bash
# Patch release (1.0.0 → 1.0.1)
npx nx release version --specifier=patch

# Minor release (1.0.0 → 1.1.0)
npx nx release version --specifier=minor

# Major release (1.0.0 → 2.0.0)
npx nx release version --specifier=major

# Prerelease (1.0.0 → 1.0.1-beta.0)
npx nx release version --specifier=prerelease --preid=beta
```

## Changelog Generation

The release workflow generates a changelog based on:

- **Conventional Commits**: Commit messages following the format:
  ```
  <type>(<scope>): <subject>
  ```

- **Supported Types**:
  - `feat`: New features
  - `fix`: Bug fixes
  - `docs`: Documentation changes
  - `refactor`: Code refactoring
  - `test`: Test changes
  - `chore`: Build/tooling changes

- **Example Changelog Entry**:
  ```markdown
  ## 1.1.0

  ### Features
  - feat(application): add portfolio template option

  ### Bug Fixes
  - fix(build): correct output path resolution on Windows
  ```

## npm Publishing

The plugin is published to npm as `@geekvetica/nx-astro`:

```bash
# Publishing happens from dist directory
cd dist/nx-astro
npm publish --access public
```

**Package Details:**
- **Package Name**: `@geekvetica/nx-astro`
- **Registry**: https://registry.npmjs.org
- **Access**: Public (anyone can install)

**After Publishing:**
- Package is available at: https://www.npmjs.com/package/@geekvetica/nx-astro
- Users can install: `npm install @geekvetica/nx-astro`

## GitHub Release

A GitHub release is automatically created with:

- **Tag**: `v{version}` (e.g., `v1.0.0`)
- **Title**: `Release v{version}`
- **Body**: Contains:
  - Changelog for this version
  - Installation instructions
  - Link to documentation

**Example Release Body:**
```markdown
# nx-astro v1.0.0

## Features
- Add support for Astro 5.0
- New portfolio template

## Bug Fixes
- Fix build output path on Windows

## Installation

\`\`\`bash
npm install @geekvetica/nx-astro@1.0.0
# or
pnpm add @geekvetica/nx-astro@1.0.0
\`\`\`

## Documentation

See the [README](https://github.com/geekvetica/nx-astro) for usage instructions.
```

## Post-Release Steps

After a successful release:

1. **Verify npm Package**
   ```bash
   # Check package is available
   npm view @geekvetica/nx-astro

   # Check latest version
   npm view @geekvetica/nx-astro version

   # View all versions
   npm view @geekvetica/nx-astro versions
   ```

2. **Test Installation**
   ```bash
   # Create test workspace
   npx create-nx-workspace@latest test-install --preset=apps
   cd test-install

   # Install plugin
   npm install --save-dev @geekvetica/nx-astro

   # Test functionality
   npx nx g @geekvetica/nx-astro:init
   ```

3. **Verify GitHub Release**
   - Visit: https://github.com/geekvetica/nx-astro/releases
   - Confirm release appears
   - Verify changelog is correct

4. **Monitor for Issues**
   - Watch GitHub Issues for bug reports
   - Monitor npm download stats
   - Check for installation errors

## Rollback Procedures

If a critical issue is discovered after release:

### Option 1: Deprecate Version

```bash
npm deprecate @geekvetica/nx-astro@1.0.0 "Critical bug, please upgrade to 1.0.1"
```

**When to use:**
- Non-critical bugs that users should be aware of
- Security vulnerabilities (also publish fix immediately)
- Package works but has known issues

### Option 2: Unpublish (72-hour window)

```bash
# WARNING: Only works within 72 hours of publish
npm unpublish @geekvetica/nx-astro@1.0.0
```

**When to use:**
- Critical breaking bugs that make the package unusable
- Accidental publish with secrets or sensitive data
- Within 72 hours of publish

**Note:** Unpublishing is discouraged by npm and should be a last resort.

### Option 3: Quick Patch Release (Recommended)

1. Fix the issue on `main` branch
2. Trigger patch release immediately
3. Deprecate broken version
4. Announce fix to users

**Steps:**
```bash
# 1. Fix the issue locally
git checkout main
# ... make fixes ...
git commit -m "fix: critical issue in build executor"
git push origin main

# 2. Trigger patch release via GitHub Actions
# 3. Deprecate broken version
npm deprecate @geekvetica/nx-astro@1.0.0 "Critical bug fixed in 1.0.1"

# 4. Announce fix
# - Update GitHub release
# - Post in discussions
# - Notify affected users
```

## Troubleshooting Releases

### Release Fails at Validation

**Symptom:** Validate job fails
**Cause:** Not on `main` branch
**Solution:**
```bash
git checkout main
git pull origin main
# Re-run workflow
```

### Release Fails at Tests

**Symptom:** Test job fails
**Cause:** Tests failing on `main`
**Solution:**
1. Fix failing tests
2. Push to `main`
3. Wait for CI to pass
4. Re-run release workflow

### Release Fails at Publishing

**Symptom:** npm publish fails
**Possible Causes:**
- `NPM_TOKEN` not set or expired
- Network issues
- Version already published

**Solution:**
```bash
# Check if version already exists
npm view @geekvetica/nx-astro versions

# If token expired, regenerate on npmjs.com:
# 1. Login to npmjs.com
# 2. Go to Access Tokens
# 3. Generate new Automation token
# 4. Update NPM_TOKEN secret in GitHub
```

### Release Fails at GitHub Release

**Symptom:** GitHub release creation fails
**Possible Causes:**
- Tag already exists
- Insufficient permissions
- Network issues

**Solution:**
```bash
# Check if tag exists
git ls-remote --tags origin

# If tag exists, delete and re-run
git push --delete origin v1.0.0
```

## Release Schedule

Recommended release cadence:

- **Patch Releases**: As needed for bug fixes
- **Minor Releases**: Monthly or when new features are ready
- **Major Releases**: When breaking changes are necessary
- **Prereleases**: For testing major changes before stable release

## Emergency Hotfix Process

For critical security issues:

1. Create hotfix branch from `main`
   ```bash
   git checkout main
   git checkout -b hotfix/security-fix
   ```

2. Fix issue with minimal changes
   ```bash
   # Make focused fix
   git commit -m "fix: critical security vulnerability"
   ```

3. Push and create PR
   ```bash
   git push origin hotfix/security-fix
   # Create PR, get quick review
   ```

4. Merge and release immediately
   ```bash
   # After merge, trigger patch release
   # Skip normal testing cycle if necessary
   ```

5. Announce with security advisory
   - Create GitHub Security Advisory
   - Update release notes
   - Notify users via GitHub Discussions

## Configuration Reference

### GitHub Secrets

Required secrets in repository settings:

- **NPM_TOKEN**: npm authentication token
  - Type: Automation token
  - Scope: Read and Publish
  - Generate at: https://www.npmjs.com/settings/tokens

### Workflow Permissions

The release workflow requires:

- `contents: write` - To push tags and commits
- `packages: write` - To publish packages
- `pull-requests: write` - To create release PRs (if needed)

### Nx Release Configuration

Located in `nx.json`:

```json
{
  "release": {
    "version": {
      "conventionalCommits": true,
      "generatorOptions": {
        "currentVersionResolver": "git-tag",
        "specifierSource": "prompt"
      }
    }
  }
}
```

## Best Practices

1. **Always test before releasing**: Run full test suite locally
2. **Use conventional commits**: Ensures accurate changelog generation
3. **Review changelog**: Check generated changelog before release
4. **Monitor releases**: Watch for issues after publishing
5. **Communicate changes**: Update documentation and notify users
6. **Keep dependencies updated**: Regular dependency updates prevent issues
7. **Test prereleases**: Use prereleases for major changes

## Additional Resources

- [Nx Release Documentation](https://nx.dev/recipes/nx-release)
- [Semantic Versioning](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
