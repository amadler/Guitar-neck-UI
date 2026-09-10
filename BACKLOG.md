# P6: API Extension — shape registry, detekcja Tonal, semantyczne kwerendy

## Motivation

Obecne API (`show-pattern`, `show-interval`, `compare-patterns`) pokazuje tylko skale/akordy na całym gryfie. Brakuje możliwości:
- Detekcji akordu/skali z listy nut (przez Tonal.js)
- Analizy tonacji (key analysis)
- Wyświetlenia akordów kowbojskich i barre z shape registry
- Rozwiązywania nazwanych kształtów na konkretne pozycje

AI potrzebuje semantycznego API — opisuje intencję muzyczną, aplikacja oblicza pozycje.

## Solution

Rozszerzenie DomainContract o 1 nową komendę (`resolve-shape`) i 3 nowe kwerendy detekcyjne, plus shape registry (dane, nie kod).

### Nowe komendy

| Komenda | Opis |
|---------|------|
| `resolve-shape` | Nazwany kształt (cowboy, barre) → pozycje |

### Nowe kwerendy

| Kwerenda | Opis |
|----------|------|
| `detect-chord` | Z listy nut → nazwa akordu (przez chord-detect) |
| `detect-scale` | Z listy nut → nazwa skali (przez scale-detect) |
| `get-key-analysis` | Pełna analiza tonacji (przez key) — własny DTO KeyAnalysis |
| `get-available-shapes` | Lista dostępnych kształtów z rejestru |

### Nowe serwisy/pliki

- [`src/app/shared/model/guitar-shapes.ts`](src/app/shared/model/guitar-shapes.ts) — typy + rejestr kształtów (cowboy, barre)
- [`src/app/services/shape-resolver.service.ts`](src/app/services/shape-resolver.service.ts) — rozwijanie kształtów na pozycje

### Rozszerzone serwisy

- [`src/app/services/tonal-facade.service.ts`](src/app/services/tonal-facade.service.ts) — `detectChord()`, `detectScale()`, `getMajorKey()`, `getMinorKey()`
- [`src/app/services/note.service.ts`](src/app/services/note.service.ts) — `getNoteAtPosition()`, `findPositionsByExactCoordinates()`
- [`src/app/services/fretboard-orchestration.service.ts`](src/app/services/fretboard-orchestration.service.ts) — `displayPositions()` (wewnętrzne RAW API)
- [`src/app/domain/domain-validator.ts`](src/app/domain/domain-validator.ts) — `validateStringIndex()`, `validateFret()`, `validatePosition()`, `validateNoteAtPosition()`

### Toolbox UI

Nowy intent "Shape" z kategoriami: Cowboy, Barre.

## MVP

- `resolve-shape` command zdefiniowana w DomainContract
- `detect-chord`, `detect-scale`, `get-key-analysis`, `get-available-shapes` kwerendy
- Shape registry z danymi: 10 cowboy chords (z własnym rootNote/chordType), 4 barre shapes
- Walidacja pozycji (string, fret, zgodność nuty)
- `displayPositions()` jako wewnętrzne RAW API
- Build przechodzi (`npm run build`)
- Testy dla foundation: shape resolver, walidacja pozycji, dane kształtów, semantic queries

## Done when

- `npm run build` succeeds
- `resolve-shape` dostępne przez `DomainService.execute()`
- Nowe kwerendy dostępne przez `DomainService.query()`
- Cowboy shapes mają własne `rootNote`/`chordType` — niespójny stan zablokowany
- Dane w guitar-shapes.ts zweryfikowane — każda pozycja zgodna z interwałem
- Testy dla foundation przechodzą
- Dokumentacja API zaktualizowana

## Status

OPEN

---

# P7: show-voicing — akord w konkretnym przewrocie na zadanych strunach

## Motivation

Po zaimplementowaniu foundation (P6), potrzebujemy możliwości pokazania konkretnego voicingu akordu — z wyborem strun, przewrotu, spreadu i pominięć. To kluczowa funkcjonalność dla AI, która chce opisać brzmienie, nie tylko zbiór nut.

## Solution

Implementacja `ShowVoicingCommand`:
- `chordType`, `rootNote` — jaki akord
- `voicing.stringSet` — które struny
- `voicing.inversion` — przewrót (0=root, 1=1st, 2=2nd)
- `voicing.spread` — rozproszony bas
- `voicing.omit` — które interwały pominąć

Wymaga poprawnego resolvera całego układu pozycji (nie tylko najniższy próg per struna).

## MVP

- `ShowVoicingCommand` zdefiniowany w DomainContract
- Handler w DomainService obliczający pozycje
- Wyświetlanie przez `displayPositions()`
- Build przechodzi

## Done when

- `show-voicing` dostępne przez `DomainService.execute()`
- Voicing z inversion/spread/omit działa poprawnie
- Testy dla różnych konfiguracji voicingu

## Status

POSTPONED

---

# P8: show-arpeggio — sekwencja interwałowa na zadanych strunach

## Motivation

Arpeggio to sekwencja nut (nie zbiór). Obecny fretboard pokazuje tylko zbiór pozycji bez kolejności. Potrzebujemy komendy, która pozwoli AI zdefiniować sekwencję interwałową i wyświetlić ją na gryfie.

## Solution

Implementacja `ShowArpeggioCommand`:
- `chordType`, `rootNote` — jaki akord
- `pattern` — sekwencja interwałowa: `['root', '3', '5', '3', 'root']`
- `strings` — na których strunach grać

## MVP

- `ShowArpeggioCommand` zdefiniowany w DomainContract
- Handler mapujący pattern interwałowy na nuty i pozycje
- Wyświetlanie przez `displayPositions()`
- Build przechodzi

## Done when

- `show-arpeggio` dostępne przez `DomainService.execute()`
- Arpeggio z dowolnym patternem działa
- Testy dla różnych patternów

## Status

POSTPONED

---

# P9: show-lick — konkretne pozycje z walidacją

## Motivation

Czasem AI lub użytkownik chce pokazać konkretną zagrywkę — dokładne pozycje (string, fret) z walidacją, czy dana nuta faktycznie brzmi na wskazanej pozycji.

## Solution

Implementacja `ShowLickCommand`:
- `notes` — tablica pozycji: `{ note, string, fret? }`
- Walidacja każdej pozycji: string (1-6), fret (0-24), zgodność nuty
- Jeśli fret nie podany — znajdź najbliższy próg dla nuty na danej strunie

## MVP

- `ShowLickCommand` zdefiniowany w DomainContract
- Handler walidujący i wyświetlający pozycje
- Wyświetlanie przez `displayPositions()`
- Build przechodzi

## Done when

- `show-lick` dostępne przez `DomainService.execute()`
- Walidacja pozycji działa (błąd dla niezgodnej nuty)
- Auto-resolve fret działa gdy fret nie podany
- Testy dla walidacji i auto-resolve

## Status

POSTPONED

---

# P10: CAGED minor shapes — definicje i obsługa w UI

## Motivation

Obecny shape registry ma tylko cowboy (open chords) i barre shapes. Brakuje kształtów CAGED (C-form, A-form, G-form, E-form, D-form) w wersji minor. Są one kluczowe dla systematyki gryfu — pozwalają pokazać mollowy akord w dowolnej pozycji na gryfie.

## Solution

Rozszerzenie shape registry o 5 minor CAGED form (Cm, Am, Gm, Em, Dm) oraz dodanie kategorii `'caged'` do `ShapeCategory` w toolbox UI.

### Nowe dane w guitar-shapes.ts

| ID | Name | Root string | String set |
|----|------|-------------|------------|
| `caged-Cm-form` | CAGED Cm-form (minor) | 5 (A) | [5,4,3,2,1] |
| `caged-Am-form` | CAGED Am-form (minor) | 5 (A) | [5,4,3,2,1] |
| `caged-Gm-form` | CAGED Gm-form (minor) | 6 (E) | [6,5,4,3,2,1] |
| `caged-Em-form` | CAGED Em-form (minor) | 6 (E) | [6,5,4,3,2,1] |
| `caged-Dm-form` | CAGED Dm-form (minor) | 4 (D) | [4,3,2,1] |

### Zmiany w UI

- `ShapeCategory` w model.ts: `'cowboy' | 'barre' | 'caged'`
- Toolbox: trzeci przycisk/wybor dla CAGED
- `currentShapes` getter: case dla `'caged'`

## MVP

- 5 minor CAGED form zdefiniowane w GUITAR_SHAPES
- `ShapeCategory` rozszerzone o `'caged'`
- Toolbox UI pozwala wybrać CAGED shapes
- Build przechodzi

## Done when

- `npm run build` succeeds
- Wszystkie 5 CAGED minor form dostępne przez `resolve-shape`
- Toolbox ma opcję wyboru CAGED shapes
- Każda pozycja CAGED shape zweryfikowana — zgodna z interwałem

## Status

OPEN

---

# P11: fretRange nie resetuje się po przejściu z shape na scale/chord

## Motivation

Gdy użytkownik ogląda shape (np. cowboy-C, zakres auto-fit `0-4`), a następnie wybiera skalę lub akord z toolboxa, `fretRange` pozostaje zwężony z auto-fitu. Skala/akord może być częściowo lub całkowicie poza widokiem, a użytkownik musi ręcznie zmienić zakres w range toolbar.

Problem występuje w [`handleShowPattern`](src/app/domain/domain.service.ts:130):
```
fretRange: command.fretRange ?? this.currentState().fretRange,
```
gdy `command.fretRange` jest `undefined`, bierze `this.currentState().fretRange` — czyli poprzedni, auto-fitted zakres z shape'a.

## Solution

W `handleShowPattern`, gdy `command.fretRange` nie jest podany, zamiast brać `this.currentState().fretRange`, użyć `DEFAULT_DOMAIN_STATE.fretRange` (lub obliczyć optymalny zakres dla wybranego patternu).

## MVP

- Zmiana w [`domain.service.ts`](src/app/domain/domain.service.ts:137): `fretRange: command.fretRange ?? DEFAULT_DOMAIN_STATE.fretRange`
- Test: `resolve-shape` → `show-pattern` → sprawdź, że `fretRange` wrócił do `{ min: 0, max: 24 }`

## Done when

- `npm run build` succeeds
- Po `resolve-shape` → `show-pattern` (bez jawnego `fretRange` w command), zakres wraca do pełnego `0-24`
- Test w `domain.service.spec.ts` potwierdza zachowanie

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