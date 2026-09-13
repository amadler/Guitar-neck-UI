# ADR 0009 — Exercise Validation via Expected Intervals

## Status

Accepted

## Context

During lessons, the agent poses exercises like "find all fifths relative to A" or "find root and b3". The user responds by clicking notes on the fretboard. We need a validation mechanism that:

1. Tells the user whether their answer is correct.
2. Reports the result back to the agent for commentary.
3. Does not require building a custom validator for every exercise type.

Several approaches were considered:

1. **Agent-only validation** — Agent asks the question, user clicks notes, agent reads `selectedNotes` via `get_current_view` and decides correctness. Simple but fragile — the agent may hallucinate or miss notes.
2. **Custom validators per exercise** — Each exercise type has its own validation logic. Correct but doesn't scale — we'd drown in validators.
3. **Expected intervals assertion** — Agent provides `expectedIntervals` when posing the exercise. The app uses Tonal.js to check if each selected note's interval from `rootNote` matches one of the expected intervals. Generic, mathematical, no custom logic.

We chose option 3.

## Decision

- The agent has a tool `start_exercise` that accepts:
  - `question` — text shown to the user
  - `rootNote` — the reference note
  - `expectedIntervals` — array of valid interval names (e.g., `['5']`, `['1', 'b3']`)
  - `fretRange?` — optional view constraint
  - `enabledStrings?` — optional string constraint
- When `start_exercise` is called, the app:
  1. Sets `exerciseMode = true` in DomainState.
  2. Stores the `exerciseTask` (question, rootNote, expectedIntervals).
  3. Makes the fretboard clickable.
  4. Shows a Submit button.
- When the user clicks Submit, the app:
  1. For each note in `selectedNotes`, calculates its interval from `rootNote` using `TonalFacadeService.intervalDistance()`.
  2. Checks if the interval is in `expectedIntervals`.
  3. Returns an `ExerciseResult` to the agent: `{ correct: boolean[], selectedNotes: [...], summary: "3 correct, 1 incorrect" }`.
- The agent receives the result as the tool response and decides how to comment.

## Consequences

### Positive

- **Zero custom validators** — Every exercise is just an interval assertion. The same mechanism works for "find fifths", "find root and b3", "find chord tones", etc.
- **Mathematically correct** — Tonal.js guarantees correct interval calculation. No agent hallucination risk.
- **Agent retains control** — The agent decides what to ask and how to respond. The app just does the math.
- **Reuses existing infrastructure** — `TonalFacadeService` already handles interval calculation. `selectedNotes` already exists in DomainState.

### Negative

- **Limited to interval-based exercises** — Exercises like "what note is a major 3rd above C?" (naming, not clicking) would need a different mechanism. But the first lesson is entirely click-based.
- **Agent must specify expectedIntervals** — If the agent gets the intervals wrong, the validation is wrong. But this is the same risk as any tool parameter.
- **No partial credit nuance** — A note is either correct (interval matches) or not. No "close but wrong octave" feedback. This is acceptable for the basic level.

## Alternatives Considered

### Agent-only validation (rejected)
- Pro: No app-side validation code.
- Con: Agent may hallucinate. User gets inconsistent feedback. Hard to trust.

### Custom validators per exercise (rejected)
- Pro: Maximum flexibility.
- Con: Doesn't scale. Every new exercise type needs a new validator. User explicitly said "nie chcemy tonąć w walidatorach".

## Related

- [`docs/glossary.md`](docs/glossary.md) — Exercise, Exercise Task, Exercise Result terms
- [`src/app/services/tonal-facade.service.ts`](src/app/services/tonal-facade.service.ts) — Music theory service used for validation
- [`src/app/domain/state.ts`](src/app/domain/state.ts) — DomainState with selectedNotes field