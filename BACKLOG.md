# Practice prompts for selected pattern

## Motivation

After selecting a scale or chord, users may not know what to do with the displayed notes.

## Solution

Show simple practice prompts near the current pattern summary.

For example:
- Play the scale ascending and descending.
- Play only root notes.
- Say note names while playing.
- Play one note per metronome click.
- Limit yourself to the selected fret range.

## MVP

Display static or rule-based practice prompts for the active selection.

Prompts are stored in a separate data file (`src/app/shared/practice-prompts.data.ts`) keyed by pattern type. The `PatternDisplayComponent` reads from this file and renders the relevant prompts.

Implementation changes:
- `src/app/shared/practice-prompts.data.ts` — new file with prompt arrays per type
- `src/app/pattern-display/pattern-display.component.ts` — import data file, add `getPromptsForType()` method
- `src/app/pattern-display/pattern-display.component.html` — add prompts section inside existing `*ngIf` block
- `src/app/pattern-display/pattern-display.component.scss` — styles for prompts list
- `src/app/pattern-display/pattern-display.component.spec.ts` — test rendering

## Done when

- Scale selections show relevant practice prompts.
- Chord selections show relevant practice prompts.
- Prompts do not require scoring or tracking.
- Prompts are hidden when nothing is selected.
- Prompt texts are editable in `src/app/shared/practice-prompts.data.ts` without changing component code.
- Current language: Polish. Localization (pl/en) tracked as a separate task.

## Status

FIXED
