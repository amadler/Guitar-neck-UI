# GuitarNeckUI

Angular application for visualizing notes, intervals, scales and chords on a guitar fretboard.

The project uses:
- **Tonal.js** — local music theory engine (no backend needed)
- **guitar-neck-shared** — shared models for scales, chords and fretboard configuration

Current product focus:
visualizing relationships between scales and chords on the fretboard.


## Stack

- **Angular 18** (standalone components)
- **TypeScript**, RxJS
- **Karma/Jasmine** (tests)
- **Cloudflare Pages** (deployment)

## External Dependencies

| Package | Source | Description |
|---|---|---|
| `guitar-neck-shared` ^1.0.2 | [public npm](https://npmjs.com) | Fretboard config + interval patterns |
| `@tonaljs/tonal` ^4.10.0 | [npm](https://npmjs.com) | Local music theory engine (scales, chords, intervals) |
| **Gemini AI** (optional) | external API | AI chat (disabled by feature flag) |

## Development

```bash
npm install
npm start                   # frontend on http://localhost:4200
```

### Environment config

Configuration in [`src/environments/`](src/environments/):

```ts
// environment.ts (dev)
export const environment = {
  production: false,
  geminiApiKey: '',
  features: { chatEnabled: false }
};
```

All music theory is computed locally by Tonal.js — no backend required.

## Build

```bash
npm run build             # development build → dist/guitar-neck-ui
npm run build:prod        # production build → dist/guitar-neck-ui
```

## Tests

```bash
npm test                  # Karma / Jasmine
```

## Deployment (Cloudflare Workers)

The app is deployed as a **Cloudflare Worker with static assets**. The [`wrangler.toml`](wrangler.toml) file in the repo root configures the SPA routing automatically.

### How it works

- Cloudflare detects [`wrangler.toml`](wrangler.toml) and treats the project as a Worker with static assets
- `not_found_handling = "single-page-application"` ensures Angular routing works on page refresh
- No `_redirects` or `functions/` files needed

### Setup in Cloudflare Dashboard

1. Delete the existing project, then create a new one: **Workers & Pages → Create → Connect to Git** → select repo
2. **Build command**: `npm run build:prod`
3. **Build output directory**: `dist/guitar-neck-ui/browser`
4. **Deploy command**: `npx wrangler deploy` (pre-filled by Cloudflare)

### Environment variables (Cloudflare Pages Secrets)

| Variable | Value |
|---|---|
| `geminiApiKey` | (empty) |
| `chatEnabled` | `false` |

### Domain

Default: `https://guitar-neck-ui.pages.dev`

## Feature flags

| Flag | File | Default | Description |
|---|---|---|---|
| `features.chatEnabled` | `environment.ts` | `false` | Enables/disables AI chat (Gemini) |

## Project structure

```
src/
├── app/
│   ├── home-page/           # Main page (aggregator)
│   ├── domain/              # Domain contract (commands, queries, state)
│   ├── guitar-neck/         # Fretboard container
│   ├── freatboard/          # Fretboard grid (strings x frets)
│   ├── services/            # Services (state, intervals, notes)
│   └── shared/              # Models, helpers
├── environments/            # Environment config
└── assets/                  # Images, scss
projects/
└── guitar-chat/             # AI chat library (feature flagged)
```

## Documentation

- [Product overview](PRODUCT_OVERVIEW.md)
- [Architecture](ARCHITECTURE.md)
- [API docs](API_DOCUMENTATION.md)
- [Domain Contract API](docs/api/domain-contract-api.md) — **nowość**: wspólny kontrakt dla Toolbox i AI
- [ADR 0005 — decyzje architektoniczne](docs/adr/0005-domain-contract-toolbox-ai.md)
- [Glossary — Ubiquitous Language](docs/glossary.md)
- [Dev setup](DEVELOPMENT.md)
- [Backlog](BACKLOG.md)

## Live preview

https://guitar-neck-ui.madler-andrzej.workers.dev/
