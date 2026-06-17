Start the commit workflow immediately.

User intent: $ARGUMENTS

## Branch Step (run first if applicable)
- If user intent starts with `new-branch`, or the current branch is `main`/`master`/`development`, or the user states they are on the wrong branch:
  1. Infer the correct branch name from the intent and the changed files using the Branch Naming Rules below.
  2. Run `git switch -c "<branch-name>"` before any staging or committing.
  3. Confirm the new branch is active before proceeding.
- If the current branch is already a feature/fix/chore branch that matches the intent, skip branch creation.

## Branch Naming Rules
- Format: `<type>/<short-kebab-description>`
- Allowed types (match the commit type): `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `build`, `ci`, `test`
- Description: lowercase, kebab-case, max 5 words, no special characters
- Examples: `feat/add-expense-filter`, `fix/auth-token-refresh`, `chore/update-dependencies`
- Always base new branches off `development` unless the user specifies otherwise.
- Never branch directly off an existing feature branch unless explicitly requested.

## Commit Execution Rules
1. Run `git status --short --branch` and `git diff` / `git diff --staged`.
2. Group related changes; avoid mixing unrelated concerns in one commit.
3. Propose up to 3 Conventional Commit messages.
4. The commit head (first line) must not exceed 100 characters.
5. Run `npm run web:lint && npm run web:build` unless the user explicitly requests skipping validation.
6. If there is exactly one clear commit path, stage and commit using the best message.
7. If there is ambiguity (multiple unrelated changes), ask one concise clarification question before committing.
8. After committing, push: `git push -u origin "<branch-name>"` for a new branch, `git push` for an existing branch.

## Commit Message Rules
- Format: `<type>(<scope>): <subject>`
- Subject: imperative, concise, specific, max 100 chars total on first line
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `perf`, `build`, `ci`, `test`
- Scope examples: `web`, `api`, `auth`, `docs`
- Add body when context matters (why, impact, migration notes)
- Only use `!` or `BREAKING CHANGE:` footer for truly breaking changes
- If there are changes not reflected in the branch name or intent, briefly explain them in the commit body

## Safety Rules
- Never run destructive commands unless explicitly requested.
- Do not commit secrets, credentials, or environment values.
- If there are unexpected local changes, pause and ask how to proceed.

## Output
- Branch used (new or existing)
- Final commit message
- Files included
- Validation results
- Commit hash
- Push command and result
