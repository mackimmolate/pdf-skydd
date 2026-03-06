# Changelog

All notable changes to this project are documented in this file.

This changelog follows the spirit of Keep a Changelog, with one important caveat:

- entries before `0.1.0` are reconstructed from local repository history
- those reconstructed entries are best-effort historical milestones, not guaranteed published releases

## [0.1.1] - 2026-03-06

Patch release for Acrobat Reader compatibility.

### Fixed

- saved encrypted PDFs using classic xref tables instead of object streams to avoid Acrobat repair prompts on generated locked files

### Notes

- locked PDFs created with older app builds should be regenerated with `0.1.1`

## [0.1.0] - 2026-03-06

First documented ship-ready release baseline.

This version is fully represented in repository files and can be shipped by pushing `main`.

Creating a matching git tag or GitHub Release is recommended, but optional.

### Added

- automated tests for PDF protection logic and UI behavior
- documented release and versioning policy
- stronger CI validation through lint, test, and build workflows

### Changed

- renamed the app directory and package identity from `pdf-protector` to `pdf-skydd`
- switched GitHub Pages deployment to the official GitHub Actions Pages flow
- rewrote project documentation to match actual behavior, constraints, and deployment model

### Fixed

- awaited PDF encryption correctly before saving output
- blocked unsupported passwords before generating output
- improved error classification for invalid PDFs and already encrypted input files
- prevented stale async results from producing mismatched downloads after reset or file changes

## [0.0.4] - 2026-02-03

Reconstructed milestone from commit `c073ff69`.

### Changed

- refactored the application codebase

## [0.0.3] - 2026-01-21

Reconstructed milestone from commit `b27577dd`.

### Changed

- upgraded encryption-related implementation details
- updated app icon assets

## [0.0.2] - 2026-01-20

Reconstructed milestone from commit `a83f6f58`.

### Added

- progressive web app support

## [0.0.1] - 2026-01-20

Reconstructed milestone from commit `a746b917`.

### Added

- initial client-side PDF password-protection app
- basic repository structure and development workflow
