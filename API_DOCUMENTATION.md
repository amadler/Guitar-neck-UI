# Guitar Neck UI - Dokumentacja API

## Core Services

### FretboardOrchestrationService
Główna fasada integrująca logikę muzyczną.

```typescript
/**
 * @file src/app/services/music-theory-facade.service.ts
 */
class FretboardOrchestrationService {
  /**
   * Wyświetla skalę na gryfie z oznaczeniem interwałów.
   * @param scaleName - Nazwa skali (np. "major", "minor", "dorian")
   * @param rootNote - Nuta podstawowa (np. "C", "F#")
   * @returns Observable<GuitarNote[]> - Zaznaczone nuty z interwałami
   */
  displayScale(scaleName: string, rootNote: string): Observable<GuitarNote[]>;

  /**
   * Wyświetla akord na gryfie z oznaczeniem interwałów.
   * @param triadType - Typ akordu (np. "major", "minor", "diminished")
   * @param rootNote - Nuta podstawowa (np. "C", "F#")
   * @returns Observable<GuitarNote[]> - Zaznaczone nuty z interwałami
   */
  displayChord(triadType: string, rootNote: string): Observable<GuitarNote[]>;

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
   * Wyświetla custom pattern nut na gryfie z interwałami.
   * @param notes - Tablica nazw nut do wyświetlenia
   * @param rootNote - Nuta bazowa dla interwałów
   */
  displayCustomPattern(notes: string[], rootNote: string): GuitarNote[];

  /**
   * Resetuje gryf (ukrywa wszystkie nuty, usuwa interwały).
   */
  resetFretboard(): void;
}
```

### FretboardStateService
Zarządza stanem gryfu gitary — tablicą nut, widocznością, zaznaczeniem.

```typescript
/**
 * @file src/app/services/guitar-neck.service.ts
 */
class FretboardStateService {
  notes: GuitarNote[];        // Pełna tablica nut na gryfie (6 strun × 25 progów)
  strings: string[];          // ["E", "B", "G", "D", "A", "E"]
  frets: number[];            // [0, 1, 2, ..., 23]

  /**
   * Sprawdza czy na danym progu i strunie jest nuta.
   */
  isNoteOnFret(string: string, fret: number): boolean;

  /**
   * Zwraca nutę na danym progu i strunie.
   */
  getNote(string: string, fret: number): GuitarNote | undefined;

  /**
   * Zwraca nazwę nuty na danym progu i strunie.
   */
  getNoteName(string: string, fret: number): string;

  /**
   * Zaznacza nuty do wyświetlenia — ukrywa wszystkie, pokazuje tylko podane.
   * @returns GuitarNote[] - Tablica zaznaczonych nut
   */
  applyHighlightedNotes(notes: GuitarNote[]): GuitarNote[];

  /**
   * Ukrywa wszystkie nuty.
   */
  hideAllNotes(): void;

  /**
   * Pokazuje wszystkie nuty.
   */
  showAll(): void;

  /**
   * Czyści zaznaczenie nut.
   */
  clearSelection(): void;

  /**
   * Obsługa kliknięcia nuty na gryfie.
   * @returns GuitarNote | null - Kliknięta nuta lub null
   */
  fretNoteClicked(string: string, fret: number): GuitarNote | null;

  /**
   * Czyści gryf — usuwa interwały, ukrywa nuty, czyści zaznaczenie.
   */
  clearFretboard(): void;
}
```

### IntervalService
Oznacza nuty interwałami (root, third, fifth, itp.).

```typescript
/**
 * @file src/app/services/interval.service.ts
 */
class IntervalService {
  /**
   * Oznacza nuty interwałami względem rootNote dla danego patternu.
   * @param rootNote - Nuta bazowa
   * @param patternName - Nazwa patternu (np. "major", "minor")
   * @param selectedNotes - Nuty do oznaczenia
   * @param patternType - Typ patternu: 'scale' | 'chord' (domyślnie 'chord')
   */
  markIntervals(
    rootNote: string,
    patternName: string,
    selectedNotes: GuitarNote[],
    patternType?: 'scale' | 'chord'
  ): void;

  /**
   * Oznacza nuty interwałami dla custom patternu (bez nazwy patternu).
   */
  markCustomIntervals(rootNote: string, selectedNotes: GuitarNote[]): void;

  /**
   * Usuwa oznaczenia interwałowe z nut.
   */
  removeIntervals(notes: GuitarNote[]): void;
}
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
   * Znajduje pozycje nut dla skali.
   */
  findPositionsByScaleNotes(scaleNotes: string[]): GuitarNote[];

  /**
   * Znajduje pozycje nut dla akordu.
   */
  findPositionsByChordNotes(triadNotes: string[]): GuitarNote[];
}
```

### MusicPatternApiService
Komunikacja z backendem `music-theory-api`.

```typescript
/**
 * @file src/app/services/scales-and-triads.service.ts
 */
class MusicPatternApiService {
  private readonly API_URL = `${environment.apiUrl}/api`; // http://localhost:3000/api

  /**
   * Pobiera listę dostępnych skal z API.
   */
  getAvailableScales(): Observable<string[]>;

  /**
   * Pobiera listę dostępnych akordów z API.
   */
  getAvailableTriads(): Observable<string[]>;

  /**
   * Rozwiązuje nuty skali — GET /api/scales/:name/:root
   */
  resolveScaleNotes(scaleName: string, rootNote: string): Observable<string[]>;

  /**
   * Rozwiązuje nuty akordu — GET /api/chords/:name/:root
   */
  resolveChordNotes(triadType: string, rootNote: string): Observable<string[]>;
}
```

### UICommands
Wzorzec Command dla operacji na gryfie.

```typescript
/**
 * @file src/app/shared/UICommands.ts
 */
interface Command {
  execute(): void;
}

class DisplaySingleNoteCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private keys: string
  ) {}
}

class DisplayAllNotesCommand implements Command {
  constructor(private fretboardOrchestrationService: FretboardOrchestrationService) {}
}

class DisplayScaleCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private scaleName: string,
    private rootNote: string
  ) {}
}

class DisplayChordCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private triadName: string,
    private rootNote: string
  ) {}
}

class DisplayCustomPatternCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private intervals: number[],
    private rootNote: string
  ) {}
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

### AISuggestionsComponent
Wyświetla sugestie muzyczne od AI.

```typescript
/**
 * @selector lib-ai-suggestions
 * @package guitar-chat
 * POSTPONED
 */
class AISuggestionsComponent {
  suggestions: MusicalSuggestion[];
}
```

## Components

### FreatboardComponent
Renderuje gryf gitary z nutami.

```typescript
/**
 * @selector app-freatboard
 * @file src/app/freatboard/freatboard.component.ts
 */
class FreatboardComponent {
  @Input({required: true}) notes: GuitarNote[];
  @Output() onNoteClicked$: EventEmitter<GuitarNote>;

  strings: string[];  // ["E", "B", "G", "D", "A", "E"]
  frets: number[];    // [0, 1, 2, ..., 23]

  /** Zwraca interwał dla nuty na danym progu/strunie. */
  getNoteInterval(string: string, fret: number): string | undefined;
}
```

### GuitarNeckComponent
Kontener dla FreatboardComponent + inicjalizacja gryfu.

```typescript
/**
 * @selector app-guitar-neck
 * @file src/app/guitar-neck/guitar-neck.component.ts
 */
class GuitarNeckComponent {
  neckConfig: NeckConfig;
  neck: GuitarNeck;
  guitarNotes: GuitarNote[];
}
```

### LegendComponent
Legenda kolorów interwałowych.

```typescript
/**
 * @selector app-legend
 * @file src/app/freatboard/components/legend/legend.component.ts
 */
class LegendComponent {}
```

### ToolboxFormComponent
Formularz wyboru skali/akordu. Dostarczany przez `guitar-toolbox-lib`.

```typescript
/**
 * @selector lib-toolbox-form
 * @package guitar-toolbox-lib
 */
class ToolboxFormComponent {
  @Output() onSubmit$: EventEmitter<ToolboxSearchQuery>;
  keys: string[];  // neckConfig.chromaticNotes
  patterns: { scale: string[], chord: string[], basic: string[] };

  /**
   * Emituje zapytanie po kliknięciu "Show!".
   */
  onSubmit(): void;
}
```

## Modele Danych

```typescript
/**
 * @file src/app/shared/model/guitarNote.ts
 */
class GuitarNote {
  id?: string;            // UUID (generowany przez uuidv4)
  string: number;         // Numer struny (1-6)
  fret: number;           // Numer progu (0-24)
  note: string;           // Nazwa nuty (np. "C", "F#", "G")
  visible: boolean;       // Czy nuta jest widoczna
  selected: boolean;      // Czy nuta jest zaznaczona
  interval: string;       // Nazwa interwału (np. "root", "major-3rd", "")

  constructor(string: number, fret: number, note: string, visible?: boolean);
}

/**
 * @file src/app/shared/model/musicElements.ts
 */
interface ToolboxSearchQuery {
  musicElements: string | number[];
  keys: string;
  type: 'scale' | 'chord' | 'basic' | 'custom';
}

interface MusicalSuggestion {
  displayName: string;
  notes: string[];
  type: 'scale' | 'triad' | 'extendedChord';
}

interface AIResponse {
  textResponse: string;
  suggestions: MusicalSuggestion[];
}
```

## Stałe i Konfiguracja

```typescript
/**
 * @file node_modules/guitar-neck-shared/src/models/neckConfig.ts
 */
interface NeckConfig {
  stringNotes: string[];          // ["E", "B", "G", "D", "A", "E"]
  chromaticNotes: string[];       // ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  numberOfFrets: number;          // 24
  numberOfStrings: number;        // 6
  markedFrets: number[];          // [3, 5, 7, 9, 15, 17, 19, 21]
  markedTwelffeFrets: number[];   // [12, 24]
}

/**
 * @file node_modules/guitar-neck-shared/src/models/chordTypes.ts
 */
interface ChordPattern {
  name: string;       // "major", "minor", "diminished", "augmented", itd.
  intervals: number[]; // np. [4, 3] dla major
}

/**
 * @file node_modules/guitar-neck-shared/src/models/scaleTypes.ts
 */
interface ScalePattern {
  name: string;       // "major", "minor", "dorian", "phrygian", itd.
  intervals: number[]; // np. [2, 2, 1, 2, 2, 2, 1] dla major
}

/**
 * @file src/environments/environment.ts
 */
const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',  // URL backendu music-theory-api
  geminiApiKey: '',
  features: { chatEnabled: false }  // AI chat wyłączony (POSTPONED)
};
```

## Architektura — przepływ danych

```
ToolboxFormComponent (wybór użytkownika)
  |
  v
UICommands (Command Pattern)
  |  DisplayChordCommand / DisplayScaleCommand / itd.
  v
FretboardOrchestrationService (Facade)
  |
  ├── MusicPatternApiService → HTTP → music-theory-api
  |     GET /api/scales/:name/:root
  |     GET /api/chords/:name/:root
  |
  ├── FretboardNotePositionService
  |     findPositionsByScaleNotes() / findPositionsByChordNotes()
  |
  ├── FretboardStateService
  |     applyHighlightedNotes() — ustawia visible=true, selected=true
  |
  └── IntervalService
        markIntervals() — oznacza nuty interwałami
        markCustomIntervals() — dla custom patternów
  |
  v
FreatboardComponent (renderowanie)
  |  NgClass — .guitar-neck__root, .guitar-neck__major-3rd, itp.
  v
CSS Variables (styles.scss)
  --interval-root, --interval-minor-3rd, --interval-major-3rd, itd.
```

## Backend API (music-theory-api)

Osobne repozytorium, uruchamiane przez Docker na porcie 3000.

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/scales` | Lista dostępnych skal |
| GET | `/api/scales/:name/:root` | Nuty skali |
| GET | `/api/chords` | Lista dostępnych akordów |
| GET | `/api/chords/:name/:root` | Nuty akordu |
| GET | `/api/findCompatibleScales/:name/:root` | Kompatybilne skale |

Wszystkie parametry `:name` i `:root` powinny być URL-encoded (przez `encodeURIComponent`) i dekodowane przez backend (przez `decodeURIComponent`).

## Backlog / Dead Code

Elementy wykryte w kodzie, które wymagają decyzji:

| Element | Status | Lokalizacja |
|---------|--------|-------------|
| AI Chat (Gemini) | **POSTPONED** — kod istnieje, wyłączony flagą `chatEnabled: false` | `projects/guitar-chat`, `src/environments` |
| `refreshNotesInRange()` | **Dead code** — pusta metoda, nigdy nie wywoływana | `src/app/freatboard/freatboard.component.ts:50` |
| `ToolboxSearchQuery` typing | Do refactoringu — custom patterny używają runtime coercion zamiast dedykowanego typu | `src/app/shared/model/musicElements.ts` |
| `toolboxSubmit()` | Do refactoringu — można wydzielić do command factory | `src/app/home-page/home-page.component.ts:31` |
