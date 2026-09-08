# Guitar Neck UI — Domain Contract API

## DomainService — centralna warstwa domenowa

Jednolite API dla wszystkich klientów (Toolbox, AI, konsola). Zdefiniowane w [`src/app/domain/`](../../src/app/domain/).

```typescript
/**
 * @file src/app/domain/domain.service.ts
 */
class DomainService {
  /** Bieżący snapshot stanu (signal) */
  readonly currentState: Signal<DomainState>;

  /**
   * Wykonuje komendę domenową.
   * @returns DomainResult<DomainState> — nowy stan lub błąd walidacji
   */
  execute(command: DomainCommand): DomainResult<DomainState>;

  /**
   * Wykonuje kwerendę domenową.
   * @returns DomainResult<T> — wynik kwerendy lub błąd
   */
  query<T>(query: DomainQuery): DomainResult<T>;
}
```

## Komendy (Commands)

### ShowPatternCommand
```typescript
interface ShowPatternCommand {
  type: 'show-pattern';
  patternType: 'scale' | 'chord';
  patternName: string;     // np. 'major', 'minor-pentatonic', 'maj7'
  rootNote: string;        // np. 'C', 'F#', 'Bb'
  fretRange?: { min: number; max: number };
  emphasis?: { intervals?: string[]; roles?: string[] };
}
```
Wyświetla pattern (skalę/akord) na gryfie. Zastępuje poprzedni widok.

### ShowIntervalCommand
```typescript
interface ShowIntervalCommand {
  type: 'show-interval';
  rootNote: string;   // np. 'C', 'A'
  interval: string;   // np. 'b3', '3', '5', 'b7'
}
```
Wyświetla pojedynczy interwał od roota na gryfie. Używa `spellNote()` dla poprawnej enharmonicznej pisowni.

### ComparePatternsCommand
```typescript
interface ComparePatternsCommand {
  type: 'compare-patterns';
  primary: { patternType: 'scale' | 'chord'; patternName: string; rootNote: string };
  secondary: { patternType: 'scale' | 'chord'; patternName: string; rootNote: string };
}
```
Porównuje dwa patterny (scale-chord mode). Wyświetla unię nut z rolami wizualnymi.

### SetViewCommand
```typescript
interface SetViewCommand {
  type: 'set-view';
  fretRange?: { min: number; max: number };
  enabledStrings?: boolean[];
  markerDisplayMode?: 'interval-colors' | 'note-names' | 'neutral-dots';
}
```
Zmienia konfigurację widoku bez zmiany patternu.

### SetEmphasisCommand
```typescript
interface SetEmphasisCommand {
  type: 'set-emphasis';
  emphasis: { intervals?: string[]; roles?: string[] };
}
```
Zmienia emphasis na bieżącym patternie (np. podświetl tylko root i tercje).

### ClearViewCommand
```typescript
interface ClearViewCommand {
  type: 'clear-view';
}
```
Czyści gryf, resetuje stan do domyślnego. Zachowuje `enabledStrings`.

### ResolveShapeCommand
```typescript
interface ResolveShapeCommand {
  type: 'resolve-shape';
  shapeId: string;              // np. 'cowboy-C', 'barre-E-form'
  rootNote?: string;            // dla movable shapes (barre)
  position?: number;            // fret position (0 = open)
}
```
Rozwija nazwany kształt z shape registry na konkretne pozycje i wyświetla je.
- Cowboy shapes mają własny `rootNote`/`chordType` — nie można nadpisać
- Barre shapes wymagają `rootNote` (np. `barre-E-form` + `rootNote: 'F'` = F-dur barre)

## Kwerendy (Queries)

### GetCurrentViewQuery
```typescript
interface GetCurrentViewQuery {
  type: 'get-current-view';
}
// Zwraca: DomainState
```

### GetAvailablePatternsQuery
```typescript
interface GetAvailablePatternsQuery {
  type: 'get-available-patterns';
}
// Zwraca: { scales: string[]; chords: string[] }
```

### GetPatternDetailsQuery
```typescript
interface GetPatternDetailsQuery {
  type: 'get-pattern-details';
  patternType: 'scale' | 'chord';
  patternName: string;
  rootNote: string;
}
// Zwraca: PatternInfo { name, rootNote, type, notes, intervals, semitones, steps }
```

### DetectChordQuery
```typescript
interface DetectChordQuery {
  type: 'detect-chord';
  notes: string[];
}
// Zwraca: { chords: string[] } — np. ['C major', 'Cdim']
```
Używa `@tonaljs/chord-detect`.

### DetectScaleQuery
```typescript
interface DetectScaleQuery {
  type: 'detect-scale';
  notes: string[];
  tonic?: string;
  match?: 'exact' | 'fit';
}
// Zwraca: { scales: string[] } — np. ['major', 'ionian']
```
Używa `@tonaljs/scale.detect()`.

### GetKeyAnalysisQuery
```typescript
interface GetKeyAnalysisQuery {
  type: 'get-key-analysis';
  tonic: string;
  mode: 'major' | 'minor';
}
// Zwraca: KeyAnalysis
```
Zwraca własny DTO [`KeyAnalysis`](../../src/app/domain/queries.ts):
```typescript
interface KeyAnalysis {
  tonic: string;
  mode: 'major' | 'minor';
  scale: string[];           // nuty skali
  triads: string[];          // nazwy triad
  chords: string[];          // nazwy akordów 7
  secondaryDominants?: string[];
}
```

### GetAvailableShapesQuery
```typescript
interface GetAvailableShapesQuery {
  type: 'get-available-shapes';
  category?: 'cowboy' | 'barre' | 'caged' | 'custom';
}
// Zwraca: { shapes: Array<{ id: string; name: string; category: string }> }
```

### ResolveShapeQuery
```typescript
interface ResolveShapeQuery {
  type: 'resolve-shape-query';
  shapeId: string;
  rootNote?: string;
  position?: number;
}
// Zwraca: { positions: Array<{ string: number; fret: number; label?: string }> }
```
Rozwija kształt bez wyświetlania — tylko zwraca pozycje.

## Canonical State (DomainState)

```typescript
interface DomainState {
  mode: 'scale' | 'chord' | 'scale-chord' | 'custom' | 'positions';
  rootNote: string;
  patternName: string;
  compareTarget?: {
    rootNote: string;
    patternName: string;
    patternType: 'scale' | 'chord';
  };
  fretRange: { min: number; max: number };
  enabledStrings: boolean[];
  emphasis?: { intervals?: string[]; roles?: string[] };
  markerDisplayMode: 'interval-colors' | 'note-names' | 'neutral-dots';
  selectedNotes?: Array<{ note: string; string: number; fret: number }>;
  shapeInfo?: {
    shapeId?: string;
    positions: Array<{ string: number; fret: number; label?: string }>;
  };
}
```

**Stan jest immutable** — każda komenda produkuje nowy snapshot. Wszystkie pozostałe dane (visible notes, interval colors, marker classes) są **derived state** — wyliczane deterministycznie przez `FretboardDisplayService`.

## DomainResult

```typescript
type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError; message: string };

enum DomainError {
  PATTERN_NOT_FOUND,
  INVALID_ROOT_NOTE,
  INVALID_FRET_RANGE,
  INVALID_INTERVAL,
  UNKNOWN_COMMAND,
  EMPTY_RESULT,
  INVALID_POSITION,
  POSITION_NOTE_MISMATCH,
  SHAPE_NOT_FOUND,
}
```

## Walidacja

`DomainService` waliduje wszystkie dane wejściowe przed delegacją:

| Problem | Rezultat |
|---------|----------|
| Nieistniejący pattern | `DomainError.PATTERN_NOT_FOUND` + lista dostępnych |
| Nieprawidłowa nuta | `DomainError.INVALID_ROOT_NOTE` + lista dozwolonych |
| Zakres progów 0-30 | `DomainError.INVALID_FRET_RANGE` (dozwolone 0-24) |
| Nieznany interwał | `DomainError.INVALID_INTERVAL` + lista dozwolonych |
| Nieznany typ komendy | `DomainError.UNKNOWN_COMMAND` |
| Pozycja (string, fret) poza zakresem | `DomainError.INVALID_POSITION` |
| Nuta nie brzmi na danej pozycji | `DomainError.POSITION_NOTE_MISMATCH` |
| Nieznany kształt | `DomainError.SHAPE_NOT_FOUND` |

## Testowanie z konsoli

Po uruchomieniu aplikacji (`npm start`), w konsoli przeglądarki:

```javascript
// Pokaż skalę
window.__ds.execute({
  type: 'show-pattern',
  patternType: 'scale',
  patternName: 'minor-pentatonic',
  rootNote: 'A'
});

// Pokaż akord
window.__ds.execute({
  type: 'show-pattern',
  patternType: 'chord',
  patternName: 'maj7',
  rootNote: 'C'
});

// Pokaż interwał
window.__ds.execute({
  type: 'show-interval',
  rootNote: 'A',
  interval: 'b3'
});

// Porównaj
window.__ds.execute({
  type: 'compare-patterns',
  primary: { patternType: 'scale', patternName: 'major', rootNote: 'C' },
  secondary: { patternType: 'chord', patternName: 'major', rootNote: 'E' }
});

// Rozwiąż kształt
window.__ds.execute({
  type: 'resolve-shape',
  shapeId: 'cowboy-C'
});

// Detekcja akordu
window.__ds.query({
  type: 'detect-chord',
  notes: ['C', 'E', 'G']
});

// Analiza tonacji
window.__ds.query({
  type: 'get-key-analysis',
  tonic: 'C',
  mode: 'major'
});

// Odczytaj stan
window.__ds.query({ type: 'get-current-view' });

// Sprawdź dostępne patterny
window.__ds.query({ type: 'get-available-patterns' });
```

## Integracja z AI (Langchain TS)

AI importuje `DomainService` bezpośrednio — żaden REST/WebSocket niepotrzebny:

```typescript
import { DomainService } from './domain/domain.service';

// AI woła te same metody co Toolbox
const result = domainService.execute({
  type: 'show-pattern',
  patternType: 'scale',
  patternName: 'minor-pentatonic',
  rootNote: 'A'
});

// AI może czytać stan
const state = domainService.query({ type: 'get-current-view' });
```

## Pliki źródłowe

| Plik | Opis |
|------|------|
| [`src/app/domain/commands.ts`](../../src/app/domain/commands.ts) | Typy komend (intencje użytkownika) |
| [`src/app/domain/queries.ts`](../../src/app/domain/queries.ts) | Typy kwerend + KeyAnalysis DTO |
| [`src/app/domain/state.ts`](../../src/app/domain/state.ts) | DomainState, DomainError, DomainResult |
| [`src/app/domain/domain.service.ts`](../../src/app/domain/domain.service.ts) | Centralny serwis domenowy |
| [`src/app/domain/domain-validator.ts`](../../src/app/domain/domain-validator.ts) | Walidacja wejść |
| [`src/app/shared/model/guitar-shapes.ts`](../../src/app/shared/model/guitar-shapes.ts) | Shape registry (dane) |
| [`src/app/services/shape-resolver.service.ts`](../../src/app/services/shape-resolver.service.ts) | Resolver kształtów |