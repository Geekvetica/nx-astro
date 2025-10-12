import { CreateNodesContext } from '@nx/devkit';
import { createNodesV2 } from './plugin';
import { vol } from 'memfs';

// Mock fs to use memfs
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

describe('@geekvetica/nx-astro plugin', () => {
  let context: CreateNodesContext;

  beforeEach(() => {
    context = {
      nxJsonConfiguration: {
        namedInputs: {
          default: ['{projectRoot}/**/*'],
          production: ['!{projectRoot}/**/*.spec.ts'],
        },
      },
      workspaceRoot: '/workspace',
      configFiles: [],
    };

    // Reset memfs
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe('createNodesV2', () => {
    it('should have correct glob pattern', () => {
      const [pattern] = createNodesV2;
      expect(pattern).toBe('**/astro.config.{mjs,js,ts}');
    });

    it('should create nodes for a basic Astro project', async () => {
      const configFile = 'apps/my-app/astro.config.mjs';

      vol.fromJSON(
        {
          'apps/my-app/astro.config.mjs': `
            export default {
              output: 'static'
            };
          `,
        },
        '/workspace'
      );

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction([configFile], {}, context);

      expect(results).toHaveLength(1);
      const [, nodes] = results[0];
      expect(nodes.projects).toBeDefined();
      expect(nodes.projects?.['apps/my-app']).toBeDefined();
    });

    it('should infer all default tasks', async () => {
      const configFile = 'apps/my-app/astro.config.mjs';

      vol.fromJSON(
        {
          'apps/my-app/astro.config.mjs': `
            export default {
              output: 'static'
            };
          `,
        },
        '/workspace'
      );

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction([configFile], {}, context);

      const [, nodes] = results[0];
      const project = nodes.projects?.['apps/my-app'];

      expect(project?.targets).toBeDefined();
      expect(project?.targets?.dev).toBeDefined();
      expect(project?.targets?.build).toBeDefined();
      expect(project?.targets?.preview).toBeDefined();
      expect(project?.targets?.check).toBeDefined();
      expect(project?.targets?.sync).toBeDefined();
    });

    it('should use custom target names from options', async () => {
      const configFile = 'apps/my-app/astro.config.mjs';

      vol.fromJSON(
        {
          'apps/my-app/astro.config.mjs': `
            export default {
              output: 'static'
            };
          `,
        },
        '/workspace'
      );

      const options = {
        devTargetName: 'serve',
        buildTargetName: 'compile',
      };

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction([configFile], options, context);

      const [, nodes] = results[0];
      const project = nodes.projects?.['apps/my-app'];

      expect(project?.targets?.serve).toBeDefined();
      expect(project?.targets?.compile).toBeDefined();
    });

    it('should set correct project root', async () => {
      const configFile = 'apps/frontend/my-app/astro.config.mjs';

      vol.fromJSON(
        {
          'apps/frontend/my-app/astro.config.mjs': `
            export default {};
          `,
        },
        '/workspace'
      );

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction([configFile], {}, context);

      const [, nodes] = results[0];
      const project = nodes.projects?.['apps/frontend/my-app'];

      expect(project?.root).toBe('apps/frontend/my-app');
    });

    it('should handle multiple config files', async () => {
      const configFiles = [
        'apps/app1/astro.config.mjs',
        'apps/app2/astro.config.mjs',
      ];

      vol.fromJSON(
        {
          'apps/app1/astro.config.mjs': 'export default {};',
          'apps/app2/astro.config.mjs': 'export default {};',
        },
        '/workspace'
      );

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction(configFiles, {}, context);

      expect(results).toHaveLength(2);
      const [, nodes1] = results[0];
      const [, nodes2] = results[1];

      expect(nodes1.projects?.['apps/app1']).toBeDefined();
      expect(nodes2.projects?.['apps/app2']).toBeDefined();
    });

    it('should handle malformed config gracefully', async () => {
      const configFile = 'apps/my-app/astro.config.mjs';

      vol.fromJSON(
        {
          'apps/my-app/astro.config.mjs': 'this is not valid javascript',
        },
        '/workspace'
      );

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction([configFile], {}, context);

      // Should still create project even with malformed config
      expect(results).toHaveLength(1);
      const [, nodes] = results[0];
      expect(nodes.projects?.['apps/my-app']).toBeDefined();
    });

    it('should extract source root from config', async () => {
      const configFile = 'apps/my-app/astro.config.mjs';

      vol.fromJSON(
        {
          'apps/my-app/astro.config.mjs': `
            export default {
              srcDir: './source'
            };
          `,
        },
        '/workspace'
      );

      const [, createNodesFunction] = createNodesV2;
      const results = await createNodesFunction([configFile], {}, context);

      const [, nodes] = results[0];
      const project = nodes.projects?.['apps/my-app'];

      expect(project?.sourceRoot).toBe('apps/my-app/source');
    });
  });
});
