# Release Checklist

This checklist should be followed every time a new version of nx-astro is released.

## Pre-Release Preparation

### 1. Code Quality Verification

- [ ] All unit tests passing (`pnpm exec nx test nx-astro`)
- [ ] All E2E tests passing (`pnpm exec nx e2e nx-astro-e2e`)
- [ ] No linting errors (`pnpm exec nx lint nx-astro`)
- [ ] No TypeScript errors (`pnpm exec nx build nx-astro`)
- [ ] Code review completed (if applicable)
- [ ] Security audit clean (`pnpm audit` or `npm audit`)

### 2. Documentation Updates

- [ ] CHANGELOG.md entry checked: `nx release` generates it from Conventional Commits (step 6); preview it with `--dry-run` (step 3) and make sure commit messages describe the changes
  - New features listed
  - Bug fixes documented
  - Breaking changes highlighted
  - Migration guide provided (if breaking changes)
- [ ] README.md updated if needed
- [ ] Version number updated in relevant docs
- [ ] Examples tested and verified
- [ ] API documentation current

### 3. Version Decision

- [ ] Decide version number (semver: major.minor.patch)
  - **Patch** (0.0.x): Bug fixes, minor improvements
  - **Minor** (0.x.0): New features, backward compatible
  - **Major** (x.0.0): Breaking changes
- [ ] Preview the release (changes nothing): `pnpm exec nx release <patch|minor|major> --skip-publish --dry-run`
- [ ] Update and commit any hardcoded version references (`nx release` bumps only `nx-astro/package.json`)

### 4. Final Testing

- [ ] Clean build from scratch
  ```bash
  rm -rf dist/ node_modules/.cache
  pnpm exec nx build nx-astro
  ```
- [ ] Verify build output
  ```bash
  ls -la dist/nx-astro/
  cat dist/nx-astro/package.json
  ```
- [ ] Test package locally
  ```bash
  cd dist/nx-astro
  npm pack
  ```
- [ ] Install in fresh Nx workspace
  ```bash
  npx create-nx-workspace@latest test-ws --preset=apps
  cd test-ws
  npm install /path/to/nx-astro-<version>.tgz
  npx nx g @geekvetica/nx-astro:init
  npx nx g @geekvetica/nx-astro:app my-app
  npx nx build my-app
  ```

### 5. Repository Preparation

- [ ] All changes committed and merged to `main`
- [ ] On `main` (`git branch --show-current`); the release workflow rejects a tag whose commit is not on `main`, so do not release from another branch
- [ ] Pull latest changes (`git pull origin main`)
- [ ] Working directory clean (`git status`)

## Release Process

### 6. Create the Release Commit and Tag

Run this last, on the clean, up-to-date `main` from step 5. Do not create the tag by hand.

```bash
pnpm exec nx release <patch|minor|major> --skip-publish
```

It builds the plugin, bumps `nx-astro/package.json`, writes the `CHANGELOG.md` entry, commits `chore(release): publish X.Y.Z` and creates the annotated `vX.Y.Z` tag. It does not push, publish or create the GitHub release.

```bash
git log -1 --format=%s          # chore(release): publish X.Y.Z
git show --no-patch vX.Y.Z      # annotated tag on that commit
```

### 7. Build for Production

```bash
# Clean build
rm -rf dist/
pnpm exec nx build nx-astro

# Verify files are included
cd dist/nx-astro
ls -la
```

### 8. Publish to npm

Do not publish from your machine. Push the release commit and tag; the release workflow stages the version on npm with provenance through Trusted Publishing:

```bash
git push --follow-tags
```

- [ ] Release workflow succeeded: https://github.com/geekvetica/nx-astro/actions
- [ ] Staged version approved with 2FA in the **Staged Packages** tab on https://www.npmjs.com/package/@geekvetica/nx-astro

To check what will be published before tagging, run `npm pack --dry-run` in `dist/nx-astro`. See [RELEASING.md](../RELEASING.md) for the full flow.

### 9. Check the GitHub Release

The release workflow creates the GitHub release from the tag and the `CHANGELOG.md` entry.

- [ ] Release `vX.X.X` exists on the GitHub releases page
- [ ] Release notes match the CHANGELOG entry
- [ ] Prereleases are marked as pre-release

## Post-Release Tasks

### 10. Verification

- [ ] Verify package on npm
  ```bash
  npm view @geekvetica/nx-astro
  npm view @geekvetica/nx-astro versions
  ```
- [ ] Test installation from npm
  ```bash
  npx create-nx-workspace@latest test-install --preset=apps
  cd test-install
  npm install --save-dev @geekvetica/nx-astro
  npx nx g @geekvetica/nx-astro:init
  ```
- [ ] Check npm package page
  - README displays correctly
  - Version is correct
  - Keywords appropriate
  - Repository link works

### 11. Communication

- [ ] Announce release on relevant channels:
  - [ ] GitHub Discussions (if enabled)
  - [ ] Twitter/X (if applicable)
  - [ ] Dev.to blog post (if applicable)
  - [ ] Nx community Discord
  - [ ] Project documentation site
- [ ] Update any "Quick Start" or "Getting Started" guides
- [ ] Notify contributors and early adopters

### 12. Monitoring

- [ ] Watch for bug reports on GitHub Issues
- [ ] Monitor npm download stats
- [ ] Check for installation errors
- [ ] Review community feedback
- [ ] Update FAQ based on questions

### 13. Housekeeping

- [ ] Update project board/milestones
- [ ] Plan next release

## Rollback Procedure

If critical issues are discovered after release:

### Option 1: Deprecate Version

```bash
npm deprecate @geekvetica/nx-astro@0.1.0 "Critical bug, please upgrade to 0.1.1"
```

### Option 2: Unpublish (within 72 hours only)

```bash
# WARNING: Only works within 72 hours of publish
npm unpublish @geekvetica/nx-astro@0.1.0
```

### Option 3: Quick Patch Release

1. Fix the issue
2. Bump patch version (0.1.1)
3. Release using this checklist
4. Deprecate broken version

## Release Schedule

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly or when new features are ready
- **Major releases**: When breaking changes are necessary

## Emergency Hotfix Process

For critical security issues:

1. Create hotfix branch from main
2. Fix issue with minimal changes
3. Bump patch version
4. Skip normal testing cycle (expedite)
5. Release immediately
6. Announce with security advisory

## Version History Reference

Keep track of releases:

| Version | Date       | Type    | Notes                |
| ------- | ---------- | ------- | -------------------- |
| 0.1.0   | 2025-10-12 | Initial | First public release |
|         |            |         |                      |

## Checklist Template for Copy/Paste

For each release, copy this condensed checklist:

```markdown
## Release vX.Y.Z

- [ ] Tests passing
- [ ] Docs updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Clean build
- [ ] Local testing complete
- [ ] Git tag created
- [ ] Published to npm
- [ ] GitHub release created
- [ ] Announcement made
- [ ] Monitoring active
```

---

**Note**: This checklist should be reviewed and updated after each release to improve the process.

Last Updated: 2025-10-12
