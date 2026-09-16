# Working with Git repositories

Use this skill whenever working inside a Git repository.

The goal is to preserve the current repository state, avoid accidental history changes, and keep commits small and reviewable.

## Before starting work

Always inspect the repository state first.

Run:

```bash
git status --short
git branch --show-current
```

### Uncommitted changes

If the working tree contains uncommitted changes before starting the task:

- do not modify files,
- do not stage files,
- do not stash changes,
- do not reset anything,
- do not discard changes,
- do not attempt to determine whether the changes are safe to overwrite.

Stop and inform the user about the existing changes.

Ask the user what should happen with the existing changes.

Do not continue until the user decides what should happen with the existing changes.

## Current branch

Continue working on the currently checked-out branch.

Do not assume that `master` or `main` contains the newest or canonical version of the code.

Do not automatically:

- switch to `master` or `main`,
- pull `master` or `main`,
- merge `master` or `main`,
- rebase onto `master` or `main`,
- synchronize the current branch with another branch.

Only perform branch synchronization when explicitly requested by the user.

## Scope of changes

Keep changes limited to the current task.

Do not:

- refactor unrelated code,
- fix unrelated warnings,
- reformat unrelated files,
- update unrelated dependencies,
- modify generated files unless required by the task.

If an unrelated problem is discovered, follow:

`./skills/updating-backlog`

Do not silently expand the scope of the task.

## Commits

Prefer small, logical commits.

A commit should represent one coherent change.

When the task contains clearly separate changes, keep them in separate commits where practical.

Examples:

- bug fix,
- test fix,
- refactor required by the fix,
- documentation update.

Do not combine unrelated changes into a single commit.

## Before staging

Inspect all changes:

```bash
git status --short
git diff
```

Determine which files belong to the current task.

Prefer staging explicit files:

```bash
git add path/to/file
```

Avoid broad staging commands such as:

```bash
git add .
git add -A
```

unless there is a clear reason and all affected files have been reviewed.

## Staging review

After staging files, always inspect the staged changes:

```bash
git status --short
git diff --cached
```

Present the staged files and changes to the user for review.

Do not commit yet.

The user must be able to review the exact staged diff before a commit is created.

## Commit approval

Do not create a commit without explicit user approval after the staged diff has been reviewed.

Approval must happen after `git add` and after showing the staged changes.

If the user requests changes:

1. modify the files,
2. update the staging area,
3. run `git diff --cached` again,
4. show the updated diff,
5. wait for approval again.

## Before commit

Immediately before committing, verify:

```bash
git status --short
git diff --cached
```

Ensure that:

- only intended files are staged,
- no secrets are included,
- no temporary or debug files are included,
- no unrelated changes are included.

## Sensitive files

Never knowingly commit:

- `.env` files containing secrets,
- API keys,
- access tokens,
- passwords,
- private keys,
- credentials,
- local debug artifacts,
- temporary files,
- machine-specific configuration that does not belong in the repository.

If such content appears in the diff, stop and inform the user.

## Push

Do not push automatically.

Never run:

```bash
git push
```

unless the user explicitly asks for it.

Never use force push unless the user explicitly requests that exact operation and understands that it rewrites remote history.

## Destructive operations

Do not perform destructive Git operations automatically.

This includes, but is not limited to:

```bash
git reset --hard
git clean
git clean -fd
git checkout .
git restore .
git branch -D
git push --force
git push --force-with-lease
```

Do not rewrite history unless explicitly requested.

This includes:

- interactive rebase,
- commit amendment,
- resetting published commits,
- force pushing.

## Stash

Do not use `git stash` automatically.

Stashing changes can hide repository state and make later reasoning ambiguous.

Only use it when explicitly requested by the user.

## Conflict resolution

Do not resolve Git conflicts by guessing.

When a merge, rebase, cherry-pick, or similar operation produces conflicts:

- inspect the conflicting changes,
- preserve both sides until intent is understood,
- ask the user when the correct resolution is ambiguous.

Do not resolve conflicts by automatically choosing `ours` or `theirs`.

## Finishing the task

At the end of Git-related work, report:

- current branch,
- changed files,
- staged files,
- whether a commit was created,
- commit hash if created,
- whether anything was pushed.

If changes are staged but not committed, state that explicitly.
