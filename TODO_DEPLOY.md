# Deployment TODO

## Highest Priority

- Rotate the previously exposed Gemini API key and keep the replacement out of the frontend bundle.
- Move the music pattern API base URL out of `src/app/services/scales-and-triads.service.ts` into environment-based configuration.
- Restore string labels before the fretboard so open-string names are visible in the UI.

## Functional Cleanup

- Fix `ToolboxSearchQuery` typing so custom patterns use a dedicated interval array type instead of runtime coercion.
- Refactor `toolboxSubmit` in `src/app/home-page/home-page.component.ts` into a command factory or private builder methods.
- Decide whether fret-range refresh is a real feature and either implement or remove the dead path in `src/app/freatboard/freatboard.component.ts`.

## Pre-Deploy Verification

- Re-test custom pattern from the toolbox against the deployed API after typing cleanup.
- Build the app against production environment values.
- Verify chat behavior when `geminiApiKey` is missing or injected externally.