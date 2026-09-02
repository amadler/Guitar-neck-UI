# P2: Consolidate interval configuration — single source of truth

## Motivation

Four independent places define the same interval mappings with different shapes and purposes:

1. [`toolbox.builder.component.ts`](../guitar-toolbox/projects/guitar-toolbox-lib/src/lib/toolbox-forms/toolbox-forms/toolbox.builder/toolbox.builder.component.ts:9) — `INTERVAL_LABELS` + `INTERVAL_OPTIONS` (symbol → label for UI dropdown)
2. [`home-page.component.ts`](src/app/home-page/home-page.component.ts:95) — `semitoneMap` (symbol → semitone for `handleShowInterval()`)
3. [`pattern-builder.service.ts`](src/app/services/pattern-builder.service.ts:8) — `SEMITONE_TO_INTERVAL` (semitone → symbol for pattern display)
4. [`note-utils.ts`](src/app/shared/note-utils.ts:33) — `CHROMA_TO_INTERVAL` (chroma → Tonal interval name for `intervalBetween()`)
5. [`tonal-adapter.ts`](src/app/shared/tonal-adapter.ts:25) — `INTERVAL_MAP` (Tonal name → UI CSS class name)

Each is a partial view of the same 12 intervals. Adding a new interval or fixing a mapping requires touching 5 files. The toolbox is now inlined in `src/app/toolbox/`, so sharing code between toolbox and the rest of the app is trivial — but the duplication still exists.

## Solution

Create a single `INTERVAL_CONFIG` array in `guitar-neck-shared` (the shared library already used by both projects) that contains all properties for each interval:

```typescript
export interface IntervalConfig {
  symbol: string;       // 'b3'
  semitone: number;     // 3
  label: string;        // 'minor 3'
  tonalName: string;    // '3m'
  cssClass: string;     // 'minor-3rd'
}
```

Then refactor all 5 consumers to derive their data from this single source.

## MVP

- `INTERVAL_CONFIG` is exported from `guitar-neck-shared`
- Toolbox `INTERVAL_OPTIONS` is derived from `INTERVAL_CONFIG`
- `home-page.component.ts` `semitoneMap` is replaced by lookup in `INTERVAL_CONFIG`
- `pattern-builder.service.ts` `SEMITONE_TO_INTERVAL` is replaced by lookup in `INTERVAL_CONFIG`
- `note-utils.ts` `CHROMA_TO_INTERVAL` is replaced by lookup in `INTERVAL_CONFIG`
- `tonal-adapter.ts` `INTERVAL_MAP` is replaced by lookup in `INTERVAL_CONFIG`
- All existing tests pass

## Done when

- `grep -n 'INTERVAL_LABELS\|INTERVAL_OPTIONS\|semitoneMap\|SEMITONE_TO_INTERVAL\|CHROMA_TO_INTERVAL\|INTERVAL_MAP' src/` returns zero results (except the new single source)
- Toolbox dropdown shows same intervals as before
- All interval colors work correctly
- `npm test` passes
- `npm run build` succeeds

## Status

OPEN