# Changelog

All notable changes to the **Guitar Neck UI** project are documented in this file.

Format oparty na [Keep a Changelog](https://keepachangelog.com/),
a projekt stosuje [Semantic Versioning](https://semver.org/).

---

## [0.7.0] — 2025-07-05

### Fixed
- `FretboardStateService.applyHighlightedNotes()` — replaced O(n) `Array.filter()` note lookup with O(1) `Map<string, GuitarNote>` lookup for ~150× performance improvement on hot paths ([`src/app/services/guitar-neck.service.ts`](src/app/services/guitar-neck.service.ts:25))

### Performance
- Added `notesMap` in `FretboardStateService` — O(1) note lookup keyed by `"${string}-${fret}"`, rebuilt once in constructor via `buildNotesMap()`

---

## [0.6.0] — 2025-04-15 (ostatnia wersja)

### Added
- Nowe środowisko produkcyjne `environment.prod.ts` z docelowym API na `https://music-theory-api-grv0.onrender.com`
- Feature flag `chatEnabled: false` w konfiguracji środowiskowej
- Skrypt `npm run build:prod` dla production build
- Skrypty dockerowe: `docker:build`, `docker:up`, `docker:down`, `docker:logs`
- `Dockerfile` + `nginx.conf` dla deploymentu frontendu przez nginx
- `docker-compose.yml` łączący backend (`music-theory-api`) i frontend w jednym stacku
- Deployment TODO w [`TODO_DEPLOY.md`](TODO_DEPLOY.md)

### Changed
- Przeniesiono URL API z `scales-and-triads.service.ts` do zmiennych środowiskowych (`environment.apiUrl`)
- Wyłączono domyślnie AI Chat (`chatEnabled: false`)
- Rotacja klucza Gemini API — usunięto z frontendowego bundle'a

### Fixed
- `ToolboxSearchQuery` typing — usunięto zbędne `CustomToolboxSearchQuery` i `isCustomToolboxSearchQuery()`
- `refreshNotesInRange()` dead code — usunięta z `freatboard.component.ts`
- Przywrócono etykiety strun (open-string names) nad gryfem

---

## [0.5.0] — 2025-03-20

### Added
- `MetronomeComponent` — interaktywny metronom z:
  - Silnikiem `AudioContext` (`MetronomeEngineService`) z schedulerem dźwięku
  - Tap-tempo (do 6 tapnięć, reset po 2s)
  - Obsługą metrum 2/4, 3/4, 4/4, 6/8
  - Zakresem tempa 20–300 BPM
  - Wizualnym wskaźnikiem bieżącego uderzenia (`currentBeat`)
- `PracticePrompts` — podpowiedzi ćwiczeń dla skal i akordów w [`practice-prompts.data.ts`](src/app/shared/practice-prompts.data.ts)
- `PatternDisplayComponent` — panel wyświetlający szczegóły aktualnego patternu wraz z podpowiedziami
- `PatternInfo` model i metoda `setCurrentPattern()` w `FretboardStateService`
- `LegendComponent` — legenda kolorów interwałowych

---

## [0.4.0] — 2025-02-15

### Added
- `MarkerDisplayMode` — 3 tryby wyświetlania znaczników na gryfie:
  - `interval-colors` — kolory interwałowe (domyślny)
  - `note-names` — nazwy nut na progach
  - `neutral-dots` — neutralne kropki
- `LoadingService` z licznikiem żądań (`requestCount`) — pokazuje/ukrywa loader przy zapytaniach HTTP
- `HeaderComponent` z automatycznym modalem pomocy (przy pierwszej wizycie, wykrywanie przez `localStorage`)
- `FooterComponent`
- `StringToggleComponent` — włączanie/wyłączanie poszczególnych strun
- `RangeToolbarComponent` — selektor zakresu progów z presetami

---

## [0.3.0] — 2025-01-15

### Added
- Integracja z `guitar-toolbox-lib` (npm) — formularz toolbox (`ToolboxFormComponent`, selektor `lib-toolbox-form`)
- Integracja z `guitar-neck-shared` (npm) — stałe, patterny akordów (26) i skal (26)
- Obsługa 26 patternów skal i 26 patternów akordów przez backend API
- `MusicPatternApiService` (`scales-and-triads.service.ts`) — HTTP → `music-theory-api`
- `DisplayCustomPatternCommand` — obsługa własnych interwałów użytkownika
- `IntervalService` (`interval.service.ts`) — oznaczanie nut interwałami (root, 2nd, 3rd, 4th, 5th, 6th, 7th, małe/wielkie)
- Pełny przepływ danych: Toolbox → Command → Facade → API → PositionService → StateService → IntervalService → UI
- `interval-note.helper.ts` — helper do generowania nut z interwałów

---

## [0.2.0] — 2024-11-01

### Added
- Wzorzec Command (`UICommands.ts`) — enkapsulacja operacji na gryfie jako osobnych komend:
  - `DisplaySingleNoteCommand` — wyświetlenie pojedynczej nuty
  - `DisplayAllNotesCommand` — wyświetlenie wszystkich nut
  - `DisplayScaleCommand` — wyświetlenie skali
  - `DisplayChordCommand` — wyświetlenie akordu
  - `DisplayCustomPatternCommand` — wyświetlenie własnego patternu
- Fasada `FretboardOrchestrationService` (`music-theory-facade.service.ts`) ukrywająca złożoność serwisów przed komponentami UI
- `FretboardStateService` (`guitar-neck.service.ts`) — centralny stan gryfu (visible, selected, interval)
- `FretboardNotePositionService` (`note.service.ts`) — generowanie mapy nut na gryfie (6 strun × 24 progi) i wyszukiwanie pozycji
- Routing Angular: ścieżka `''` → `HomePageComponent`
- `HomePageComponent` — agregacja toolboxa i gryfu na jednej stronie

---

## [0.1.0] — 2024-09-15

### Added
- Inicjalizacja projektu Angular 18 z **standalone components** (brak `NgModule`)
- Konfiguracja TypeScript 5.5, RxJS 7.8
- `app.config.ts` z `provideHttpClient()`, `provideRouter()`, `provideAnimations()`
- Interaktywny gryf gitary (`FreatboardComponent`):
  - Wizualizacja nut na 6 strunach × 24 progi
  - Klikalne nuty z zaznaczaniem (`selected`)
  - Klasy CSS dla root, interwałów
  - Responsywny layout
- `GuitarNeckComponent` — kontener inicjalizujący gryf
- `GuitarNeck.ts` — klasa generująca tablicę gryfu (6 strun × 25 progów)
- Model `GuitarNote` z polami: id, string, fret, note, visible, selected, interval
- Podstawowe style w `styles.scss` z zmiennymi CSS i ciemną paletą kolorów
- Konfiguracja testów: Karma 6.4 + Jasmine 5.2 + ChromeHeadless
- Pliki dokumentacji: [`PRODUCT_OVERVIEW.md`](PRODUCT_OVERVIEW.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`DEVELOPMENT.md`](DEVELOPMENT.md), [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)

---

## [0.0.0] — 2024-08-01

### Added
- Generacja szkieletu projektu przez Angular CLI 18
- Podstawowy `package.json` z zależnościami Angular, RxJS, Zone.js
- Konfiguracja TypeScript (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`)
- Plik `angular.json` z konfiguracją builda
- Plik `.editorconfig`
- Plik `.gitignore`

---

## Postponed

Poniższe funkcjonalności zostały zidentyfikowane w kodzie, ale nie są aktywnie rozwijane:

| Funkcjonalność | Status | Przyczyna |
|---------------|--------|-----------|
| **AI Chat (Gemini)** — biblioteka `projects/guitar-chat` z `ChatComponent`, `AISuggestionsComponent`, `AIFacadeService`, `AIService`, `AISuggestionService` | POSTPONED | Wymaga klucza API Gemini i włączenia flagi `chatEnabled: true` |
| **Note readability na gryfie** — poprawa czytelności nazw nut | POSTPONED | Wymaga redesignu wizualnego znaczników |

---

## Backlog

Pełny backlog znajduje się w [`BACKLOG.md`](BACKLOG.md). Otwarte zadania:

- Refactor `toolboxSubmit()` w `HomePageComponent` na command factory lub prywatne metody budujące
- Pattern name Unicode w backendzie (`music-theory-api`) — `:name` param nie dekodowany
- Fret numbering starts at 0 — zmiana w template na `fret + 1`
- Usunięcie nieużywanego `uuid` z modelu `GuitarNote`
- `FretboardStateService` O(n) → O(1) — zastąpienie `Array.find` mapą
- Template bezpośrednio wywołuje serwisy — przeniesienie logiki do komponentu
- UI Color Palette Refresh — odświeżenie palety kolorów interwałowych
- MusicSelection domain abstraction — abstrakcja dla wyboru elementów muzycznych

---

_Wersja 0.0.0 w [`package.json`](package.json) oznacza, że projekt nie doczekał się jeszcze formalnego release'a. Kolejne wersje w changelogu odzwierciedlają fazy rozwoju na podstawie analizy kodu źródłowego._
