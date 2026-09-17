# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build / Test / Lint

- **Dev server**: `npm start` (ng serve)
- **Build prod**: `npm run build:prod`
- **Run all tests**: `npm test` (Vitest runner)
- **Compodoc docs**: `npm run compodoc` (serves at localhost:8080)
- **Deploy**: via Cloudflare Workers — `wrangler.toml` deploys from `dist/guitar-neck-ui/browser` with SPA fallback

## Skills

This repository includes local skills in [`.roo/skills/`](.roo/skills) that agents should follow when applicable:

- [**`working-with-GIT-repositories`**](.roo/skills/working-with-GIT-repositories/SKILL.md) — Git workflow: status checks, staged review, commit approval, no destructive operations without consent.
- [**`fix-broken-tests`**](.roo/skills/fix-broken-tests/SKILL.md) — Diagnose and fix failing tests without hiding bugs or adjusting tests to match buggy implementations.
- [**`updating-backlog`**](.roo/skills/updating-backlog/SKILL.md) — Create, update, complete, and archive backlog items in `BACKLOG.md`; move completed work to `CHANGELOG.md`.
- 
## Non-Obvious Project Facts

- **DomainService uses Registry Pattern** — commands/queries dispatched via `Map<string, Handler>`, not switch/if-else. Add new handlers by registering in `registerCommandHandlers()` or `registerQueryHandlers()`.
- **TonalFacadeService is the ONLY allowed importer of `@tonaljs/*`**. All other services must go through it. Violating this creates coupling.
- **DomainValidator returns `null` on success, `DomainResult` on failure** — not boolean. Chain with `??` operator.
- **Note comparison uses chroma (pitch class 0-11)** via `noteToChroma()` in `src/app/shared/note-utils.ts`. Never compare note names as strings — C# and Db are the same pitch.
- **Two separate AI chat implementations**: old in `projects/guitar-chat/` (legacy), new in `src/app/chat/` (LangChain agent with Zod-schema tools). New code should use the LangChain version.
- **AI chat stores API key** in `localStorage.getItem('modelApiKey')` or prompts user. Model: `deepseek/deepseek-v4-flash` via OpenRouter.
- **Shape positions use `fretOffset` (relative)** not absolute frets. `ShapeResolverService` calculates actual frets. Cowboy shapes have fixed rootNote that cannot be overridden.
- **`enabledStrings` persist across `clearView`** — they are NOT reset. Only the user can toggle them.
- **`markerDisplayMode` is saved/restored** when entering/exiting compare mode (saved before forcing `note-names`).
- **`INTERVAL_CONFIG` in `src/app/shared/tonal-adapter.ts`** is the single source of truth for all 12 intervals. All derived maps (`INTERVAL_MAP`, `INTERVAL_SEMITONE_MAP`) are built from it.
- **Pattern name mapping** (UI → Tonal) in `tonal-adapter.ts` handles Unicode variants (`♭`/`♯` → `b`/`#`). `SCALES_NOT_IN_TONAL` and `CHORDS_NOT_IN_TONAL` sets define patterns that fallback to `CHORD_PATTERNS`/`SCALE_PATTERNS`.
- **Angular 22 standalone** — no NgModules. Uses `@angular/build:application` builder.
- **`tsconfig.app.json` suppresses** `nullishCoalescingNotNullable` and `optionalChainNotNullable` diagnostics.
- **DomainState is immutable** — updated via `signal.set()`/`.update()`, never mutated in place.
- **`spellNote()` in `note-utils.ts`** handles enharmonic spelling: minor intervals (`b2`, `b3`, etc.) get flat spelling, major/perfect get sharp spelling.
- **Two agent modes**: local (browser DeepAgents, default) and remote (Node `guitar-neck-agent`). Toggle via `window.__USE_REMOTE_AGENT__ = true`.
- **Remote agent** (`guitar-neck-agent`) is a separate repo with Express + DeepAgents on VPS. Communicates via `POST /api/chat` with NDJSON streaming.
- **`AgentApiService`** in `src/app/chat/services/agent-api.service.ts` handles HTTP communication with the remote agent. Parses NDJSON stream, executes `DomainCommand` locally via `DomainService.execute()`.
- **DomainState snapshot** is sent with every `/api/chat` request (request-scoped, not stored in agent checkpoint). Within a single request, Node does NOT see the effects of DomainCommand executed locally.
- **Flow**: `DomainCommand → wait_for_user → next request with new DomainState snapshot`. No round-trip/ack for DomainCommand in MVP.
- **Tool definitions live in Node** (`guitar-neck-agent/src/tools/domain-tools.ts`). Angular does not import tool definitions — it only exposes `DomainService.execute()` locally.
- **Tonal.js stays in Angular** — the remote Node agent has no access to music theory queries. Query tools read from the DomainState snapshot.

## Code Style

- **Single quotes** for TypeScript (`.editorconfig`), double quotes for HTML templates
- **SCSS** for component styles (configured in `angular.json`)
- **2-space indentation**, UTF-8, final newline
- **Strict TypeScript** (`strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`)
- **Interfaces over types** for domain models (see `DomainState`, `DomainCommand`, `DomainQuery`)
- **`@Injectable({ providedIn: 'root' })`** for all services — no manual providers
- **`inject()` function** over constructor injection (Angular 14+ pattern)
- **Signals** for state management (`signal<T>()`, `.asReadonly()`) — no RxJS Subjects for state
