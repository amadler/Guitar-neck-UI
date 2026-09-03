# Guitar Neck UI — Dokumentacja API

## Domain Contract (nowość)

Wspólny kontrakt domeny dla Toolbox i AI. Zdefiniowany w [`src/app/domain/`](src/app/domain/).

- [Pełna dokumentacja Domain Contract API](docs/api/domain-contract-api.md)
- [ADR 0005 — decyzje architektoniczne](docs/adr/0005-domain-contract-toolbox-ai.md)
- [Glossary — Ubiquitous Language](docs/glossary.md)

**W skrócie:** `DomainService` przyjmuje `DomainCommand` (intencje użytkownika) i `DomainQuery` (odczyt stanu), zwraca `DomainResult<T>`. Toolbox i AI używają tego samego kontraktu.

```typescript
// Przykład: AI woła to samo co Toolbox
domainService.execute({
  type: 'show-pattern',
  patternType: 'scale',
  patternName: 'minor-pentatonic',
  rootNote: 'A'
});

// Odczyt stanu
domainService.query({ type: 'get-current-view' });
```

## Core Services

### FretboardOrchestrationService
Główna fasada integrująca logikę muzyczną. **Synchroniczna** — używa Tonal.js zamiast HTTP API.

```typescript
/**
 * @file src/app/services/fretboard-orchestration.service.ts
 */
class FretboardOrchestrationService {
  /**
   * Wyświetla skalę na gryfie z oznaczeniem interwałów.
   * @param scaleName - Nazwa skali (np. "major", "minor", "dorian")
   * @param rootNote - Nuta podstawowa (np. "C", "F#")
   * @returns GuitarNote[] - Zaznaczone nuty z interwałami
   */
  displayScale(scaleName: string, rootNote: string): GuitarNote[];

  /**
   * Wyświetla akord na gryfie z oznaczeniem interwałów.
   * @param triadType - Typ akordu (np. "major", "minor", "diminished")
   * @param rootNote - Nuta podstawowa (np. "C", "F#")
   * @returns GuitarNote[] - Zaznaczone nuty z interwałami
   */
  displayChord(triadType: string, rootNote: string): GuitarNote[];

  /**
   * Wyświetla pojedynczą nutę na gryfie.
   * @param noteName - Nazwa nuty (np. "C", "F#")
   */
  displaySingleNote(noteName: string): void;

  /**
   * Wyświetla wszystkie nuty na gryfie.
   */
  displayAllNotes(): void;

  /**
   * Resetuje gryf (ukrywa wszystkie nuty, usuwa interwały).
   */
  resetFretboard(): void;

  /**
   * Wyświetla custom pattern nut na gryfie z interwałami.
   * @param notes - Tablica nazw nut do wyświetlenia
   * @param rootNote - Nuta bazowa dla interwałów
   */
  displayCustomPattern(notes: string[], rootNote: string): GuitarNote[];

  // ---- Scale + Chord relation ----

  /**
   * Wyświetla skalę z nałożonym akordem w trybie scale-chord.
   *
   * 1. Oblicza nuty skali przez Tonal.js (scaleGet)
   * 2. Oblicza nuty akordu przez Tonal.js (chord)
   * 3. Znajduje pozycje dla nut skali ORAZ nut akordu spoza skali
   * 4. Zaznacza wszystkie (union) na gryfie przez applyHighlightedNotes()
   * 5. Pomija interwały — rolę wizualną przejmuje MarkerRoleService
   * 6. Ustawia scaleChordState w FretboardStateService
   * 7. Wywołuje MarkerRoleService.computeRoles() dla wszystkich nut
   *
   * @param scaleName - Nazwa skali (np. "major", "minor")
   * @param scaleRoot - Nuta podstawowa skali (np. "C", "F#")
   * @param chordName - Nazwa akordu (np. "major", "diminished")
   * @param chordRoot - Nuta podstawowa akordu (np. "E", "G#")
   * @returns GuitarNote[] - Zaznaczone nuty (skala + spoza-akord)
   */
  displayScaleWithChord(
    scaleName: string,
    scaleRoot: string,
    chordName: string,
    chordRoot: string,
  ): GuitarNote[];

  /**
   * Usuwa relację akordu, pozostawiając samą skalę.
   * Czyści MarkerRoleService.lastRoles.
   */
  clearRelation(): void;
}
```

#### Prywatne metody pomocnicze

```typescript
/**
 * Rozwiązuje nuty skali z nazwy UI.
 * Używa Tonal jeśli dostępny, fallback do SCALE_PATTERNS dla egzotycznych skal.
 */
private resolveScaleNotes(scaleName: string, rootNote: string): { simplified: string[]; raw: string[] }

/**
 * Rozwiązuje nuty akordu z nazwy UI.
 * Używa Tonal jeśli dostępny, fallback do CHORD_PATTERNS.
 * add11 obsługiwany ręcznie (Tonal nie ma).
 */
private resolveChordNotes(chordType: string, rootNote: string): { simplified: string[]; raw: string[] }

/**
 * Fallback: rozwiązuje nuty z CHORD_PATTERNS / SCALE_PATTERNS.
 * Używany dla patternów których Tonal nie zna.
 */
private resolveFromPatterns(
  patternName: string,
  rootNote: string,
  patterns: Array<{ name: string; intervals: number[] }>,
): { simplified: string[]; raw: string[] }

/**
 * Oznacza nuty interwałami, używając oryginalnych nazw Tonal do distance().
 */
private markIntervals(rootNote: string, rawNoteNames: string[], notes: GuitarNote[]): void

/**
 * Oznacza nuty interwałami dla custom patternu.
 */
private markCustomIntervals(rootNote: string, notes: GuitarNote[]): void

/**
 * Usuwa oznaczenia interwałowe z nut.
 */
private removeIntervals(notes: GuitarNote[]): void
```

### FretboardStateService
Zarządza stanem gryfu gitary — tablicą nut, widocznością, zaznaczeniem.

```typescript
/**
 * @file src/app/services/fretboard-state.service.ts
 */
class FretboardStateService {
  notes: GuitarNote[];        // Pełna tablica nut na gryfie (6 strun × 25 progów)
  activeStrings: boolean[];   // Per-string active state. Reset on clearFretboard().
  markerDisplayMode: MarkerDisplayMode;  // 'interval-colors' | 'note-names' | 'neutral-dots'
  hasActiveResult: boolean;   // Czy istnieje aktywny wynik na gryfie
  currentSelection: MusicSelection | null;  // Obecnie wybrany pattern
  scaleChordState: ScaleChordState | null;  // Dual selection state

  /**
   * Zaznacza nuty do wyświetlenia — ukrywa wszystkie, pokazuje tylko podane.
   * Używa O(1) lookup przez notesMap.
   * @returns GuitarNote[] - Tablica zaznaczonych nut
   */
  applyHighlightedNotes(notes: GuitarNote[]): GuitarNote[];

  /** Toggle a single string on/off. Used by StringToggleComponent. */
  toggleString(index: number, active: boolean): void;

  /** Ukrywa wszystkie nuty. */
  hideAllNotes(): void;

  /** Pokazuje wszystkie nuty. */
  showAll(): void;

  /** Czyści zaznaczenie nut. */
  clearSelection(): void;

  /** Czyści gryf — ukrywa nuty, usuwa interwały, czyści zaznaczenie. */
  clearFretboard(): void;
}

/**
 * Dual selection state for scale + chord relation.
 */
interface ScaleChordState {
  scale: MusicSelection;          // Wybrana skala z nutami
  chord: MusicSelection | null;   // Wybrany akord lub null
}

type MarkerDisplayMode = 'interval-colors' | 'note-names' | 'neutral-dots';
```

### FretboardNotePositionService
Generuje i zarządza pozycjami nut na gryfie.

```typescript
/**
 * @file src/app/services/note.service.ts
 */
class FretboardNotePositionService {
  guitarStrings: string[];  // Strojenie strun
  fretsCount: number;       // Liczba progów (24)
  guitarNotes: GuitarNote[]; // Wszystkie nuty na gryfie

  /**
   * Zwraca wszystkie pozycje nut na gryfie.
   */
  getAllPositions(): GuitarNote[];

  /**
   * Znajduje pozycje nut o podanej nazwie.
   */
  findPositionsByNoteName(noteName: string): GuitarNote[];

  /**
   * Znajduje pozycje nut dla skali (lub dowolnej listy nazw nut).
   */
  findPositionsByScaleNotes(scaleNotes: string[]): GuitarNote[];
}
```

### FretboardNoteQueryService
Warstwa zapytań o nuty na gryfie. Oddzielona od `FretboardStateService` żeby template nie miał bezpośredniego dostępu do stanu.

```typescript
/**
 * @file src/app/services/fretboard-note-query.service.ts
 */
class FretboardNoteQueryService {
  /**
   * Sprawdza czy na danym progu i strunie jest widoczna nuta.
   * Uwzględnia activeStrings — zwraca false jeśli struna jest wyłączona.
   */
  isNoteOnFret(stringIndex: number, fret: number): boolean;

  /**
   * Zwraca nutę na danym progu i strunie, lub undefined.
   */
  getNote(stringIndex: number, fret: number): GuitarNote | undefined;

  /**
   * Zwraca nazwę nuty na danym progu i strunie, lub pusty string.
   */
  getNoteName(stringIndex: number, fret: number): string;

  /**
   * Obsługa kliknięcia nuty na gryfie.
   * @returns GuitarNote | null - Kliknięta nuta lub null
   */
  fretNoteClicked(stringIndex: number, fret: number): GuitarNote | null;
}
```

### MarkerRoleService
Oblicza role wizualne dla nut na gryfie w trybie scale-chord.
Zastępuje kolory interwałowe rolami wizualnymi (złote obramowania).

```typescript
/**
 * @file src/app/services/marker-role.service.ts
 */

/**
 * 5 możliwych ról markera na gryfie w trybie scale+chord.
 */
type MarkerRole =
  | 'scale-tone'                  // Nuta należy do skali, NIE do akordu
  | 'chord-tone'                  // Nuta należy i do skali, i do akordu
  | 'scale-root'                  // Pryma skali
  | 'chord-root'                  // Pryma akordu (może być inna niż scale-root)
  | 'chord-tone-outside-scale';   // Nuta należy do akordu, NIE do skali

class MarkerRoleService {
  /**
   * Cache ostatnio obliczonych ról — odczyt przez FretboardDisplayService.
   */
  lastRoles: Map<string, MarkerRole>;

  /**
   * Oblicza role dla WSZYSTKICH nut na gryfie na podstawie wybranej skali
   * i opcjonalnego akordu.
   *
   * Gdy chordSelection jest null, zwraca tylko scale-tone i scale-root.
   *
   * @param notes - Wszystkie nuty na gryfie (FretboardStateService.notes)
   * @param scaleSelection - Wybrana skala
   * @param chordSelection - Wybrany akord lub null
   * @returns Map<string, MarkerRole> — klucz `${stringIndex}-${fret}` → rola
   */
  computeRoles(
    notes: GuitarNote[],
    scaleSelection: MusicSelection,
    chordSelection: MusicSelection | null,
  ): Map<string, MarkerRole>;
}
```

CSS klasy dla ról:

| Rola | Klasa CSS | Kolor |
|------|-----------|-------|
| `scale-tone` | `guitar-neck__role-scale-tone` | border niebieski |
| `chord-tone` | `guitar-neck__role-chord-tone` | border zielony |
| `scale-root` | `guitar-neck__role-scale-root` | border niebieski, pogrubiony |
| `chord-root` | `guitar-neck__role-chord-root` | border fioletowy |
| `chord-tone-outside-scale` | `guitar-neck__role-chord-tone-outside` | border pomarańczowy |

### FretboardDisplayService
Warstwa prezentacji dla znaczników na gryfie. Decyduje o klasach CSS
w zależności od trybu (interwałowy / role-based).

```typescript
/**
 * @file src/app/services/fretboard-display.service.ts
 */
class FretboardDisplayService {
  /**
   * Zwraca klasę CSS dla znacznika interwałowego.
   * Gdy relacja scale+chord jest aktywna, zwraca '' (role-based).
   * W przeciwnym razie zwraca 'guitar-neck__root', 'guitar-neck__major-3rd' itp.
   */
  getMarkerCssClass(interval: string | undefined): string;

  /** Czy znaczniki mają etykiety (nazwy nut). */
  showNoteLabels: boolean;

  /**
   * Zwraca klasę CSS dla roli markera na danej pozycji.
   * @param stringIndex - 0-based indeks struny
   * @param fret - Numer progu
   * @returns string - np. 'guitar-neck__role-chord-root' lub ''
   */
  getRoleCssClass(stringIndex: number, fret: number): string;

  /** Czy istnieje aktywna relacja scale+chord. */
  hasRelation: boolean;

  /** Zwraca listę aktywnych interwałów (unikalne, dla legendy). */
  getActiveIntervals(): string[];
}
```

### AppStateService
Zarządza trybem aplikacji (`AppMode`). Oddzielony od `FretboardStateService`,
żeby stan gryfu był niezależny od logiki UI.

```typescript
/**
 * @file src/app/app-state.service.ts
 */

type AppMode = 'custom-pattern' | 'scale-or-chord' | 'scale-chord';

class AppStateService {
  /** Observable dla reactive UI */
  appMode$: Observable<AppMode>;

  /** Bieżący tryb (getter synchroniczny) */
  appMode: AppMode;

  /** Ustawia tryb aplikacji. */
  setMode(mode: AppMode): void;

  /**
   * Przełącza między trybami — zachowuje stan gryfu.
   * Nic nie robi jeśli tryb jest ten sam.
   */
  switchMode(mode: AppMode): void;
}
```

### PatternBuilderService
Buduje `PatternInfo` dla UI — szczegóły wybranej skali/akordu (nuty, interwały, kroki W/H).

```typescript
/**
 * @file src/app/services/pattern-builder.service.ts
 */
class PatternBuilderService {
  currentPattern: PatternInfo | null;
  relatedChord: PatternInfo | null;

  /**
   * Ustawia bieżący pattern (skalę lub akord).
   * Oblicza nuty, interwały, semitony i kroki (W/H) z SCALE_PATTERNS / CHORD_PATTERNS.
   * Aktualizuje FretboardStateService.currentSelection.
   */
  setCurrentPattern(patternName: string, rootNote: string, type: 'scale' | 'chord'): void;

  /**
   * Ustawia powiązany akord dla trybu scale-chord.
   * Nie aktualizuje currentSelection — tylko relatedChord.
   */
  setRelatedChord(chordName: string, rootNote: string): void;

  /** Czyści bieżący pattern i relatedChord. */
  clearCurrentPattern(): void;
}

interface PatternInfo {
  name: string;
  rootNote: string;
  type: 'scale' | 'chord';
  notes: string[];
  intervals: string[];
  semitones: number[];
  steps: string[];
}
```

### IntervalNoteHelper
Helper do obliczania nut z interwałów.

```typescript
/**
 * @file src/app/shared/interval-note.helper.ts
 */
function calculateNotesFromIntervals(rootNote: string, intervals: number[]): string[];
```

### UICommands (DEPRECATED)
> **UWAGA**: Command Pattern (`UICommands.ts`) jest **nieużywany** — został zastąpiony przez `FretboardCommand` z `src/app/toolbox/model.ts`. Plik istnieje tylko jako referencja i zostanie usunięty w przyszłości.

```typescript
/**
 * @file src/app/shared/UICommands.ts
 * @deprecated Zastąpiony przez FretboardCommand z guitar-toolbox-lib
 */
interface Command {
  execute(): void;
}

class DisplaySingleNoteCommand implements Command { /* ... */ }
class DisplayAllNotesCommand implements Command { /* ... */ }
class DisplayScaleCommand implements Command { /* ... */ }
class DisplayChordCommand implements Command { /* ... */ }
class DisplayCustomPatternCommand implements Command { /* ... */ }
```

## TonalAdapter

```typescript
/**
 * @file src/app/shared/tonal-adapter.ts
 */

// Mapowanie interwałów Tonal → UI
const INTERVAL_MAP: Record<string, IntervalName>;

// Mapowanie nazw akordów UI → Tonal
const CHORD_NAME_TO_TONAL: Record<string, string>;

// Mapowanie nazw skal UI → Tonal
const SCALE_NAME_TO_TONAL: Record<string, string>;

// Zbiór skal których Tonal nie ma — wymagają fallbacku
const SCALES_NOT_IN_TONAL: Set<string>;

// Zbiór akordów których Tonal nie ma — wymagają fallbacku
const CHORDS_NOT_IN_TONAL: Set<string>;
```

Dostępne interwały i ich nazwy CSS:
- `root` — pryma
- `minor-2nd` — mała sekunda (♭2)
- `major-2nd` — wielka sekunda (2)
- `minor-3rd` — mała tercja (♭3)
- `major-3rd` — wielka tercja (3)
- `perfect-4th` — kwarta (4)
- `diminished-5th` — tryton (♭5)
- `perfect-5th` — kwinta (5)
- `minor-6th` — mała seksta (♭6)
- `major-6th` — wielka seksta (6)
- `minor-7th` — mała septyma (♭7)
- `major-7th` — wielka septyma (7)

## AI Chat (projekt guitar-chat) — POSTPONED

Osobna biblioteka Angular w [`projects/guitar-chat`](projects/guitar-chat). Kod istnieje, ale **funkcjonalność jest wstrzymana**:
- `chatEnabled: false` w środowisku (domyślnie wyłączone)
- `geminiApiKey` jest pusty w konfiguracji
- Wymaga klucza API Gemini i ponownej aktywacji feature flag

```typescript
/**
 * @file projects/guitar-chat/src/lib/services/ai.service.ts
 */
class AIService {
  // POSTPONED — komunikacja z Gemini API
  generateResponse(userInput: string): Observable<AIResponse>;
}

/**
 * @file projects/guitar-chat/src/lib/services/ai-suggestion.service.ts
 */
class AISuggestionService {
  // POSTPONED — zarządzanie sugestiami AI
  setResponse(response: AIResponse): void;
  getSuggestions(): Observable<MusicalSuggestion[]>;
}

/**
 * @file projects/guitar-chat/src/lib/services/ai-facade.service.ts
 */
class AIFacadeService {
  // POSTPONED — fasada AI
  sendMessage(text: string): Observable<void>;
  getMessages(): Observable<ChatMessage[]>;
  applySuggestion(suggestion: MusicalSuggestion): void;
}
```

### ChatComponent
Interfejs konwersacji z AI.

```typescript
/**
 * @selector lib-chat
 * @package guitar-chat
 * POSTPONED
 */
class ChatComponent {
  sendMessage(message: string): void;
  messages: ChatMessage[];
}
```

## Toolbox (`src/app/toolbox/`)

Toolbox jest wbudowany bezpośrednio w aplikację jako `src/app/toolbox/`. Zawiera 3 pliki źródłowe:

| Plik | Odpowiedzialność |
|------|-----------------|
| `toolbox-builder.component.ts` | Główny komponent toolbox (sentence-style UI) |
| `dropdown.component.ts` | Reużywalny dropdown z filtrowaniem |
| `model.ts` | Typy: `FretboardCommand`, `MusicKey`, `Interval` |

### ToolboxBuilderComponent

```typescript
/**
 * @selector app-toolbox-builder
 * @file src/app/toolbox/toolbox-builder.component.ts
 */
class ToolboxBuilderComponent {
  @Output() toolboxEvent: EventEmitter<FretboardCommand>;
}
```

## HomePageComponent

Główny komponent agregujący. Odbiera eventy z toolboxu i dispatchuje do serwisów.

```typescript
/**
 * @file src/app/home-page/home-page.component.ts
 */
class HomePageComponent {
  chatEnabled: boolean;  // Z environment.features.chatEnabled
  displayMode: WritableSignal<DisplayMode>;  // 'legend' | 'relationship' | null

  /**
   * Główny handler eventów z toolboxu.
   * Dispatchuje do odpowiednich serwisów w zależności od FretboardCommand.kind.
   */
  onToolboxEvent(command: FretboardCommand): void;
}
```

## Model Danych

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
  name?: string;
  rootNote?: string;
  notes?: string[];
  intervals?: number[];
}

// src/app/shared/model/patternInfo.ts
interface PatternInfo {
  name: string;
  rootNote: string;
  type: 'scale' | 'chord';
  notes: string[];
  intervals: string[];
  semitones: number[];
  steps: string[];
}