# CI/CD Setup Guide for nx-astro

This guide covers the continuous integration and continuous deployment (CI/CD) setup for the nx-astro plugin repository. It explains how the automation works, how to configure it, and how to troubleshoot common issues.

## Table of Contents

- [Overview](#overview)
- [CI Pipeline](#ci-pipeline)
- [Release Pipeline](#release-pipeline)
- [Required Secrets](#required-secrets)
- [Triggering Workflows](#triggering-workflows)
- [Branch Protection](#branch-protection)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The nx-astro plugin uses GitHub Actions for CI/CD automation with two primary workflows:

1. **CI Workflow** (`.github/workflows/ci.yml`) - Runs on every push and PR
2. **Release Workflow** (`.github/workflows/release.yml`) - Publishes new versions to npm

Additionally, we use:

- **Dependabot** (`.github/dependabot.yml`) - Automated dependency updates
- **Issue Templates** - Structured bug reports and feature requests
- **PR Template** - Consistent pull request format

## CI Pipeline

### Purpose

The CI pipeline ensures code quality and catches issues before they reach production. It runs automatically on:

- Every push to the `main` branch
- Every pull request targeting `main`
- Manual triggers via workflow_dispatch

### Pipeline Architecture

The CI workflow follows a modular design with parallel execution where possible:

```
setup (install dependencies)
    ├─── lint (run ESLint)
    ├─── test (run unit tests + coverage)
    ├─── build (build the plugin)
    └─── e2e (run end-to-end tests)
         └── ci-success (aggregate status check)
```

### Jobs Breakdown

#### 1. Setup & Install Dependencies

**Purpose:** Install and cache dependencies for subsequent jobs

**Actions:**

- Checkout repository with full git history
- Setup pnpm (version 9)
- Setup Node.js (v20.x)
- Cache pnpm store and node_modules
- Install dependencies with `--frozen-lockfile`

**Cache Strategy:**

- **pnpm store**: Cached using lock file hash
- **node_modules**: Cached per project for faster restoration

#### 2. Lint

**Purpose:** Ensure code quality standards

**Actions:**

- Run ESLint on all projects
- Use Nx affected commands in PRs for efficiency
- Fail on any warnings or errors

**Command:**

```bash
# On PRs (only affected projects)
npx nx affected -t lint --base=origin/main --head=HEAD --parallel=3

# On main branch (all projects)
npx nx run-many -t lint --all --parallel=3
```

#### 3. Test

**Purpose:** Run unit tests and generate coverage reports

**Actions:**

- Run Jest tests with CI configuration
- Generate code coverage reports
- Upload coverage artifacts
- Fail if coverage drops below 80% threshold

**Coverage Threshold:**
The pipeline enforces a minimum code coverage of 80%. This can be adjusted in the workflow by modifying the `COVERAGE_THRESHOLD` environment variable.

**Command:**

```bash
# On PRs (only affected projects)
npx nx affected -t test --base=origin/main --head=HEAD --parallel=3 --configuration=ci

# On main branch (all projects)
npx nx run-many -t test --all --parallel=3 --configuration=ci
```

#### 4. Build

**Purpose:** Build the plugin and verify outputs

**Actions:**

- Build the nx-astro plugin using TypeScript compiler
- Verify build outputs exist (package.json, generators.json, executors.json)
- Cache build artifacts for E2E tests

**Output Verification:**

```bash
# Checked files:
- dist/nx-astro/package.json
- dist/nx-astro/generators.json
- dist/nx-astro/executors.json
```

#### 5. E2E Tests

**Purpose:** Test the plugin in a realistic environment

**Actions:**

- Restore build artifacts from build job
- Run end-to-end tests using Jest
- Test generator and executor functionality

**Dependencies:** Requires both `setup` and `build` jobs to complete first.

#### 6. CI Success Check

**Purpose:** Aggregate all job statuses

**Actions:**

- Check results of all previous jobs
- Fail if any job failed
- Used as a single required status check in branch protection

**Benefits:**

- Simplifies branch protection rules
- Only need to require this single job
- Easy to add new jobs without updating branch protection

### Performance Optimizations

#### Caching Strategy

1. **pnpm Store Cache**

   - Key: `${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`
   - Speeds up dependency installation
   - Shared across all jobs

2. **Node Modules Cache**

   - Key: `${{ runner.os }}-node-modules-${{ hashFiles('**/pnpm-lock.yaml') }}`
   - Cached per project
   - Eliminates repeated installations

3. **Nx Cache**

   - Key: `${{ runner.os }}-nx-cache-{job}-${{ github.sha }}`
   - Stores Nx computation cache
   - Separate cache per job type (lint, test, build, e2e)

4. **Build Artifacts Cache**
   - Key: `${{ runner.os }}-build-${{ github.sha }}`
   - Shares build outputs between jobs
   - Used by E2E tests

#### Parallel Execution

- Jobs run in parallel where possible (lint, test, build)
- Within jobs, tasks use `--parallel=3` flag
- Nx affected commands optimize PR builds

#### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This cancels in-progress runs when new commits are pushed, saving CI minutes.

## Release Pipeline

### Purpose

The release pipeline automates version management, changelog generation, and package publishing. It ensures a consistent and reliable release process.

### Trigger

Releases are triggered manually via GitHub Actions UI:

1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Choose version bump type:
   - **patch**: Bug fixes (1.0.0 → 1.0.1)
   - **minor**: New features (1.0.0 → 1.1.0)
   - **major**: Breaking changes (1.0.0 → 2.0.0)
   - **prerelease**: Pre-release version (1.0.0 → 1.0.1-beta.0)
5. For prerelease, optionally specify identifier (default: beta)

### Pipeline Architecture

```
validate (check branch, conditions)
    └── test (run full test suite)
        └── release (version, publish, create release)
            └── validate-release (verify npm, GitHub)
```

### Jobs Breakdown

#### 1. Validate Release Conditions

**Purpose:** Ensure safe release conditions

**Checks:**

- Running on `main` branch only
- No uncommitted changes
- Valid repository state

**Why:** Prevents accidental releases from feature branches or invalid states.

#### 2. Run Full Test Suite

**Purpose:** Verify plugin is in releasable state

**Actions:**

- Run all linting checks
- Run all unit tests with coverage
- Build the plugin
- Run E2E tests

**Why:** Ensures quality before publishing to npm.

#### 3. Release and Publish

**Purpose:** Version, tag, publish, and create release

**Steps:**

1. **Setup Environment**

   - Checkout with full git history (for changelog)
   - Setup pnpm and Node.js
   - Configure npm registry authentication
   - Configure git user for commits

2. **Version Bump**

   - Use Nx release to bump version
   - Follow semantic versioning (semver)
   - Update package.json in dist directory

3. **Changelog Generation**

   - Generate CHANGELOG.md from git commits
   - Include commit messages, authors, and references
   - Use conventional commits format

4. **Git Operations**

   - Commit version changes: `chore(release): publish {version}`
   - Create git tag: `v{version}`
   - Push commits and tags to repository

5. **npm Publishing**

   - Publish from dist directory
   - Set public access
   - Use NPM_TOKEN for authentication

6. **GitHub Release**
   - Create GitHub release from git tag
   - Include changelog in release notes
   - Add installation instructions
   - Mark as prerelease if applicable

#### 4. Validate Release

**Purpose:** Verify successful publication

**Checks:**

- Package available on npm registry
- GitHub release created
- Correct version published

**Wait Period:** 30 seconds for npm registry propagation

### Nx Release Configuration

The release process uses Nx's built-in release capabilities configured in `nx.json`:

```json
{
  "release": {
    "version": {
      "preVersionCommand": "pnpm dlx nx run-many -t build",
      "generatorOptions": {
        "currentVersionResolver": "git-tag",
        "fallbackCurrentVersionResolver": "disk",
        "specifierSource": "prompt"
      }
    },
    "changelog": {
      "workspaceChangelog": {
        "createRelease": "github",
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
    "git": {
      "commit": true,
      "commitMessage": "chore(release): publish {version}",
      "commitArgs": "--no-verify",
      "tag": true,
      "tagMessage": "v{version}",
      "tagArgs": "--force"
    }
  }
}
```

**Key Features:**

- **preVersionCommand**: Builds plugin before versioning
- **currentVersionResolver**: Uses git tags as source of truth
- **changelog**: Generates workspace-level changelog
- **git**: Automatically commits and tags releases

## Required Secrets

### NPM_TOKEN

**Purpose:** Authenticates with npm registry for publishing

**How to Create:**

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to Account Settings → Access Tokens
3. Click "Generate New Token"
4. Select "Automation" type
5. Copy the token

**How to Add to GitHub:**

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click "Add secret"

**Security:**

- Token is only accessible to GitHub Actions
- Never exposed in logs
- Has publish permissions only

### GITHUB_TOKEN

**Purpose:** Authenticates with GitHub API for releases

**Configuration:** Automatically provided by GitHub Actions - no setup needed.

**Permissions:** The workflow requests minimal permissions:

- `contents: write` - Create releases and push tags
- `packages: write` - Publish packages (if needed)
- `pull-requests: write` - Update PRs (if needed)

## Triggering Workflows

### CI Workflow

**Automatic Triggers:**

- Push to `main` branch
- Pull request to `main` branch

**Manual Trigger:**

1. Go to Actions tab
2. Select "CI" workflow
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow" button

### Release Workflow

**Manual Trigger Only:**

1. Navigate to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Configure release:
   - Version bump: patch, minor, major, or prerelease
   - Prerelease ID (if applicable): beta, alpha, rc
5. Click "Run workflow"

**Wait for Completion:**

- Validation: ~5 minutes
- Tests: ~15-20 minutes
- Release: ~5 minutes
- Validation: ~5 minutes
- Total: ~30-40 minutes

### Local Release Testing

To test the release process locally without publishing:

```bash
# Dry run release
npx nx release --dry-run

# Version only (no publish)
npx nx release version --dry-run

# See what would be published
cd dist/nx-astro
npm pack
```

## Branch Protection

### Recommended Settings

Configure branch protection for `main` branch:

**GitHub Settings → Branches → Branch protection rules:**

1. **Require pull request reviews**

   - Required approvals: 1
   - Dismiss stale reviews on new commits: ✓

2. **Require status checks to pass**

   - Require branches to be up to date: ✓
   - Required status checks:
     - `CI Success` (this aggregates all CI jobs)

3. **Require conversation resolution**

   - All conversations must be resolved: ✓

4. **Require linear history** (optional)

   - Prevents merge commits: ✓

5. **Include administrators**

   - Apply rules to admins: ✓

6. **Restrict who can push**

   - Allow only maintainers to push directly

7. **Allow force pushes**

   - Disable force pushes: ✗

8. **Allow deletions**
   - Prevent branch deletion: ✗

### Why Only Require "CI Success"?

Instead of requiring individual jobs (lint, test, build, e2e), we require only the aggregate "CI Success" job. This provides:

- **Simplicity**: One rule to maintain
- **Flexibility**: Add new jobs without updating branch protection
- **Clarity**: Single status check indicates overall health

## Troubleshooting

### Common Issues

#### 1. CI Failing on Dependency Installation

**Symptom:** pnpm install fails with lock file mismatch

**Solution:**

```bash
# Locally update lock file
pnpm install

# Commit the updated lock file
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lock file"
```

#### 2. Coverage Threshold Not Met

**Symptom:** Test job fails with "Coverage X% is below threshold 80%"

**Solutions:**

- Add more tests to improve coverage
- Adjust threshold in `.github/workflows/ci.yml` (not recommended)
- Ensure all code paths are tested

#### 3. Build Verification Failed

**Symptom:** "Error: dist/nx-astro/package.json not found"

**Solutions:**

- Verify build configuration in `nx-astro/project.json`
- Check TypeScript compilation succeeds
- Ensure assets are copied correctly

#### 4. E2E Tests Timing Out

**Symptom:** E2E job exceeds 20-minute timeout

**Solutions:**

- Optimize test setup/teardown
- Reduce test scope or parallelize
- Increase timeout in workflow (not recommended)

#### 5. NPM Publish Failed

**Symptom:** "Unable to authenticate need: npm_token"

**Solutions:**

- Verify `NPM_TOKEN` secret is set correctly
- Check token has publish permissions
- Ensure token hasn't expired
- Regenerate token if needed

#### 6. GitHub Release Creation Failed

**Symptom:** "Resource not accessible by integration"

**Solutions:**

- Verify `GITHUB_TOKEN` has correct permissions
- Check workflow has `contents: write` permission
- Ensure not running on a fork

#### 7. Cache Restoration Failed

**Symptom:** "Cache restore failed" or "fail-on-cache-miss: true"

**Solutions:**

- This is expected if cache doesn't exist yet
- First run will populate cache
- Subsequent runs will use cache
- Can disable `fail-on-cache-miss` for more flexibility

### Debugging Tips

#### View Detailed Logs

1. Go to Actions tab in GitHub
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the failed step
5. Review detailed output

#### Enable Debug Logging

Add secrets to repository for more verbose output:

- `ACTIONS_STEP_DEBUG`: `true` - Detailed step logging
- `ACTIONS_RUNNER_DEBUG`: `true` - Runner diagnostic logging

#### Test Locally

Run the same commands locally:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run lint
npx nx run-many -t lint --all --parallel=3

# Run tests with coverage
npx nx run-many -t test --all --parallel=3 --configuration=ci

# Build plugin
npx nx build nx-astro

# Run E2E tests
npx nx e2e nx-astro-e2e
```

#### Check Workflow Syntax

Use GitHub's workflow syntax checker:

```bash
# Install act (GitHub Actions local runner)
brew install act

# Validate workflow syntax
act -l
```

## Best Practices

### For Contributors

1. **Always run tests locally before pushing**

   ```bash
   npx nx run-many -t lint test build --all
   ```

2. **Use conventional commits**

   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation
   - `chore:` - Maintenance
   - `test:` - Test additions/changes

3. **Keep PRs focused**

   - Single purpose per PR
   - Easier to review and test
   - Faster to merge

4. **Respond to CI failures promptly**

   - Don't let PRs stagnate with failing checks
   - Ask for help if blocked

5. **Update tests with code changes**
   - Maintain test coverage
   - Add tests for new features
   - Update tests for bug fixes

### For Maintainers

1. **Review Dependabot PRs regularly**

   - Keep dependencies up to date
   - Review changelogs for breaking changes
   - Test major version updates thoroughly

2. **Release regularly**

   - Don't let changes accumulate
   - Small, frequent releases are easier to debug
   - Communicate breaking changes clearly

3. **Monitor CI performance**

   - Track build times
   - Optimize slow jobs
   - Update caching strategies as needed

4. **Keep documentation current**

   - Update docs with workflow changes
   - Document new CI features
   - Explain troubleshooting steps

5. **Use release notes effectively**
   - Clear descriptions of changes
   - Migration guides for breaking changes
   - Examples of new features

## Advanced Configuration

### Matrix Builds

To test on multiple Node.js versions, add to CI workflow:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

### Scheduled Runs

Add scheduled CI runs to catch issues early:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday at midnight
```

### Slack Notifications

Add Slack notifications for releases:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Released v${{ steps.release.outputs.new_version }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Code Coverage Upload

Upload coverage to services like Codecov:

```yaml
- name: Upload to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/nx-astro/coverage-final.json
    flags: unittests
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx CI Documentation](https://nx.dev/ci/intro/ci-with-nx)
- [pnpm CI Documentation](https://pnpm.io/continuous-integration)
- [Semantic Versioning](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org)

## Support

If you encounter issues with CI/CD:

1. Check this documentation
2. Review [existing issues](https://github.com/geekvetica/nx-astro/issues)
3. Open a new issue with CI logs
4. Ask in [discussions](https://github.com/geekvetica/nx-astro/discussions)
