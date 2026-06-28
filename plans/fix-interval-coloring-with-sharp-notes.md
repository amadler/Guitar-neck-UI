# Plan: Fix Interval Coloring with Sharp (#) Root Notes

## Bug Description

When selecting a chord or scale with a sharp root note (e.g., C#, F#, G#), the intervals on the fretboard stay black (no coloring). This happens even though notes are displayed on the fretboard.

## Root Cause Analysis

### Data Flow

1. User selects a chord with sharp root note (e.g., "C# major") in the toolbox form
2. `ToolboxFormComponent` emits `ToolboxSearchQuery` with `keys: "C#"`
3. `DisplayChordCommand.execute()` → `FretboardOrchestrationService.displayChord("major", "C#")`
4. `MusicPatternApiService.resolveChordNotes("major", "C#")` makes HTTP GET to:
   ```
   http://localhost:3000/api/chords/major/C#
   ```
5. **The browser interprets `#` as a URL fragment identifier** → actual request goes to:
   ```
   http://localhost:3000/api/chords/major/C
   ```
6. API returns notes for **C major** (`["C", "E", "G"]`) instead of **C# major** (`["C#", "F", "G#"]`)
7. `FretboardNotePositionService.findPositionsByChordNotes(...)` finds positions for C, E, G on the fretboard
8. `IntervalService.markIntervals("C#", "major", highlightedNotes)` builds an interval map using C# as root:
   - `"C#" → "root"`
   - `"F" → "major-3rd"`
   - `"G#" → "perfect-5th"`
9. But the selected notes are **C, E, G** — none of these match the interval map keys
10. All intervals remain `""` (empty string) → notes render without interval CSS classes → **black**

### The Bug

In [`src/app/services/scales-and-triads.service.ts`](src/app/services/scales-and-triads.service.ts:29), the `rootNote` is interpolated directly into the URL template string without URL encoding:

```typescript
// Line 29: scales
this.http.get<{notes: string[]}>(`${this.API_URL}/scales/${formattedName}/${rootNote}`)

// Line 36: chords
this.http.get<{notes: string[]}>(`${this.API_URL}/chords/${formattedName}/${rootNote}`)
```

The `#` character is a reserved URL fragment delimiter. It must be encoded as `%23` to be treated as part of the path.

### Scope

The same bug affects **both scales and chords** since both methods use the same pattern.

## Fix

**File:** [`src/app/services/scales-and-triads.service.ts`](src/app/services/scales-and-triads.service.ts)

Apply `encodeURIComponent()` to `rootNote` in both API URL constructions:

```typescript
// Line 29 (resolveScaleNotes):
return this.http.get<{notes: string[]}>(`${this.API_URL}/scales/${formattedName}/${encodeURIComponent(rootNote)}`)

// Line 36 (resolveChordNotes):
return this.http.get<{notes: string[]}>(`${this.API_URL}/chords/${formattedName}/${encodeURIComponent(rootNote)}`)
```

This will encode `C#` → `C%23` in the URL, so the browser sends it correctly as part of the path.

## Testing

1. Update the existing spec file [`src/app/services/scales-and-triads.service.spec.ts`](src/app/services/scales-and-triads.service.spec.ts) to add a test case with a sharp root note
2. Verify the URL is correctly encoded with `%23` instead of `#`
3. Run `npm test` to confirm all tests pass
4. Run `npm run build` to confirm no compilation errors

## Verification Steps

After the fix is applied:
1. Start the app with `npm start`
2. Select a chord with sharp root note (e.g., "C#" + "major")
3. Confirm that intervals are colored correctly (root, major-3rd, perfect-5th)
4. Test with F# major, G# major, etc.
5. Test with scales using sharp root notes (e.g., "F#" + "major")
