# Release Process

This document describes how to release new versions of `@geekvetica/nx-astro` to npm.

## Overview

We use [Nx Release](https://nx.dev/recipes/nx-release/get-started-with-nx-release) for automated version management, changelog generation, and publishing to npm. Releases can be triggered either manually via command line or automatically through GitHub Actions.

## Prerequisites

### For Manual Releases

Before creating a release, ensure:

1. You're on the `main` branch
2. Your working directory is clean (no uncommitted changes)
3. All tests pass: `pnpm test:all`
4. You have npm publish permissions for `@geekvetica/nx-astro`
5. You're logged in to npm: `npm whoami`

### For Automated Releases (GitHub Actions)

Required secrets must be configured in your GitHub repository:

- `NPM_TOKEN`: npm authentication token with publish permissions
  - Create at: https://www.npmjs.com/settings/[username]/tokens
  - **IMPORTANT**: Select "Automation" token type (required for provenance)
  - Add to: Repository Settings → Secrets and variables → Actions

**Why Automation Token?** The automated release workflow publishes with npm provenance, which requires:

- An Automation token (Classic tokens don't support provenance)
- OIDC authentication from GitHub Actions
- `id-token: write` permission (already configured in the workflow)

## Release Methods

### Method 1: Automated Release via GitHub Actions (Recommended)

This is the easiest and safest method. The workflow handles everything automatically.

1. Navigate to the **Actions** tab in your GitHub repository
2. Select the **"Release"** workflow
3. Click **"Run workflow"**
4. Select:
   - Branch: `main`
   - Version bump type: `patch`, `minor`, `major`, or `prerelease`
   - (Optional) Prerelease identifier: `beta`, `alpha`, `rc`, etc.
5. Click **"Run workflow"**

The workflow will:

- ✅ Validate you're on the main branch
- ✅ Run full test suite (lint, test, build, e2e)
- ✅ Bump version in package.json
- ✅ Generate CHANGELOG.md
- ✅ Create git commit and tag
- ✅ Push changes to GitHub
- ✅ **Publish to npm with provenance** (cryptographic attestation)
- ✅ Create GitHub release
- ✅ Validate the published package

**What is Provenance?** When published via GitHub Actions, the package includes:

- Cryptographic attestation linking it to source code
- Build environment details (workflow, commit SHA, repository)
- Verification badge on npm package page
- Supply chain security and transparency for users

### Method 2: Manual Release via Command Line

Use this method for local testing or when you need more control.

**⚠️ Important:** Manual releases from your local machine **do not include provenance attestations**. Only releases published from GitHub Actions can include provenance. For production releases, always use Method 1 (GitHub Actions).

#### Step 1: Run the Release Command

Choose one of the following based on the type of release:

```bash
# Patch release (0.0.1 → 0.0.2)
npx nx release --specifier=patch

# Minor release (0.1.0 → 0.2.0)
npx nx release --specifier=minor

# Major release (1.0.0 → 2.0.0)
npx nx release --specifier=major

# Prerelease (1.0.0 → 1.0.1-beta.0)
npx nx release --specifier=prerelease --preid=beta

# Custom version
npx nx release --specifier=1.2.3
```

#### Step 2: What Happens

The `nx release` command will:

1. **Build** - Run `pnpm dlx nx run-many -t build` (pre-version command)
2. **Version** - Bump version in:
   - `nx-astro/package.json`
   - `dist/nx-astro/package.json`
3. **Changelog** - Generate `CHANGELOG.md` from git commits
4. **Git** - Create commit and tag:
   - Commit message: `chore(release): publish [version]`
   - Tag: `v[version]`
5. **Prompt** - Ask if you want to publish to npm
6. **Publish** - If confirmed, publish `dist/nx-astro` to npm
7. **Push** - Push commit and tags to GitHub

#### Step 3: Verify the Release

```bash
# Check the package on npm
npm view @geekvetica/nx-astro

# Verify provenance (only if published via GitHub Actions)
npm audit signatures

# Install the new version in a test project
npm install @geekvetica/nx-astro@latest
```

**Note:** Packages published via GitHub Actions will display a "Provenance" badge on the npm package page.

### Method 3: Step-by-Step Manual Process

For maximum control, run each step separately:

**⚠️ Important:** This method also does not include provenance. Use GitHub Actions for production releases.

```bash
# 1. Build the package
pnpm build

# 2. Run tests
pnpm test:all

# 3. Version bump and changelog (but don't publish)
npx nx release version [patch|minor|major]

# 4. Review changes
git log --oneline -5
cat CHANGELOG.md

# 5. Publish to npm
npx nx release publish

# 6. Push to GitHub
git push origin main --follow-tags
```

## Version Bump Guidelines

Choose the appropriate version bump based on the changes:

| Bump Type      | When to Use                         | Example              |
| -------------- | ----------------------------------- | -------------------- |
| **patch**      | Bug fixes, minor tweaks             | 1.0.0 → 1.0.1        |
| **minor**      | New features (backwards compatible) | 1.0.0 → 1.1.0        |
| **major**      | Breaking changes                    | 1.0.0 → 2.0.0        |
| **prerelease** | Beta/alpha releases                 | 1.0.0 → 1.0.1-beta.0 |

## Changelog

Changelogs are automatically generated from git commit messages. Follow [Conventional Commits](https://www.conventionalcommits.org/) for the best results:

```bash
# Features
git commit -m "feat: add new Astro generator"

# Bug fixes
git commit -m "fix: resolve build output path issue"

# Breaking changes
git commit -m "feat!: change executor API"
# or
git commit -m "feat: change executor API

BREAKING CHANGE: Executor options have been renamed"

# Documentation
git commit -m "docs: update README with new examples"

# Refactoring
git commit -m "refactor: simplify generator logic"
```

## Troubleshooting

### "You are not logged in to npm"

```bash
npm login
```

### "You do not have permission to publish"

Ensure you're a collaborator on the `@geekvetica/nx-astro` package on npm.

### "Tag already exists"

If a release failed midway, you may need to delete the tag:

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0
```

### "Nothing to commit"

If version files weren't updated, check:

```bash
# Verify the release configuration
cat nx.json | jq .release

# Check project release config
cat nx-astro/project.json | jq .release
```

### Publishing Failed

If the publish step failed but version was bumped:

```bash
# Manually publish the dist folder
cd dist/nx-astro
npm publish --access public
cd ../..

# Push the version commit and tag
git push origin main --follow-tags
```

## Rollback

If you need to unpublish a version (within 72 hours):

```bash
# Unpublish a specific version
npm unpublish @geekvetica/nx-astro@1.0.0

# WARNING: Only use this if absolutely necessary
# Better to publish a patch with a fix
```

## Release Checklist

Use this checklist before releasing:

- [ ] All tests passing (`pnpm test:all`)
- [ ] No uncommitted changes (`git status`)
- [ ] On main branch (`git branch --show-current`)
- [ ] Up to date with remote (`git pull`)
- [ ] CHANGELOG entries look correct
- [ ] Version bump type is appropriate
- [ ] README is up to date
- [ ] Breaking changes are documented

## Post-Release Tasks

After a successful release:

1. **Verify npm**: Visit https://www.npmjs.com/package/@geekvetica/nx-astro
2. **Check provenance**: Verify the "Provenance" badge appears (GitHub Actions releases only)
3. **Test installation**: Install in a test project
4. **Verify signatures**: Run `npm audit signatures` to verify package attestations
5. **Update documentation**: If API changed, update docs
6. **Announce**: Share release on social media, Discord, etc.
7. **Monitor**: Watch for issues or bug reports

## Best Practices

1. **Test First**: Always run the full test suite before releasing
2. **Use Semantic Versioning**: Follow semver principles strictly
3. **Write Good Commit Messages**: They become your changelog
4. **Preview Changes**: Use `--dry-run` to preview without making changes
5. **Automate**: Prefer GitHub Actions for consistent, auditable releases with provenance
6. **Communicate**: Announce breaking changes prominently
7. **Verify Provenance**: Always check that provenance attestations are generated for production releases

## Support

If you encounter issues with the release process:

1. Check this document for troubleshooting steps
2. Review [Nx Release documentation](https://nx.dev/recipes/nx-release)
3. See [.github/workflows/RELEASE_SETUP.md](.github/workflows/RELEASE_SETUP.md) for detailed GitHub Actions setup
4. Open an issue on GitHub with details about the problem
5. Contact the maintainers if secrets/permissions are needed

## Additional Resources

- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Detailed Release Workflow Setup](.github/workflows/RELEASE_SETUP.md)

---

**Last updated**: 2025-10-14
