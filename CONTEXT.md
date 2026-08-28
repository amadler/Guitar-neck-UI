# Guitar Neck App

Interactive fretboard visualization for learning scales, chords, and their relationships on the guitar.

## Language

**AppMode**:
The current mode of the application, determining which UI controls and visualizations are shown.
Values: `'idle'` (start screen), `'scale'` (single scale/chord learning), `'scale-chord'` (scale-chord relation comparison).
_Avoid_: View, screen, state

**ModeSelectorComponent**:
The start screen component shown when `appMode === 'idle'`. Presents two choices: "Scale" and "Scale + Chord".

**ScaleFormComponent**:
Form for selecting a scale (type + root key) in scale-only mode. Shown when `appMode === 'scale'`.

**ScaleChordFormComponent**:
Form for independently selecting a scale (type + root key) AND a chord (type + root key) in relation mode. The chord is independent — it does not need to be a diatonic chord of the selected scale.
_Avoid_: Degree form (degree is a future shortcut, not the primary selection mechanism)

**RelationshipStripComponent**:
Compact bar showing the relationship between a scale and a chord. Includes: role legend (scale-root, chord-tone, chord-root, chord-tone-outside-scale), chord tone overlap info, and a degree shortcut (future). Replaces the legend in scale-chord mode.
_Avoid_: Chord legend, relation legend

**MarkerRole**:
The visual role of a note on the fretboard when both a scale and a chord are displayed. Values: `scale-tone`, `chord-tone` (belongs to both), `scale-root`, `chord-root`, `chord-tone-outside-scale` (belongs to chord but not scale).
_Avoid_: Interval role, note role

**AppStateService**:
Service managing the current `AppMode` and providing reactive state for UI visibility. Separated from `FretboardStateService` to keep fretboard state independent of UI mode logic.
_Avoid_: Mode service, UI state service

**ChordDegreeResolverService**:
Service (future) that computes diatonic chord types and root notes from a scale degree. Currently the logic lives in `ChordDegreeSelectorComponent` — will be extracted during degree feature implementation.
_Avoid_: Degree service

**Fit info**:
Raw data showing which chord tones are inside the scale and which are outside. Displayed as a list of note names, without evaluation (no "Great fit" / "Partial fit" labels).
_Avoid_: Fit score, match rating

**ScaleChordState**:
Dual selection state held by `FretboardStateService`, containing a `scale: MusicSelection` and an optional `chord: MusicSelection | null`. When `chord` is null, the app is in single-pattern mode (scale-only or chord-only).
_Avoid_: Relation state, dual state

**PatternDisplayComponent**:
Component showing the current pattern info (scale card and/or chord card). In scale-chord mode shows both cards side by side with practice prompts.
_Avoid_: Pattern info, selected patterns

**Tonal.js**:
Local music theory engine (`@tonaljs/tonal` v4) used for calculating scale notes, chord notes, and interval names. Replaces the former `music-theory-api` backend. All Tonal imports are confined to `FretboardOrchestrationService` — no UI component imports Tonal directly.
_Avoid_: Backend API, music theory API

**TonalAdapter**:
Map of interval names between Tonal.js notation (`'3M'`, `'3m'`) and Guitar Neck UI notation (`'major-3rd'`, `'minor-3rd'`). Lives in `src/app/shared/tonal-adapter.ts`.
_Avoid_: Interval converter, tonal mapper
