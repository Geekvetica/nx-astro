# Release Process

This document describes the release process for `@geekvetica/nx-astro`: how a maintainer creates a release locally and what the release workflow does with it.

## Overview

A release has two halves:

- **Locally, with Nx Release** (`pnpm exec nx release <specifier> --skip-publish`): version bump, changelog entry, release commit and annotated tag. Nothing is pushed.
- **In GitHub Actions** (`.github/workflows/release.yml`, triggered by pushing the tag): tag verification, lint and unit tests, npm staging with provenance, and the GitHub release.

A maintainer then approves the staged version on npmjs.com with 2FA, which makes it public.

## Release Types

Nx Release supports semantic versioning with the following bump types:

- **Patch** (`0.0.x`): Bug fixes and minor improvements
- **Minor** (`0.x.0`): New features, backward compatible changes
- **Major** (`x.0.0`): Breaking changes
- **Prerelease** (`0.0.0-beta.x`): Pre-release versions for testing

## Prerequisites

Before creating a release, ensure:

1. You can push to `main` and create `v*` tags (tags are protected by a ruleset; admins only)
2. All CI checks are passing on `main`
3. Your local `main` is clean and up to date (`git pull origin main`)
4. npm Trusted Publishing is configured for `@geekvetica/nx-astro` (see [npm Trusted Publishing](#npm-trusted-publishing)). No npm token secret is needed.

## How to Create a Release

1. Create the release commit and tag locally (see [Version Determination](#version-determination)):

   ```bash
   pnpm exec nx release patch --skip-publish --dry-run   # preview
   pnpm exec nx release patch --skip-publish
   ```

2. Push the commit and the tag together:

   ```bash
   git push --follow-tags
   ```

   The tag push triggers the release workflow. Push the commit with the tag: the workflow rejects a tag whose commit is not on `main`.

3. Approve the staged version with 2FA in the **Staged Packages** tab on https://www.npmjs.com/package/@geekvetica/nx-astro.

To stage an existing tag again (for example after fixing the trusted publisher), run the workflow manually with that tag: `gh workflow run release.yml -f tag=vX.Y.Z`. The manual run takes only a `tag` input; it never chooses or bumps a version.

## Release Workflow Details

The workflow (`.github/workflows/release.yml`) has three jobs.

### Job 1: Run Tests and Lint

- **Verify release tag**: refuses the tag unless it matches `v<major>.<minor>.<patch>` (optional prerelease suffix), points to a commit with the subject `chore(release): publish <version>`, that commit's `nx-astro/package.json` has the same version, and the commit is on `main`
- Installs dependencies, runs lint and unit tests (E2E tests run in regular CI, not here)

### Job 2: Stage on npm

- Builds the plugin and stages `dist/nx-astro` with `npm stage publish --access public --provenance` (prereleases under the `next` dist-tag)
- Authenticates through npm Trusted Publishing (OIDC); the trusted publisher allows staging only, so the workflow cannot make a version public by itself
- Links to the approval page in the run summary

### Job 3: Create GitHub Release

- Extracts the version's entry from `CHANGELOG.md` (written locally by `nx release`)
- Creates the GitHub release for the tag with that changelog and installation instructions; prereleases are marked as pre-release

## Version Determination

The maintainer chooses the next version locally with **Nx Release** (see [RELEASING.md](../../RELEASING.md) for the full flow):

```bash
# Patch release (1.0.0 → 1.0.1)
pnpm exec nx release patch --skip-publish

# Minor release (1.0.0 → 1.1.0)
pnpm exec nx release minor --skip-publish

# Major release (1.0.0 → 2.0.0)
pnpm exec nx release major --skip-publish

# Prerelease (1.0.0 → 1.0.1-beta.0)
pnpm exec nx release prerelease --preid=beta --skip-publish
```

This bumps `nx-astro/package.json`, writes the `CHANGELOG.md` entry, commits `chore(release): publish X.Y.Z` and creates the annotated `vX.Y.Z` tag. It does not push or create the GitHub release; push with `git push --follow-tags` and the release workflow does the rest. Use the top-level command: the `nx release version` and `nx release changelog` subcommands are rejected with this workspace's `release.git` configuration.

## Changelog Generation

`nx release` writes the `CHANGELOG.md` entry locally, based on:

- **Conventional Commits**: Commit messages following the format:

  ```
  <type>(<scope>): <subject>
  ```

- **Types shown in the changelog** (others such as `docs`, `refactor`, `test`, `ci` and `build` are hidden):
  - `feat`: New features
  - `fix`: Bug fixes
  - `perf`: Performance improvements
  - `chore`: Maintenance, including Dependabot's `chore(deps)` and `chore(deps-dev)` updates, so that a dependency-only release still gets an entry

- **Example Changelog Entry**:

  ```markdown
  # 1.1.0 (2026-01-15)

  ### 🚀 Features

  - **application:** add portfolio template option

  ### 🩹 Fixes

  - **build:** correct output path resolution on Windows
  ```

## npm Publishing

The plugin is published to npm as `@geekvetica/nx-astro`:

```bash
# The release workflow stages the version from the dist directory
cd dist/nx-astro
npm stage publish --access public --provenance
```

A staged version is **not public** until a maintainer approves it with 2FA, either in the **Staged Packages** tab on https://www.npmjs.com/package/@geekvetica/nx-astro or with `npm stage approve <stage-id>`. The workflow run summary links to the approval page.

**Package Details:**

- **Package Name**: `@geekvetica/nx-astro`
- **Registry**: https://registry.npmjs.org
- **Access**: Public (anyone can install)

**After Approval:**

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

After a successful release workflow run:

1. **Approve the staged version** on npmjs.com (Staged Packages tab, 2FA required). The GitHub release is already created at this point; the npm version is public only after approval.

2. **Verify npm Package**

   ```bash
   # Check package is available
   npm view @geekvetica/nx-astro

   # Check latest version
   npm view @geekvetica/nx-astro version

   # View all versions
   npm view @geekvetica/nx-astro versions
   ```

3. **Test Installation**

   ```bash
   # Create test workspace
   npx create-nx-workspace@latest test-install --preset=apps
   cd test-install

   # Install plugin
   npm install --save-dev @geekvetica/nx-astro

   # Test functionality
   npx nx g @geekvetica/nx-astro:init
   ```

4. **Verify GitHub Release**
   - Visit: https://github.com/geekvetica/nx-astro/releases
   - Confirm release appears
   - Verify changelog is correct

5. **Monitor for Issues**
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
2. Create and push a patch release immediately
3. Deprecate broken version
4. Announce fix to users

**Steps:**

```bash
# 1. Fix the issue locally
git checkout main
# ... make fixes ...
git commit -m "fix: critical issue in build executor"
git push origin main

# 2. Create the patch release and push it (triggers the release workflow)
pnpm exec nx release patch --skip-publish
git push --follow-tags

# 3. After approving the staged version on npmjs.com, deprecate the broken one
npm deprecate @geekvetica/nx-astro@1.0.0 "Critical bug fixed in 1.0.1"

# 4. Announce fix
# - Update GitHub release
# - Post in discussions
# - Notify affected users
```

## Troubleshooting Releases

### Release Fails at Validation

**Symptom:** The "Verify release tag" step fails
**Cause:** The tag is not a release created by `nx release`. The step requires that:

- the tag matches `v<major>.<minor>.<patch>` (optional prerelease suffix)
- it points to a commit with the subject `chore(release): publish <version>`
- `nx-astro/package.json` in that commit has the same version
- the commit is on `main`

**Solution:** Create releases only with `nx release` on an up-to-date `main`, then push the commit and tag:

```bash
git checkout main
git pull origin main
pnpm exec nx release patch --skip-publish
git push --follow-tags
```

### Release Fails at Tests

**Symptom:** Test job fails
**Cause:** Tests failing on the tagged release commit
**Solution:** re-running the workflow tests the same tagged commit again, so release a new version instead:

1. Fix the failing tests on `main` (through a PR) and wait for CI to pass
2. Create a new patch release with `pnpm exec nx release patch --skip-publish` and push it with `git push --follow-tags`
3. The failed version was never staged. Deleting its tag is optional (`git push origin :refs/tags/vX.Y.Z`; `v*` tags are admin-only)

### Release Fails at Publishing

**Symptom:** npm publish fails
**Possible Causes:**

- Trusted publisher on npmjs.com is missing or does not match `Geekvetica/nx-astro` and `release.yml`
- npm in the workflow is older than 11.15.0 (check the `npm --version` output of the "Install npm" step)
- The release was staged but not approved yet (check the Staged Packages tab on npmjs.com)
- `repository.url` in `nx-astro/package.json` no longer matches the GitHub repository
- Network issues
- Version already published

**Common Error Pattern:**

- `npm error code E404`
- `404 Not Found - PUT https://registry.npmjs.org/@geekvetica%2fnx-astro`

This often indicates an authorization problem for a scoped package rather than a missing package.

**Solution:**

```bash
# Check if version already exists
npm view @geekvetica/nx-astro versions

# After fixing the trusted publisher settings, publish the existing tag again
# (the manual run checks out the tag and uses the workflow file from main)
gh workflow run release.yml -f tag=v1.0.0
```

### Release Fails at GitHub Release

**Symptom:** GitHub release creation fails
**Possible Causes:**

- Missing `CHANGELOG.md` entry for the version (the release body falls back to `Release <version>`)
- Insufficient permissions (`contents: write` on the `github-release` job)
- Network issues

**Solution:** do not delete or recreate the tag; the version is already staged on npm. Re-run only the failed job of that workflow run:

```bash
gh run list --workflow release.yml --limit 5
gh run rerun <run-id> --failed
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
   # After merge, on an up-to-date main
   pnpm exec nx release patch --skip-publish
   git push --follow-tags
   ```

5. Announce with security advisory
   - Create GitHub Security Advisory
   - Update release notes
   - Notify users via GitHub Discussions

## Configuration Reference

### npm Trusted Publishing

The release workflow uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) with staged publishing. npm trusts the workflow via OIDC and issues a short-lived credential for each run, so there is no npm token to store, rotate or leak. The trusted publisher may only stage versions; a maintainer approves each one with 2FA before it becomes public. Provenance attestations are generated automatically.

One-time setup on npmjs.com (package owner):

1. Open `@geekvetica/nx-astro` → **Settings** → **Trusted Publisher** → **GitHub Actions**
2. Organization or user: `Geekvetica`
3. Repository: `nx-astro`
4. Workflow filename: `release.yml`
5. Environment: leave empty
6. Leave **Allow npm publish** unchecked (stage-only) and **Allow npm dist-tag** unchecked
7. Keep this as the only trusted publisher entry: a publish is authorized if it matches any entry, so an extra entry with direct publishing would bypass the approval step
8. Under **Publishing access**, require two-factor authentication and disallow tokens

Requirements the workflow already meets:

- `id-token: write` permission
- npm >= 11.15.0 for `npm stage publish` (installed by the publish job)
- `repository.url` in `nx-astro/package.json` matches `https://github.com/Geekvetica/nx-astro`

### Release Tag Protection

Two checks make sure only real releases are staged:

- **Workflow:** the "Verify release tag" step refuses any tag that is not a `chore(release): publish <version>` commit on `main` with a matching package version.
- **GitHub tag ruleset** `release-tags`: only repository admins can create, move or delete `v*` tags.

### GitHub Secrets

No npm secret is required. `GITHUB_TOKEN` is provided automatically by GitHub Actions.

### Workflow Permissions

The release workflow is read-only by default (`contents: read`) and widens permissions per job:

- `publish` (Stage on npm): `id-token: write`, for the npm Trusted Publishing OIDC token and provenance
- `github-release` (Create GitHub Release): `contents: write`, to create the GitHub release

It never pushes commits or tags; the maintainer pushes them.

### Nx Release Configuration

Located in `nx.json`:

```json
{
  "release": {
    "version": {
      "preVersionCommand": "pnpm exec nx run-many -t build",
      "specifierSource": "prompt",
      "currentVersionResolver": "git-tag",
      "fallbackCurrentVersionResolver": "disk",
      "preserveLocalDependencyProtocols": false
    },
    "changelog": {
      "workspaceChangelog": {
        "createRelease": false,
        "file": "CHANGELOG.md",
        "entryWhenNoChanges": false,
        "renderOptions": {
          "authors": true,
          "commitReferences": true,
          "versionTitleDate": true
        }
      },
      "projectChangelogs": false
    },
    "conventionalCommits": {
      "types": {
        "chore": {
          "semverBump": "none",
          "changelog": {
            "title": "🏡 Chore"
          }
        }
      }
    },
    "git": {
      "commit": true,
      "commitMessage": "chore(release): publish {version}",
      "commitArgs": "--no-verify",
      "tag": true,
      "tagMessage": "v{version}",
      "tagArgs": "--force",
      "push": false
    },
    "projects": ["nx-astro"],
    "releaseTag": {
      "pattern": "v{version}"
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
