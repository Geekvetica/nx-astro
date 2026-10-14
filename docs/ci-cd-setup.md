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

The release workflow (`.github/workflows/release.yml`) publishes a version that a maintainer created locally with Nx Release. Versioning, the changelog, the release commit and the tag all happen locally (see [RELEASING.md](../RELEASING.md)); the workflow verifies, stages and announces.

### Trigger

- **Automatic:** pushing a `v*.*.*` tag (`git push --follow-tags` after `pnpm exec nx release <specifier> --skip-publish`)
- **Manual:** `workflow_dispatch` with an existing `tag` input, to stage that tag again (for example after fixing the npm trusted publisher). It never chooses or bumps a version.

### Pipeline Architecture

```
test (verify release tag, lint, unit tests)
    └── publish (build, stage on npm with provenance)
        └── github-release (create GitHub release from CHANGELOG.md)
```

### Jobs Breakdown

#### 1. Run Tests and Lint

- **Verify release tag:** the tag matches `v<major>.<minor>.<patch>` (optional prerelease suffix), points to a commit with the subject `chore(release): publish <version>`, that commit's `nx-astro/package.json` has the same version, and the commit is on `main`
- Install dependencies, run lint and unit tests (E2E tests run in regular CI, not here)

#### 2. Stage on npm

- Build the plugin and stage `dist/nx-astro` with `npm stage publish --access public --provenance` (prereleases under the `next` dist-tag)
- Authenticate with npm Trusted Publishing (OIDC, no stored token); the trusted publisher allows staging only
- A maintainer approves the staged version on npmjs.com with 2FA, which makes it public

#### 3. Create GitHub Release

- Extract the version's entry from `CHANGELOG.md`
- Create the GitHub release for the tag with that changelog and installation instructions; mark prereleases as pre-release

### Nx Release Configuration

The release process uses Nx's built-in release capabilities configured in `nx.json`:

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

**Key Features:**

- **preVersionCommand**: Builds plugin before versioning
- **currentVersionResolver**: Uses git tags as source of truth
- **changelog**: Generates a workspace-level changelog; `createRelease` is `false` because the release workflow creates the GitHub release
- **conventionalCommits**: Shows `chore` commits (including Dependabot's dependency updates) in the changelog
- **git**: Commits and tags releases locally; `push` is `false`, so the maintainer pushes with `git push --follow-tags`

## Required Secrets

No npm token is required. The release workflow stages releases with npm Trusted Publishing (OIDC), so the only credential is the `GITHUB_TOKEN` that GitHub Actions provides automatically. See [npm Trusted Publishing](maintenance/release-process.md#npm-trusted-publishing) for the one-time setup on npmjs.com.

### GITHUB_TOKEN

**Purpose:** Authenticates with GitHub API for releases

**Configuration:** Automatically provided by GitHub Actions - no setup needed.

**Permissions:** The release workflow is read-only by default (`contents: read`) and widens permissions per job:

- `publish` (Stage on npm): `id-token: write`, for the npm Trusted Publishing OIDC token and provenance
- `github-release` (Create GitHub Release): `contents: write`, to create the GitHub release

It never pushes commits or tags.

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

**Automatic:** pushing a release tag. Create it locally and push it with the release commit:

```bash
pnpm exec nx release patch --skip-publish
git push --follow-tags
```

**Manual (re-stage an existing tag):**

```bash
gh workflow run release.yml -f tag=vX.Y.Z
```

The manual run takes only a `tag`; it never bumps a version.

### Local Release Testing

To test the release process locally without publishing:

```bash
# Dry run: shows the version bump and CHANGELOG entry, changes nothing
pnpm exec nx release patch --skip-publish --dry-run

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

**Symptom:** npm publish fails with `E404` or `ENEEDAUTH`

**Solutions:**

- Verify the trusted publisher on npmjs.com matches `Geekvetica/nx-astro` and `release.yml`
- Check the "Install npm" step prints npm 11.15.0 or newer
- Ensure the workflow still has `id-token: write` permission

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
