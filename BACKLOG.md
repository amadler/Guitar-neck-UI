# Practice prompts for selected pattern

## Motivation

After selecting a scale or chord, users may not know what to do with the displayed notes.

## Solution

Show simple practice prompts near the current pattern summary.

For example:
- Play the scale ascending and descending.
- Play only root notes.
- Say note names while playing.
- Play one note per metronome click.
- Limit yourself to the selected fret range.

## MVP

Display static or rule-based practice prompts for the active selection.

Prompts are stored in a separate data file (`src/app/shared/practice-prompts.data.ts`) keyed by pattern type. The `PatternDisplayComponent` reads from this file and renders the relevant prompts.

Implementation changes:
- `src/app/shared/practice-prompts.data.ts` — new file with prompt arrays per type
- `src/app/pattern-display/pattern-display.component.ts` — import data file, add `getPromptsForType()` method
- `src/app/pattern-display/pattern-display.component.html` — add prompts section inside existing `*ngIf` block
- `src/app/pattern-display/pattern-display.component.scss` — styles for prompts list
- `src/app/pattern-display/pattern-display.component.spec.ts` — test rendering

## Done when

- Scale selections show relevant practice prompts.
- Chord selections show relevant practice prompts.
- Prompts do not require scoring or tracking.
- Prompts are hidden when nothing is selected.
- Prompt texts are editable in `src/app/shared/practice-prompts.data.ts` without changing component code.
- Current language: Polish. Localization (pl/en) tracked as a separate task.

## Status

FIXED

---

# AI Chat (Gemini)

## Motivation

Users may want interactive guidance — asking questions about scales, chord progressions, or music theory in natural language directly from the guitar neck UI.

## Solution

Integrate Google Gemini API via a dedicated Angular library (`projects/guitar-chat`). The library provides:
- `ChatComponent` — chat bubble UI
- `AISuggestionsComponent` — contextual suggestion chips
- `AIFacadeService` / `AIService` / `AISuggestionService` — orchestration and API communication

## MVP

- Library `projects/guitar-chat` is published and importable
- Chat panel appears in the app when `chatEnabled: true` in environment config
- User can send text prompts and receive AI-generated responses
- Feature flag `chatEnabled` controls visibility (currently `false`)

## Done when

- `chatEnabled` is set to `true` in production environment
- A valid Gemini API key is configured server-side (not in frontend bundle)
- Chat component renders and communicates with the API
- AI suggestions are context-aware (current scale/chord selection)

## Status

POSTPONED

---

# `refreshNotesInRange()` dead code

## Motivation

Dead code increases maintenance burden and confuses developers reading the codebase.

## Solution

Remove the unused `refreshNotesInRange()` method from `freatboard.component.ts`.

## MVP

- Method `refreshNotesInRange()` is deleted from `FreatboardComponent`
- No other code references this method
- All existing tests pass

## Done when

- `git grep refreshNotesInRange` returns no results in `src/app`
- `npm test` passes
- No regression in fret range selection behavior

## Status

FIXED

---

# `ToolboxSearchQuery` typing

## Motivation

The toolbox search type system had redundant types (`CustomToolboxSearchQuery` and `isCustomToolboxSearchQuery()` guard) that complicated the command flow without adding value.

## Solution

Remove the redundant `CustomToolboxSearchQuery` type and its type guard function. Simplify the command parameter types to use a single union type.

## MVP

- Delete `CustomToolboxSearchQuery` type
- Delete `isCustomToolboxSearchQuery()` function
- Update all references to use the base `ToolboxSearchQuery` type
- All tests pass

## Done when

- No references to `CustomToolboxSearchQuery` remain in `src/app`
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED

---

# `toolboxSubmit()` command factory

## Motivation

The `toolboxSubmit()` method in `HomePageComponent` is a monolithic block that manually constructs different command types based on form state. This violates the Open/Closed principle and makes adding new toolbox modes error-prone.

## Solution

Refactor `toolboxSubmit()` into a command factory (or private builder methods) that encapsulate command creation per toolbox mode. Each command type gets its own factory method, isolating construction logic.

## MVP

- Extract command creation into private methods: `buildSingleNoteCommand()`, `buildScaleCommand()`, `buildChordCommand()`, `buildCustomPatternCommand()`
- `toolboxSubmit()` delegates to the appropriate builder
- All existing behavior is preserved (no functional changes)
- Tests cover each builder path

## Done when

- `toolboxSubmit()` is reduced to a dispatcher (no inline command construction)
- `npm test` passes
- `npm run build` succeeds
- No regression in toolbox form submission

## Status

OPEN

---

# Pattern name Unicode w backendzie

## Motivation

The backend `music-theory-api` does not decode Unicode characters in the `:name` URL parameter when fetching chord or scale patterns. This breaks pattern names containing non-ASCII characters (e.g., "maj7♭5", "dim7").

## Solution

Fix the backend endpoint to properly decode percent-encoded Unicode in the `:name` route parameter. Ensure the frontend sends the parameter correctly encoded (`encodeURIComponent`).

## MVP

- Backend decodes `:name` parameter using `decodeURIComponent()` or equivalent
- Frontend encodes pattern names with `encodeURIComponent()` before constructing the URL
- Patterns with Unicode characters (♭, ♯, etc.) resolve correctly

## Done when

- `GET /api/chords/:name/:root` works with Unicode characters in `:name`
- `GET /api/scales/:name/:root` works with Unicode characters in `:name`
- No `400` or `404` errors for valid Unicode pattern names

## Status

OPEN

---

# Note readability na gryfie

## Motivation

Note names on the fretboard can be difficult to read — especially on lower frets or when multiple intervals overlap. The current `neutral-dots` marker mode is a workaround, not a solution.

## Solution

Redesign the visual marker system for note names. Options include:
- Rotated or vertical text on narrow frets
- Tooltip on hover/tap
- Dynamic font size based on fret width
- Background pill/badge for contrast

## MVP

- Implement at least one improved readability mode (e.g., pill badges with high contrast)
- Ensure it works across all frets (1–24) and string densities
- Preserve existing `MarkerDisplayMode` switching mechanism

## Done when

- Note names are readable on all frets without zooming
- The feature does not regress `interval-colors` or `neutral-dots` modes
- Responsive layout is maintained at mobile widths

## Status

POSTPONED

---

# Fret numbering starts at 0

## Motivation

Currently, fret 0 (open string) is displayed as fret 1 in the template. This causes an off-by-one mismatch between the data model (0-indexed) and the visual label (1-indexed), confusing users who expect traditional guitar fret numbering.

## Solution

Change the template rendering to display `fret + 1` for the label, or alternatively shift the model to be 1-indexed. The label displayed to the user should match standard guitar notation where the first fret = 1.

## MVP

- Update the fret label in the template to show `fret + 1` (or equivalent)
- Ensure fret 0 (open strings) is labeled correctly
- All existing click/selection logic remains 0-indexed internally

## Done when

- Fret labels show 1–24 instead of 0–23 (or 0–24 for open strings)
- `npm test` passes
- No regression in note positioning or selection

## Status

OPEN

---

# Remove unused uuid from GuitarNote

## Motivation

The `GuitarNote` model has no `id` or `uuid` field in the current codebase, but historical references (v0.1.0 changelog) mention an `id` field. If any dead code still references a `uuid`/`id` property, it should be cleaned up.

## Solution

Search the codebase for any remaining references to `GuitarNote.id`, `GuitarNote.uuid`, `note.id`, or `note.uuid`. Remove any dead code, getter/setter, or interface extension that assumes an identifier.

## MVP

- Confirm no `id` or `uuid` property exists on `GuitarNote` (already done — model is clean)
- Remove any residual references in tests, mocks, or documentation

## Done when

- `git grep -n '\.id' src/app/shared/model/guitarNote.ts` returns nothing
- `git grep -n 'uuid' src/app/` returns nothing
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# FretboardStateService O(n) → O(1)

## Motivation

`FretboardStateService` (implemented in `guitar-neck.service.ts`) uses `Array.find()` to look up notes by string/fret position. This is O(n) per lookup and called frequently during rendering and interaction.

## Solution

Replace the array-based lookup with a `Map<string, GuitarNote>` keyed by `"${string}-${fret}"`. This provides O(1) average lookup time.

## MVP

- Introduce a `Map` in `FretboardStateService` alongside (or replacing) the existing array
- Update all lookup methods to use `Map.get()` instead of `Array.find()`
- Ensure the map is rebuilt when the note collection changes
- All existing public API signatures remain unchanged

## Done when

- `Array.find` / `Array.filter` on the full note array is eliminated from hot paths
- `npm test` passes
- No regression in note selection, highlighting, or display

## Status

FIXED

---

# Template woła serwisy bezpośrednio

## Motivation

Several Angular templates call services directly (e.g., `fretboardStateService.method()` in the template), violating the separation of concerns. Logic should live in the component class, not the template.

## Solution

Move all direct service calls from templates into component methods or computed properties. The template should only reference component properties and methods.

## MVP

- Identify all `*.component.html` files that reference service methods directly
- Wrap each call in a component method or getter
- Ensure `ChangeDetectionStrategy.OnPush` compatibility is improved

## Done when

- No template in `src/app/` directly calls a service method (e.g., `service.someMethod()`)
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# UI Color Palette Refresh

## Motivation

The current interval color palette was defined early in the project (v0.1.0) and may not meet accessibility contrast standards. Some interval colors are hard to distinguish for color-blind users.

## Solution

Redesign the color palette with:
- WCAG AA contrast ratios for all interval colors on the dark background
- Color-blind safe differentiation (e.g., patterns or shapes in addition to color)
- CSS custom properties for easy theming

## MVP

- Define new color values in `src/styles.scss` CSS variables
- Ensure root, 3rd, 5th, 7th intervals are distinguishable
- Test with a color-blindness simulator

## Done when

- All interval colors meet WCAG AA contrast against the dark background
- Interval colors are distinguishable without relying solely on hue
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# MusicSelection domain abstraction

## Motivation

Currently, music selection logic (scales, chords, notes, custom patterns) is spread across multiple services and components without a unified domain model. This makes it hard to extend or test selection behavior.

## Solution

Create a `MusicSelection` domain abstraction that encapsulates the current selection state:
- Type: `scale | chord | note | custom`
- Pattern name and root note
- Fret range
- Selected notes list

This abstraction would be used by `FretboardStateService`, `IntervalService`, and the command layer.

## MVP

- Define `MusicSelection` interface/class in `src/app/shared/model/`
- Integrate with `FretboardStateService` as the single source of truth for selection
- Update `UICommands` to accept/return `MusicSelection` where applicable

## Done when

- `MusicSelection` is the canonical representation of current selection
- All components read selection state through this abstraction
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# Localization (pl/en) for practice prompts

## Motivation

The practice prompts are currently hardcoded in Polish. The existing backlog entry for "Practice prompts" explicitly notes that localization is tracked separately.

## Solution

Add an i18n layer to `practice-prompts.data.ts` that supports Polish and English. The language can be switched via a setting or detected from the browser locale.

## MVP

- Split prompts data into `pl` and `en` language maps
- Add a `language` parameter to the prompt retrieval function
- Default to Polish (matching current behavior)
- English translations for all existing prompts

## Done when

- `practice-prompts.data.ts` exports both `pl` and `en` prompt sets
- `PatternDisplayComponent` accepts a language input or setting
- Switching language changes prompt texts without a rebuild
- All existing tests pass

## Status

OPEN

---

# Metronome — visual beat indicator improvement

## Motivation

The current metronome (`MetronomeComponent`) has a basic visual beat indicator (`currentBeat`). The UI could be more intuitive with stronger visual accents (e.g., beat accent colors, bar visualization, animated pulse).

## Solution

Enhance the metronome display with:
- Accent colors for the downbeat (beat 1) vs. other beats
- Animated pulse or glow on each beat
- Bar/measure visualization showing current position within the measure
- Configurable accent patterns per time signature

## MVP

- Differentiate the downbeat visually (e.g., larger indicator, different color)
- Add a subtle CSS animation (pulse/scale) on each beat change
- Preserve all existing tap-tempo, BPM range, and time signature functionality

## Done when

- Beat 1 is visually distinct from other beats in all time signatures
- The beat indicator animates smoothly on each tick
- `npm test` passes
- No regression in metronome audio timing

## Status

OPEN

---

# guitar-toolbox-lib version bump to ^1.2.1

## Motivation

The `package.json` previously referenced an older version of `guitar-toolbox-lib`. The dependency has been updated to `^1.2.1` to pick up bug fixes and new features.

## Solution

Update `package.json` to use `"guitar-toolbox-lib": "^1.2.1"`. This is already done — the change is verified.

## MVP

- `package.json` line 29 shows `"guitar-toolbox-lib": "^1.2.1"`
- `npm install` resolves without peer dependency conflicts
- All toolbox components work with the updated library

## Done when

- Version `^1.2.1` is confirmed in `package.json`
- `npm run build` succeeds
- Toolbox form renders and submits correctly

## Status

FIXED
