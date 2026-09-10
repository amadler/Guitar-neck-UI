# Guitar Neck UI

Educational web application for exploring scales, chords, intervals and their
relationships directly on a guitar fretboard.

The fretboard is the central element of the application. The goal is to make
music theory easier to understand visually and interactively.

## Current product focus

The application currently focuses on:

- displaying scales and chords on the fretboard,
- visualizing intervals,
- comparing scales and chords,
- displaying guitar shapes and fretboard positions,
- exposing application capabilities through a shared domain API,
- controlling the fretboard through an AI assistant.

The project is under active development. Some parts of the architecture are
currently being simplified and should not be treated as final.

## Stack

- Angular 22
- TypeScript
- Angular Signals
- Vitest for the main application tests
- Tonal.js for music theory
- LangChain for the AI agent
- OpenRouter as the current LLM provider
- `guitar-neck-shared` for shared fretboard and music pattern data

## Development

Install dependencies:


## Development

```bash
npm install
npm start                   # frontend on http://localhost:4200
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

| Variable       | Value   |
| -------------- | ------- |
| `geminiApiKey` | (empty) |
| `chatEnabled`  | `false` |

### Domain

Default: `https://guitar-neck-ui.pages.dev`



## Documentation
- [Glossary — Ubiquitous Language](docs/glossary.md)
- [Backlog](BACKLOG.md)
- [Changelog](CHANGELOG.md)

## Live preview

https://guitar-neck-ui.madler-andrzej.workers.dev/
