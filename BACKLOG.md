# P2: Consolidate interval configuration — single source of truth

## Motivation

Four independent places define the same interval mappings with different shapes and purposes:

1. [`toolbox.builder.component.ts`](../guitar-toolbox/projects/guitar-toolbox-lib/src/lib/toolbox-forms/toolbox-forms/toolbox.builder/toolbox.builder.component.ts:9) — `INTERVAL_LABELS` + `INTERVAL_OPTIONS` (symbol → label for UI dropdown)
2. [`home-page.component.ts`](src/app/home-page/home-page.component.ts:95) — `semitoneMap` (symbol → semitone for `handleShowInterval()`)
3. [`pattern-builder.service.ts`](src/app/services/pattern-builder.service.ts:8) — `SEMITONE_TO_INTERVAL` (semitone → symbol for pattern display)
4. [`note-utils.ts`](src/app/shared/note-utils.ts:33) — `CHROMA_TO_INTERVAL` (chroma → Tonal interval name for `intervalBetween()`)
5. [`tonal-adapter.ts`](src/app/shared/tonal-adapter.ts:25) — `INTERVAL_MAP` (Tonal name → UI CSS class name)

Each is a partial view of the same 12 intervals. Adding a new interval or fixing a mapping requires touching 5 files. The toolbox is now inlined in `src/app/toolbox/`, so sharing code between toolbox and the rest of the app is trivial — but the duplication still exists.

## Solution

Create a single `INTERVAL_CONFIG` array in [`tonal-adapter.ts`](src/app/shared/tonal-adapter.ts) (the existing single source of truth for interval mappings) that contains all properties for each interval:

```typescript
export interface IntervalConfig {
  symbol: string;       // 'b3'
  semitone: number;     // 3
  label: string;        // 'minor 3'
  tonalName: string;    // '3m'
  cssClass: string;     // 'minor-3rd'
}
```

Then refactor all 5 consumers to derive their data from this single source.

`tonal-adapter.ts` is the correct home because `IntervalConfig` includes `tonalName` (Tonal.js-specific) and `cssClass` (UI-specific) — these are adapter concerns, not pure music theory. `guitar-neck-shared` (npm package) would require a release cycle for every change.

## MVP

- `INTERVAL_CONFIG` is exported from [`tonal-adapter.ts`](src/app/shared/tonal-adapter.ts)
- Toolbox `INTERVAL_OPTIONS` is derived from `INTERVAL_CONFIG`
- `pattern-builder.service.ts` `SEMITONE_TO_INTERVAL` is replaced by lookup in `INTERVAL_CONFIG`
- `note-utils.ts` `CHROMA_TO_INTERVAL` is replaced by lookup in `INTERVAL_CONFIG`
- `tonal-adapter.ts` `INTERVAL_MAP` is derived from `INTERVAL_CONFIG`
- All existing tests pass

## Done when

- `grep -n 'INTERVAL_LABELS\|INTERVAL_OPTIONS\|semitoneMap\|SEMITONE_TO_INTERVAL\|CHROMA_TO_INTERVAL\|INTERVAL_MAP' src/` returns zero results (except the new single source)
- Toolbox dropdown shows same intervals as before
- All interval colors work correctly
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED

# P3: Cloudflare Pages deployment

## Motivation

Aplikacja jest w pełni lokalna (Tonal.js, żadnego backendu) i gotowa do hostowania jako statyczna strona. Obecnie:

- [`README.md`](README.md:135) wskazuje na żywy preview na Render.com (`guitar-neck-ui.onrender.com`) — ale to nie jest docelowy deployment
- [`DEVELOPMENT.md`](DEVELOPMENT.md:101) opisuje Cloudflare Pages jako planowany hosting, ale bez konkretnych kroków
- Docker i VPS zostały już usunięte z projektu ([`CHANGELOG.md`](CHANGELOG.md:39))
- Brak automatycznego deploymentu z GitHub — każda zmiana wymaga ręcznego builda i uploadu

Cloudflare Pages to darmowy hosting statyczny z automatycznym deploymentem z GitHub, idealny dla SPA bez backendu.

## Solution

1. Dodać plik [`wrangler.toml`](wrangler.toml) z `not_found_handling = "single-page-application"` — Cloudflare wykryje go i skonfiguruje SPA routing
2. Podłączyć repozytorium GitHub do Cloudflare Pages/Workers
3. Skonfigurować build command: `npm run build:prod` (produkcyjny build Angular)
4. Skonfigurować output directory: `dist/guitar-neck-ui/browser`
5. Ustawić zmienne środowiskowe przez Cloudflare Secrets (geminiApiKey — puste, chatEnabled: false)
6. Przetestować deployment i ustawić domenę
7. Zaktualizować dokumentację

## MVP

- Plik [`wrangler.toml`](wrangler.toml) w repo z `not_found_handling = "single-page-application"`
- Repozytorium podłączone do Cloudflare (Workers static assets)
- Build i deploy automatycznie z gałęzi `master`
- Aplikacja działa pod domeną `.workers.dev`
- Dokumentacja zaktualizowana

## Done when

- `https://guitar-neck-ui.madler-andrzej.workers.dev` (lub własna domena) wyświetla aplikację
- `npm run build:prod` produkuje poprawny build
- Automatyczny deployment działa na push do `master`
- Angular routing działa (odświeżenie strony nie powoduje 404) — obsłużone przez `not_found_handling` w [`wrangler.toml`](wrangler.toml)
- `README.md` i `DEVELOPMENT.md` nie zawierają już instrukcji Docker/VPS
- Wszystkie zmienne środowiskowe są ustawione w Cloudflare dashboard

## Status

FIXED

# P4: Update first-launch welcome popup content

## Motivation

The help modal (first-launch popup) in [`header.component.html`](src/app/header/header.component.html:18-31) lists what the app can do, but it's outdated. Since the popup was written, several features have been added:

- **Compare mode** — Scale + Chord relation with 5 marker roles (scale-tone, chord-tone, etc.) and independent key/type selection
- **Metronome** — built-in AudioContext engine with 2/4, 3/4, 4/4, 6/8 time signatures, 20–300 BPM, tap-tempo
- **Pattern display panel** — shows scale/chord details (notes, intervals, semitones, steps) plus practice prompts
- **Relationship strip** — replaces Legend in Compare mode, shows role legend + which chord tones are inside/outside the scale

Additionally the line _"AI chat and practice features are planned"_ is misleading: practice prompts already exist (see [`practice-prompts.data.ts`](src/app/shared/practice-prompts.data.ts)), only AI chat remains postponed.

## Solution

Update the popup content in [`header.component.html`](src/app/header/header.component.html:18-31) to accurately describe all current features. Remove the "planned" note about practice features; keep the AI chat note as postponed if desired.

## MVP

- Popup lists all current features: notes, scales, chords, custom intervals, Compare mode, fret range, string toggle, marker display, metronome, pattern display with practice prompts
- The "planned" line is corrected to reflect reality (practice exists, AI postponed)
- Tests in [`header.component.spec.ts`](src/app/header/header.component.spec.ts) still pass (modal open/close logic unchanged)

## Done when

- Popup content matches the feature set described in [`PRODUCT_OVERVIEW.md`](PRODUCT_OVERVIEW.md)
- No mention of practice features as "planned" — they exist
- AI chat still noted as postponed (accurate)
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

# Registry Pattern dla DomainService

## Motivation

Obecny [`DomainService`](src/app/domain/domain.service.ts) używa switch statement do dyspozycji komend. Łamie to OCP (Open-Closed Principle) — dodanie nowej komendy wymaga modyfikacji switcha. Registry Pattern pozwala na rejestrację handlerów w konstruktorze, co daje zero ifów/switchów w `execute()`.

## Solution

Zastąpić switch w `DomainService.execute()` registry patternem:

```typescript
type CommandHandler = (command: any) => DomainResult<DomainState>;

private handlers = new Map<string, CommandHandler>();

constructor() {
  this.handlers.set('show-pattern', (c) => this.handleShowPattern(c));
  this.handlers.set('show-interval', (c) => this.handleShowInterval(c));
  this.handlers.set('compare-patterns', (c) => this.handleComparePatterns(c));
  this.handlers.set('set-view', (c) => this.handleSetView(c));
  this.handlers.set('set-emphasis', (c) => this.handleSetEmphasis(c));
  this.handlers.set('clear-view', (_c) => this.handleClearView());
}

execute(command: DomainCommand): DomainResult<DomainState> {
  const handler = this.handlers.get(command.type);
  if (!handler) {
    return { success: false, error: DomainError.UNKNOWN_COMMAND, message: `Unknown: ${command.type}` };
  }
  return handler(command);
}
```

## MVP

- Registry pattern w `DomainService.execute()`
- Wszystkie istniejące testy przechodzą
- `npm run build` succeeds

## Done when

- `DomainService.execute()` nie zawiera switch/if-else dla dyspozycji komend
- Nową komendę można dodać przez jeden wpis w `handlers.set()`
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED

# P5: Stale state after compare → single pattern (marker colors + duplicate chord display)

## Motivation

Two related state-clearing bugs when switching from Compare mode to a single pattern:

1. **Stale marker styles:** [`displayScale()`](src/app/services/fretboard-orchestration.service.ts:26) and [`displayChord()`](src/app/services/fretboard-orchestration.service.ts:35) do not clear `scaleChordState`, so [`getMarkerCssClass()`](src/app/services/fretboard-display.service.ts:26) returns empty string and [`getRoleCssClass()`](src/app/services/fretboard-display.service.ts:62) returns stale role CSS from the previous compare session.

2. **Stale relatedChord in PatternDisplay:** [`handleShowPattern()`](src/app/domain/domain.service.ts:104) calls `patternBuilder.setCurrentPattern()` but does NOT clear `patternBuilder.relatedChord`. Since [`PatternDisplayComponent`](src/app/pattern-display/pattern-display.component.ts:22-28) shows both `currentPattern` and `relatedChord`, the chord pattern appears twice after compare → show-chord.

## Solution

1. Add `this.guitarNeckService.scaleChordState = null;` at the start of both `displayScale()` and `displayChord()` in [`FretboardOrchestrationService`](src/app/services/fretboard-orchestration.service.ts).
2. Add `this.patternBuilder.relatedChord = null;` in [`handleShowPattern()`](src/app/domain/domain.service.ts:104) after `setCurrentPattern()`.

## MVP

- `scaleChordState` is cleared in `displayScale()` and `displayChord()`
- `relatedChord` is cleared in `handleShowPattern()`
- After compare → show-scale, markers show interval-based colors
- After compare → show-chord, pattern display shows chord only once
- All existing tests pass

## Done when

- `npm test` passes
- `npm run build` succeeds
- Manual test: Compare (e.g. C major + Cmaj7) → Show Scale (C major) → markers show interval colors, not role colors
- Manual test: Compare (e.g. C major + Cmaj7) → Show Chord (Cmaj7) → pattern display shows chord once, not twice

## Status

FIXED

# P6: Compare mode — marker display mode forced to note-names

## Motivation

In Compare mode (scale + chord relation), the marker display mode selector from [`<app-legend>`](src/app/legend/legend.component.html:24-34) is hidden because [`home-page.component.html`](src/app/home-page/home-page.component.html:24-27) shows `<app-relationship-strip>` instead. The `interval-colors` option is meaningless in compare mode because role-based CSS overrides interval colors anyway. Only `note-names` and `neutral-dots` would be useful.

## Solution

Force the marker display mode to `note-names` when entering Compare mode. This is a pragmatic decision: in compare mode, markers show role-based colors (scale-tone, chord-tone, etc.), so interval colors are irrelevant. Note names provide the most useful information alongside role colors.

Implementation: in [`handleComparePatterns()`](src/app/domain/domain.service.ts:152), set `markerDisplayMode: 'note-names'` in the emitted state.

## MVP

- Compare mode always uses `note-names` marker display mode
- Switching back to Show Scale/Chord restores the previous marker display mode
- All existing tests pass

## Done when

- `npm test` passes
- `npm run build` succeeds
- Manual test: Compare mode → markers show note names, not interval colors
- Manual test: Switch back to Show Scale → previous marker display mode is restored

## Status

FIXED

# P7: DomainService — BehaviorSubject → signal

## Motivation

[`DomainService`](src/app/domain/domain.service.ts:29) uses `BehaviorSubject<DomainState>` to manage application state. This requires a hack in [`HomePageComponent`](src/app/home-page/home-page.component.ts:54) — `this.domainService.state$.subscribe(() => this.appRef.tick())` — to force change detection when commands are executed from the browser console. Angular 18 has full signal support, which would:

1. Eliminate the `appRef.tick()` hack — signals automatically trigger change detection
2. Reduce boilerplate (no `BehaviorSubject` + `asObservable()` + getter)
3. Align with the rest of the codebase (components already use signals)
4. Enable future migration to zoneless change detection

## Solution

Replace `BehaviorSubject<DomainState>` with `signal<DomainState>` in `DomainService`:

```typescript
import { signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

private state = signal<DomainState>(DEFAULT_DOMAIN_STATE);

// Observable for external consumers (AI chat)
state$: Observable<DomainState> = toObservable(this.state);

get currentState(): DomainState {
  return this.state();
}

private emitState(newState: DomainState): DomainResult<DomainState> {
  this.state.set(newState);
  return { success: true, data: newState };
}
```

Changes needed:
1. [`DomainService`](src/app/domain/domain.service.ts) — replace `BehaviorSubject` with `signal`, add `toObservable()` for `state$`
2. [`HomePageComponent`](src/app/home-page/home-page.component.ts) — remove `appRef.tick()` subscription, remove `ApplicationRef` dependency
3. All consumers of `currentState` — no changes needed (getter stays)
4. Tests — verify `state$` subscription still works (may need `TestBed.flushEffects()`)

## MVP

- `DomainService` uses `signal<DomainState>` internally
- `state$` is exposed as `Observable` via `toObservable()` for AI chat compatibility
- `currentState` getter works identically
- `HomePageComponent` no longer injects `ApplicationRef` or subscribes to `state$`
- All existing tests pass

## Done when

- `grep -n 'BehaviorSubject' src/app/domain/domain.service.ts` returns zero results
- `grep -n 'appRef.tick' src/app/` returns zero results
- `grep -n 'ApplicationRef' src/app/home-page/home-page.component.ts` returns zero results
- `npm test` passes
- `npm run build` succeeds
- Manual test: all commands from toolbox still work correctly

## Status

FIXED

# P8: Extract exotic patterns from tonal-adapter.ts into dedicated file

## Motivation

[`tonal-adapter.ts`](src/app/shared/tonal-adapter.ts:126-140) currently hardcodes two sets of pattern names that Tonal.js does not support:

- `SCALES_NOT_IN_TONAL` — 8 scales (`melodic-minor-descending`, `neapolitan-minor`, `byzantine-scale`, `arabic-scale`, `japanese-scale`, `flamenco-scale`, `tritone-scale`, `custom_metal_riff`)
- `CHORDS_NOT_IN_TONAL` — 1 chord (`add11`)

These are checked in [`TonalFacadeService`](src/app/services/tonal-facade.service.ts:87-88) to decide whether to use Tonal.js or fallback to `guitar-neck-shared` patterns. This approach does not scale — adding a new exotic pattern requires:
1. Adding to `SCALES_NOT_IN_TONAL` or `CHORDS_NOT_IN_TONAL` in `tonal-adapter.ts`
2. Adding the pattern definition to `guitar-neck-shared` (npm package → release cycle)

## Solution

Create a local file [`exotic-patterns.ts`](src/app/shared/) that contains both the pattern definitions (name + intervals) and the set of names not in Tonal. This eliminates the dependency on `guitar-neck-shared` for pattern fallback and makes adding new patterns a single-file change.

```typescript
// src/app/shared/exotic-patterns.ts
export interface ExoticPattern {
  name: string;
  intervals: number[];
}

export const EXOTIC_SCALES: ExoticPattern[] = [
  { name: 'melodic-minor-descending', intervals: [2, 1, 2, 2, 1, 2, 2] },
  // ...
];

export const EXOTIC_CHORDS: ExoticPattern[] = [
  { name: 'add11', intervals: [4, 3, 5] },
  // ...
];

/** Set of scale names not available in Tonal.js. */
export const SCALES_NOT_IN_TONAL = new Set(EXOTIC_SCALES.map(s => s.name));

/** Set of chord names not available in Tonal.js. */
export const CHORDS_NOT_IN_TONAL = new Set(EXOTIC_CHORDS.map(c => c.name));
```

Then:
1. Move `SCALES_NOT_IN_TONAL` and `CHORDS_NOT_IN_TONAL` from `tonal-adapter.ts` to `exotic-patterns.ts`
2. Update `TonalFacadeService` to import from `exotic-patterns.ts` instead of `tonal-adapter.ts`
3. Remove `guitar-neck-shared` dependency from `TonalFacadeService` (it already has `resolveFromPatterns()` which works with any `{name, intervals}[]`)

## MVP

- `exotic-patterns.ts` contains all exotic scale and chord definitions
- `SCALES_NOT_IN_TONAL` and `CHORDS_NOT_IN_TONAL` are removed from `tonal-adapter.ts`
- `TonalFacadeService` imports exotic patterns from the new file
- Adding a new exotic pattern requires only editing `exotic-patterns.ts`
- All existing tests pass

## Done when

- `grep -n 'SCALES_NOT_IN_TONAL\|CHORDS_NOT_IN_TONAL' src/app/shared/tonal-adapter.ts` returns zero results
- `grep -n 'SCALES_NOT_IN_TONAL\|CHORDS_NOT_IN_TONAL' src/app/services/tonal-facade.service.ts` imports from `exotic-patterns.ts`
- New exotic pattern can be added by editing one file (`exotic-patterns.ts`)
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED

# P9: Eliminate state duplication — DomainState vs FretboardStateService

## Motivation

Three fields are duplicated between `DomainState` (canonical state) and `FretboardStateService` (legacy):
- `fretRange` / `fretRange`
- `enabledStrings` / `activeStrings`
- `markerDisplayMode` / `markerDisplayMode`

Consumers already read from `DomainService.currentState`, but `FretboardStateService` still holds these fields. This creates two sources of truth.

## Solution

Remove `fretRange`, `activeStrings`, `markerDisplayMode`, `toggleString()`, `resetActiveStrings()` from `FretboardStateService`. All consumers already use `DomainService.currentState` for reads and `execute({ type: 'set-view', ... })` for writes.

## MVP

- `FretboardStateService` no longer has `fretRange`, `activeStrings`, `markerDisplayMode`
- All consumers read/write through `DomainService`
- All existing tests pass

## Done when

- `grep -n 'fretRange\|activeStrings\|markerDisplayMode\|toggleString\|resetActiveStrings' src/app/services/fretboard-state.service.ts` returns zero results
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED

# P10: Angular 18→22 upgrade + OnPush + signals migration

## Motivation

After merge [`e775f2c`](https://github.com/amadler/Guitar-neck-app/commit/e775f2c64b67d83d51fa0f2204cf2e9585a87881), Angular was upgraded from 18 to 22 across the entire project. This major version jump required migrating from `BehaviorSubject` to `signal()`, adopting `ChangeDetectionStrategy.OnPush` everywhere, and removing legacy patterns like `appRef.tick()`.

## Solution

1. **Angular 22** — all `@angular/*` packages updated to `^22.1.5`, TypeScript to `^6.0.3`, `@angular/build` to `^22.1.7`
2. **OnPush** — all 12 components use `ChangeDetectionStrategy.OnPush`
3. **Signals** — `DomainService` replaced `BehaviorSubject<DomainState>` with `signal<DomainState>` + `asReadonly()`, `FretboardStateService` uses signals for `hasActiveResult`, `currentSelection`, `scaleChordState`, `PatternBuilderService` uses signals for `currentPattern`, `relatedChord`, `MarkerRoleService` uses signal for `lastRoles`, `ToolboxBuilderComponent` uses 8 signals for form state, `HomePageComponent` uses signal for `displayMode`
4. **`appRef.tick()` removed** — no `ApplicationRef` injection or `state$.subscribe()` in `HomePageComponent`
5. **Test runner** — migrated from Karma to Vitest (`@angular/build:unit-test` with `"runner": "vitest"`)

## MVP

- All packages updated to Angular 22
- All components use OnPush
- No `BehaviorSubject` in the codebase
- No `appRef.tick()` or `ApplicationRef` in components
- `npm run build` succeeds
- `npm test` passes (174 tests)

## Done when

- `grep -n 'BehaviorSubject' src/` returns zero results
- `grep -n 'appRef.tick' src/` returns zero results
- `grep -n 'ApplicationRef' src/app/home-page/home-page.component.ts` returns zero results
- `grep -n 'ChangeDetectionStrategy.Default' src/` returns zero results
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED

# P11: Migrate @Input/@Output decorators → input()/output() functions

## Motivation

Angular 18+ introduced `input()` and `output()` functions as the modern replacement for `@Input`/`@Output` decorators. These are required for future zoneless change detection and provide better type safety (readonly signals, no accidental reassignment). Five components still used decorators after the Angular 22 upgrade.

## Solution

Migrate all `@Input()`/`@Output()` decorators to `input()`/`output()` functions:

| Component | Before | After |
|-----------|--------|-------|
| [`FreatboardComponent`](src/app/freatboard/freatboard.component.ts:24-25) | `@Input() notes`, `@Output() onNoteClicked$` | `input.required<GuitarNote[]>()`, `output<GuitarNote>()` |
| [`ToolboxBuilderComponent`](src/app/toolbox/toolbox-builder.component.ts:33) | `@Output() toolboxEvent` | `output<DomainCommand>()` |
| [`DropdownComponent`](src/app/toolbox/dropdown.component.ts:97-103) | `@Input() options`, `@Output() valueChange` | `input<T[]>([])`, `output<T>()` |
| [`RangeToolbarComponent`](src/app/range-toolbar/range-toolbar.component.ts:21) | `@Output() rangeChange` | `output<{ minFret, maxFret }>()` |
| [`StringToggleComponent`](src/app/string-toggle/string-toggle.component.ts:36-41) | `@Input() stringName`, `@Output() stringToggled` | `input.required<string>()`, `output<{ stringIndex, active }>()` |

## MVP

- All 5 components use `input()`/`output()` instead of decorators
- Tests updated to use `fixture.componentRef.setInput()` instead of direct property assignment
- All existing tests pass
- `npm run build` succeeds

## Done when

- `grep -n '@Input(' src/app/` returns zero results
- `grep -n '@Output(' src/app/` returns zero results
- `npm test` passes
- `npm run build` succeeds

## Status

FIXED