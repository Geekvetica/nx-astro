import { execSync, ChildProcess } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync } from 'fs';
import {
  runNxCommand,
  runPnpmCommand,
  fileExists,
  readFile,
  readJsonFile,
  waitForPort,
  startProcess,
  killProcess,
  logStep,
  writeFile,
} from './helpers/test-utils';

describe('nx-astro e2e', () => {
  let projectDirectory: string;
  const testAppName = 'test-app';
  const testAppDir = `apps/${testAppName}`;

  beforeAll(() => {
    projectDirectory = createTestProject();

    // The plugin has been built and packaged as a tarball in the jest globalSetup
    // Install the plugin directly from the tarball
    logStep('Installing @geekvetica/nx-astro plugin from tarball...');

    // Construct tarball path based on package name and version
    const tarballPath = join(
      process.cwd(),
      'dist',
      'nx-astro',
      'geekvetica-nx-astro-0.0.0-e2e.tgz'
    );

    execSync(`pnpm add -Dw "${tarballPath}"`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  afterAll(() => {
    if (projectDirectory) {
      // Cleanup the test project
      logStep('Cleaning up test project...');
      rmSync(projectDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  describe('plugin installation', () => {
    it('should be installed', () => {
      logStep('Verifying plugin installation...');
      // npm ls will fail if the package is not installed properly
      execSync('pnpm ls --depth 100 @geekvetica/nx-astro', {
        cwd: projectDirectory,
        stdio: 'inherit',
      });
    });
  });

  describe('init generator', () => {
    it('should register plugin in nx.json', () => {
      logStep('Running init generator...');
      runNxCommand('g @geekvetica/nx-astro:init', projectDirectory);

      logStep('Verifying nx.json configuration...');
      const nxJson = readJsonFile<{
        plugins?: Array<string | { plugin: string; options?: unknown }>;
      }>('nx.json', projectDirectory);

      expect(nxJson.plugins).toBeDefined();
      expect(nxJson.plugins).toContainEqual(
        expect.objectContaining({
          plugin: '@geekvetica/nx-astro',
        })
      );

      // Reset Nx cache to allow the plugin to be detected
      logStep('Resetting Nx cache...');
      runNxCommand('reset', projectDirectory);
    });

    it('should add Astro dependencies to package.json', () => {
      logStep('Verifying Astro dependencies...');
      const packageJson = readJsonFile<{
        devDependencies?: Record<string, string>;
      }>('package.json', projectDirectory);

      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies?.['astro']).toBeDefined();
    });
  });

  describe('application generator', () => {
    it('should create new Astro application', () => {
      logStep('Generating Astro application...');
      runNxCommand(
        `g @geekvetica/nx-astro:app ${testAppName} --directory=${testAppDir} --unitTestRunner=vitest --no-interactive`,
        projectDirectory
      );

      logStep('Verifying application was created...');
      expect(
        fileExists(`${testAppDir}/astro.config.mjs`, projectDirectory)
      ).toBe(true);
    });

    it('should generate all required files', () => {
      logStep('Checking required files...');
      const requiredFiles = [
        `${testAppDir}/astro.config.mjs`,
        `${testAppDir}/tsconfig.json`,
        `${testAppDir}/package.json`,
        `${testAppDir}/src/pages/index.astro`,
        `${testAppDir}/src/env.d.ts`,
        `${testAppDir}/public/favicon.svg`,
      ];

      requiredFiles.forEach((file) => {
        expect(fileExists(file, projectDirectory)).toBe(true);
      });
    });

    it('should have valid Astro config', () => {
      logStep('Verifying Astro config...');
      const astroConfig = readFile(
        `${testAppDir}/astro.config.mjs`,
        projectDirectory
      );

      expect(astroConfig).toContain('defineConfig');
      expect(astroConfig).toContain('export default');
    });

    it('should have valid package.json', () => {
      logStep('Verifying package.json...');
      const packageJson = readJsonFile<{
        name: string;
        type?: string;
      }>(`${testAppDir}/package.json`, projectDirectory);

      expect(packageJson.name).toBe(testAppName);
      expect(packageJson.type).toBe('module');
    });

    it('should have valid TypeScript config', () => {
      logStep('Verifying tsconfig.json...');
      const tsConfig = readJsonFile<{
        extends?: string;
        compilerOptions?: Record<string, unknown>;
      }>(`${testAppDir}/tsconfig.json`, projectDirectory);

      expect(tsConfig.extends).toBeDefined();
      expect(tsConfig.compilerOptions).toBeDefined();
    });
  });

  describe('component generator', () => {
    const componentName = 'Button';

    it('should generate Astro component', () => {
      logStep(`Generating ${componentName} component...`);
      runNxCommand(
        `g @geekvetica/nx-astro:component ${componentName} --project=${testAppName} --no-interactive`,
        projectDirectory
      );

      logStep('Verifying component was created...');
      expect(
        fileExists(
          `${testAppDir}/src/components/${componentName}.astro`,
          projectDirectory
        )
      ).toBe(true);
    });

    it('should have valid component content', () => {
      logStep('Verifying component content...');
      const componentContent = readFile(
        `${testAppDir}/src/components/${componentName}.astro`,
        projectDirectory
      );

      expect(componentContent).toContain('---');
      expect(componentContent).toBeTruthy();
    });
  });

  describe('task inference', () => {
    it('should detect Astro project configuration', () => {
      logStep('Checking project graph...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig).toBeDefined();
      expect(projectConfig.name).toBe(testAppName);
    });

    it('should infer build target', () => {
      logStep('Verifying build target...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets).toBeDefined();
      expect(projectConfig.targets.build).toBeDefined();
      expect(projectConfig.targets.build.executor).toBe('@geekvetica/nx-astro:build');
    });

    it('should infer dev target', () => {
      logStep('Verifying dev target...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.dev).toBeDefined();
      expect(projectConfig.targets.dev.executor).toBe('@geekvetica/nx-astro:dev');
    });

    it('should infer check target', () => {
      logStep('Verifying check target...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.check).toBeDefined();
      expect(projectConfig.targets.check.executor).toBe('@geekvetica/nx-astro:check');
    });

    it('should infer sync target', () => {
      logStep('Verifying sync target...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.sync).toBeDefined();
      expect(projectConfig.targets.sync.executor).toBe('@geekvetica/nx-astro:sync');
    });

    it('should infer preview target', () => {
      logStep('Verifying preview target...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.preview).toBeDefined();
      expect(projectConfig.targets.preview.executor).toBe('@geekvetica/nx-astro:preview');
    });

    it('should infer test target', () => {
      logStep('Verifying test target...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.test).toBeDefined();
      expect(projectConfig.targets.test.executor).toBe('@geekvetica/nx-astro:test');
    });
  });

  describe('sync executor', () => {
    it('should run astro sync command', () => {
      logStep('Running sync executor...');
      // Note: sync may not create .astro if no content collections exist
      // Just verify the command executes without error
      expect(() => {
        runNxCommand(`run ${testAppName}:sync`, projectDirectory);
      }).not.toThrow();
    });
  });

  describe('check executor', () => {
    beforeAll(() => {
      // Install @astrojs/check as a prerequisite
      logStep('Installing @astrojs/check for type checking...');
      try {
        runPnpmCommand('add -D @astrojs/check typescript', projectDirectory, {
          silent: true,
        });
      } catch (error) {
        // If installation fails, we'll skip the check test
        console.warn('Failed to install @astrojs/check, check test may fail');
      }
    });

    it('should run type checking without errors', () => {
      logStep('Running check executor...');
      // This should not throw if type checking passes
      expect(() => {
        runNxCommand(`check ${testAppName}`, projectDirectory);
      }).not.toThrow();
    });
  });

  describe('build executor', () => {
    it('should build Astro project', () => {
      logStep('Running build executor...');
      runNxCommand(`build ${testAppName}`, projectDirectory);

      logStep('Verifying build output...');
      expect(fileExists(`dist/${testAppDir}`, projectDirectory)).toBe(true);
    });

    it('should generate dist output directory', () => {
      logStep('Checking dist output...');
      expect(
        fileExists(`dist/${testAppDir}/index.html`, projectDirectory)
      ).toBe(true);
    });

    it('should cache build results', () => {
      logStep('Running build again to test caching...');
      const output = runNxCommand(`build ${testAppName}`, projectDirectory, {
        silent: true,
      });

      // Second build should use cache
      expect(output).toContain('cache');
    });
  });

  describe('test executor', () => {
    beforeAll(() => {
      // Create a simple test file
      logStep('Creating test file...');
      const testContent = `
import { describe, it, expect } from 'vitest';

describe('Sample test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
`;
      writeFile(
        `${testAppDir}/src/components/Button.spec.ts`,
        testContent,
        projectDirectory
      );
    });

    it('should run Vitest tests', () => {
      logStep('Running test executor...');
      // This should not throw if tests pass
      expect(() => {
        runNxCommand(`test ${testAppName}`, projectDirectory);
      }).not.toThrow();
    });
  });

  describe('dev server', () => {
    it('should have dev target configured', () => {
      logStep('Verifying dev server configuration...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.dev).toBeDefined();
      expect(projectConfig.targets.dev.executor).toBe('@geekvetica/nx-astro:dev');

      logStep('Dev server configuration verified');
    });
  });

  describe('preview server', () => {
    it('should have preview target configured', () => {
      logStep('Verifying preview server configuration...');
      const showOutput = runNxCommand(
        `show project ${testAppName} --json`,
        projectDirectory,
        { silent: true }
      );

      const projectConfig = JSON.parse(showOutput);
      expect(projectConfig.targets.preview).toBeDefined();
      expect(projectConfig.targets.preview.executor).toBe('@geekvetica/nx-astro:preview');

      logStep('Preview server configuration verified');
    });
  });
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `pnpm dlx create-nx-workspace@latest ${projectName} --preset apps --nxCloud=skip --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}
