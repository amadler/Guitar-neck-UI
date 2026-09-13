# ADR 0008 — Lesson Delivery via Markdown Files in Agent Context

## Status

Accepted

## Context

We need a way to deliver structured guitar lessons to users. The first lesson is about intervals (`lessons/interwały.md`, 1166 lines). The lesson is led by the AI agent step by step — the agent explains concepts, shows patterns on the fretboard, poses exercises, and the user responds by clicking notes.

Several delivery options were considered:

1. **Embedded UI** — Lesson content rendered as a separate panel next to the fretboard, with the agent controlling what's shown. Harder to author, harder to change, couples UI to content.
2. **RAG / Vector embeddings** — Lesson content chunked and stored in a vector DB, agent retrieves relevant fragments. More complex infrastructure, harder to debug, but scales to many lessons.
3. **Markdown files loaded into agent context** — Lesson is a plain `.md` file. When a lesson starts, the full text is loaded into the agent's system prompt or first message. Simple, transparent, easy to author.

We chose option 3 for the initial implementation, with a clear migration path to RAG later.

## Decision

- Lessons are authored as plain Markdown files in `lessons/`.
- When a user selects a lesson, the application reads the `.md` file and passes its content to the agent as part of the initial context.
- The agent starts a **fresh session** — no previous conversation history, no cross-lesson context.
- The lesson list is hardcoded in the application (e.g., in a lesson registry service).
- The agent receives the full lesson text and is instructed to stay on-topic and follow the lesson structure.

## Consequences

### Positive

- **Simple authoring** — Anyone can write a lesson in Markdown. No UI changes needed for new lessons.
- **Transparent** — The full lesson text is visible in the agent's context. No black-box retrieval.
- **Easy to debug** — If the agent misbehaves, you can read exactly what it was told.
- **Easy migration path** — When we switch to RAG, the lesson files remain the source of truth. Only the loading mechanism changes.
- **No coupling to UI** — Lesson content and presentation are separate.

### Negative

- **Context window usage** — Long lessons consume context. The intervals lesson is ~1166 lines. This may become an issue with very long lessons or limited context windows.
- **No cross-lesson state** — Each lesson starts fresh. No progress tracking across sessions (by design for now).
- **No multimedia** — Markdown limits us to text and simple formatting. Sound playback will be handled separately via Web Audio API tools.

### Migration Path to RAG

When lessons grow beyond context window limits:
1. Keep `.md` files as source of truth.
2. Add a chunking step that splits lessons into sections.
3. Store chunks in a vector DB (e.g., Chroma, Supabase).
4. Replace `loadLesson()` with a retrieval tool that fetches relevant chunks.
5. The agent still gets lesson context, but only the relevant parts.

## Alternatives Considered

### Embedded UI (rejected)
- Pro: Visual separation of lesson content from chat.
- Con: Every new lesson requires UI changes. Harder to iterate on content.

### RAG from day one (rejected)
- Pro: Scales to many lessons, efficient context use.
- Con: Premature complexity. Harder to debug agent behavior. We don't yet know how lessons will be used.

## Related

- [`lessons/interwały.md`](lessons/interwały.md) — First lesson
- [`docs/glossary.md`](docs/glossary.md) — Lesson, Exercise, Selection Mode terms