# Deployment TODO

## Highest Priority (wszystkie DONE)

- DONE: Rotate the previously exposed Gemini API key and keep the replacement out of the frontend bundle.
- DONE: Move the music pattern API base URL out of `src/app/services/scales-and-triads.service.ts` into environment-based configuration.
- DONE: Restore string labels before the fretboard so open-string names are visible in the UI.
- DONE: Feature flag for Chat (`chatEnabled` in environment, disabled by default)
- DONE: Dockerfile + nginx.conf for production frontend build
- DONE: docker-compose.yml (backend + frontend razem)
- DONE: Build & deploy scripts (`npm run build:prod`, `npm run docker:*`)

## Functional Cleanup

### FIXED (usunięte z kodu)

- `ToolboxSearchQuery` typing — FIXED: usunięto `CustomToolboxSearchQuery` i `isCustomToolboxSearchQuery()`.
- `refreshNotesInRange()` dead code — FIXED: usunięta z `freatboard.component.ts`.

### OPEN (do wykonania)

- Refactor `toolboxSubmit` in `src/app/home-page/home-page.component.ts` into a command factory or private builder methods.
- Pattern name Unicode w backendzie — `:name` param nie dekodowany (backend `music-theory-api`).
- Fret numbering starts at 0 zamiast 1 — zmiana w template na `fret + 1`.
- Remove unused uuid from GuitarNote — zbędny import, 150 UUID generowanych bez użycia.
- FretboardStateService O(n) → O(1) — zastąpić Array.find Mapą.
- Template bezpośrednio wywołuje serwisy — przenieść logikę do komponentu / DisplayCell.
- UI Color Palette Refresh — odświeżenie palety kolorów interwałowych.

## Pre-Deploy Verification

- Re-test custom pattern from the toolbox against the deployed API after typing cleanup.
- Build the app against production environment values.
- Verify chat behavior when `geminiApiKey` is missing or injected externally.
