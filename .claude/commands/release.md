Run the post-merge release workflow from main.

User intent: $ARGUMENTS
(Optional: bump and options — e.g. `patch`, `minor`, `major`, `draft patch`, `v1.8.0 --no-bump`)

## Goal
Run the post-merge release flow after final changes are already merged to `main`:
1. Sync local `main`
2. Determine release version
3. Bump version (unless explicitly `--no-bump`)
4. Commit version bump (if needed)
5. Create annotated git tag
6. Push commit + tag
7. Publish GitHub Release

## Release Mode Rules
- Always release from `main`. If not on `main`, switch before any release action.
- Always run `git pull --ff-only origin main` before version/tag operations.
- If fast-forward pull fails, stop and ask one concise clarification question.

## Version Resolution Rules
- Accept explicit intent: `patch`, `minor`, `major`, `vX.Y.Z`, `X.Y.Z`, optional flags: `draft`, `--no-bump`
- Default bump policy (highest-impact wins):
  - Any breaking change → `major`
  - Any minor-level feature → `minor`
  - Otherwise → `patch`
- Preflight comparison (mandatory):
  - Read package version: `node -p "require('./package.json').version"`
  - Read latest GH release tag: `gh release list --limit 1 --json tagName --jq '.[0].tagName'`
  - Fallback (no GH release): `git ls-remote --tags --refs origin | sed 's/.*refs\/tags\///' | sort -V | tail -n 1`
  - Normalize both to semver and compare.
  - If package version is behind latest GitHub version → stop and ask.
  - If package version is ahead → continue but note the mismatch.
- If no bump/version given, infer and propose up to 3 options, then ask for one choice.

## Safety Rules
1. `git status --short --branch` first.
2. If there are uncommitted changes → ask before proceeding.
3. Verify `main` exists on remote.
4. Verify GitHub auth: `gh auth status`.
5. Verify the final release tag does not already exist locally or remotely.
6. Verify release commit is on `main` (tag target SHA = main HEAD SHA).
7. CI status for `main` must be green if CI is configured and accessible.
8. Never force-push during release.
9. Never delete or move existing tags unless explicitly requested.

## Release Execution Steps
1. Check clean state and current branch.
2. `git switch main && git pull --ff-only origin main`
3. Resolve and compare versions (see Version Resolution Rules).
4. If not `--no-bump`: `npm version <patch|minor|major> --no-git-tag-version`, then commit: `chore(release): vX.Y.Z`
5. Create annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
6. Push: `git push origin main` (if version commit exists), then `git push origin vX.Y.Z`
7. Build curated release notes — do NOT publish raw commit lists:
   - `## vX.Y.Z Highlights`
   - `## What's New`
   - `## Improvements`
   - `## Fixes`
   - `## Known Issues` (use `None` if none)
   - `## How To Use` (only for new flows/features)
   - `## Compatibility Notes` (breaking changes, or `none`)
   - `## Operational Notes` (rollout/rollback notes when relevant)
   - `## Full Changelog` with compare URL
   - Group by feature/domain (auth, clients, library, vault), not by commit.
8. Create GitHub Release: write notes to temp file, then `gh release create vX.Y.Z --notes-file <path>` (add `--draft` if requested).
9. Create/update developer changelog at `docs/changelog/developer/vX.Y.Z.md`:
   - `# vX.Y.Z Developer Changelog`
   - `## Scope`
   - `## Architecture / Design Changes`
   - `## API and Data Contract Changes`
   - `## Implementation Notes`
   - `## Code Examples` (small focused snippets only)
   - `## Migrations / Operational Steps`
   - `## Risks and Mitigations`
   - `## Validation and Test Evidence`
   - `## Follow-ups`
10. Post-release verification:
    - Tag exists remotely and points to intended commit.
    - Release URL is accessible and published state matches intent.
    - Local `main` and `origin/main` contain the release commit.

## Output
- Released version
- Branch used
- Package version before/after
- Latest GH version before release
- Version comparison result
- Version commit hash (or `none` if `--no-bump`)
- Tag name and target commit
- Release URL
- Release notes summary (1 short paragraph)
- Developer changelog path and short summary
- Post-release verification results
- Push commands and result
