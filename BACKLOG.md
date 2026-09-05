# P6: API Extension — semantyczne komendy, shape registry, detekcja Tonal

## Motivation

Obecne API (`show-pattern`, `show-interval`, `compare-patterns`) pokazuje tylko skale/akordy na całym gryfie. Brakuje możliwości:
- Pokazania konkretnego voicingu (przewrót, string set, spread)
- Pokazania arpeggio (sekwencja interwałowa)
- Pokazania zagrywki (konkretne pozycje z walidacją)
- Detekcji akordu/skali z listy nut (przez Tonal.js)
- Wyświetlenia akordów kowbojskich, barre i triad w przewrotach

AI potrzebuje semantycznego API — opisuje intencję muzyczną, aplikacja oblicza pozycje.

## Solution

Rozszerzenie DomainContract o 3 nowe komendy semantyczne i 3 nowe kwerendy detekcyjne, plus shape registry (dane, nie kod).

### Nowe komendy

| Komenda | Opis |
|---------|------|
| `show-voicing` | Akord w konkretnym przewrocie na zadanych strunach |
| `show-arpeggio` | Sekwencja interwałowa na zadanych strunach |
| `show-lick` | Konkretne pozycje (string, fret) z walidacją nuty |
| `resolve-shape` | Nazwany kształt (cowboy, barre, triada) → pozycje |

### Nowe kwerendy

| Kwerenda | Opis |
|----------|------|
| `detect-chord` | Z listy nut → nazwa akordu (przez chord-detect) |
| `detect-scale` | Z listy nut → nazwa skali (przez scale-detect) |
| `get-key-analysis` | Pełna analiza tonacji (przez key) |

### Nowe serwisy/pliki

- [`src/app/shared/model/guitar-shapes.ts`](src/app/shared/model/guitar-shapes.ts) — typy + rejestr kształtów (cowboy, barre, triad inversions)
- [`src/app/services/shape-resolver.service.ts`](src/app/services/shape-resolver.service.ts) — rozwijanie kształtów na pozycje

### Rozszerzone serwisy

- [`src/app/services/tonal-facade.service.ts`](src/app/services/tonal-facade.service.ts) — `detectChord()`, `detectScale()`, `getMajorKey()`, `getMinorKey()`, `filterNotesBySet()`, `isSubsetOf()`, `isSupersetOf()`
- [`src/app/services/note.service.ts`](src/app/services/note.service.ts) — `getNoteAtPosition()`, `findPositionsByExactCoordinates()`
- [`src/app/services/fretboard-orchestration.service.ts`](src/app/services/fretboard-orchestration.service.ts) — `displayPositions()` (wewnętrzne RAW API)
- [`src/app/domain/domain-validator.ts`](src/app/domain/domain-validator.ts) — `validateStringIndex()`, `validateFret()`, `validatePosition()`, `validateNoteAtPosition()`, `validateVoicing()`

### Toolbox UI

Nowy intent "Shape" z kategoriami: Cowboy, Barre, Triad. Dla movable shapes (barre, triad) — wybór root note.

## MVP

- Wszystkie nowe komendy i kwerendy zdefiniowane w DomainContract
- Shape registry z danymi: 10 cowboy chords, 4 barre shapes, 24 triad inversions
- Toolbox UI z nową sekcją Shape
- Build przechodzi (`npm run build`)

## Done when

- `npm run build` succeeds
- Nowe komendy są dostępne przez `DomainService.execute()`
- Nowe kwerendy są dostępne przez `DomainService.query()`
- Toolbox ma działającą sekcję Shape
- Dokumentacja API zaktualizowana

## Status

OPEN