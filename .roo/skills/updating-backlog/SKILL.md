# Updating Backlog

Use this skill whenever creating, updating, completing, or archiving backlog items.

The project backlog is maintained in:

`BACKLOG.md`

Completed backlog items may periodically be summarized and moved into:

`CHANGELOG.md`

The backlog describes planned or unresolved work.
The changelog describes completed changes.

## General rules

- Keep backlog items focused on one coherent problem or improvement.
- Do not silently expand an existing item into unrelated work.
- Preserve existing item identifiers such as `P13`.
- Do not renumber existing items.
- Prefer updating an existing item over creating a duplicate.
- Keep backlog entries compact.
- Do not duplicate detailed architectural reasoning that already exists in ADRs or plans.

Before adding a new item, search `BACKLOG.md` for an existing item describing the same problem.

## Sources of truth

Before creating or updating a backlog item, inspect relevant project documentation.

Use these as extended sources of truth:

- `README.md`
- `PRODUCT_OVERVIEW.md`
- ADR documents
- `./plans/*`

### ADRs and plans

ADR files and files under:

`./plans/*`

are read-only outside Architect mode.

In Coder mode:

- read them when relevant,
- use them to understand intended architecture and implementation direction,
- do not modify them,
- do not rewrite or extend architectural decisions there.

If a backlog item originates from an ADR or plan, link to that source instead of copying its detailed reasoning into `BACKLOG.md`.

Example:

```md
**Source:** [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)
```

The backlog item should contain only enough context to:

- identify the problem,
- explain why it matters,
- state the expected outcome,
- point to the authoritative design source.

Do not duplicate full architectural analysis, alternatives, or implementation design from ADRs or plans.

## Adding a backlog item

When discovering work that should not be handled as part of the current task:

1. Determine whether it belongs in the backlog.
2. Check whether a matching or overlapping item already exists.
3. Check relevant ADRs, plans, product documentation, and README.
4. If an existing source already describes the issue or solution in detail, link to it.
5. If a backlog item already exists, update it instead of creating a duplicate.
6. Otherwise create a new item using the next appropriate project identifier.

Use this structure:

```md
---

# PXX: Short descriptive title

**Source:** link to ADR, plan, review, task, or other source

## Motivation

Briefly explain:

- what the problem is,
- why it matters,
- what observable issue or constraint triggered the item.

Keep this concise when the source document already contains detailed analysis.

## Solution

Describe the expected direction or outcome at a high level.

If the solution is already defined in an ADR or plan, do not duplicate it. Reference the source instead.

## Files involved

- `path/to/relevant-file`
- `path/to/another-file`

Include only files currently known to be relevant.

## Status

OPEN
```

## Updating an existing item

When new information affects an existing backlog item:

- preserve its identifier,
- keep the entry concise,
- update links to authoritative ADRs or plans when applicable,
- update `Files involved` when scope becomes clearer,
- avoid copying details already documented elsewhere.

If architectural direction changes, the authoritative ADR or plan should be updated in Architect mode first. The backlog should then reference the updated source.

## Completing an item

When the implementation represented by an item is finished:

1. Verify that the intended problem was actually resolved.
2. Verify relevant tests.
3. Check whether documentation needs updating.
4. Change:

```md
## Status

OPEN
```

to:

```md
## Status

DONE
```

Do not mark an item as complete merely because code was written.

## Documentation impact

For every significant completed change, check:

- `README.md`
- `PRODUCT_OVERVIEW.md`

### README.md

Update `README.md` when useful, but keep it compact.

It should contain only information needed to quickly understand, run, develop, or navigate the project.

Avoid turning README into detailed architecture documentation.

Prefer links to ADRs, plans, or dedicated documentation instead of duplicating large explanations.

### PRODUCT_OVERVIEW.md

Treat `PRODUCT_OVERVIEW.md` as a newer, high-level description of the current product.

Check it when changes affect:

- current product capabilities,
- user workflows,
- feature scope,
- core domain concepts,
- major product-level behavior.

Update it when the implemented change makes its description outdated.

Keep it focused on the current state of the product, not historical implementation details.

## Moving completed work to CHANGELOG.md

`BACKLOG.md` should remain useful as a list of active and planned work.

Periodically, completed items may be removed from `BACKLOG.md` and summarized in:

`CHANGELOG.md`

Do not flatten backlog items automatically after every completed task.

Only do it when explicitly requested or when the current task specifically includes backlog maintenance.

### Flattening rules

For each completed item:

1. Preserve the backlog identifier.
2. Summari
