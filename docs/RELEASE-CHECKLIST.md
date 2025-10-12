# Release Checklist

This checklist should be followed every time a new version of nx-astro is released.

## Pre-Release Preparation

### 1. Code Quality Verification

- [ ] All unit tests passing (`npx nx test nx-astro`)
- [ ] All E2E tests passing (`npx nx e2e nx-astro-e2e`)
- [ ] No linting errors (`npx nx lint nx-astro`)
- [ ] No TypeScript errors (`npx nx build nx-astro`)
- [ ] Code review completed (if applicable)
- [ ] Security audit clean (`pnpm audit` or `npm audit`)

### 2. Documentation Updates

- [ ] CHANGELOG.md updated with all changes
  - New features listed
  - Bug fixes documented
  - Breaking changes highlighted
  - Migration guide provided (if breaking changes)
- [ ] README.md updated if needed
- [ ] Version number updated in relevant docs
- [ ] Examples tested and verified
- [ ] API documentation current

### 3. Version Bump

- [ ] Decide version number (semver: major.minor.patch)
  - **Patch** (0.0.x): Bug fixes, minor improvements
  - **Minor** (0.x.0): New features, backward compatible
  - **Major** (x.0.0): Breaking changes
- [ ] Update version in `package.json`
- [ ] Update version in `nx-astro/package.json`
- [ ] Update any hardcoded version references

### 4. Final Testing

- [ ] Clean build from scratch
  ```bash
  rm -rf dist/ node_modules/.cache
  npx nx build nx-astro
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
  npx nx g nx-astro:init
  npx nx g nx-astro:app my-app
  npx nx build my-app
  ```

### 5. Repository Preparation

- [ ] All changes committed
- [ ] Working directory clean (`git status`)
- [ ] On correct branch (usually `main` or `release`)
- [ ] Pull latest changes (`git pull origin main`)
- [ ] Create release branch (optional)
  ```bash
  git checkout -b release/v0.1.0
  ```

## Release Process

### 6. Create Git Tag

```bash
# Create annotated tag
git tag -a v0.1.0 -m "Release version 0.1.0"

# Push tag to origin
git push origin v0.1.0
```

### 7. Build for Production

```bash
# Clean build
rm -rf dist/
npx nx build nx-astro

# Verify files are included
cd dist/nx-astro
ls -la
```

### 8. Publish to npm

**Option A: Using npm CLI**

```bash
cd dist/nx-astro

# Dry run first (verify what will be published)
npm publish --dry-run

# Actually publish (if dry run looks good)
npm publish --access public
```

**Option B: Using Nx Release** (if configured)

```bash
npx nx release publish
```

### 9. Create GitHub Release

- [ ] Go to GitHub repository releases page
- [ ] Click "Create a new release"
- [ ] Select the tag created earlier (v0.1.0)
- [ ] Release title: "v0.1.0 - [Brief Description]"
- [ ] Copy relevant section from CHANGELOG.md
- [ ] Add installation instructions:
  ```bash
  npm install --save-dev nx-astro@0.1.0
  ```
- [ ] Attach any relevant assets
- [ ] Mark as pre-release if appropriate
- [ ] Publish release

## Post-Release Tasks

### 10. Verification

- [ ] Verify package on npm
  ```bash
  npm view nx-astro
  npm view nx-astro versions
  ```
- [ ] Test installation from npm
  ```bash
  npx create-nx-workspace@latest test-install --preset=apps
  cd test-install
  npm install --save-dev nx-astro
  npx nx g nx-astro:init
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

- [ ] Merge release branch to main (if using release branches)
- [ ] Delete release branch (if temporary)
- [ ] Update project board/milestones
- [ ] Plan next release
- [ ] Start new section in CHANGELOG for next version

## Rollback Procedure

If critical issues are discovered after release:

### Option 1: Deprecate Version

```bash
npm deprecate nx-astro@0.1.0 "Critical bug, please upgrade to 0.1.1"
```

### Option 2: Unpublish (within 72 hours only)

```bash
# WARNING: Only works within 72 hours of publish
npm unpublish nx-astro@0.1.0
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
