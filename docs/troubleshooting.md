# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the nx-astro plugin.

## Table of Contents

- [Common Errors](#common-errors)
- [Build Issues](#build-issues)
- [Development Server Issues](#development-server-issues)
- [Type Checking Issues](#type-checking-issues)
- [Import and Path Issues](#import-and-path-issues)
- [Performance Issues](#performance-issues)
- [Caching Issues](#caching-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Getting Help](#getting-help)

---

## Common Errors

### Error: "astro not found" or "Command not found: astro"

**Problem**: The Astro CLI is not installed or not in the correct location.

**Solution**:

```bash
# Check if astro is installed
npm list astro

# Install astro at workspace root
npm install astro

# Verify installation
npx astro --version

# Clear cache and retry
nx reset
nx build my-app
```

**Prevention**: Always run `nx g @geekvetica/nx-astro:init` to ensure dependencies are installed.

---

### Error: "Cannot find module 'astro:content'"

**Problem**: Content collection types haven't been generated.

**Solution**:

```bash
# Generate content collection types
nx sync my-app

# Verify .astro directory was created
ls -la apps/my-app/.astro/

# Check types were generated
cat apps/my-app/.astro/types.d.ts

# Restart TypeScript server in IDE
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

**Prevention**: Run `nx sync` after creating or modifying content collections.

---

### Error: "Project 'my-app' not found"

**Problem**: Nx hasn't detected your Astro project.

**Solution**:

```bash
# Check if project exists
nx show projects

# Verify astro.config.mjs exists
ls apps/my-app/astro.config.mjs

# Check plugin is registered
cat nx.json | grep @geekvetica/nx-astro

# Clear cache and regenerate project graph
nx reset
nx show projects
```

**Manual Fix**: Create `apps/my-app/project.json`:

```json
{
  "name": "my-app",
  "sourceRoot": "apps/my-app/src",
  "projectType": "application"
}
```

---

### Error: "Cannot resolve module" or "Module not found"

**Problem**: TypeScript can't resolve imports due to missing path configuration.

**Solution**:

```bash
# Check path aliases in tsconfig.base.json
cat tsconfig.base.json

# Verify baseUrl and paths are set
# {
#   "compilerOptions": {
#     "baseUrl": ".",
#     "paths": {
#       "@my-org/shared/*": ["libs/shared/src/*"]
#     }
#   }
# }

# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf apps/my-app/.astro

# Reinstall
npm install

# Restart TypeScript
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Build Issues

### Build Fails with "ENOENT: no such file or directory"

**Problem**: Output directory doesn't exist or incorrect path.

**Solution**:

```bash
# Check outputPath configuration
nx show project my-app

# Create output directory
mkdir -p dist/apps/my-app

# Update astro.config.mjs with correct path
# export default defineConfig({
#   outDir: '../../dist/apps/my-app'
# });

# Clean and rebuild
rm -rf dist/apps/my-app
nx build my-app
```

---

### Build Succeeds But Output is Empty

**Problem**: Build completed but no files in output directory.

**Solution**:

```bash
# Check if clean option is removing files
# In project.json, set clean: false temporarily
{
  "targets": {
    "build": {
      "options": {
        "clean": false
      }
    }
  }
}

# Verify output path is correct
nx build my-app --verbose

# Check astro.config.mjs output settings
cat apps/my-app/astro.config.mjs
```

---

### Build is Extremely Slow

**Problem**: Build takes much longer than expected.

**Solution**:

```bash
# Enable verbose output to see bottlenecks
nx build my-app --verbose

# Check for large dependencies
npm ls --depth=0

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for file watching issues
# Exclude node_modules, dist, .nx from file watchers

# Use Nx cache
nx build my-app  # Should be faster on subsequent builds
```

---

### Build Fails with Memory Error

**Problem**: "JavaScript heap out of memory" error.

**Solution**:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or add to package.json scripts
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' nx build"
  }
}

# Reduce parallel builds
nx build my-app --parallel=1

# Check for memory leaks in code
# Look for large assets or circular dependencies
```

---

## Development Server Issues

### Dev Server Won't Start

**Problem**: `nx dev my-app` fails or hangs.

**Solution**:

```bash
# Check if port is already in use
lsof -i :4321
# or on Windows:
netstat -ano | findstr :4321

# Kill process using port
kill -9 <PID>

# Use different port
nx dev my-app --port=3000

# Check for syntax errors in astro.config.mjs
node -c apps/my-app/astro.config.mjs

# Run with verbose output
nx dev my-app --verbose
```

---

### Hot Module Replacement Not Working

**Problem**: Changes don't trigger page reload.

**Solution**:

```bash
# Check file is being watched
# Ensure file is inside src/ directory

# Clear cache
nx reset

# Restart dev server
# Kill existing: Ctrl+C
nx dev my-app

# Check file watcher limits (Linux)
cat /proc/sys/fs/inotify/max_user_watches
# Increase if needed:
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Dev Server Shows White Screen

**Problem**: Dev server runs but page is blank.

**Solution**:

```bash
# Check browser console for errors
# Open DevTools (F12) → Console tab

# Check for missing imports
# Look for "404 Not Found" errors

# Verify base path configuration
# In astro.config.mjs:
# base: '/' (or correct subdirectory)

# Check for JavaScript errors in components
# Look for syntax errors or undefined variables

# Try accessing dev server from different URL
# http://localhost:4321
# http://127.0.0.1:4321
```

---

## Type Checking Issues

### TypeScript Errors in .astro Files

**Problem**: False positive TypeScript errors in Astro files.

**Solution**:

```bash
# Ensure astro types are included
# In tsconfig.json:
{
  "compilerOptions": {
    "types": ["astro/client"]
  }
}

# Generate Astro type definitions
nx sync my-app

# Update @astrojs/check
npm install --save-dev @astrojs/check@latest

# Run check with verbose output
nx check my-app --verbose
```

---

### "Cannot find name" Errors

**Problem**: TypeScript can't find types for imports.

**Solution**:

```bash
# Install missing type definitions
npm install --save-dev @types/node

# Check tsconfig includes correct files
{
  "include": ["src/**/*", ".astro/**/*"]
}

# Verify path aliases are working
# Test with absolute import

# Restart TypeScript server
```

---

### Check Executor Reports No Errors But IDE Shows Errors

**Problem**: Mismatch between Nx check and IDE.

**Solution**:

```bash
# Ensure IDE uses project TypeScript
# VS Code: Check TypeScript version in status bar

# Use workspace TypeScript version
# VS Code: Cmd+Shift+P → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

# Verify tsconfig is correct
cat apps/my-app/tsconfig.json

# Restart TypeScript server
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Import and Path Issues

### Absolute Imports Not Working

**Problem**: `import from '@/components/Button'` fails.

**Solution**:

```bash
# Verify tsconfig.json has paths configured
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# Check Astro respects TypeScript paths
# (Should work automatically)

# Try relative import to verify file exists
import Button from '../components/Button.astro';

# Clear cache
nx reset
rm -rf node_modules/.cache
```

---

### Shared Library Imports Fail

**Problem**: Can't import from shared libraries.

**Solution**:

```bash
# Check path is in tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@my-org/shared-ui": ["libs/shared-ui/src/index.ts"]
    }
  }
}

# Verify library has exports
cat libs/shared-ui/src/index.ts

# Check library project.json exists
ls libs/shared-ui/project.json

# Build library first if needed
nx build shared-ui
nx dev my-app
```

---

### ".astro" Extension Issues

**Problem**: Imports work without extension but fail with `.astro`.

**Solution**:

```typescript
// Always include .astro extension for Astro components
import Button from './Button.astro'; // ✓ Correct
import Button from './Button'; // ✗ Incorrect

// For TypeScript files, omit extension
import { formatDate } from './utils'; // ✓ Correct
```

---

## Performance Issues

### Nx Commands are Slow

**Problem**: All Nx commands take a long time to start.

**Solution**:

```bash
# Restart Nx daemon
nx daemon --stop
nx daemon --start

# Check daemon status
nx daemon --status

# Clear cache
nx reset

# Check for large number of projects
nx show projects | wc -l

# Optimize project graph
# Exclude unnecessary files in .nxignore
echo "**/*.md" >> .nxignore
echo "**/docs/**" >> .nxignore
```

---

### Cache Not Working

**Problem**: Builds always run, never use cache.

**Solution**:

```bash
# Check cache is enabled
cat nx.json | grep cacheableOperations

# Verify outputs are configured
nx show project my-app

# Check inputs haven't changed
# Inputs: source files, dependencies, config files

# Manually trigger cache
nx build my-app
# Make no changes
nx build my-app  # Should be instant

# Check cache directory
ls .nx/cache
```

---

### Large Bundle Size

**Problem**: Build output is unexpectedly large.

**Solution**:

```bash
# Analyze bundle
# In astro.config.mjs:
import { defineConfig } from 'astro/config';
export default defineConfig({
  build: {
    inlineStylesheets: 'auto'
  }
});

# Check for large dependencies
npm ls --depth=0 | grep MB

# Use dynamic imports
// Before:
import HeavyComponent from './HeavyComponent.astro';

// After:
const HeavyComponent = (await import('./HeavyComponent.astro')).default;

# Enable compression
# Configure in adapter or hosting platform
```

---

## Caching Issues

### Stale Cache After Changes

**Problem**: Changes not reflected despite rebuilding.

**Solution**:

```bash
# Clear all caches
nx reset
rm -rf node_modules/.cache
rm -rf apps/my-app/.astro
rm -rf dist

# Reinstall and rebuild
npm install
nx build my-app

# Force rebuild without cache
nx build my-app --skip-nx-cache
```

---

### Cache Invalidation Too Aggressive

**Problem**: Cache invalidates on every run.

**Solution**:

```bash
# Check inputs configuration
nx show project my-app

# Verify files aren't changing unexpectedly
git status

# Check for timestamp-based inputs
# Ensure only content changes trigger invalidation

# Review namedInputs in nx.json
{
  "namedInputs": {
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts"
    ]
  }
}
```

---

## Platform-Specific Issues

### Windows Path Issues

**Problem**: Paths with backslashes cause errors.

**Solution**:

```javascript
// Always use forward slashes in configs
import { join } from 'path';

// ✓ Correct
outDir: './dist';
outDir: '../../dist/apps/my-app';

// ✗ Incorrect
outDir: '.\\dist';

// Use path.join for dynamic paths
const outDir = join(process.cwd(), 'dist', 'apps', 'my-app');
```

---

### Linux File Permission Issues

**Problem**: EACCES errors when running commands.

**Solution**:

```bash
# Fix permissions
chmod +x node_modules/.bin/astro
chmod +x node_modules/.bin/nx

# Don't run as root
# Create without sudo, run without sudo

# Check file ownership
ls -la node_modules/.bin/

# Fix ownership if needed
sudo chown -R $USER:$USER node_modules
```

---

### Mac M1/M2 Compatibility

**Problem**: Build failures on Apple Silicon.

**Solution**:

```bash
# Ensure arm64 native modules
rm -rf node_modules package-lock.json
npm install

# Check Node.js architecture
node -p "process.arch"  # Should output: arm64

# Use Rosetta if needed (not recommended)
arch -x86_64 npm install

# Update to latest versions
npm update
```

---

## Debugging Techniques

### Enable Verbose Output

```bash
# Verbose build
nx build my-app --verbose

# Verbose dev
nx dev my-app --verbose

# Verbose check
nx check my-app --verbose
```

### Check Configuration

```bash
# View project configuration
nx show project my-app

# View project graph
nx graph

# View affected projects
nx affected:graph
```

### Inspect Build Output

```bash
# Build and inspect
nx build my-app
ls -lah dist/apps/my-app/

# Check file sizes
du -sh dist/apps/my-app/*

# Inspect generated files
cat dist/apps/my-app/index.html
```

### Debug Node Process

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/nx build my-app

# Attach debugger in Chrome
# chrome://inspect

# Or use VS Code debugger
# Create .vscode/launch.json
```

---

## Environment-Specific Issues

### Environment Variables Not Loading

**Problem**: `import.meta.env` variables are undefined.

**Solution**:

```bash
# Check .env file exists
ls -la .env

# Ensure PUBLIC_ prefix for client-side variables
# .env:
PUBLIC_API_URL=https://api.example.com

# Check variable in code
console.log(import.meta.env.PUBLIC_API_URL);

# Restart dev server after changing .env
```

---

### Different Behavior in Dev vs Build

**Problem**: Works in dev but fails in production build.

**Solution**:

```bash
# Test production build locally
nx build my-app
nx preview my-app

# Check for client-side code running on server
// Use client directives
<Component client:load />

# Check for environment-specific code
if (import.meta.env.DEV) {
  // Development only
}

# Verify paths are production-ready
// Avoid localhost URLs in production
```

---

## Getting Help

### Before Asking for Help

1. **Check this guide**: Search for your error message
2. **Check documentation**: Review relevant docs sections
3. **Clear caches**: Run `nx reset` and try again
4. **Update dependencies**: Ensure latest versions
5. **Create minimal reproduction**: Isolate the issue

### Where to Get Help

#### GitHub Issues

- Search existing issues: [nx-astro issues](https://github.com/geekvetica/nx-astro/issues)
- Create new issue with:
  - Error message
  - Steps to reproduce
  - Environment info (OS, Node version, package versions)
  - Minimal reproduction repo

#### Nx Community

- [Nx Discord](https://discord.gg/nx)
- [Nx Community Slack](https://nx.dev/community)

#### Astro Community

- [Astro Discord](https://astro.build/chat)
- [Astro GitHub Discussions](https://github.com/withastro/astro/discussions)

### Providing Information

When reporting issues, include:

```bash
# System information
node --version
npm --version
nx --version

# Package versions
npm list astro @geekvetica/nx-astro

# Error output
nx build my-app --verbose 2>&1 | tee error.log

# Configuration
cat nx.json
cat apps/my-app/astro.config.mjs
cat apps/my-app/tsconfig.json
```

---

## Preventive Measures

### Regular Maintenance

```bash
# Update dependencies regularly
npm update

# Clear caches periodically
nx reset

# Verify builds work
nx run-many --target=build --all
```

### Good Practices

1. **Commit frequently**: Makes it easier to identify breaking changes
2. **Test locally**: Build and preview before deploying
3. **Document custom setup**: Note any special configurations
4. **Use version control**: Track all configuration changes
5. **Keep dependencies updated**: Apply security patches
6. **Monitor bundle size**: Watch for unexpected growth
7. **Run type checking**: Catch errors early with `nx check`

---

## Still Having Issues?

If you're still experiencing problems:

1. **Create a minimal reproduction**: Strip down to simplest failing case
2. **Check recent changes**: Review git history for breaking changes
3. **Test in clean environment**: Try fresh install in new directory
4. **Report the issue**: File a detailed bug report with reproduction
5. **Community help**: Ask in Discord or Slack with context

Remember: The community is here to help! Most issues have been encountered and solved before.

---

## Additional Resources

- [Configuration Guide](./configuration.md) - Advanced configuration options
- [FAQ](./faq.md) - Frequently asked questions
- [Examples](./examples.md) - Working examples
- [API Reference](./api-reference.md) - Complete schemas
