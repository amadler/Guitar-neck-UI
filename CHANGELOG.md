# Changelog

All notable changes to the **Guitar Neck UI** project are documented in this file.

Format oparty na [Keep a Changelog](https://keepachangelog.com/),
a projekt stosuje [Semantic Versioning](https://semver.org/).

---

## [0.7.0] — 2025-07-05

### Added
- `MusicSelection` domain abstraction — unified model for scale/chord/note/custom selection state ([`src/app/shared/model/music-selection.ts`](src/app/shared/model/music-selection.ts))

### Fixed
- `FretboardStateService.applyHighlightedNotes()` — replaced O(n) `Array.filter()` note lookup with O(1) `Map<string, GuitarNote>` lookup for ~150× performance improvement on hot paths ([`src/app/services/guitar-neck.service.ts`](src/app/services/guitar-neck.service.ts:25))
- `toolboxSubmit()` in `HomePageComponent` — refactored into private builder methods (`buildSingleNoteCommand()`, `buildScaleCommand()`, `buildChordCommand()`, `buildCustomPatternCommand()`) ([`src/app/home-page/home-page.component.ts`](src/app/home-page/home-page.component.ts:31))
- Pattern name Unicode in backend (`music-theory-api`) — URL `:name` parameter decoding using `decodeURIComponent()` ([`API_DOCUMENTATION.md`](API_DOCUMENTATION.md))
- `guitar-toolbox-lib` version bump to `^1.2.1` ([`package.json`](package.json))

### Performance
- Added `notesMap` in `FretboardStateService` — O(1) note lookup keyed by `"${string}-${fret}"`, rebuilt once in constructor via `buildNotesMap()`

---

## [0.6.0] — 2025-04-15 (last version)

### Added
- New production environment `environment.prod.ts` with target API at `https://music-theory-api-grv0.onrender.com`
- Feature flag `chatEnabled: false` in environment configuration
- Script `npm run build:prod` for production build
- Docker scripts: `docker:build`, `docker:up`, `docker:down`, `docker:logs`
- `Dockerfile` + `nginx.conf` for frontend deployment via nginx
- `docker-compose.yml` connecting backend (`music-theory-api`) and frontend in a single stack
- Deployment TODO in [`TODO_DEPLOY.md`](TODO_DEPLOY.md)

### Changed
- Moved API URL from `scales-and-triads.service.ts` to environment variables (`environment.apiUrl`)
- Disabled AI Chat by default (`chatEnabled: false`)
- Rotated Gemini API key — removed from frontend bundle

### Fixed
- `ToolboxSearchQuery` typing — removed redundant `CustomToolboxSearchQuery` and `isCustomToolboxSearchQuery()`
- `refreshNotesInRange()` dead code — removed from `freatboard.component.ts`
- Fret numbering starts at 0 — changed in template to `fret + 1` for compatibility with traditional fret marking
- Remove unused uuid from `GuitarNote` — removed redundant references in documentation and tests
- Template directly calling services — moved logic from templates to component methods
- Restored string labels (open-string names) above the fretboard

---

## [0.5.0] — 2025-03-20

### Added
- `MetronomeComponent` — interactive metronome with:
  - `AudioContext` engine (`MetronomeEngineService`) with sound scheduler
  - Tap-tempo (up to 6 taps, reset after 2s)
  - Time signature support: 2/4, 3/4, 4/4, 6/8
  - Tempo range 20–300 BPM
  - Visual indicator of the current beat (`currentBeat`)
- `PracticePrompts` — practice prompts for scales and chords in [`practice-prompts.data.ts`](src/app/shared/practice-prompts.data.ts)
- `PatternDisplayComponent` — panel displaying details of the current pattern along with prompts
- `PatternInfo` model and `setCurrentPattern()` method in `FretboardStateService`
- `LegendComponent` — interval color legend

---

## [0.4.0] — 2025-02-15

### Added
- `MarkerDisplayMode` — 3 marker display modes on the fretboard:
  - `interval-colors` — interval colors (default)
  - `note-names` — note names on frets
  - `neutral-dots` — neutral dots
- `LoadingService` with request counter (`requestCount`) — shows/hides loader during HTTP requests
- `HeaderComponent` with automatic help modal (on first visit, detected via `localStorage`)
- `FooterComponent`
- `StringToggleComponent` — toggle individual strings on/off
- `RangeToolbarComponent` — fret range selector with presets

---

## [0.3.0] — 2025-01-15

### Added
- Integration with `guitar-toolbox-lib` (npm) — toolbox form (`ToolboxFormComponent`, selector `lib-toolbox-form`)
- Integration with `guitar-neck-shared` (npm) — constants, chord patterns (26) and scale patterns (26)
- Support for 26 scale patterns and 26 chord patterns via backend API
- `MusicPatternApiService` (`scales-and-triads.service.ts`) — HTTP → `music-theory-api`
- `DisplayCustomPatternCommand` — custom user interval handling
- `IntervalService` (`interval.service.ts`) — marking notes with intervals (root, 2nd, 3rd, 4th, 5th, 6th, 7th, minor/major)
- Full data flow: Toolbox → Command → Facade → API → PositionService → StateService → IntervalService → UI
- `interval-note.helper.ts` — helper for generating notes from intervals

---

## [0.2.0] — 2024-11-01

### Added
- Command Pattern (`UICommands.ts`) — encapsulation of fretboard operations as separate commands:
  - `DisplaySingleNoteCommand` — display a single note
  - `DisplayAllNotesCommand` — display all notes
  - `DisplayScaleCommand` — display a scale
  - `DisplayChordCommand` — display a chord
  - `DisplayCustomPatternCommand` — display a custom pattern
- Facade `FretboardOrchestrationService` (`music-theory-facade.service.ts`) hiding service complexity from UI components
- `FretboardStateService` (`guitar-neck.service.ts`) — central fretboard state (visible, selected, interval)
- `FretboardNotePositionService` (`note.service.ts`) — generating note map on the fretboard (6 strings × 24 frets) and position lookup
- Angular routing: path `''` → `HomePageComponent`
- `HomePageComponent` — aggregation of toolbox and fretboard on a single page

---

## [0.1.0] — 2024-09-15

### Added
- Angular 18 project initialization with **standalone components** (no `NgModule`)
- TypeScript 5.5, RxJS 7.8 configuration
- `app.config.ts` with `provideHttpClient()`, `provideRouter()`, `provideAnimations()`
- Interactive guitar fretboard (`FreatboardComponent`):
  - Note visualization on 6 strings × 24 frets
  - Clickable notes with selection (`selected`)
  - CSS classes for root, intervals
  - Responsive layout
- `GuitarNeckComponent` — container initializing the fretboard
- `GuitarNeck.ts` — class generating the fretboard array (6 strings × 25 frets)
- `GuitarNote` model with fields: id, string, fret, note, visible, selected, interval
- Basic styles in `styles.scss` with CSS variables and dark color palette
- Test configuration: Karma 6.4 + Jasmine 5.2 + ChromeHeadless
- Documentation files: [`PRODUCT_OVERVIEW.md`](PRODUCT_OVERVIEW.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`DEVELOPMENT.md`](DEVELOPMENT.md), [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)

---

## [0.0.0] — 2024-08-01

### Added
- Project skeleton generated by Angular CLI 18
- Basic `package.json` with Angular, RxJS, Zone.js dependencies
- TypeScript configuration (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`)
- `angular.json` file with build configuration
- `.editorconfig` file
- `.gitignore` file

---

## Postponed

The following features have been identified in the codebase but are not being actively developed:

| Feature | Status | Reason |
|---------|--------|--------|
| **AI Chat (Gemini)** — library `projects/guitar-chat` with `ChatComponent`, `AISuggestionsComponent`, `AIFacadeService`, `AIService`, `AISuggestionService` | POSTPONED | Requires Gemini API key and enabling the `chatEnabled: true` flag |
| **Note readability on fretboard** — improving note name readability | POSTPONED | Requires visual redesign of markers |
| **UI Color Palette Refresh** — refresh of interval color palette | POSTPONED | Requires redesign with WCAG AA and color-blind support |

---

## Backlog

Full backlog is in [`BACKLOG.md`](BACKLOG.md). Open tasks:

- Localization (pl/en) for practice prompts — internationalization of practice prompts
- Metronome — visual beat indicator improvement — improvement of visual beat indicator

---

_Wersja 0.0.0 w [`package.json`](package.json) oznacza, że projekt nie doczekał się jeszcze formalnego release'a. Kolejne wersje w changelogu odzwierciedlają fazy rozwoju na podstawie analizy kodu źródłowego._
