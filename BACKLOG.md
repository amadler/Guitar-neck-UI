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

POSTPONED

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

# Cloudflare Pages Deployment

## Motivation

Docker-based deployment was removed along with the backend API. The app is now a pure static Angular frontend with no backend dependency. Cloudflare Pages offers free static hosting with global CDN, HTTPS, and custom domains — ideal for this project.

## Solution

Migrate from Docker/VPS to Cloudflare Pages:
1. Connect the GitHub repository to Cloudflare Pages
2. Configure build command: `npm run build`
3. Configure output directory: `dist/guitar-neck-ui`
4. Set environment variables (geminiApiKey) via Cloudflare Pages Secrets
5. Configure custom domain (optional)

## MVP

- App is deployed and accessible via Cloudflare Pages URL
- Build succeeds on Cloudflare Pages
- All static assets (images, fonts) load correctly
- Environment variables are configured for production

## Done when

- `npm run build` produces a deployable `dist/guitar-neck-ui/` directory
- Cloudflare Pages deployment is configured and working
- App is accessible via public URL
- No Docker or VPS infrastructure is required

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

# Remove AppMode — redundant UI mode type

## Motivation

Three types (`QueryTypes`, `AppMode`, `FretboardCommand.kind`) describe overlapping concepts with different value sets. `AppMode` is the most problematic: its `'custom-pattern'` value is dead code (never set by any component), and its only real use — controlling single-panel vs two-card layout in `PatternDisplayComponent` — can be derived from existing state (`scaleChordState.chord !== null`). The `switchMode()` method in `RangeToolbarComponent` is also dead code (no UI trigger). Removing `AppMode` eliminates a potential source of state desync and simplifies the type landscape.

## Solution

1. Remove `AppMode` type and `AppStateService` entirely (or keep `AppStateService` as a stub if needed later)
2. Replace `PatternDisplayComponent.isScaleChordMode` with a check on `FretboardStateService.scaleChordState.chord !== null`
3. Remove `switchMode()` and `appMode` getter from `RangeToolbarComponent`
4. Remove `AppStateService` import and `appMode` getter from `PatternDisplayComponent`
5. Delete `app-state.service.ts` and `app-state.service.spec.ts`
6. Update all imports across the codebase

## MVP

- `AppMode` type no longer exists anywhere in the codebase
- `PatternDisplayComponent` derives its layout from `scaleChordState` instead of `AppMode`
- `RangeToolbarComponent` no longer references `AppMode`
- All tests pass
- `npm run build` succeeds

## Done when

- `grep -r 'AppMode' src/` returns zero results
- `grep -r 'app-state.service' src/` returns zero results
- `npm test` passes
- `npm run build` succeeds
- No regression in pattern display layout (single-panel vs two-card)

## Status

OPEN

---

# P0: Fix enharmonic handling — compare by pitch class, not string

## Motivation

`FretboardOrchestrationService` uses `simplify()` from `@tonaljs/note` which returns enharmonic spellings like `Eb`, `Bb`, `Ab`, `Db`, `Gb`. Meanwhile `neckConfig.chromaticNotes` uses only sharps (`C#`, `D#`, `F#`, `G#`, `A#`). When `MarkerRoleService` and `RelationshipStripComponent` compare note names via `Set.has()` / `Array.includes()`, `Eb !== D#` causes positions to disappear or relationships to be computed incorrectly. For example, Cm chord resolves to `["C", "Eb", "G"]` from Tonal, but `Eb` never matches `D#` in the fretboard note positions.

## Solution

Replace all string-based note comparisons with pitch class (chroma 0-11) comparison. The spelling is preserved only for display. The `GuitarNote` model gets a `chroma` property, or comparison happens through a helper that maps note names to 0-11.

Affected files:
- `src/app/services/marker-role.service.ts` — `Set.has()` comparisons
- `src/app/services/music-theory-facade.service.ts` — `filter()` and `includes()` calls
- `src/app/relationship-strip/relationship-strip.component.ts` — `Set.has()` comparisons
- `src/app/pattern-resolver.ts` — `resolveNotesFromIntervals()` return type

## MVP

- Cm chord displays all three notes correctly on the fretboard
- Cm scale-chord relation with C major scale computes roles correctly
- All existing tests pass

## Done when

- `Cm` triad shows `C`, `Eb`, `G` positions (not `C`, `D#`, `G`)
- `Fm` triad shows `F`, `Ab`, `C` positions (not `F`, `G#`, `C`)
- Scale-chord relation for `C major` + `Cm` shows correct overlap
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P0: MarkerRole — support multiple roles per position

## Motivation

The current `Map<string, MarkerRole>` stores exactly one role per fretboard position. When a note is both a `scale-root` and a `chord-root`, the `chord-root` role wins and the `scale-root` information is lost. This contradicts the grooming requirement of multiple roles per position. The test at `marker-role.service.spec.ts` even enforces the single-role behaviour.

## Solution

Change `Map<string, MarkerRole>` to `Map<string, Set<MarkerRole>>` or add a `roles: MarkerRole[]` field to `GuitarNote`. The display layer iterates all roles to apply CSS classes. The `FretboardDisplayService` renders all roles (e.g., a split-colour marker for `scale-root` + `chord-root`).

## MVP

- `Map<string, Set<MarkerRole>>` with `chord-root` + `scale-root` coexisting
- `FretboardDisplayService.getRoleCssClass()` returns combined classes
- Fretboard template applies both CSS classes
- Update test to assert multiple roles instead of single-role priority

## Done when

- A note that is both `scale-root` and `chord-root` gets both CSS classes
- Visual marker shows both roles (e.g., split colour or layered badge)
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P0/P1: Remove MarkerRoleService.lastRoles cache — store roles in FretboardState

## Motivation

`MarkerRoleService.lastRoles` is a global mutable cache. `FretboardDisplayService.getRoleCssClass()` checks only `scaleChordState` existence (not whether `chord` is null) and then reads from `lastRoles`. When the user navigates: Compare → Show Scale, `HomePageComponent.handleShowScale()` sets `scaleChordState.chord = null` but never calls `computeRoles()`. The old roles from the Compare session persist in `lastRoles` and leak into the new Show Scale view.

## Solution

1. Remove `lastRoles` from `MarkerRoleService`
2. Add a `roles: Map<string, Set<MarkerRole>>` field to `FretboardStateService`
3. `FretboardOrchestrationService.displayScaleWithChord()` writes roles directly to `FretboardStateService.roles`
4. `FretboardOrchestrationService.displayScale()` / `displayChord()` clear `FretboardStateService.roles`
5. `FretboardDisplayService.getRoleCssClass()` reads from `FretboardStateService.roles` instead of `MarkerRoleService.lastRoles`

## MVP

- No stale roles leak between Compare → Show Scale transitions
- `FretboardStateService.roles` is the single source of truth for marker roles
- `MarkerRoleService.lastRoles` is removed

## Done when

- Doing Compare (C major + Cm) then Show Scale (C major) shows no role markers
- Doing Compare again shows correct role markers
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1: Consolidate theory computation — single source of truth

## Motivation

Three independent places compute the same music theory with different mechanisms:

1. `FretboardOrchestrationService` — uses Tonal.js `scaleGet()` / `chordGet()` + fallback to `CHORD_PATTERNS` / `SCALE_PATTERNS`
2. `MarkerRoleService` — resolves note names from `CHORD_PATTERNS` / `SCALE_PATTERNS` via `resolveNotesFromIntervals()`
3. `RelationshipStripComponent` — iterates `pattern.intervals` manually over `neckConfig.chromaticNotes`

Each can produce different note name strings for the same input (enharmonic mismatch). This is the primary source of architectural redundancy and potential bugs.

## Solution

1. `FretboardOrchestrationService` becomes the single place that computes theory
2. It returns a resolved result containing: pitch classes (0-11), note names, intervals, and scale/chord membership per pitch class
3. `MarkerRoleService` is replaced by a pure function or inline logic in `FretboardOrchestrationService.displayScaleWithChord()`
4. `RelationshipStripComponent` receives resolved data via `FretboardStateService` instead of recomputing it
5. Remove `resolveChordNoteNames()` and `resolveScaleNoteNames()` from `RelationshipStripComponent`

## MVP

- All theory computation flows through `FretboardOrchestrationService`
- `MarkerRoleService` does not recompute theory from `CHORD_PATTERNS` / `SCALE_PATTERNS`
- `RelationshipStripComponent` does not resolve note names independently
- All tests pass

## Done when

- `MarkerRoleService` no longer imports `CHORD_PATTERNS` or `SCALE_PATTERNS`
- `RelationshipStripComponent` no longer imports `CHORD_PATTERNS` or `SCALE_PATTERNS`
- Both use the resolved result from `FretboardOrchestrationService`
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1: Fix PatternBuilderService — W/H logic and compound intervals

## Motivation

`PatternBuilderService` has two issues:

1. **W/H logic is wrong for chords**: `steps.push(step === 2 ? 'W' : step === 1 ? 'H' : 'W+H')` labels every step other than 1 or 2 semitones as `W+H`. For a major triad `[4, 3, ...]`, the first step of 4 semitones becomes `W+H`, which is musically meaningless for chords. The W/H display should be limited to scales only.

2. **Compound intervals reduced modulo 12**: `intervals.push(SEMITONE_TO_INTERVAL[cumulative % 12])` reduces a minor 7th (cumulative=9) to major 2nd (9 % 12 = 2). In an educational app, intervals should be shown in their actual octave position.

3. **Duplicate code**: `setCurrentPattern()` and `setRelatedChord()` are nearly identical.

## Solution

1. For chords, skip W/H display entirely or show interval names only
2. For scales, show W/H from the resolved Tonal intervals (not recomputed from `CHORD_PATTERNS` / `SCALE_PATTERNS`)
3. Use actual semitone values for display, not `% 12`
4. Extract shared logic into a private helper method

## MVP

- Chord display shows no W/H steps (or interval names only)
- Scale display shows correct W/H for all scale types
- Compound intervals (9, 11, 13) are not reduced modulo 12
- `setCurrentPattern()` and `setRelatedChord()` share implementation

## Done when

- Major triad shows intervals `1`, `3`, `5` and semitones `0`, `4`, `7` — no `W+H` steps
- Minor 7th chord shows `7m` interval, not `2M`
- `setCurrentPattern()` and `setRelatedChord()` call a shared helper
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1: Single owner for notes array — state owns, components read

## Motivation

The `FretboardStateService.notes` array is assigned in three places:

1. `FretboardStateService` constructor — `this.notes = this.noteService.getAllPositions()`
2. `GuitarNeckComponent` constructor — `this.guitarNeckService.notes = this.guitarNotes`
3. `FreatboardComponent.ngOnInit()` — `this.guitarNeckService.notes = this.notes`

This works only because `getAllPositions()` returns the same or equivalent array reference. It violates single-responsibility and makes it unclear who owns the data.

## Solution

1. `FretboardStateService` is the sole owner of the `notes` array — initialized once in constructor
2. `GuitarNeckComponent` reads from `FretboardStateService.notes` instead of calling `noteService.getAllPositions()` itself
3. `FreatboardComponent.ngOnInit()` does not reassign `guitarNeckService.notes`
4. Remove `GuitarNeckComponent.guitarNotes` property if unused elsewhere

## MVP

- `FretboardStateService.notes` is assigned exactly once (in its constructor)
- `GuitarNeckComponent` reads from state, not from `NoteService`
- `FreatboardComponent.ngOnInit()` does not reassign state.notes
- All tests pass

## Done when

- `guitarNeckService.notes =` appears in exactly one location (the constructor)
- `GuitarNeckComponent` does not have its own `guitarNotes` field
- `FreatboardComponent.ngOnInit()` does not reassign state
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1/P2: Remove FretboardNoteQueryService — use notesMap O(1) lookup

## Motivation

`FretboardNoteQueryService` provides `getNote()`, `getNoteName()`, `isNoteOnFret()`, and `fretNoteClicked()` — all using `Array.find()` and `Array.some()` which are O(n). Meanwhile `FretboardStateService` already builds a `notesMap` (O(1) lookup) in its constructor. The template calls these methods many times per cell (up to 24 frets x 6 strings = 144 calls per render).

## Solution

1. Add `getNoteAt(stringIndex: number, fret: number): GuitarNote | undefined` to `FretboardStateService` using `notesMap`
2. Replace all `FretboardNoteQueryService` calls in `FreatboardComponent` with `FretboardStateService` calls
3. Remove `FretboardNoteQueryService` file and its spec
4. Remove `FretboardNoteQueryService` import from `FreatboardComponent`

## MVP

- All fretboard queries use O(1) `notesMap` lookup
- `FretboardNoteQueryService` is deleted
- `FretboardNoteQueryService` no longer appears in any import

## Done when

- `grep -r 'FretboardNoteQueryService' src/` returns zero results
- `grep -r 'fretboard-note-query.service' src/` returns zero results
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1: Consistent reset lifecycle — orchestrator owns lifecycle

## Motivation

`HomePageComponent.onToolboxEvent()` always calls `clearFretboard()`. Then `displayChord()` calls `clearFretboard()` again. `displayScale()` does not call `clearFretboard()` at all. This inconsistency means some operations do a double-reset while others rely on the caller to reset first.

## Solution

1. `FretboardOrchestrationService` owns the full lifecycle of each display operation
2. Each `display*()` method starts with `clearFretboard()` internally
3. `HomePageComponent.onToolboxEvent()` does NOT call `clearFretboard()` — it just dispatches the command
4. Remove the `clearFretboard()` call from `HomePageComponent.onToolboxEvent()`

## MVP

- Each `display*()` method in `FretboardOrchestrationService` is self-contained (clears + renders)
- `HomePageComponent.onToolboxEvent()` does not duplicate the clear
- All display operations behave consistently

## Done when

- `displayChord()` calls `clearFretboard()` once (not twice)
- `displayScale()` calls `clearFretboard()` (same as others)
- `HomePageComponent.onToolboxEvent()` does not call `clearFretboard()`
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1: Fix markedTwelffeFrets typo — build-breaker

## Motivation

`FreatboardComponent.isMarkedTwelffeFret()` references `neckConfig.markedTwelffeFrets` (with double 'f' and typo 'twelffe'). The current `guitar-neck-shared` 1.0.2 defines `markedTwelveFrets` (correct spelling). This would cause a build error. The `toolbox-styling` branch may have additional changes that make this worse.

## Solution

Rename `markedTwelffeFrets` to `markedTwelveFrets` in `FreatboardComponent.isMarkedTwelffeFret()` and update the method name to `isMarkedTwelveFret()`. Update all references in the template.

## MVP

- `npm run build` succeeds
- D string 12th fret marker still renders correctly

## Done when

- `grep -r 'markedTwelffe' src/` returns zero results
- `npm run build` succeeds
- Fretboard markers at 12th fret show correctly

## Status

OPEN

---

# P1: Reduce state sources — consolidate to FretboardState + displayMode

## Motivation

The current codebase has 7+ independent state sources that can desynchronise:

1. `AppStateService.appMode` — always `'scale-or-chord'`, never changes
2. `FretboardStateService.currentSelection` — `MusicSelection | null`
3. `FretboardStateService.scaleChordState` — `ScaleChordState | null`
4. `PatternBuilderService.currentPattern` — `PatternInfo | null`
5. `PatternBuilderService.relatedChord` — `PatternInfo | null`
6. `HomePageComponent.displayMode` — `signal<DisplayMode>`
7. `MarkerRoleService.lastRoles` — `Map<string, MarkerRole>`

`currentSelection` and `scaleChordState` partially overlap. `PatternBuilder.currentPattern` duplicates `currentSelection`. `displayMode` can be derived from `scaleChordState.chord !== null`. This makes it possible for states to drift apart — e.g., `scaleChordState` says chord is active but `PatternBuilder.relatedChord` is null.

## Solution

1. Keep `FretboardStateService` as the single state owner
2. Remove `currentSelection` — `scaleChordState` is sufficient (chord=null means single-selection mode)
3. Remove `PatternBuilderService.currentPattern` and `relatedChord` — they become computed properties from `FretboardStateService` data
4. Derive `HomePageComponent.displayMode` from `scaleChordState.chord !== null` (remove the signal)
5. Remove `MarkerRoleService.lastRoles` (covered by separate entry)
6. Remove `AppStateService` (covered by separate entry)

## MVP

- `FretboardStateService` is the only service-level state holder
- `PatternDisplayComponent` reads pattern info directly from `FretboardStateService` + `FretboardOrchestrationService`
- No duplicate state fields across services
- All tests pass

## Done when

- `FretboardStateService.currentSelection` is removed
- `PatternBuilderService.currentPattern` and `relatedChord` are removed (or replaced with derived getters)
- No `HomePageComponent.displayMode` signal
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

---

# P1: Remove dead "shared" dependency from package.json

## Motivation

`package.json` lists `"shared": "^0.2.0"` as a dependency. No import from `shared` exists anywhere in the GNUI codebase. This is a dead dependency that adds unnecessary noise to `npm install` and `package-lock.json`.

## Solution

Remove the `"shared": "^0.2.0"` line from `package.json`. Run `npm install` to update `package-lock.json`.

## MVP

- `"shared"` no longer appears in `package.json` dependencies
- `npm install` succeeds
- `npm run build` succeeds

## Done when

- `grep '"shared"' package.json` returns zero results
- `npm install` succeeds
- `npm run build` succeeds

## Status

OPEN

---

# P2: Dead code cleanup — console.log, resetActiveStrings, unused exports

## Motivation

Several dead code locations exist:

1. `src/app/app-state.service.ts:18` — `console.log(mode)` after setMode
2. `src/app/guitar-neck/guitar-neck.component.ts:31` — `console.log('onNoteClicked$', note)`
3. `src/app/freatboard/freatboard.component.ts:84` — commented-out `console.log`
4. `src/app/services/note.service.ts:31` — commented-out `console.log`
5. `src/app/services/guitar-neck.service.ts:77-79` — `resetActiveStrings()` is private and never called despite comment saying "Called on clearFretboard()"
6. `src/app/services/note.service.ts` — check for unused exports

## Solution

1. Remove `console.log()` from `app-state.service.ts` (will be deleted by AppMode removal anyway)
2. Remove `console.log()` from `guitar-neck.component.ts`
3. Remove commented-out lines from `freatboard.component.ts` and `note.service.ts`
4. Either remove `resetActiveStrings()` or call it from `clearFretboard()` to match the comment
5. Check `note.service.ts` for unused exported symbols

## MVP

- No `console.log()` statements in production code
- No commented-out console.log lines
- `resetActiveStrings()` is either used or removed
- All tests pass

## Done when

- `grep -r 'console.log' src/app/` returns zero results (excluding spec files)
- `resetActiveStrings()` is either called or removed
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN