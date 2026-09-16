# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build / Test / Lint

- **Dev server**: `npm start` (ng serve)
- **Build prod**: `npm run build:prod`
- **Run all tests**: `npm test` (Vitest runner)
- **Compodoc docs**: `npm run compodoc` (serves at localhost:8080)
- **Deploy**: via Cloudflare Workers — `wrangler.toml` deploys from `dist/guitar-neck-ui/browser` with SPA fallback

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
- **`.claude/hooks/block-dangerous-git.ps1`** blocks `git push`, `reset --hard`, `clean`, `branch -D` from Claude agents.
- **DomainState is immutable** — updated via `signal.set()`/`.update()`, never mutated in place.
- **`spellNote()` in `note-utils.ts`** handles enharmonic spelling: minor intervals (`b2`, `b3`, etc.) get flat spelling, major/perfect get sharp spelling.

## Code Style

- **Single quotes** for TypeScript (`.editorconfig`), double quotes for HTML templates
- **SCSS** for component styles (configured in `angular.json`)
- **2-space indentation**, UTF-8, final newline
- **Strict TypeScript** (`strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`)
- **Interfaces over types** for domain models (see `DomainState`, `DomainCommand`, `DomainQuery`)
- **`@Injectable({ providedIn: 'root' })`** for all services — no manual providers
- **`inject()` function** over constructor injection (Angular 14+ pattern)
- **Signals** for state management (`signal<T>()`, `.asReadonly()`) — no RxJS Subjects for state