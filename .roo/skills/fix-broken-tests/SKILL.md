# Fixing Broken Tests

Fix broken or failing tests.

## Goal

Restore correct test behavior without hiding bugs in the implementation and without adjusting tests solely to make them pass.

A test should still verify a real requirement or system behavior.

## Rules

1. First, determine **why the test is failing**.

   Distinguish at least:
   - a bug in production code,
   - a bug or outdated assumption in the test,
   - a change in requirements,
   - a configuration or environment problem,
   - a flaky test / dependent on order, timing, or external resources.

2. **Do not adjust the test to match a buggy implementation.**

   Do not change the expected result just because the current code returns a different value.

3. Verify that the test actually checks the functionality it claims to.

   Check:
   - test name,
   - setup,
   - action performed by the test,
   - assertions,
   - edge cases,
   - dependencies and mocks.

4. Before changing behavior, check the project documentation for the relevant functionality.

   In particular, look for:
   - functional specifications,
   - README,
   - ADRs,
   - module documentation,
   - comments describing the contract,
   - backlog or design decisions.

   Documentation describing the required behavior takes precedence over the accidental behavior of the current implementation.

5. If documentation, implementation, and test contradict each other and the expected behavior cannot be determined unambiguously — **ask the user before changing the functional contract**.

6. Prefer the smallest change that removes the root cause.

   Do not perform a large refactor on the side if it is not needed to fix the test.

7. After fixing:
   - run the fixed test,
   - run related tests,
   - if reasonable, run the entire relevant test suite,
   - make sure the change did not hide an existing bug.

## Changing a test is allowed

A test can be changed when there is evidence that the test itself is wrong or outdated, e.g.:
- the test checks behavior contradicting the current specification,
- the requirement was deliberately changed,
- the test has a wrong setup or assertion,
- the test depends on an irrelevant implementation detail,
- the mock does not reflect the real contract,
- the test is flaky or non-deterministic.

Do not change a test solely because it will pass after the change.

## Git

While working, follow the rules in:

`./skills/working-with-GIT-repositories`

Do not perform Git operations that conflict with project policy.

## Backlog

If during diagnosis you discover:
- a separate bug,
- a missing test,
- missing documentation,
- technical debt,
- a problem unrelated to the current fix,

do not automatically expand the scope of the task.

Follow:

`./skills/updating-backlog`

## Result

At the end, briefly state:
- what the root cause was,
- whether production code, test, configuration, or a combination was changed,
- why the change is consistent with the required behavior,
- which tests were run and what their result was.