# Release Workflow Setup Guide

This guide described an earlier version of the release workflow (a manual run with a version bump input and an `NPM_TOKEN` secret). It has been replaced:

- **How to release:** [RELEASING.md](../../RELEASING.md)
- **Workflow details, one-time npm setup (Trusted Publishing, stage-only) and troubleshooting:** [docs/maintenance/release-process.md](../../docs/maintenance/release-process.md)

The workflow in `release.yml` needs no npm token. It authenticates to npm with Trusted Publishing (OIDC), stages each version with provenance, and a maintainer approves the staged version with 2FA on npmjs.com before it is public.
