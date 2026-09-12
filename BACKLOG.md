# P12: FretboardStateService — Mutable state leak → Immutable FretboardSnapshot

**Źródło:** Architecture Review Candidate 1 (Mutable state leak) — [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)
**Plan implementacji:** [`plans/fretboard-state-immutable-refactor.md`](plans/fretboard-state-immutable-refactor.md)

## Motivation

Despite ADR 0005 mandating immutable state, `FretboardStateService` still holds a mutable `GuitarNote[]` array. Methods like `applyHighlightedNotes()`, `hideAllNotes()`, and `clearSelection()` mutate `note.visible`, `note.selected`, and `note.interval` **in-place**. The `GuitarNote` class itself has public mutable fields with no encapsulation.

**Deletion test:** If you deleted `FretboardStateService`, the complexity would *not* concentrate — it would scatter into `FretboardOrchestrationService` (which would need its own note state) and `FretboardDisplayService` (which would need its own derived state cache). The module is **shallow**: its interface (6 public methods) is nearly as complex as its implementation.

## Solution

Replace the mutable `GuitarNote[]` with an **immutable snapshot** pattern. Create a `FretboardSnapshot` value object that captures the complete rendering state (which notes are visible, selected, their intervals) at a point in time. `FretboardStateService` becomes a snapshot store — `currentSnapshot: signal<FretboardSnapshot>` — updated atomically. `GuitarNote` becomes an immutable data class (or interface). The orchestration pipeline produces a new snapshot instead of mutating existing objects.

### Kluczowe różnice względem poprzedniego planu (signal-based)

| Aspekt | Stary plan (signal) | Nowy plan (snapshot) |
|--------|---------------------|----------------------|
| Stan | `signal<GuitarNote[]>` + osobne signaly | `signal<FretboardSnapshot \| null>` — wszystko w jednym |
| `hasActiveResult` | Osobny signal | Część snapshotu |
| `notesMap` | Przebudowywana przy każdej zmianie | Zastąpiona przez `.find()` na snapshot.notes (~150 items) |
| Testowanie | Trzeba mockować signal + sprawdzać efekty uboczne | Asercja na równość snapshotów — czystsze |
| `markIntervals()` | Mutuje przez serwis | Zwraca `Map<string, string>` — czysta funkcja |

### Pliki do zmiany (~16)

| Plik | Zmiana |
|------|--------|
| `src/app/shared/model/fretboard-snapshot.ts` | **NOWY** — `FretboardSnapshot` + `FretboardNote` interfejsy |
| `src/app/shared/model/guitarNote.ts` | Klasa → immutable interface + `createGuitarNote()` factory |
| `src/app/services/fretboard-state.service.ts` | `notes: GuitarNote[]` → `currentSnapshot: signal<FretboardSnapshot \| null>` |
| `src/app/services/fretboard-orchestration.service.ts` | `markIntervals()` → `computeIntervals()` zwraca `Map`; `display*()` produkują snapshot |
| `src/app/services/fretboard-display.service.ts` | Czyta z `currentSnapshot()` zamiast `notes` |
| `src/app/services/fretboard-note-query.service.ts` | Czyta z `currentSnapshot()` zamiast `notes` |
| `src/app/services/marker-role.service.ts` | `notes: GuitarNote[]` → `readonly GuitarNote[]` |
| `src/app/services/note.service.ts` | `new GuitarNote()` → `createGuitarNote()` |
| `src/app/guitar-neck/guitar-neck.component.ts` | `service.notes = ...` → `service.initialize()` |
| `src/app/guitar-neck/guitar-neck.component.html` | Usunąć `[notes]` binding |
| `src/app/freatboard/freatboard.component.ts` | `notes` input → getter z `currentSnapshot()` |
| `src/app/freatboard/freatboard.component.html` | `notes()` → `notes` |
| `src/app/legend/legend.component.ts` | `hasActiveResult()` → `currentSnapshot()?.hasActiveResult` |
| Wszystkie `*.spec.ts` dla powyższych | Aktualizacja mocków i asercji |

## Kolejność implementacji

1. Stworzyć `FretboardSnapshot` type (nowy plik)
2. `GuitarNote` → immutable interface + factory
3. `FretboardStateService` → snapshot signal
4. `FretboardOrchestrationService` → produkuje snapshoty
5. `FretboardDisplayService` → czyta z snapshotu
6. `FretboardNoteQueryService` → czyta z snapshotu
7. `MarkerRoleService` → typ parametru
8. Komponenty → usunięcie bezpośrednich przypisań
9. Testy → aktualizacja

## MVP

- Wszystkie zmiany z powyższej tabeli wdrożone
- `npm run build` succeeds
- `npm test` succeeds (wszystkie testy związane z FretboardStateService przechodzą)
- Żaden kod poza `FretboardStateService` nie mutuje `GuitarNote` properties bezpośrednio
- `GuitarNote` jest immutable interface

## Done when

- `npm run build` succeeds
- `npm test` succeeds
- `FretboardStateService.currentSnapshot` jest `signal<FretboardSnapshot | null>()`
- `applyHighlightedNotes()` przyjmuje opcjonalny `intervalMap` i produkuje snapshot
- `computeIntervals()` w `FretboardOrchestrationService` jest czystą funkcją zwracającą `Map`
- Wszystkie komponenty czytają stan z `currentSnapshot()` zamiast `notes`
- Testy w `fretboard-state.service.spec.ts` używają snapshot API

## Status

OPEN