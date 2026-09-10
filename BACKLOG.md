# P12: Pilne — aliasy nazw akordów/skal + duplikaty kluczy w pattern-display

## Motivation

Dwa błędy blokujące płynne używanie API przez AI i konsolę:

1. **`maj7` → `PATTERN_NOT_FOUND`**: [`DomainValidator.validatePattern()`](src/app/domain/domain-validator.ts:12) sprawdza nazwę tylko w [`CHORD_PATTERNS`](node_modules/guitar-neck-shared/src/models/chordTypes.ts:6), gdzie akord nazywa się `major-7th`, a nie `maj7`. Tymczasem [`CHORD_NAME_TO_TONAL`](src/app/shared/tonal-adapter.ts:73) mapuje `major-7th → maj7` (do Tonal.js), ale nie ma odwrotnego aliasu. AI i zaawansowani użytkownicy naturalnie używają skrótów (`maj7`, `m7`, `dom7`, `dim7`, `aug`).

2. **NG0955 duplicate keys**: [`pattern-display.component.html`](src/app/pattern-display/pattern-display.component.html) używa `track interval` i `track step` w pętlach `@for`, ale tablice `intervals` i `steps` zawierają duplikaty:
   - `intervals`: `'1'` pojawia się dla semitone 0 (root) i semitone 12 (oktawa, bo `12 % 12 = 0`)
   - `steps`: `'W'`, `'H'`, `'W+H'` powtarzają się naturalnie w patternach (np. minor-pentatonic: `['W+H', 'W', 'W', 'W+H', 'W']`)

Oba błędy są pilne, bo blokują AI-driven development i powodują błędy w konsoli przy każdym wywołaniu.

## Solution

### 1. Aliasy nazw akordów/skal

Dodać rejestr aliasów w [`domain-validator.ts`](src/app/domain/domain-validator.ts) lub w nowym pliku `pattern-aliases.ts`:

```typescript
export const CHORD_ALIASES: Record<string, string> = {
  'maj7': 'major-7th',
  'm7': 'minor-7th',
  'dom7': 'dominant-7th',
  'dim7': 'diminished-7th',
  'half-dim7': 'half-diminished-7th',
  'aug': 'augmented',
  'dim': 'diminished',
  'maj9': 'major-9',
  'm9': 'minor-9',
  'm11': 'minor-11',
  'm13': 'minor-13',
};
```

Miejsce rozwiązania aliasu:
- Opcja A: W [`DomainValidator.validatePattern()`](src/app/domain/domain-validator.ts:12) — aliasować przed walidacją
- Opcja B: W [`DomainService.handleShowPattern()`](src/app/domain/domain.service.ts:113) — aliasować command.patternName przed przekazaniem dalej
- Opcja C: W [`PatternBuilderService.setCurrentPattern()`](src/app/services/pattern-builder.service.ts:20) — aliasować przed lookupem

**Rekomendacja: Opcja A** — aliasowanie na najwcześniejszym etapie, żeby cały system (validator + serwisy) widział już kanoniczną nazwę.

Analogicznie dla skal, jeśli istnieją popularne aliasy.

### 2. Duplikaty kluczy w @for

Zmienić wszystkie `track interval` → `track $index` i `track step` → `track $index` w [`pattern-display.component.html`](src/app/pattern-display/pattern-display.component.html).

Wystąpienia:
- Linia 20: `@for (interval of p.intervals; track interval; let last = $last)`
- Linia 46: `@for (interval of rc.intervals; track interval; let last = $last)`
- Linia 68: `@for (step of p.steps; track step)`
- Linia 101: `@for (interval of p.intervals; track interval; let last = $last)`
- Linia 121: `@for (step of p.steps; track step)`
- Linia 142: `@for (interval of rc.intervals; track interval; let last = $last)`

`track $index` jest bezpieczne, bo kolejność elementów w tych tablicach jest stabilna (są generowane w [`PatternBuilderService`](src/app/services/pattern-builder.service.ts:42-47) w stałej kolejności).

## MVP

- Rejestr aliasów dla akordów (najpopularniejsze skróty)
- Aliasowanie w `DomainValidator.validatePattern()` przed lookupem w CHORD_PATTERNS
- Wszystkie `track interval` → `track $index` i `track step` → `track $index` w pattern-display.component.html
- Build przechodzi (`npm run build`)
- Test: `maj7` → `major-7th` alias działa przez `DomainService.execute()`
- Test: brak błędów NG0955 w konsoli przy wyświetlaniu patternu

## Done when

- `window.__ds.execute({ type: 'show-pattern', patternType: 'chord', patternName: 'maj7', rootNote: 'C' })` zwraca `{ success: true, ... }`
- Żaden pattern nie powoduje NG0955 w konsoli
- `npm run build` succeeds
- Testy dla aliasów w `domain-validator.spec.ts`
- Testy dla `track $index` w `pattern-display.component.spec.ts`

## Status

OPEN

# P13: `displayMode` nie jest reaktywny — `__ds.execute()` nie aktywuje legend ani relationship-strip

## Motivation

`window.__ds.execute()` nie powoduje wyświetlenia odpowiedniego panelu (legend lub relationship-strip), mimo że [`DomainService`](src/app/domain/domain.service.ts) poprawnie aktualizuje stan.

Konkretne przypadki:
1. `__ds.execute({ type: 'resolve-shape', shapeId: 'cowboy-C' })` — nie wyświetla [`app-legend`](src/app/legend/legend.component.ts), mimo że nuty są poprawnie pokazane na gryfie
2. `__ds.execute({ type: 'compare-patterns', ... })` — nie wyświetla [`app-relationship-strip`](src/app/relationship-strip/relationship-strip.component.ts), mimo że `DomainState.mode = 'scale-chord'` i `scaleChordState` są poprawnie ustawione

Przyczyna: [`displayMode`](src/app/home-page/home-page.component.ts:44) jest ustawiany tylko w [`HomePageComponent.onToolboxEvent()`](src/app/home-page/home-page.component.ts:65), który nie jest wywoływany przy bezpośrednim wywołaniu `DomainService.execute()` przez AI, konsolę (`window.__ds`), lub przyszłych klientów. To łamie zasadę, że każdy klient DomainService (Toolbox, AI, `window.__ds`) powinien mieć ten sam rezultat wizualny.

Dodatkowo istnieje TODO w [`home-page.component.ts:17`](src/app/home-page/home-page.component.ts:17): `// TODO: Czy displayMode nie powinno być z DomainState.mode zsynchronizowane?`

## Solution

Zastąpić ręczne ustawianie `displayMode` w `onToolboxEvent()` reaktywnym `effect()` w `HomePageComponent`, który synchronizuje `displayMode` z `DomainState.mode` i `FretboardStateService.hasActiveResult`:

```typescript
private modeEffect = effect(() => {
  const state = this.domainService.currentState();
  const hasResult = this.guitarNeckService.hasActiveResult();

  if (!hasResult) {
    this.displayMode.set(null);
    return;
  }

  switch (state.mode) {
    case 'scale':
    case 'chord':
    case 'custom':
    case 'positions':
      this.displayMode.set('legend');
      break;
    case 'scale-chord':
      this.displayMode.set('relationship');
      break;
  }
});
```

Potrzebne `hasActiveResult` — bez niego nie można odróżnić "nic nie wybrano" (mode='scale' z DEFAULT_DOMAIN_STATE) od "wybrano skalę". `hasActiveResult` jest `false` po clear/init i `true` po każdym wyświetleniu patternu.

Konsekwencje:
- `onToolboxEvent()` przestaje ręcznie ustawiać `displayMode` — robi to `effect()` automatycznie
- `rangeDisabled` pozostaje ręcznie sterowane (bo zależy od konkretnego command, nie tylko od mode)
- Testy w `home-page.component.spec.ts` wymagają aktualizacji — `displayMode` będzie ustawiany asynchronicznie przez `effect()`

## MVP

- `effect()` w `HomePageComponent` synchronizujący `displayMode` z `DomainState.mode` + `hasActiveResult`
- Usunięcie zbędnych `displayMode.set()` z `onToolboxEvent()`
- Test: `__ds.execute({ type: 'resolve-shape', shapeId: 'cowboy-C' })` → `displayMode === 'legend'`
- Test: `__ds.execute(compare-patterns)` → `displayMode === 'relationship'`
- Test: `__ds.execute(show-pattern)` → `displayMode === 'legend'`
- Test: `__ds.execute(clear-view)` → `displayMode === null`
- Build przechodzi (`npm run build`)

## Done when

- `window.__ds.execute({ type: 'resolve-shape', shapeId: 'cowboy-C' })` powoduje wyświetlenie legend z aktywnymi interwałami
- `window.__ds.execute({ type: 'compare-patterns', primary: {...}, secondary: {...} })` powoduje wyświetlenie relationship-strip
- `window.__ds.execute({ type: 'show-pattern', ... })` powoduje wyświetlenie legend
- `window.__ds.execute({ type: 'clear-view' })` ukrywa zarówno legend jak i relationship-strip
- Toolbox nadal działa — `onToolboxEvent()` nie jest zepsuty
- `npm run build` succeeds
- Testy w `home-page.component.spec.ts` pokrywają reaktywne zachowanie

## Status

OPEN

---

# P12: FretboardStateService.notes[] — migracja na immutable + signal

## Motivation

Obecnie [`FretboardStateService.notes`](src/app/services/fretboard-state.service.ts:16) to mutowalne pole `GuitarNote[]`, które jest:

1. **Mutowane in-place** przez [`applyHighlightedNotes()`](src/app/services/fretboard-state.service.ts:43-61), [`hideAllNotes()`](src/app/services/fretboard-state.service.ts:63-65), [`showAll()`](src/app/services/fretboard-state.service.ts:67-70), [`clearSelection()`](src/app/services/fretboard-state.service.ts:72-74) — oraz z zewnątrz przez [`markIntervals()`](src/app/services/fretboard-orchestration.service.ts:130-142) i [`removeIntervals()`](src/app/services/fretboard-orchestration.service.ts:145-147)
2. **Przypisywane z zewnątrz** przez [`FreatboardComponent.ngOnInit()`](src/app/freatboard/freatboard.component.ts:36) i [`GuitarNeckComponent`](src/app/guitar-neck/guitar-neck.component.ts:26)
3. **Brak reaktywności** — zmiany `visible`/`selected`/`interval` nie są sygnalizowane, co jest niespójne z `OnPush` change detection i z resztą stanu (`hasActiveResult`, `currentSelection`, `scaleChordState` które są `signal`)
4. **Niespójność architektoniczna** — [`DomainState`](src/app/domain/state.ts:25) jest jawnie zadeklarowany jako *"immutable source of truth"*, podczas gdy `FretboardStateService.notes` jest w pełni mutowalny

## Solution

Zamienić `notes: GuitarNote[]` na `readonly notes = signal<GuitarNote[]>([])` z immutable aktualizacjami. Wszystkie mutacje `visible`, `selected`, `interval` przechodzą przez `this.notes.update()` tworząc nową tablicę z nowymi obiektami.

### Zmiany w GuitarNote

`GuitarNote` (klasa) zostaje zastąpiona przez interfejs `GuitarNote` (lub klasa z readonly properties + clone()), aby wymusić immutability — nowe instancje przy każdej zmianie.

### Zmiany w FretboardStateService

- `notes` → `readonly notes = signal<GuitarNote[]>([])`
- `applyHighlightedNotes()` → immutable update przez `this.notes.update()`
- `hideAllNotes()`, `showAll()`, `clearSelection()` → immutable update
- `buildNotesMap()` → działa na `this.notes()` (odczyt)
- Usunięcie zewnętrznych przypisań `guitarNeckService.notes = ...` z komponentów

### Zmiany w konsumentach

| Plik | Zmiana |
|------|--------|
| [`FreatboardComponent.ngOnInit()`](src/app/freatboard/freatboard.component.ts:34-38) | Zamiast `this.guitarNeckService.notes = this.notes()` — inicjalizacja przez metodę serwisu |
| [`GuitarNeckComponent`](src/app/guitar-neck/guitar-neck.component.ts:26) | Analogicznie |
| [`FretboardOrchestrationService`](src/app/services/fretboard-orchestration.service.ts) | `markIntervals()` i `removeIntervals()` → immutable update przez serwis |
| [`FretboardDisplayService`](src/app/services/fretboard-display.service.ts:83) | `this.guitarNeckService.notes.forEach()` → `this.guitarNeckService.notes().forEach()` |
| [`FretboardNoteQueryService`](src/app/services/fretboard-note-query.service.ts) | `this.guitarNeckService.notes` → `this.guitarNeckService.notes()` |
| [`MarkerRoleService.computeRoles()`](src/app/services/marker-role.service.ts:61) | `notes: GuitarNote[]` → odczyt z signal |
| Wszystkie `*.spec.ts` | `guitarNeckService.notes = ...` → `guitarNeckService.notes.set(...)` |

### Opcjonalnie: metoda `setNotes()` w FretboardStateService

Dla inicjalizacji z `GuitarNeckComponent`/`FreatboardComponent` — jedna metoda która ustawia notes i przebudowuje notesMap.

## MVP

- `GuitarNote` zmieniony na interfejs (lub readonly)
- `FretboardStateService.notes` → `signal<GuitarNote[]>()`
- Wszystkie mutacje przechodzą przez `this.notes.update()`
- `buildNotesMap()` przebudowywana przy każdej zmianie notes
- `FretboardOrchestrationService.markIntervals()`/`removeIntervals()` delegują do `FretboardStateService`
- Wszystkie konsumenty używają `notes()` (wywołanie signal)
- Build przechodzi (`npm run build`)
- Testy przechodzą (`npm test`)

## Done when

- `npm run build` succeeds
- `npm test` succeeds
- `FretboardStateService.notes` jest `signal<GuitarNote[]>()` — tylko immutable update
- Żaden kod poza `FretboardStateService` nie mutuje `GuitarNote` properties bezpośrednio
- `GuitarNote` jest interfejsem (lub readonly klasą)
- `notesMap` jest przebudowywana przy każdej zmianie notes (przez `computed` lub `effect`)
- Testy w `fretboard-state.service.spec.ts` zaktualizowane dla signal API

## Status

OPEN