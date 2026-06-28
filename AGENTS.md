# AGENTS.md

Agent instructions for the Guitar neck UI workspace.

## Scope
- Applies to the full repository.
- Prefer workspace tasks and npm scripts over ad-hoc commands.

## Project Snapshot
- Stack: Angular 18, TypeScript, RxJS, Karma/Jasmine.
- Main app source: `src/app`.
- Library project: `projects/guitar-chat` (build via `npm run build-chat`).
- Technical docs:
  - Overview: [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md)
  - Development setup: [DEVELOPMENT.md](DEVELOPMENT.md)
  - Architecture details: [ARCHITECTURE.md](ARCHITECTURE.md)
  - API notes: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Commands Agents Should Use
- Install deps: `npm install`
- Start app: `npm start` (or VS Code task `npm: start`)
- Unit tests: `npm test` (or VS Code task `npm: test`)
- Build app: `npm run build`
- Build watch: `npm run watch`
- Build library: `npm run build-chat`
- Generate docs: `npm run compodoc`

## Codebase Conventions
- Keep changes small and local; avoid broad refactors unless requested.
- Follow existing Angular standalone-style bootstrap patterns in `src/main.ts`, `src/app/app.config.ts`, and `src/app/app.routes.ts`.
- Reuse existing service boundaries in `src/app/services` (facade/service pattern) before adding new orchestration layers.
- Preserve current naming/layout conventions even where imperfect (for example, `freatboard` folder naming) unless the user asks for a rename migration.
- When changing behavior in services or shared command logic, update/add related `*.spec.ts` tests in the same area.

## Validation Expectations
- Run tests for touched areas first, then full `npm test` when feasible.
- For UI-only changes, at minimum run a build (`npm run build`) to catch TypeScript/template issues.
- If a command cannot run locally, report what was attempted and why it failed.

## Security and Secrets
- Treat keys in environment files as sensitive. Do not print, duplicate, or move secrets into docs, logs, tests, or commits.
- If work involves API credentials, prefer environment-specific handling and recommend rotation if exposed.

## High-Value Paths
- App routes/config: `src/app/app.routes.ts`, `src/app/app.config.ts`
- Services: `src/app/services`
- Shared model/commands: `src/app/shared`
- Main UI containers: `src/app/home-page`, `src/app/guitar-neck`, `src/app/freatboard`
- Environment config: `src/environments`

## Git workflow
- **Never commit directly to `master`** — always create a feature/fix branch first.
- Branch naming: `fix/<short-description>` for bug fixes, `feat/<short-description>` for new features.
- After committing on the branch, ask the user for merge approval before merging to `master`.
- Squash-merge is preferred to keep history clean.
