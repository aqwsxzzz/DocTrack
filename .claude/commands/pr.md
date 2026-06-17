Create a pull request.

User intent: $ARGUMENTS

## Mode Selection
- If user intent contains `--main` or `--master`, run in **release mode**:
  - Head branch: `development`
  - Base branch: `main`
  - Remove `--main`/`--master` from the final PR title/body text
- Otherwise run in **development mode**:
  - Head branch: current checked-out branch
  - Base branch: `development`

## Target Rules
- Development mode: never open a PR from `main`, `master`, or `development` to `development`; if currently on one of these, ask for one concise clarification before proceeding.
- Release mode: always create PR from `development` to `main` unless user explicitly overrides.

## PR Execution Rules
1. Run `git status --short --branch` and confirm there are no merge conflicts.
2. Resolve head/base branches from Mode Selection.
3. If release mode:
   - Capture current branch name so it can be restored after sync.
   - Run `git switch development && git pull --ff-only origin development`.
   - Run `git switch main && git pull --ff-only origin main`.
   - Return to previous branch unless it is `development` or `main`.
4. Verify head branch is pushed to origin; if not, push with upstream first.
5. Compare head against base and summarize changes (commits/files) for PR context.
6. If release mode, generate PR title/body only from the real `main...development` diff after pulls.
7. Propose up to 3 PR titles if intent is ambiguous; otherwise use the best clear title.
8. Build a concise PR body with:
   - Summary
   - What changed
   - Validation performed (list only validation type + status: Passed/Failed — no logs or stack traces)
   - Risks/notes
   - Out-of-scope changes explained if any
9. Create the PR:
   - Default: ready PR
   - If user intent includes `draft`: create as draft

## Safety Rules
- If there are uncommitted changes that would affect PR accuracy, ask one concise clarification question.
- Development mode: if `development` does not exist on remote, ask one concise clarification before proceeding.
- Release mode: if `main` or `development` does not exist on remote, ask before proceeding.
- Release mode: if `git pull --ff-only` fails on either branch, stop and ask before creating the PR.

## Output
- Base and head branches
- Final title
- PR URL
- Whether draft or ready
- Any follow-up actions
