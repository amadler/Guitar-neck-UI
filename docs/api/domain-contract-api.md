# Guitar Neck UI — Domain Contract API

## DomainService — centralna warstwa domenowa

Jednolite API dla wszystkich klientów (Toolbox, AI, konsola). Zdefiniowane w [`src/app/domain/`](src/app/domain/).

```typescript
/**
 * @file src/app/domain/domain.service.ts
 */
class DomainService {
  /** Observable stanu — immutable snapshot po każdej komendzie */
  state$: Observable<DomainState>;

  /** Bieżący snapshot stanu (getter synchroniczny) */
  currentState: DomainState;

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

## Canonical State (DomainState)

```typescript
interface DomainState {
  mode: 'scale' | 'chord' | 'scale-chord' | 'custom';
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
| [`src/app/domain/commands.ts`](src/app/domain/commands.ts) | Typy komend (intencje użytkownika) |
| [`src/app/domain/queries.ts`](src/app/domain/queries.ts) | Typy kwerend |
| [`src/app/domain/state.ts`](src/app/domain/state.ts) | DomainState, DomainError, DomainResult |
| [`src/app/domain/domain.service.ts`](src/app/domain/domain.service.ts) | Centralny serwis domenowy |