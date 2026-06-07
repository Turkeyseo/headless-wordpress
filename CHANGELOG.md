# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/).

Maintained by [Whspe](https://www.whspe.com) — free & open source.

## [1.2.0] - 2026-06-08

### Security
- Manager sessions now use HMAC-signed, expiring tokens instead of a presence-only cookie check.
- Every mutating admin server action and the update endpoint enforce authentication on the server.
- Passwords are hashed with salted **scrypt**; existing SHA-256 hashes upgrade automatically on the next login.
- Re-running the installer is blocked once an admin account exists.
- The Next.js image optimizer is scoped to your WordPress host instead of accepting any domain.
- New optional environment variables: `SESSION_SECRET`, `REVALIDATION_SECRET`, `SERVER_ACTION_ORIGINS`, `NEXT_PUBLIC_IMAGE_HOSTS`.

### Fixed
- Corrected the auto-updater repository URL — update checks previously pointed at a non-existent repo and failed.
- The login form now reports invalid credentials instead of always navigating to the dashboard.
- The page-transition progress bar now animates on every navigation (previously only on first load).
- Removed a potential race condition when switching tabs in the Pages manager.

### Changed
- Resolved all ESLint errors and warnings and replaced loose `any` types with concrete types across the codebase.

[1.2.0]: https://github.com/Turkeyseo/headlesswordpress/releases/tag/v1.2.0
