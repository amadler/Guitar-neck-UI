# Ubiquitous Language — Guitar Neck Domain

## Core Concepts

| Term | Definition | Notes |
|------|------------|-------|
| **Pattern** | A musical concept (scale or chord) defined by a name, root note, and set of intervals. Resolved to concrete note names by `TonalFacadeService`. | `PatternInfo` in [`src/app/shared/model/patternInfo.ts`](src/app/shared/model/patternInfo.ts) |
| **Canonical State** | The minimal, immutable source-of-truth state describing the user's current musical intent and view configuration. | Defined in ADR 0005. Stored in `DomainState`. |
| **Derived State** | Data computed deterministically from canonical state — visible notes, interval colors, marker classes, outside-scale notes. | Computed exclusively by `FretboardDisplayService`. Never stored as source of truth. |
| **Command** | An operation that expresses a **user intent** to change the fretboard view. Always produces a new immutable snapshot. | `DomainCommand` — `show-pattern`, `compare-patterns`, `set-view`, `clear-view`, `set-emphasis`. Describes *what* the user wants, not *how* to mutate state. |
| **Query** | An operation that reads canonical state or derived state without changing it. | `DomainQuery` — `get-current-view`, `get-available-patterns`, `get-pattern-details` |
| **DomainResult** | A discriminated union: `{ success: true; data: T }` or `{ success: false; error: DomainError; message: string }`. | Return type for all commands and queries. Named `DomainResult` (not `CommandResult`) because queries use it too. |
| **DomainError** | Enum of possible validation failures: `PATTERN_NOT_FOUND`, `INVALID_ROOT_NOTE`, `INVALID_FRET_RANGE`, `INVALID_INTERVAL`, `UNKNOWN_COMMAND`. | Used in `DomainResult`. |
| **Emphasis** | Optional parameter on commands specifying which intervals or roles to highlight visually. | `{ intervals?: string[]; roles?: string[] }`. Not a separate overlay — part of the command. |

## State Fields

| Term | Type | Description |
|------|------|-------------|
| **mode** | `'scale' \| 'chord' \| 'scale-chord' \| 'custom'` | Current application mode. Determines `patternType` (derived). |
| **rootNote** | `string` | The tonic/root note of the current pattern (e.g., `'C'`, `'A'`, `'F#'`). |
| **patternName** | `string` | Name of the selected pattern (e.g., `'major'`, `'minor-pentatonic'`, `'maj7'`). |
| **compareTarget** | `{ rootNote: string; patternName: string; patternType: 'scale' \| 'chord' }?` | Second pattern for comparison in scale-chord mode. |
| **fretRange** | `{ min: number; max: number }` | Visible fret range on the fretboard. Default: `{ min: 0, max: 24 }`. |
| **enabledStrings** | `boolean[]` | Which strings are active (6 elements). `true` = show notes on this string. |
| **markerDisplayMode** | `'interval-colors' \| 'note-names' \| 'neutral-dots'` | How fretboard markers are rendered. |
| **emphasis** | `{ intervals?: string[]; roles?: string[] }?` | Which intervals or roles to highlight. |
| **selectedNotes** | `Array<{ note: string; string: number; fret: number }>?` | Notes manually selected by clicking specific positions on the fretboard. Each entry records the exact string and fret, not just the note name. |

## Derived Concepts

| Term | Description |
|------|-------------|
| **visibleNotes** | Array of `GuitarNote` objects that should be highlighted on the fretboard, computed from pattern + root + fretRange + enabledStrings. |
| **intervalColors** | CSS classes for each visible note based on its interval from root. |
| **markerClasses** | CSS classes for marker rendering (role-based or interval-based). |
| **outsideScaleNotes** | Notes belonging to the chord but not to the scale (in scale-chord mode). |
| **patternType** | Derived from `mode`: `'scale'` when mode is `'scale'`, `'chord'` when mode is `'chord'`. Not stored separately. |

## Client Roles

| Term | Description |
|------|-------------|
| **Toolbox** | Current UI client (dropdowns, buttons). Emits `DomainCommand` through `DomainService`. |
| **AI** | Future Langchain-based client. Sends `DomainCommand` and `DomainQuery` through the same `DomainService` interface. |
| **DomainService** | Central service that accepts `DomainCommand`/`DomainQuery`, validates, executes, and returns `DomainResult`. |

## Architectural Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Domain Contract** | `src/app/domain/` | Command/query types, canonical state type, domain errors |
| **Domain Service** | `src/app/domain/domain.service.ts` | Validates and dispatches commands/queries to application services |
| **Orchestration** | `src/app/services/fretboard-orchestration.service.ts` | Coordinates music theory → positions → highlighting pipeline |
| **State** | `src/app/services/fretboard-state.service.ts` | (To be refactored) Currently mutable state; will become immutable canonical state store |
| **Derived State** | `src/app/services/fretboard-display.service.ts` | Single source of derived state — computes CSS classes, visible notes, etc. from `DomainState` |
| **Music Theory** | `src/app/services/tonal-facade.service.ts` | Single point of access to Tonal.js for pattern resolution and interval calculation |