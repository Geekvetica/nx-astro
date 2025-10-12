# CI/CD Setup for Projects Using nx-astro

This guide helps you set up continuous integration and deployment for Nx workspaces that use the nx-astro plugin. Learn how to automate testing, building, and deploying your Astro applications.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Example Workflow](#example-workflow)
- [Nx Affected Commands](#nx-affected-commands)
- [Caching Strategy](#caching-strategy)
- [Deployment](#deployment)
- [Platform-Specific Guides](#platform-specific-guides)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

When using nx-astro in your Nx workspace, you can leverage Nx's powerful CI capabilities to:

- **Run only affected tasks** - Test and build only what changed
- **Cache task results** - Reuse previous build outputs
- **Parallelize execution** - Run tasks concurrently for speed
- **Integrate with Astro** - Run Astro-specific checks and builds

## Quick Start

### 1. Basic CI Setup

For a quick GitHub Actions setup, see our [example workflow](./ci-examples/astro-project-ci.yml).

### 2. Key Concepts

When setting up CI for Nx + Astro projects:

1. **Use Nx affected commands** to only process changed projects
2. **Cache Nx operations** to speed up subsequent runs
3. **Run Astro checks** (`astro check`) for type safety
4. **Build static sites** or server outputs based on adapter
5. **Deploy** to your hosting platform

### 3. Essential Commands

```bash
# Sync Astro dependencies
nx run-many -t sync --all

# Type check with Astro
nx run-many -t check --all

# Run tests
nx run-many -t test --all

# Build applications
nx run-many -t build --all

# Preview built sites
nx run-many -t preview --all
```

## Example Workflow

See the complete example in [`docs/ci-examples/astro-project-ci.yml`](./ci-examples/astro-project-ci.yml).

### Minimal GitHub Actions Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run affected sync
        run: pnpm nx affected -t sync --base=origin/main

      - name: Run affected checks
        run: pnpm nx affected -t check --base=origin/main

      - name: Run affected tests
        run: pnpm nx affected -t test --base=origin/main

      - name: Build affected apps
        run: pnpm nx affected -t build --base=origin/main
```

### What This Does

1. **Checkout** - Gets your code with full git history
2. **Setup** - Installs pnpm, Node.js, and dependencies
3. **Sync** - Generates Astro TypeScript definitions
4. **Check** - Runs Astro type checking
5. **Test** - Runs unit tests for affected projects
6. **Build** - Builds affected Astro applications

## Nx Affected Commands

### Understanding Affected

Nx's affected commands determine which projects changed based on git history and dependency graph.

**Benefits:**

- Faster CI builds (only process what changed)
- Lower costs (less compute time)
- Faster feedback (shorter build times)

### Using Affected in CI

#### Pull Requests

Compare against the base branch:

```bash
# Check what's affected
nx affected:graph --base=origin/main --head=HEAD

# Run tasks only for affected projects
nx affected -t sync check test build --base=origin/main --head=HEAD
```

#### Main Branch

Compare against the last successful CI run:

```bash
# Using Nx Cloud (recommended)
nx affected -t build

# Using git commits
nx affected -t build --base=HEAD~1 --head=HEAD
```

### Affected Examples

#### Only Lint Affected Projects

```yaml
- name: Lint affected
  run: pnpm nx affected -t lint --base=origin/main --parallel=3
```

#### Only Test Affected Projects

```yaml
- name: Test affected
  run: pnpm nx affected -t test --base=origin/main --parallel=3
```

#### Only Build Affected Apps

```yaml
- name: Build affected
  run: pnpm nx affected -t build --base=origin/main --parallel=3
```

### Running All Projects

Sometimes you want to run tasks on all projects regardless of changes:

```bash
# Run task on all projects
nx run-many -t sync --all

# With parallelization
nx run-many -t test --all --parallel=3

# Specific projects
nx run-many -t build --projects=app1,app2
```

## Caching Strategy

### Nx Task Caching

Nx caches task outputs locally and (optionally) remotely via Nx Cloud.

#### Local Caching

Enabled by default in `nx.json`:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint", "sync", "check"]
      }
    }
  }
}
```

#### Remote Caching with Nx Cloud

For shared caching across team and CI:

```bash
# Connect to Nx Cloud
nx connect-to-nx-cloud

# Your token is stored in nx.json
```

**In CI workflow:**

```yaml
env:
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

steps:
  - name: Build with remote cache
    run: pnpm nx affected -t build --base=origin/main
    # Automatically uses remote cache if configured
```

### Dependency Caching

Cache dependencies to speed up installation:

#### pnpm

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm' # Automatic caching

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

#### npm

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

- name: Install dependencies
  run: npm ci
```

#### yarn

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'yarn'

- name: Install dependencies
  run: yarn install --frozen-lockfile
```

### Build Output Caching

Cache Nx build outputs between jobs:

```yaml
- name: Cache Nx outputs
  uses: actions/cache@v4
  with:
    path: |
      .nx/cache
      dist
    key: ${{ runner.os }}-nx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-nx-
```

## Deployment

### General Deployment Pattern

```yaml
deploy:
  name: Deploy
  needs: build # Wait for build to complete
  if: github.ref == 'refs/heads/main' # Only deploy from main
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v4

    # ... setup and build steps ...

    - name: Deploy to hosting platform
      run: |
        # Platform-specific deployment command
```

### Platform-Specific Deployments

#### Vercel

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./dist/apps/my-astro-app
```

#### Netlify

```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2
  with:
    publish-dir: './dist/apps/my-astro-app'
    production-branch: main
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deploy-message: 'Deploy from GitHub Actions'
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Cloudflare Pages

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    projectName: my-astro-app
    directory: ./dist/apps/my-astro-app
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

#### AWS S3 + CloudFront

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Deploy to S3
  run: |
    aws s3 sync ./dist/apps/my-astro-app s3://${{ secrets.S3_BUCKET }} --delete

- name: Invalidate CloudFront
  run: |
    aws cloudfront create-invalidation \
      --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
      --paths "/*"
```

#### GitHub Pages

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist/apps/my-astro-app
    cname: www.example.com # Optional custom domain
```

### Deploying Multiple Apps

For monorepos with multiple Astro apps:

```yaml
deploy:
  name: Deploy Apps
  needs: build
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  strategy:
    matrix:
      app:
        - name: app1
          platform: vercel
        - name: app2
          platform: netlify

  steps:
    - uses: actions/checkout@v4

    # ... setup and build steps ...

    - name: Deploy ${{ matrix.app.name }}
      run: |
        # Deployment logic per app
```

## Platform-Specific Guides

### GitHub Actions

See the [complete example workflow](./ci-examples/astro-project-ci.yml).

**Advantages:**

- Native GitHub integration
- Free for public repos
- Easy secrets management
- Good caching support

### GitLab CI

```yaml
# .gitlab-ci.yml
image: node:20

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .nx/cache/

stages:
  - install
  - test
  - build
  - deploy

install:
  stage: install
  script:
    - npm ci

test:
  stage: test
  script:
    - npx nx affected -t test --base=origin/main

build:
  stage: build
  script:
    - npx nx affected -t build --base=origin/main
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  only:
    - main
  script:
    - npm run deploy
```

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.1

jobs:
  build-and-test:
    executor: node/default
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: pnpm
      - run:
          name: Run affected tests
          command: pnpm nx affected -t test --base=origin/main
      - run:
          name: Build affected
          command: pnpm nx affected -t build --base=origin/main

workflows:
  build-test-deploy:
    jobs:
      - build-and-test
```

### Azure Pipelines

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - script: npm install -g pnpm
    displayName: 'Install pnpm'

  - script: pnpm install --frozen-lockfile
    displayName: 'Install dependencies'

  - script: pnpm nx affected -t test --base=origin/main
    displayName: 'Test affected'

  - script: pnpm nx affected -t build --base=origin/main
    displayName: 'Build affected'
```

## Best Practices

### 1. Use Affected Commands in PRs

Always use affected commands in pull requests for efficiency:

```yaml
# Good - Only tests what changed
- run: pnpm nx affected -t test --base=origin/main

# Avoid - Tests everything every time
- run: pnpm nx run-many -t test --all
```

### 2. Run Full Builds on Main Branch

On the main branch, consider running all tests to catch integration issues:

```yaml
- name: Test strategy
  run: |
    if [ "${{ github.event_name }}" == "pull_request" ]; then
      pnpm nx affected -t test --base=origin/main
    else
      pnpm nx run-many -t test --all
    fi
```

### 3. Parallelize Tasks

Use the `--parallel` flag for faster execution:

```yaml
- run: pnpm nx affected -t test --parallel=3 --base=origin/main
```

Find the optimal number based on your CI runners:

- Small runners: `--parallel=2`
- Medium runners: `--parallel=3`
- Large runners: `--parallel=4` or more

### 4. Set Proper Timeouts

Prevent hanging builds:

```yaml
jobs:
  build:
    timeout-minutes: 30 # Fail after 30 minutes
```

### 5. Cache Aggressively

Cache everything that's expensive to compute:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.pnpm-store
      node_modules
      .nx/cache
      dist
    key: ${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 6. Separate Build and Deploy

Keep build and deploy as separate jobs:

```yaml
jobs:
  build:
    # Build logic

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    # Deploy logic
```

### 7. Use Environment Variables

Configure builds via environment variables:

```yaml
env:
  NODE_ENV: production
  ASTRO_TELEMETRY_DISABLED: 1
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
```

### 8. Run Astro-Specific Checks

Always run `astro check` for type safety:

```yaml
- name: Astro type check
  run: pnpm nx run-many -t check --all
```

### 9. Verify Build Outputs

Check that builds produce expected outputs:

```yaml
- name: Verify build outputs
  run: |
    if [ ! -d "dist/apps/my-app" ]; then
      echo "Build output not found"
      exit 1
    fi
```

### 10. Use Matrix Builds for Multiple Environments

Test across different Node versions:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

## Troubleshooting

### Issue: Affected Commands Not Working

**Symptom:** All projects always marked as affected

**Solutions:**

1. Ensure full git history: `fetch-depth: 0`
2. Set correct base branch: `--base=origin/main`
3. Check Nx dependency graph: `nx graph`

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0 # Important!
```

### Issue: Astro Check Failing

**Symptom:** `astro check` reports type errors in CI but not locally

**Solutions:**

1. Run sync before check:

   ```yaml
   - run: pnpm nx affected -t sync --base=origin/main
   - run: pnpm nx affected -t check --base=origin/main
   ```

2. Ensure TypeScript versions match
3. Check `.astro` directory is generated

### Issue: Build Outputs Missing

**Symptom:** Deploy step can't find built files

**Solutions:**

1. Verify build completed successfully
2. Check build output path in `project.json`
3. Cache and restore build artifacts:
   ```yaml
   - uses: actions/cache@v4
     with:
       path: dist
       key: build-${{ github.sha }}
   ```

### Issue: Out of Memory

**Symptom:** Node heap out of memory error

**Solutions:**

1. Increase Node memory:

   ```yaml
   env:
     NODE_OPTIONS: '--max-old-space-size=4096'
   ```

2. Build fewer projects in parallel:

   ```yaml
   - run: pnpm nx affected -t build --parallel=1
   ```

3. Use larger CI runners

### Issue: Cache Not Restoring

**Symptom:** Cache always misses, slow builds

**Solutions:**

1. Check cache key includes lock file hash
2. Verify cache path exists
3. Use restore-keys for partial matches:
   ```yaml
   restore-keys: |
     ${{ runner.os }}-pnpm-store-
   ```

### Issue: Deployment Fails

**Symptom:** Deploy step fails with authentication error

**Solutions:**

1. Verify secrets are set correctly
2. Check secret names match workflow
3. Ensure deployment token has correct permissions
4. Test deployment locally with same credentials

## Advanced Topics

### Distributed Task Execution

Use Nx Cloud for distributed builds:

```yaml
- name: Start Nx Cloud agent
  run: pnpm nx-cloud start-agent

- name: Run tasks
  run: pnpm nx affected -t test build --parallel=3
```

### Custom Nx Target for CI

Create a CI-specific target:

```json
{
  "targets": {
    "ci": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["nx run {projectName}:sync", "nx run {projectName}:lint", "nx run {projectName}:check", "nx run {projectName}:test", "nx run {projectName}:build"],
        "parallel": false
      }
    }
  }
}
```

Then in CI:

```yaml
- run: pnpm nx affected -t ci --base=origin/main
```

### Preview Deployments

Deploy PR previews automatically:

```yaml
preview:
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  steps:
    # ... build steps ...

    - name: Deploy preview
      run: |
        # Deploy with unique URL per PR
        vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

## Additional Resources

- [Nx CI Documentation](https://nx.dev/ci/intro/ci-with-nx)
- [Nx Affected Commands](https://nx.dev/ci/features/affected)
- [Nx Cloud](https://nx.app)
- [Astro Deployment Guides](https://docs.astro.build/en/guides/deploy/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Example Projects

See complete working examples:

- [Example GitHub Actions Workflow](./ci-examples/astro-project-ci.yml)
- [Nx + Astro Example Repo](https://github.com/geekvetica/nx-astro-example)

## Need Help?

- Open an issue: [GitHub Issues](https://github.com/geekvetica/nx-astro/issues)
- Join discussions: [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions)
- Check documentation: [Main README](../README.md)
