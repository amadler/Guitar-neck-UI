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