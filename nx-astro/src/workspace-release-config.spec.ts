import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the repository's own release setup (RELEASING.md): `nx release`
 * runs locally and only commits and tags, while release.yml verifies the
 * tag, stages on npm and creates the GitHub release.
 */
const workspaceRoot = join(__dirname, '..', '..');
const readWorkspaceFile = (path: string) =>
  readFileSync(join(workspaceRoot, path), 'utf-8');

interface NxReleaseConfig {
  changelog: {
    workspaceChangelog: { createRelease: unknown };
  };
  conventionalCommits?: {
    types?: Record<
      string,
      { semverBump?: string; changelog?: { hidden?: boolean } | boolean }
    >;
  };
  git: {
    commit?: boolean;
    tag?: boolean;
    push?: boolean;
    commitMessage: string;
  };
  releaseTag: { pattern: string };
  version: { preVersionCommand: string };
}

const release = (
  JSON.parse(readWorkspaceFile('nx.json')) as { release: NxReleaseConfig }
).release;

describe('workspace release configuration', () => {
  it('[187-R2] never pushes from a local nx release', () => {
    expect(release.git.push).toBe(false);
  });

  it('[187-R2] leaves creating the GitHub release to release.yml', () => {
    expect(release.changelog.workspaceChangelog.createRelease).toBe(false);
  });

  it('[187-R4] shows chore commits in the changelog without bumping the version', () => {
    const chore = release.conventionalCommits?.types?.chore;

    expect(chore?.semverBump).toBe('none');
    // `changelog: false` or `hidden: true` would hide chore commits again
    expect(chore?.changelog).toEqual(
      expect.objectContaining({ title: expect.any(String) }),
    );
    expect(chore?.changelog).not.toEqual(
      expect.objectContaining({ hidden: true }),
    );
  });

  it('[187-R5] writes the release commit subject that release.yml verifies', () => {
    const releaseWorkflow = readWorkspaceFile('.github/workflows/release.yml');
    const version = '1.2.3';

    expect(releaseWorkflow).toContain(
      '"$SUBJECT" != "chore(release): publish $VERSION"',
    );
    expect(release.git.commitMessage.replace('{version}', version)).toBe(
      `chore(release): publish ${version}`,
    );
  });

  it('[190-S02] commits and tags from a local nx release', () => {
    expect(release.git.commit).toBe(true);
    expect(release.git.tag).toBe(true);
  });

  it('[190-S03] creates release tags that release.yml accepts', () => {
    const releaseWorkflow = readWorkspaceFile('.github/workflows/release.yml');
    const [, tagFormat] =
      /if \[\[ ! "\$TAG" =~ (\S+) \]\]/.exec(releaseWorkflow) ?? [];
    // Without this, new RegExp(undefined) would accept every tag
    expect(tagFormat).toMatch(/^\^v/);
    const acceptedTag = new RegExp(tagFormat);

    for (const version of ['1.2.3', '1.2.3-beta.0']) {
      expect(release.releaseTag.pattern.replace('{version}', version)).toMatch(
        acceptedTag,
      );
    }
  });

  it('[187-R1] builds with the workspace nx before versioning', () => {
    expect(release.version.preVersionCommand).toBe(
      'pnpm exec nx run-many -t build',
    );
  });

  it('[187-R1] keeps the root release script from publishing locally', () => {
    const { scripts } = JSON.parse(readWorkspaceFile('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(scripts['release']).toBe('nx release --skip-publish');
  });

  it('[187-R4] gives Dependabot commits a single conventional scope', () => {
    const dependabot = readWorkspaceFile('.github/dependabot.yml');
    const prefixes = [
      ...dependabot.matchAll(/^\s+prefix(?:-development)?: '([^']*)'/gm),
    ].map(([, prefix]) => prefix);

    // include: 'scope' appends "(deps)" or "(deps-dev)" to each prefix
    expect(prefixes).toEqual(['chore', 'chore', 'ci']);
    expect(dependabot).toMatch(/include: 'scope'/);
  });
});
