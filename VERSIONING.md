# Versioning

This repository now uses Semantic Versioning.

Current documented version: `0.1.1`

## Status

`0.1.1` is the current authoritative documented release baseline of the project.

The project can be shipped from the repository files alone by pushing `main`.

A git tag or GitHub Release is recommended for release bookkeeping, but it is not required for the app to build or deploy.

There were meaningful changes before `0.1.0`, but the repository did not have a formal versioning policy, release tags, or published release notes at that time. Because of that, any version numbers assigned before `0.1.0` are reconstructed for documentation purposes and should be treated as inferred milestones, not guaranteed published artifacts.

## Scheme

Version format:

`MAJOR.MINOR.PATCH`

Interpretation:

- `PATCH`: bug fixes, dependency updates, test improvements, documentation updates, and internal cleanup that do not intentionally change the supported user-facing behavior.
- `MINOR`: new user-facing functionality, meaningful UX changes, behavior changes within the supported scope, or operational changes that materially affect how the app is shipped or used.
- `MAJOR`: breaking changes to documented behavior, support expectations, or release contract.

## Pre-1.0 policy

The project is currently on the `0.x` line.

While on `0.x`:

- breaking or risky behavior changes should bump `MINOR`
- safe bug fixes should bump `PATCH`
- `MAJOR` remains reserved for `1.0.0`

The project should move to `1.0.0` when all of the following are true:

- the password-protection scope is considered stable
- supported input constraints are documented and not expected to change frequently
- deployment and release flow are stable
- manual QA expectations are documented and repeatable

## Release source of truth

The version number in [`pdf-skydd/package.json`](pdf-skydd/package.json) is the application version.

The release history is documented in [`CHANGELOG.md`](CHANGELOG.md).

## Release process

### Minimum ship flow

If the goal is simply to ship the app:

1. Update [`CHANGELOG.md`](CHANGELOG.md) if needed.
2. Bump the version in [`pdf-skydd/package.json`](pdf-skydd/package.json) if needed.
3. Push `main`.

That is enough to ship the current app because deployment happens through GitHub Actions.

### Recommended formal release flow

For each new release:

1. Update [`CHANGELOG.md`](CHANGELOG.md).
2. Bump the version in [`pdf-skydd/package.json`](pdf-skydd/package.json).
3. Commit the changelog and version bump together.
4. Create a git tag in the format `vX.Y.Z`.
5. Publish release notes from the matching changelog entry.

## Reconstructed historical versions

These versions are documented retroactively from local repository history:

- `0.0.1` on `2026-01-20`: initial prototype, based on commit `a746b917`
- `0.0.2` on `2026-01-20`: PWA milestone, based on commit `a83f6f58`
- `0.0.3` on `2026-01-21`: encryption and icon upgrade milestone, based on commit `b27577dd`
- `0.0.4` on `2026-02-03`: refactor milestone, based on commit `c073ff69`
- `0.1.0` on `2026-03-06`: first formally documented release baseline, based on commits `8976eeb5`, `c5f001ac`, and the follow-up versioning docs
- `0.1.1` on `2026-03-06`: Acrobat Reader compatibility patch for generated locked PDFs

## Historical note

The repository contains local branch history and reflog entries for older milestones, but there are no historical version tags available in this environment. That is why the pre-`0.1.0` versions are documented as reconstructed rather than canonical.
