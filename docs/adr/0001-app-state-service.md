# ADR 0001: AppStateService for UI mode management

**Status**: SUPERSEDED by ADR 0005 (2026-09-03)

**Reason**: `AppStateService` has been removed. The application mode is now managed by `DomainState.mode` in [`src/app/domain/state.ts`](../domain/state.ts), set by `DomainService` command handlers. See [ADR 0005](0005-domain-contract-toolbox-ai.md) for the current architecture.

---

The application mode (`custom-pattern`, `scale-or-chord`, `scale-chord`) was managed by a dedicated `AppStateService` rather than being added to the existing `FretboardStateService`.

**Context**: The plan initially proposed adding `appMode` directly to `FretboardStateService`. However, `FretboardStateService` owns fretboard state (notes, selection, string toggles, `scaleChordState`). `AppMode` is UI routing state — it controls which components are visible, not how the fretboard renders. Mixing them would violate SRP and make `FretboardStateService` harder to test and reason about.

**Changes from original (v0.7.0 → v0.8.0)**:
- `AppMode` values changed from `'idle' | 'scale' | 'scale-chord'` to `'custom-pattern' | 'scale-or-chord' | 'scale-chord'`
- `'idle'` mode removed — the start screen (`ModeSelectorComponent`) was removed
- `'scale'` mode renamed to `'scale-or-chord'` — reflects that the toolbox combines both in one form
- `'custom-pattern'` added — new mode for the custom interval builder
- Default mode changed from `'idle'` to `'scale-or-chord'`

**Alternatives considered**:
- **In `FretboardStateService`**: simpler, fewer files, but couples fretboard state to UI mode
- **In `HomePageComponent`**: simplest, but makes `appMode` inaccessible to deeply nested components without prop drilling

**Consequences**: New service file, one extra import in components that need `appMode`. Future modes (e.g., `chord-only`, `note-explorer`) can be added without touching fretboard state.
