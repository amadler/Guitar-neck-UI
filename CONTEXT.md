# Guitar Neck App

Interactive fretboard visualization for learning scales, chords, and their relationships on the guitar.

## Language

**AppMode**:
The current mode of the application, determining which UI controls and visualizations are shown.
Values: `'custom-pattern'` (custom interval builder), `'scale-or-chord'` (single scale/chord learning, default), `'scale-chord'` (scale-chord relation comparison).
_Avoid_: View, screen, state

**ToolboxBuilderComponent**:
The toolbox component from `src/app/toolbox/` (selector `app-toolbox-builder`). Provides three modes: Show (scale/chord/interval), Compare (scale+chord). Communicates via `@Output() toolboxEvent: EventEmitter<FretboardCommand>`.
_Avoid_: ToolboxFormComponent, toolbox form

**FretboardCommand**:
The event type emitted by `FormsWrapperComponent`. Variants: `scale`, `chord`, `intervalPattern`, `scaleChordRelation`. Each carries the selected pattern name(s) and root note(s).
_Avoid_: ToolboxSearchQuery, UICommand

**RelationshipStripComponent**:
Compact bar showing the relationship between a scale and a chord. Includes: role legend (scale-root, chord-tone, chord-root, chord-tone-outside-scale), chord tone overlap info, and a degree shortcut (future). Replaces the legend in scale-chord mode.
_Avoid_: Chord legend, relation legend

**MarkerRole**:
The visual role of a note on the fretboard when both a scale and a chord are displayed. Values: `scale-tone`, `chord-tone` (belongs to both), `scale-root`, `chord-root`, `chord-tone-outside-scale` (belongs to chord but not scale).
_Avoid_: Interval role, note role

**DomainState.mode**:
The application mode stored in `DomainState.mode` (values: `'scale' | 'chord' | 'scale-chord' | 'custom'`). Set by `DomainService` command handlers. Components read it via `domainService.currentState.mode`. Replaces the former `AppStateService.appMode`.
_Avoid_: AppMode, app state

**ScaleChordState**:
Dual selection state held by `FretboardStateService`, containing a `scale: MusicSelection` and an optional `chord: MusicSelection | null`. When `chord` is null, the app is in single-pattern mode (scale-only or chord-only).
_Avoid_: Relation state, dual state

**PatternDisplayComponent**:
Component showing the current pattern info (scale card and/or chord card). In scale-chord mode shows both cards side by side with practice prompts.
_Avoid_: Pattern info, selected patterns

**Tonal.js**:
Local music theory engine (`@tonaljs/tonal` v4) used for calculating scale notes, chord notes, and interval names. Replaces the former `music-theory-api` backend. All Tonal imports are confined to `TonalFacadeService` — no other service or UI component imports Tonal directly. For exotic patterns not in Tonal, falls back to `CHORD_PATTERNS`/`SCALE_PATTERNS` from `guitar-neck-shared`.
_Avoid_: Backend API, music theory API

**TonalAdapter**:
Map of interval names between Tonal.js notation (`'3M'`, `'3m'`) and Guitar Neck UI notation (`'major-3rd'`, `'minor-3rd'`). Also maps pattern names (UI `'dominant-7th'` → Tonal `'7'`). Lives in `src/app/shared/tonal-adapter.ts`.
_Avoid_: Interval converter, tonal mapper

**FretboardOrchestrationService**:
Main orchestrator coordinating the pipeline: music theory → positions → highlighting → intervals. Uses `TonalFacadeService` for all Tonal.js calls.
_Avoid_: Music theory facade, scale service

**FretboardStateService**:
Central fretboard state manager. Owns the notes array, active strings, marker display mode, current selection, and scale-chord state.
_Avoid_: Guitar neck service, neck state

**FretboardNotePositionService**:
Generates the note map on the fretboard (6 strings × 24 frets) and provides position lookup methods.
_Avoid_: Note service, position service

**FretboardNoteQueryService**:
Query helper for the fretboard template. Provides `isNoteOnFret()`, `getNote()`, `getNoteName()` with active string awareness.
_Avoid_: Note query, fret query

**MarkerRoleService**:
Computes visual roles for notes when both a scale and a chord are displayed. Uses `CHORD_PATTERNS`/`SCALE_PATTERNS` directly (not Tonal.js) for role resolution.
_Avoid_: Role service, visual role service

**FretboardDisplayService**:
Presentation layer for fretboard markers. Decides CSS classes based on mode (interval-based vs role-based).
_Avoid_: Display service, marker service

**PatternBuilderService**:
Builds `PatternInfo` objects for the UI — notes, intervals, semitones, and whole/half steps for the selected scale or chord.
_Avoid_: Pattern service, info builder

**CommandBarComponent**:
Top bar replacing the dock/toolbox. Contains mode selector (Show/Compare/Build), key/pattern selects, Apply button, and range preset buttons. Communicates via `FretboardCommand` events.
_Avoid_: Toolbox bar, top toolbar

**BottomPanelComponent**:
Bottom section with three columns: Scale Info (pattern notes/intervals), Chord Info (related chord notes/intervals), and Metronome. Replaces the old dock + separate pattern-display layout.
_Avoid_: Info panel, dock panel

**FretboardSectionComponent**:
Wrapper component containing the fretboard, string toggles (vertical left), and relationship strip (below fretboard). Provides visual grouping for the main interaction area.
_Avoid_: Neck section, fretboard wrapper

**MarkerPalette**:
The set of CSS Custom Properties in `:root` defining all marker colors and sizes. Single source of truth consumed by fretboard, legend, and relationship-strip via `var(--marker-*)`.
_Avoid_: Marker colors, dot palette