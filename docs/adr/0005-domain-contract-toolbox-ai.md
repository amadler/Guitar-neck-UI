# ADR 0005: Domain Contract — wspólna warstwa komend/kwerend dla Toolbox i AI

**Status**: proposed

## Context

Aplikacja Guitar Neck UI ma obecnie:
- [`FretboardCommand`](src/app/toolbox/model.ts:42) zdefiniowane wewnątrz toolboxa — prywatne dla toolboxa
- [`FretboardOrchestrationService`](src/app/services/fretboard-orchestration.service.ts) przyjmujący gołe stringi (`scaleName`, `rootNote`)
- [`FretboardStateService`](src/app/services/fretboard-state.service.ts) z mutable state — `notes[]` mutowany in-place

Planowana jest warstwa AI (Langchain jako osobny projekt), która potrzebuje:
- wywoływać akcje na gryfie (commands)
- odczytywać aktualny stan aplikacji (queries)
- reagować kontekstowo na podstawie stanu

Nie chcemy tworzyć osobnego API pod AI. Zamiast tego definiujemy **wspólny publiczny kontrakt domeny**, z którego AI będzie tylko jednym z klientów — obok obecnego Toolboxa i przyszłych modułów (tryby ćwiczeń, tabulatura, rytm).

## Decyzje

### 1. Wspólna warstwa domenowa

Tworzymy folder `src/app/domain/` z definicjami:
- `commands.ts` — typy komend zmieniających stan
- `queries.ts` — typy kwerend odczytujących stan
- `state.ts` — canonical state (source of truth)
- `domain.service.ts` — serwis przyjmujący komendy/kwerendy i delegujący do serwisów aplikacji

Toolbox i AI korzystają z **dokładnie tych samych** typów `DomainCommand` i `DomainQuery`.

### 2. DomainCommand opisuje intencję użytkownika, nie techniczną zmianę stanu

`DomainCommand` to **intencja**, nie instrukcja mutacji. Np. `showPattern` oznacza "chcę zobaczyć ten pattern na gryfie", a nie "ustaw mode=X, rootNote=Y, patternName=Z".

Mapowanie intencji na konkretne mutacje stanu jest odpowiedzialnością `DomainService`.

```typescript
// To jest intencja:
{ type: 'show-pattern', patternType: 'scale', patternName: 'minor-pentatonic', rootNote: 'A' }

// Nie to:
{ type: 'set-state', mode: 'scale', rootNote: 'A', patternName: 'minor-pentatonic' }
```

### 3. Jedna komenda z parametrami (nie osobny overlay)

Odrzucamy model "base + overlay" (dwie warstwy stanu). Zamiast tego każda komenda ma parametry określające co i jak pokazać:

```typescript
interface ShowPatternCommand {
  type: 'show-pattern';
  patternType: 'scale' | 'chord';
  patternName: string;
  rootNote: string;
  fretRange?: { min: number; max: number };
  emphasis?: EmphasisSpec;
}
```

`emphasis` jest parametrem komendy, nie osobną operacją. Jeśli użytkownik chce zmienić tylko emphasis, wysyła `SetEmphasisCommand` który modyfikuje bieżący pattern.

### 4. Canonical state — minimalny i immutable

**Uwaga:** `mode` i `patternType` niosą częściowo redundantną informację. Gdy `mode = 'scale'`, patternType jest zawsze `'scale'`. Gdy `mode = 'chord'`, patternType jest zawsze `'chord'`. W `'scale-chord'` są dwa patterny, w `'custom'` nie ma patternType.

**Decyzja:** `patternType` jest wyliczany z `mode` gdy potrzebny. Nie ma go w canonical state jako osobne pole.

**Canonical state (source of truth):**

| Pole | Typ | Opis |
|------|-----|------|
| `mode` | `'scale' \| 'chord' \| 'scale-chord' \| 'custom'` | Tryb aplikacji — intencja użytkownika |
| `rootNote` | `string` | Wybrany root/tonic |
| `patternName` | `string` | Nazwa patternu (skala/akord) |
| `compareTarget` | `{ rootNote, patternName, patternType }?` | Cel porównania (scale-chord mode) |
| `fretRange` | `{ min: number; max: number }` | Zakres progów |
| `enabledStrings` | `boolean[]` | Aktywne struny (6 elementów) |
| `emphasis` | `{ intervals?: string[]; roles?: string[] }?` | Co podświetlić |
| `markerDisplayMode` | `'interval-colors' \| 'note-names' \| 'neutral-dots'` | Tryb wyświetlania markerów |
| `selectedNotes` | `Array<{ note: string; string: number; fret: number }>?` | Ręcznie zaznaczone pozycje na gryfie (kliknięcia użytkownika) |

**Dlaczego `selectedNotes` to tablica pozycji, a nie string[]:**
Kliknięcie na gryfie dotyczy konkretnego miejsca (struna + próg), nie tylko nazwy nuty. Nuta C na 5 strunie to inne miejsce niż C na 2 strunie. Jeśli użytkownik kliknie konkretną pozycję, zapisujemy dokładnie którą.

**Derived state — wyliczane przez `FretboardDisplayService`:**
- `visibleNotes[]` — nuty do pokazania na gryfie
- `intervalColors` — kolory interwałowe
- `markerClasses` — klasy CSS markerów
- `outsideScaleNotes` — nuty poza skalą (w trybie scale-chord)

`FretboardDisplayService` jest jedynym miejscem odpowiedzialnym za derived state. Czyta `DomainState`, wylicza, zwraca.

Stan jest immutable — każda komenda produkuje nowy snapshot stanu. Nie ma mutacji `notes[]` in-place.

### 5. DomainResult dla walidacji

Wszystkie komendy i kwerendy zwracają `DomainResult<T>` (nazwa zmieniona z `CommandResult` — dotyczy też kwerend):

```typescript
type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError; message: string };
```

AI musi wiedzieć czy komenda się udała i dlaczego. Toolbox może pokazać komunikat błędu.

### 6. Brak wersjonowania na razie

Nowe możliwości dodajemy przez optional fields (`?`). Jeśli w przyszłości pojawi się realny breaking change, wprowadzamy v2 kontraktu.

### 7. MCP później

Najpierw definiujemy kontrakt domeny. MCP (Model Context Protocol) może być dodany później jako warstwa integracyjna — adapter mapujący `DomainCommand` na MCP tools i odwrotnie.

## Alternatywy rozważone

- **Osobne API pod AI**: odrzucone — AI ma być równoprawnym klientem, nie specjalnym
- **Base + overlay (dwie warstwy stanu)**: odrzucone — komplikuje stan, niejasna semantyka gdy zmienia się baza
- **Mutable state**: odrzucone — mutacje `notes[]` w wielu miejscach utrudniają debugowanie
- **Wersjonowanie od początku**: odroczone — optional fields wystarczają na tym etapie
- **MCP od początku**: odroczone — kontrakt domeny jest niezależny od protokołu transportowego
- **Command jako instrukcja mutacji**: odrzucone — command to intencja, mapowanie na stan należy do DomainService

## Konsekwencje

- Nowy folder `src/app/domain/` z ~4 plikami
- `FretboardOrchestrationService` — refactor: przyjmuje `DomainCommand` zamiast gołych stringów
- `ToolboxBuilderComponent` — refactor: emituje `DomainCommand` zamiast własnego `FretboardCommand`
- `FretboardStateService` — refactor: immutable state, derived state w `FretboardDisplayService`
- `FretboardDisplayService` — jedyne miejsce odpowiedzialne za derived state
- `FretboardNoteQueryService` — może być zastąpiony przez `DomainService.query()`
- AI (Langchain) woła `DomainService.execute(command)` przez wybrany transport (HTTP/WebSocket/shared module)
- Możliwość dodania undo/redo w przyszłości (snapshoty stanu)