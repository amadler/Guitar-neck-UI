# Guitar Neck UI - Architektura Systemu

## Przegląd Architektury
Aplikacja wykorzystuje architekturę warstwową opartą na wzorcu **Facade** i **Command Pattern**, z centralnym zarządzaniem stanem gryfu i asynchroniczną komunikacją z backendem `music-theory-api`.

System składa się z 3 części:
1. **`guitar-neck-ui`** — Angular 18 frontend (to repo)
2. **`music-theory-api`** — Backend Elysia, Docker, port 3000
3. **`guitar-neck-shared` + `guitar-toolbox-lib`** — npm pakiety z patternami i komponentem toolbox

## Główne Komponenty Systemu

### 1. Warstwa Prezentacji (UI)

| Komponent | Selektor | Odpowiedzialność | Źródło |
|-----------|----------|-----------------|--------|
| `HeaderComponent` | `app-header` | Nagłówek strony z logo i nawigacją | `src/app/header` |
| `HomePageComponent` | `app-home-page` | Agreguje gryf + toolbox | `src/app/home-page` |
| `FreatboardComponent` | `app-freatboard` | Renderuje gryf z nutami i interwałami | `src/app/freatboard` |
| `GuitarNeckComponent` | `app-guitar-neck` | Kontener inicjalizujący gryf | `src/app/guitar-neck` |
| `LegendComponent` | `app-legend` | Legenda kolorów interwałowych | `src/app/legend` |
| `RangeToolbarComponent` | `app-range-toolbar` | Selektor zakresu progów (presety) | `src/app/range-toolbar` |
| `StringToggleComponent` | `app-string-toggle` | Włączanie/wyłączanie poszczególnych strun | `src/app/string-toggle` |
| `PatternDisplayComponent` | `app-pattern-display` | Panel wyświetlający szczegóły patternu + practice prompts | `src/app/pattern-display` |
| `MetronomeComponent` | `app-metronome` | Metronom z AudioContext i tap-tempo | `src/app/metronome` |
| `ToolboxFormComponent` | `lib-toolbox-form` | Formularz wyboru skali/akordu (z `guitar-toolbox-lib`) | npm package |
| `ChatComponent` | `lib-chat` | **POSTPONED** — czat AI | `projects/guitar-chat` |
| `AISuggestionsComponent` | `lib-ai-suggestions` | **POSTPONED** — sugestie AI | `projects/guitar-chat` |
| `FooterComponent` | `app-footer` | Stopka strony z informacjami o projekcie | `src/app/footer` |

### 2. Warstwa Serwisów

#### Core Services (`src/app/services`)

| Serwis (klasa) | Plik | Odpowiedzialność |
|---------------|------|-----------------|
| `FretboardOrchestrationService` | `music-theory-facade.service.ts` | Fasada — wyświetlanie skal, akordów, nut |
| `FretboardStateService` | `guitar-neck.service.ts` | Stan gryfu — visible, selected, interval |
| `FretboardNotePositionService` | `note.service.ts` | Generuje mapę nut na gryfie, wyszukuje pozycje |
| `IntervalService` | `interval.service.ts` | Oznacza nuty interwałami (root, 3rd, 5th, itd.) |
| `MusicPatternApiService` | `scales-and-triads.service.ts` | HTTP → `music-theory-api` |
| `LoadingService` | `loading.service.ts` | Zarządza stanem ładowania (show/hide z requestCount) |

#### AI Services (`projects/guitar-chat`) — POSTPONED

| Serwis | Odpowiedzialność |
|--------|-----------------|
| `AIService` | Komunikacja z Gemini API |
| `AISuggestionService` | Zarządzanie sugestiami AI |
| `AIFacadeService` | Fasada AI → UI |

### 3. UICommands (Command Pattern)

```typescript
// src/app/shared/UICommands.ts
interface Command { execute(): void; }

class DisplaySingleNoteCommand    // keys: string
class DisplayAllNotesCommand      // (brak param)
class DisplayScaleCommand         // scaleName: string, rootNote: string
class DisplayChordCommand         // triadName: string, rootNote: string
class DisplayCustomPatternCommand // intervals: number[], rootNote: string
```

### 4. Model Danych

```typescript
// src/app/shared/model/guitarNote.ts
class GuitarNote {
  id?: string;        // UUID
  string: number;     // 1-6
  fret: number;       // 0-24
  note: string;       // "C", "F#", itd.
  visible: boolean;
  selected: boolean;
  interval: string;   // "root", "major-3rd", ""
}
```

> **Uwaga:** `ToolboxSearchQuery` pochodzi z zewnętrznego npm package — `guitar-toolbox-lib`.

### 5. Stałe i Konfiguracja (z `guitar-neck-shared`)

```typescript
// node_modules/guitar-neck-shared
neckConfig.chromaticNotes  // ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
neckConfig.stringNotes     // ["E","B","G","D","A","E"]
CHORD_PATTERNS             // 26 patternów akordów
SCALE_PATTERNS             // 26 patternów skal
```

## Przepływ Danych

```
User → ToolboxFormComponent (select type, pattern, key)
  → HomePageComponent.toolboxSubmit()
    → DisplayChordCommand / DisplayScaleCommand
      → FretboardOrchestrationService.displayChord / displayScale
        → MusicPatternApiService.resolveChordNotes / resolveScaleNotes
            → HTTP GET /api/chords/:name/:root (lub /api/scales/...)
        → FretboardNotePositionService.findPositionsByChordNotes / ByScaleNotes
        → FretboardStateService.applyHighlightedNotes
        → IntervalService.markIntervals(root, pattern, notes, 'chord'|'scale')
      → Observable<GuitarNote[]> → FreatboardComponent
        → NgClass: guitar-neck__root, guitar-neck__major-3rd, itd.
```

## Wzorce Projektowe

### 1. Facade Pattern
`FretboardOrchestrationService` ukrywa złożoność (HTTP API, wyszukiwanie pozycji, interwały) przed komponentami UI.

### 2. Command Pattern
`UICommands.ts` enkapsuluje każdą operację na gryfie jako osobną klasę Command.

### 3. Service Pattern
Każda odpowiedzialność w osobnej klasie: `FretboardNotePositionService` → geometria, `FretboardStateService` → stan, `IntervalService` → logika muzyczna, `MusicPatternApiService` → HTTP.

## Backend API (music-theory-api)

Osobne repozytorium, Docker na porcie 3000, framework Elysia.

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/scales` | Lista skal |
| GET | `/api/scales/:name/:root` | Nuty skali |
| GET | `/api/chords` | Lista akordów |
| GET | `/api/chords/:name/:root` | Nuty akordu |
| GET | `/api/find-compatible-scales/:name/:root` | Kompatybilne skale |

Uwaga: parametry `:name` i `:root` wymagają `decodeURIComponent()`.

## Konfiguracja Środowiska

```typescript
// src/environments/environment.ts
const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  geminiApiKey: '',
  features: { chatEnabled: false }
};
```

## Styling Strategy: Library vs Host App Separation

### Problem

`guitar-toolbox-lib` jest zewnętrznym workspace (npm package). Host app (`guitar-neck-ui`) definiuje style w `src/styles.scss`, które muszą być kompatybilne z markupem biblioteki. W przyszłości planowana jest podmiana biblioteki na wersję mobilną.

### Zasada separacji

| Odpowiedzialność | Kto | Przykład |
|-----------------|-----|----------|
| **Layout** (grid, flex, gap, padding, wewnętrzne rozmieszczenie) | Biblioteka | `.toolbox__form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: var(--toolbox-gap, 18px); }` |
| **Podstawowa geometria** (min-width, height elementów) | Biblioteka | `.toolbox__submit { min-width: 88px; height: 40px; }` |
| **Kolory, fonty, border-radius, cienie** (theme) | Host app przez CSS Custom Properties | `--toolbox-bg: var(--app-surface)` |
| **Responsywność** (breakpointy) | Host app | `@media (max-width: 900px) { ... }` |

### CSS Custom Properties API (kontrakt)

**Neutral fallback rule**: Biblioteka nie definiuje żadnych kolorów ani wartości wizualnych — nawet jako fallback CSS variables. Wszystkie color/background/border-color/radius wartości używają `transparent`, `inherit`, `currentColor` lub `0` jako fallback.

```css
/* Library — layout only, NO opinionated colors */
.toolbox__form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: var(--toolbox-gap, 18px);
  align-items: end;
  margin-bottom: 26px;
}

.toolbox__submit {
  min-width: 88px;
  height: 40px;
  background: var(--toolbox-accent, transparent);  /* neutral fallback */
  color: var(--toolbox-accent-text, inherit);       /* neutral fallback */
  border: none;
  border-radius: var(--toolbox-radius-sm, 0);       /* neutral fallback */
}

/* Host app sets values */
:root {
  --toolbox-bg: var(--app-surface);
  --toolbox-border-color: var(--app-border);
  --toolbox-radius: var(--radius-md);
  --toolbox-text: var(--app-text);
  --toolbox-accent: var(--green-800);
  --toolbox-accent-text: #ffffff;
}

/* Border is split: width/style in library, color in host */
/* Library: */
.toolbox__select {
  border-width: 1px;
  border-style: solid;
  border-color: var(--toolbox-border-color, transparent);
}
```

### CSS Variables API — pełna tabela

| Variable | Fallback | Kategoria |
|----------|----------|-----------|
| `--toolbox-bg` | `transparent` | Host — kolor tła |
| `--toolbox-text` | `inherit` | Host — kolor tekstu |
| `--toolbox-border-color` | `transparent` | Host — kolor obramowania |
| `--toolbox-radius` | `0` | Host — border radius |
| `--toolbox-radius-sm` | `0` | Host — border radius (mały) |
| `--toolbox-gap` | `18px` | Library — odstępy layout |
| `--toolbox-accent` | `currentColor` | Host — kolor akcentu |
| `--toolbox-accent-text` | `inherit` | Host — tekst na akcencie |
| `--toolbox-accent-bg` | `transparent` | Host — tło akcentu |
| `--toolbox-muted` | `inherit` | Host — kolor muted |

### Biblioteki zewnętrzne

| Biblioteka | Status | Źródło | Uwagi |
|-----------|--------|--------|-------|
| `guitar-neck-shared` | npm `^1.0.2` | zewnętrzne repo | Stałe, patterny, konfiguracja |
| `guitar-toolbox-lib` | npm `^1.0.2` | zewnętrzne repo | Toolbox form, custom pattern; style przez CSS vars |
| `guitar-chat` | lokalny workspace | `projects/guitar-chat` | AI chat — **POSTPONED** |

### Zagrożenia

- CSS variables kontrakt może się rozejść między wersjami biblioteki a hosta — wymaga semver + dokumentacji API
- Responsywność — biblioteka definiuje layout, ale breakpointy są w host app; biblioteka może wspierać `:host-context(.toolbox--compact)` lub data attribute

## Backlog

Pełny backlog w [`BACKLOG.md`](BACKLOG.md) (16 pozycji). Podsumowanie stanu:

| Status | Liczba |
|--------|--------|
| OPEN | 9 |
| FIXED | 4 |
| POSTPONED | 2 |
| WON'T DO | 0 |
