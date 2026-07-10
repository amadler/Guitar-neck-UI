# ADR 0001: AppStateService for UI mode management

**Status**: accepted

The application mode (`idle`, `scale`, `scale-chord`) is managed by a dedicated `AppStateService` rather than being added to the existing `FretboardStateService`.

**Context**: The plan initially proposed adding `appMode` directly to `FretboardStateService`. However, `FretboardStateService` owns fretboard state (notes, selection, string toggles, `scaleChordState`). `AppMode` is UI routing state — it controls which components are visible, not how the fretboard renders. Mixing them would violate SRP and make `FretboardStateService` harder to test and reason about.

**Alternatives considered**:
- **In `FretboardStateService`**: simpler, fewer files, but couples fretboard state to UI mode
- **In `HomePageComponent`**: simplest, but makes `appMode` inaccessible to deeply nested components without prop drilling

**Consequences**: New service file, one extra import in components that need `appMode`. Future modes (e.g., `chord-only`, `note-explorer`) can be added without touching fretboard state.
