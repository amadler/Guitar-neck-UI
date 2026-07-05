# AI Chat (Gemini)

## Motivation

Users may want interactive guidance — asking questions about scales, chord progressions, or music theory in natural language directly from the guitar neck UI.

## Solution

Integrate Google Gemini API via a dedicated Angular library (`projects/guitar-chat`). The library provides:
- `ChatComponent` — chat bubble UI
- `AISuggestionsComponent` — contextual suggestion chips
- `AIFacadeService` / `AIService` / `AISuggestionService` — orchestration and API communication

## MVP

- Library `projects/guitar-chat` is published and importable
- Chat panel appears in the app when `chatEnabled: true` in environment config
- User can send text prompts and receive AI-generated responses
- Feature flag `chatEnabled` controls visibility (currently `false`)

## Done when

- `chatEnabled` is set to `true` in production environment
- A valid Gemini API key is configured server-side (not in frontend bundle)
- Chat component renders and communicates with the API
- AI suggestions are context-aware (current scale/chord selection)

## Status

POSTPONED

---

# Note readability na gryfie

## Motivation

Note names on the fretboard can be difficult to read — especially on lower frets or when multiple intervals overlap. The current `neutral-dots` marker mode is a workaround, not a solution.

## Solution

Redesign the visual marker system for note names. Options include:
- Rotated or vertical text on narrow frets
- Tooltip on hover/tap
- Dynamic font size based on fret width
- Background pill/badge for contrast

## MVP

- Implement at least one improved readability mode (e.g., pill badges with high contrast)
- Ensure it works across all frets (1–24) and string densities
- Preserve existing `MarkerDisplayMode` switching mechanism

## Done when

- Note names are readable on all frets without zooming
- The feature does not regress `interval-colors` or `neutral-dots` modes
- Responsive layout is maintained at mobile widths

## Status

POSTPONED

---

# UI Color Palette Refresh

## Motivation

The current interval color palette was defined early in the project (v0.1.0) and may not meet accessibility contrast standards. Some interval colors are hard to distinguish for color-blind users.

## Solution

Redesign the color palette with:
- WCAG AA contrast ratios for all interval colors on the dark background
- Color-blind safe differentiation (e.g., patterns or shapes in addition to color)
- CSS custom properties for easy theming

## MVP

- Define new color values in `src/styles.scss` CSS variables
- Ensure root, 3rd, 5th, 7th intervals are distinguishable
- Test with a color-blindness simulator

## Done when

- All interval colors meet WCAG AA contrast against the dark background
- Interval colors are distinguishable without relying solely on hue
- `npm test` passes
- `npm run build` succeeds

## Status

POSTPONED

---

# Localization (pl/en) for practice prompts

## Motivation

The practice prompts are currently hardcoded in Polish. The existing backlog entry for "Practice prompts" explicitly notes that localization is tracked separately.

## Solution

Add an i18n layer to `practice-prompts.data.ts` that supports Polish and English. The language can be switched via a setting or detected from the browser locale.

## MVP

- Split prompts data into `pl` and `en` language maps
- Add a `language` parameter to the prompt retrieval function
- Default to Polish (matching current behavior)
- English translations for all existing prompts

## Done when

- `practice-prompts.data.ts` exports both `pl` and `en` prompt sets
- `PatternDisplayComponent` accepts a language input or setting
- Switching language changes prompt texts without a rebuild
- All existing tests pass

## Status

OPEN

---

# Metronome — visual beat indicator improvement

## Motivation

The current metronome (`MetronomeComponent`) has a basic visual beat indicator (`currentBeat`). The UI could be more intuitive with stronger visual accents (e.g., beat accent colors, bar visualization, animated pulse).

## Solution

Enhance the metronome display with:
- Accent colors for the downbeat (beat 1) vs. other beats
- Animated pulse or glow on each beat
- Bar/measure visualization showing current position within the measure
- Configurable accent patterns per time signature

## MVP

- Differentiate the downbeat visually (e.g., larger indicator, different color)
- Add a subtle CSS animation (pulse/scale) on each beat change
- Preserve all existing tap-tempo, BPM range, and time signature functionality

## Done when

- Beat 1 is visually distinct from other beats in all time signatures
- The beat indicator animates smoothly on each tick
- `npm test` passes
- No regression in metronome audio timing

## Status

OPEN

---

