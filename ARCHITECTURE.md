# Guitar Neck UI — Architektura Systemu

## Przegląd Architektury
Aplikacja wykorzystuje architekturę warstwową opartą na wzorcu **Facade**, z centralnym zarządzaniem stanem gryfu i **synchronicznym silnikiem teorii muzyki** (Tonal.js).

System składa się z 2 części:
1. **`guitar-neck-ui`** — Angular 18 frontend (to repo)
2. **`guitar-toolbox-lib`** — lokalny workspace (`file:../guitar-toolbox/dist/guitar-toolbox-lib`) z komponentem toolbox

Logika teorii muzyki (skale, akordy, interwały) jest obliczana lokalnie przez **Tonal.js** — nie ma zależności od backendu `music-theory-api`.

## Główne Komponenty Systemu

### 1. Warstwa Prezentacji (UI)

| Komponent | Selektor | Odpowiedzialność | Źródło |
|-----------|----------|-----------------|--------|
| `HeaderComponent` | `app-header` | Nagłówek strony z logo i nawigacją | `src/app/header` |
| `HomePageComponent` | `app-home-page` | Agreguje gryf + toolbox + metronom | `src/app/home-page` |
| `FreatboardComponent` | `app-freatboard` | Renderuje gryf z nutami i interwałami/rolami | `src/app/freatboard` |
| `GuitarNeckComponent` | `app-guitar-neck` | Kontener inicjalizujący gryf | `src/app/guitar-neck` |
| `LegendComponent` | `app-legend` | Legenda kolorów interwałowych | `src/app/legend` |
| `RelationshipStripComponent` | `app-relationship-strip` | Legenda ról scale+chord | `src/app/relationship-strip` |
| `RangeToolbarComponent` | `app-range-toolbar` | Selektor zakresu progów (presety) | `src/app/range-toolbar` |
| `StringToggleComponent` | `app-string-toggle` | Włączanie/wyłączanie poszczególnych strun | `src/app/string-toggle` |
| `PatternDisplayComponent` | `app-pattern-display` | Panel wyświetlający szczegóły patternu + practice prompts | `src/app/pattern-display` |
| `MetronomeComponent` | `app-metronome` | Metronom z AudioContext i tap-tempo | `src/app/metronome` |
| `FormsWrapperComponent` | `lib-forms-wrapper` | Formularz wyboru skali/akordu/custom pattern (z `guitar-toolbox-lib`) | `../guitar-toolbox` |
| `ChatComponent` | `lib-chat` | **POSTPONED** — czat AI | `projects/guitar-chat` |
| `AISuggestionsComponent` | `lib-ai-suggestions` | **POSTPONED** — sugestie AI | `projects/guitar-chat` |
| `FooterComponent` | `app-footer` | Stopka strony z informacjami o projekcie | `src/app/footer` |

### 2. Warstwa Serwisów

#### Core Services (`src/app/services`)

| Serwis (klasa) | Plik | Odpowiedzialność |
|---------------|------|-----------------|
| `AppStateService` | `app-state.service.ts` | Tryb aplikacji: `custom-pattern` / `scale-or-chord` / `scale-chord` |
| `FretboardOrchestrationService` | `fretboard-orchestration.service.ts` | **Orkiestrator** — koordynuje pipeline: teoria → pozycje → podświetlenie → interwały. Używa TonalFacadeService. |
| `FretboardStateService` | `fretboard-state.service.ts` | Stan gryfu — visible, selected, interval, ScaleChordState, activeStrings, markerDisplayMode |
| `FretboardNotePositionService` | `note.service.ts` | Generuje mapę nut na gryfie, wyszukuje pozycje |
| `FretboardNoteQueryService` | `fretboard-note-query.service.ts` | Zapytania o nuty na gryfie (isNoteOnFret, getNote, getNoteName) |
| `MarkerRoleService` | `marker-role.service.ts` | Oblicza role wizualne (scale-tone, chord-root, chord-tone-outside-scale itd.) |
| `FretboardDisplayService` | `fretboard-display.service.ts` | Klasa CSS dla znaczników: interwałowa lub role-based |
| `PatternBuilderService` | `pattern-builder.service.ts` | Buduje `PatternInfo` dla UI (nut, interwałów, kroków W/H) |

#### AI Services (`projects/guitar-chat`) — POSTPONED

| Serwis | Odpowiedzialność |
|--------|-----------------|
| `AIService` | Komunikacja z Gemini API |
| `AISuggestionService` | Zarządzanie sugestiami AI |
| `AIFacadeService` | Fasada AI → UI |

### 3. Komunikacja Toolbox → UI (FretboardCommand)

Toolbox (`FormsWrapperComponent`) komunikuje się z `HomePageComponent` przez event `FretboardCommand`:

```typescript
// Z guitar-toolbox-lib
type FretboardCommand =
  | { kind: 'scale'; key: string; scaleType: string }
  | { kind: 'chord'; key: string; chordType: string }
  | { kind: 'intervalPattern'; key: string; intervals: number[] }
  | { kind: 'scaleChordRelation'; scaleKey: string; scaleType: string; chordKey: string; chordType: string };
```

`HomePageComponent.onToolboxEvent()` dispatchuje bezpośrednio do serwisów — **nie używa już Command Pattern**.

### 4. Model Danych

```typescript
// src/app/shared/model/guitarNote.ts
class GuitarNote {
  string: number;     // 1-6
  fret: number;       // 0-24
  note: string;       // "C", "F#", itd.
  visible: boolean;
  selected: boolean;
  interval: string;   // "root", "major-3rd", ""
}

// src/app/shared/model/music-selection.ts
type MusicSelectionType = 'scale' | 'chord' | 'note' | 'custom' | 'all-notes';

interface MusicSelection {
  type: MusicSelectionType;
  name?: string;        // pattern name for scale/chord
  rootNote?: string;    // root/tonic note
  notes?: string[];     // resolved note names
  intervals?: number[]; // semitone intervals for custom patterns
}
```

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
User → FormsWrapperComponent (select type, pattern, key)
  → HomePageComponent.onToolboxEvent(FretboardCommand)
    → FretboardOrchestrationService.displayScale / displayChord / displayCustomPattern / displayScaleWithChord
      → [Tonal.js] scaleGet() / chordGet() → string[]
      → Fallback: CHORD_PATTERNS / SCALE_PATTERNS dla patternów spoza Tonal
      → FretboardNotePositionService.findPositionsByScaleNotes / ByChordNotes
      → FretboardStateService.applyHighlightedNotes
      → [inline] markIntervals() — distance() + INTERVAL_MAP
    → GuitarNote[] → FreatboardComponent
      → NgClass: guitar-neck__root, guitar-neck__major-3rd, itd.
```

### Przepływ Scale-Chord (tryb scale-chord)

```
FormsWrapperComponent (wybór skali + akordu)
  → HomePageComponent.onToolboxEvent({ kind: 'scaleChordRelation' })
    → FretboardOrchestrationService.displayScaleWithChord(scale, root, chord, chordRoot)
      → [Tonal.js] scaleGet(root, scaleName) → scale notes
      → [Tonal.js] chord(root, chordName) → chord notes
      → FretboardNotePositionService.findPositionsByScaleNotes(scaleNotes)
      → FretboardNotePositionService.findPositionsByScaleNotes(outsideChordNotes)
      → FretboardStateService.applyHighlightedNotes(union)
      → MarkerRoleService.computeRoles(allNotes, scale, chord)
        → 5 role CSS classes: scale-tone, chord-tone, scale-root, chord-root, chord-tone-outside-scale
      → Interval marking skipped (role-based instead)
      → FretboardStateService.scaleChordState = { scale, chord }
    → PatternBuilderService.setCurrentPattern() + setRelatedChord()
    → RelationshipStripComponent (zamiast LegendComponent)
    → FreatboardComponent: getRoleCssClass() zamiast getMarkerCssClass()
```

## Wzorce Projektowe

### 1. Facade Pattern
`FretboardOrchestrationService` ukrywa złożoność (Tonal.js, wyszukiwanie pozycji, interwały) przed komponentami UI.

### 2. Service Pattern
Każda odpowiedzialność w osobnej klasie: `FretboardNotePositionService` → geometria, `FretboardStateService` → stan, `MarkerRoleService` → role wizualne, `FretboardNoteQueryService` → zapytania.

### 3. Event-driven Communication
Toolbox komunikuje się z `HomePageComponent` przez `@Output() toolboxEv: EventEmitter<FretboardCommand>` — prostsze niż Command Pattern, wystarczające dla obecnej architektury.

## Silnik Teorii Muzyki (Tonal.js)

Logika teorii muzyki jest obliczana lokalnie przez **Tonal.js** (`@tonaljs/tonal` v4):

| Funkcja | Tonal | Użycie |
|---------|-------|--------|
| Nuty skali | `scaleGet(root + name).notes` | `displayScale()`, `displayScaleWithChord()` |
| Nuty akordu | `chord(root + type).notes` | `displayChord()`, `displayScaleWithChord()` |
| Nazwy interwałów | `distance(from, to)` → `INTERVAL_MAP` | `markIntervals()` |
| Detekcja skali | `detect(notes)` | Przyszłe: AI teacher |
| Akordy diatoniczne | `majorKey(root).chords` | Przyszłe: AI teacher |

### Fallback dla patternów spoza Tonal

Nie wszystkie patterny z `guitar-neck-shared` istnieją w Tonal.js. Dla nich używany jest fallback:

```typescript
// src/app/services/tonal-facade.service.ts
private resolveFromPatterns(patternName, rootNote, patterns): { simplified, raw }
```

**Skale spoza Tonal**: `melodic-minor-descending`, `neapolitan-minor`, `byzantine-scale`, `arabic-scale`, `japanese-scale`, `flamenco-scale`, `tritone-scale`, `custom_metal_riff`

**Akordy spoza Tonal**: `add11` (obsługiwany ręcznie)

Adapter mapowania nazw: [`src/app/shared/tonal-adapter.ts`](src/app/shared/tonal-adapter.ts) — mapuje nazwy UI (`dominant-7th`) na nazwy Tonal (`7`).

## Konfiguracja Środowiska

```typescript
// src/environments/environment.ts
const environment = {
  production: false,
  geminiApiKey: '',
  features: { chatEnabled: false }
};
```

Brak `apiUrl` — wszystkie obliczenia są lokalne (Tonal.js).

## Integracja z guitar-toolbox-lib

Toolbox jest lokalnym workspace (nie npm package):

```json
// package.json
"guitar-toolbox-lib": "file:../guitar-toolbox/dist/guitar-toolbox-lib"
```

### Kontrakt integracji

| Aspekt | Szczegóły |
|--------|-----------|
| **Event** | `@Output() toolboxEv: EventEmitter<FretboardCommand>` |
| **Selektor** | `lib-forms-wrapper` |
| **Styling** | CSS Custom Properties (patrz ARCHITECTURE.md w toolbox) |
| **Build** | `cd ../guitar-toolbox && ng build guitar-toolbox-lib` przed `npm run build` w GNUI |

### CSS Custom Properties API (kontrakt z toolbox)

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

## Backlog

Pełny backlog w [`BACKLOG.md`](BACKLOG.md). Podsumowanie stanu:

| Status | Liczba |
|--------|--------|
| OPEN | 3 |
| FIXED | 4 |
| POSTPONED | 3 |
| WON'T DO | 0 |