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

Create a single `INTERVAL_CONFIG` array in `guitar-neck-shared` (the shared library already used by both projects) that contains all properties for each interval:

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

## MVP

- `INTERVAL_CONFIG` is exported from `guitar-neck-shared`
- Toolbox `INTERVAL_OPTIONS` is derived from `INTERVAL_CONFIG`
- `home-page.component.ts` `semitoneMap` is replaced by lookup in `INTERVAL_CONFIG`
- `pattern-builder.service.ts` `SEMITONE_TO_INTERVAL` is replaced by lookup in `INTERVAL_CONFIG`
- `note-utils.ts` `CHROMA_TO_INTERVAL` is replaced by lookup in `INTERVAL_CONFIG`
- `tonal-adapter.ts` `INTERVAL_MAP` is replaced by lookup in `INTERVAL_CONFIG`
- All existing tests pass

## Done when

- `grep -n 'INTERVAL_LABELS\|INTERVAL_OPTIONS\|semitoneMap\|SEMITONE_TO_INTERVAL\|CHROMA_TO_INTERVAL\|INTERVAL_MAP' src/` returns zero results (except the new single source)
- Toolbox dropdown shows same intervals as before
- All interval colors work correctly
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN

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

OPEN

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

OPEN