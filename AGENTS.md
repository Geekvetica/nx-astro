# AGENTS.md

## Repo identity

- Nx monorepo for the published plugin `@geekvetica/nx-astro` (package lives in `nx-astro/`).
- Main code is generators/executors under `nx-astro/src/{generators,executors}`; e2e harness is separate in `nx-astro-e2e/`.

## Commands (use these exact forms)

- Use `pnpm` (not `npm`/`npx`) for local work.
- Prefer `pnpm exec` for workspace binaries (`pnpx` may be unavailable depending on pnpm install method/version).
- Install deps: `pnpm install --frozen-lockfile` (matches CI).
- Unit tests only: `pnpm exec nx test nx-astro`.
- Single project lint: `pnpm exec nx lint nx-astro` (or `pnpm exec nx lint nx-astro-e2e`).
- Build plugin: `pnpm exec nx build nx-astro`.
- E2E: `pnpm exec nx e2e nx-astro-e2e`.

## Verification order

- Follow CI/release order for confidence: `lint -> test -> build`.
- If touching many files, run formatting first: `pnpm format` (or `pnpm format:check` in validation-only runs).

## E2E gotchas (easy to miss)

- E2E tests rely on a built plugin tarball in `dist/nx-astro` produced from global setup scripts (`tools/scripts/start-local-registry.ts`).
- `nx-astro-e2e` uses Jest `globalSetup`/`globalTeardown` to prepare and clean temporary artifacts; do not bypass by running test files directly.
- E2E is configured `runInBand` with a 5-minute timeout; expect slower execution.

## Build/package behavior

- `nx-astro` build uses `@nx/js:tsc` and copies required publish assets (`README`, `LICENSE`, `generators.json`, `executors.json`, non-TS files) into `dist/nx-astro`.
- Published manifest is `nx-astro/package.json`; root `package.json` is workspace-only.

## Workspace conventions to preserve

- Keep plugin target names aligned with `nx.json` plugin options (`dev`, `build`, `preview`, `check`, `test`, `sync`) unless intentionally changing inference behavior.
- ESLint ignores include `**/.astro` and `**/fixtures`; avoid placing source-of-truth code there.
- Pre-commit hook runs `pnpm exec lint-staged` and then `pnpm test`; expect full test run on commit.

## Source priority when instructions conflict

- Trust executable config first: `project.json` files, `nx.json`, Jest/ESLint configs, workflow YAML.
- Treat `CLAUDE.md` as context only; parts may be stale relative to current source.
