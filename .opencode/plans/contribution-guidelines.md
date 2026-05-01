# Contribution Guidelines Package

## Overview

Add comprehensive contribution guidelines to encourage community participation in the nx-astro project.

## Files to Create

### 1. `CODE_OF_CONDUCT.md`

- Contributor Covenant v2.1
- Contact: github@geekveti.ca
- Full enforcement guidelines

### 2. `SECURITY.md`

- Vulnerability reporting process via email
- 48h acknowledgment, 7d assessment, 30d resolution targets
- Responsible disclosure guidelines

### 3. `SUPPORT.md`

- Where to get help (Discussions > issues)
- Issues vs Discussions guidance
- Response expectations
- Links to docs and troubleshooting

### 4. `.github/ISSUE_TEMPLATE/idea-discussion.md`

- Lightweight template for early-stage ideas
- Less formal than feature requests
- Includes "would you help build this?" checkbox

### 5. `.github/ISSUE_TEMPLATE/config.yml`

- Adds "Have a question? Start a Discussion" link in issue chooser
- Links to docs and troubleshooting

## Files to Modify

### 6. `CONTRIBUTING.md`

- Add label guide section with full taxonomy
- Add first-time contributor guide (step-by-step)
- Update CoC section to reference standalone CODE_OF_CONDUCT.md

### 7. `README.md`

- Add All Contributors section with bot setup instructions

## Manual Steps for User (after files are created)

### GitHub Labels to Create

- Triage: `needs-triage`, `blocked`
- Type: `bug`, `enhancement`, `documentation`, `chore`
- Contribution: `good first issue`, `help wanted`
- Status: `wontfix`, `duplicate`, `invalid`
- Scope: `generators`, `executors`, `plugin`, `e2e`
- Dependencies: `dependencies`

### GitHub Discussions Setup

- Enable Discussions in repo Settings → Features
- Create categories: Q&A, Ideas, Show & Tell, General

### All Contributors Bot

- Run `npx all-contributors-cli init`
- Add contributors via `@all-contributors please add @username for code,doc,etc`
