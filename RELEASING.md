# Release Process

This document describes how to release new versions of `@geekvetica/nx-astro` to npm.

## Overview

We use a hybrid release process that combines local control with automated CI/CD publishing:

1. **Local versioning**: Run `nx release` locally to create version, changelog, and git tag
2. **Automated publishing**: Push the tag to GitHub, and GitHub Actions automatically publishes to npm with provenance

This approach gives you:

- ✅ Control over version numbers and changelog locally
- ✅ Automated npm publishing with cryptographic provenance from CI/CD
- ✅ Supply chain security through verifiable build attestations

## Prerequisites

Before creating a release:

1. You're on the `main` branch
2. Your working directory is clean (no uncommitted changes)
3. All tests pass locally: `pnpm test`
4. Build succeeds: `pnpm build`
5. GitHub repository has `NPM_TOKEN` secret configured

### Setting up NPM_TOKEN (One-time setup)

The GitHub Actions workflow requires an npm Automation token:

1. Create token at: https://www.npmjs.com/settings/[username]/tokens
2. **IMPORTANT**: Select **"Automation"** token type (Classic tokens don't support provenance)
3. Add to GitHub: Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: [paste your automation token]

**Why Automation Token?** Publishing with npm provenance requires:

- An Automation token (Classic tokens don't support provenance)
- OIDC authentication from GitHub Actions
- `id-token: write` permission (already configured in the workflow)

## Release Process

### Step 1: Create Version and Tag Locally

Run `nx release` locally to version the package and create a git tag:

```bash
# For patch version (0.9.0 → 0.9.1)
pnpx nx release version patch

# For minor version (0.9.0 → 0.10.0)
pnpx nx release version minor

# For major version (0.9.0 → 1.0.0)
pnpx nx release version major

# For specific version
pnpx nx release version 1.0.0

# For prerelease version
pnpx nx release version prerelease --preid=beta
```

This command will:

- ✅ Update `package.json` version
- ✅ Generate `CHANGELOG.md` from git commits
- ✅ Create a git commit: `chore(release): publish X.X.X`
- ✅ Create a git tag: `vX.X.X`

**Important:** This does NOT publish to npm. Publishing happens automatically in the next step.

### Step 2: Push Tag to GitHub

Push the tag to GitHub to trigger automated publishing:

```bash
# Push the commit and tags
git push && git push --tags

# Or push everything at once
git push --follow-tags
```

### Step 3: GitHub Actions Publishes Automatically

Once you push the tag, GitHub Actions will automatically:

1. ✅ Run linting and unit tests
2. ✅ Build the package
3. ✅ **Publish to npm with provenance**
4. ✅ Verify the package is available on npm
5. ✅ Create GitHub release with changelog

**Note:** E2E tests are not run in the release workflow (they run in your regular CI/PR checks).

**Monitor the workflow:** https://github.com/geekvetica/nx-astro/actions

**What is Provenance?** The package includes a cryptographic attestation that:

- Links the package to its source repository and specific commit
- Records the GitHub Actions workflow that built it
- Provides transparency and supply chain security
- Displays a "Provenance" badge on the npm package page

**Note:** Provenance can ONLY be generated when publishing from GitHub Actions. Local publishing cannot create provenance attestations.

### Step 4: Verify the Release

After the GitHub Actions workflow completes (usually 5-10 minutes):

```bash
# Check the package on npm
npm view @geekvetica/nx-astro

# Verify provenance attestation
npm audit signatures

# Check GitHub release
# Visit: https://github.com/geekvetica/nx-astro/releases

# Verify provenance badge on npm
# Visit: https://www.npmjs.com/package/@geekvetica/nx-astro
```

## First Release

For the very first release (0.9.0), use the `--first-release` flag:

```bash
pnpx nx release version 0.9.0 --first-release
git push && git push --tags
```

The `--first-release` flag tells `nx release` that there are no previous git tags to compare against.

## Prerelease Versions

To release a prerelease version (e.g., beta, alpha):

```bash
# Create a beta prerelease
pnpx nx release version prerelease --preid=beta

# This creates version like: 0.9.1-beta.0
git push && git push --tags
```

GitHub Actions will automatically mark it as a prerelease on GitHub.

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

### GitHub Actions workflow doesn't trigger

**Cause:** The tag might not have been pushed correctly.

**Solution:**

```bash
# Check local tags
git tag

# Push all tags
git push --tags

# Or push specific tag
git push origin v0.9.0
```

### "Unable to generate provenance" error in GitHub Actions

**Cause:** NPM_TOKEN secret is not configured or is a Classic token.

**Solution:**

1. Create an **Automation token** (not Classic) at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add it to GitHub repository secrets as `NPM_TOKEN`
3. Verify the token type is "Automation"

### Package publishes to wrong registry

**Cause:** Your `.npmrc` has a scoped registry for `@geekvetica`.

**Solution:** The workflow overrides the registry to `https://registry.npmjs.org` automatically. This is working as designed - your other `@geekvetica` packages will still use your private registry, but this package goes to npm central.

### "Tag already exists" error

If a release failed midway, you may need to delete the tag:

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Then retry the release
pnpx nx release version 1.0.0
git push && git push --tags
```

### GitHub Actions workflow fails during tests

**Cause:** Tests or linting failures.

**Solution:**

1. Run tests locally first: `pnpm test`
2. Fix any failures
3. Commit and push fixes
4. Delete the failed release tag
5. Create a new release

## Rollback

If you need to unpublish a version (within 72 hours):

```bash
# Unpublish a specific version
npm unpublish @geekvetica/nx-astro@1.0.0

# WARNING: Only use this if absolutely necessary
# Better to publish a patch with a fix
```

## Release Checklist

Before creating a release, verify:

- [ ] All tests passing locally (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No uncommitted changes (`git status`)
- [ ] On main branch (`git branch --show-current`)
- [ ] Up to date with remote (`git pull`)
- [ ] Version bump type decided (patch/minor/major)
- [ ] README is up to date
- [ ] Breaking changes are documented (if any)
- [ ] NPM_TOKEN secret configured in GitHub

After pushing tag:

- [ ] GitHub Actions workflow succeeded
- [ ] Package published to npm: `npm view @geekvetica/nx-astro`
- [ ] Provenance attestation present: `npm audit signatures`
- [ ] GitHub release created
- [ ] Provenance badge visible on npm package page

## Post-Release Tasks

After a successful automated release:

1. **Verify npm**: Visit https://www.npmjs.com/package/@geekvetica/nx-astro
2. **Check provenance badge**: Should appear on the npm package page
3. **Verify signatures**: Run `npm audit signatures`
4. **Check GitHub release**: Visit https://github.com/geekvetica/nx-astro/releases
5. **Test installation**: Install in a test project: `pnpm add @geekvetica/nx-astro@latest`
6. **Update documentation**: If API changed, update docs
7. **Announce**: Share release on social media, Discord, etc.
8. **Monitor**: Watch for issues or bug reports

## Best Practices

1. **Test locally first**: Always run tests and build before creating a release
2. **Use semantic versioning**: Follow semver principles strictly
   - Patch: Bug fixes (0.9.0 → 0.9.1)
   - Minor: New features, backward compatible (0.9.0 → 0.10.0)
   - Major: Breaking changes (0.9.0 → 1.0.0)
3. **Write meaningful commit messages**: They become your changelog (use conventional commits)
4. **Let GitHub Actions publish**: Always push tags to trigger automated publishing with provenance
5. **Verify provenance**: Check that provenance attestations are generated after each release
6. **Monitor the workflow**: Watch GitHub Actions to ensure successful publishing
7. **Communicate breaking changes**: Announce prominently in changelog and docs

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
