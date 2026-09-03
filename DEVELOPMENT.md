# Guitar Neck UI — Informacje Rozwojowe

## Technologie

- **Frontend:** Angular 18.2, TypeScript 5.5, RxJS 7.8
- **Teoria muzyki:** Tonal.js 4 (`@tonaljs/tonal`) — lokalny silnik, bez backendu
- **Testy:** Karma 6.4, Jasmine 5.2, ChromeHeadless
- **Pakiety:** `guitar-neck-shared` ^1.0.2
- **AI (POSTPONED):** Gemini AI API (biblioteka `projects/guitar-chat`)

## Uruchomienie Projektu

### Wymagania
- Node.js 18+
- Angular CLI 18 (`npm install -g @angular/cli`)

### Instalacja
```bash
npm install
```

### Frontend (dev server)
```bash
npm start           # ng serve → http://localhost:4200
npm run build       # ng build → dist/guitar-neck-ui
npm run watch       # ng build --watch --configuration development
```

### Testy
```bash
npm test            # ng test → Karma + ChromeHeadless
```


### Biblioteka guitar-chat (AI)
```bash
npm run build-chat   # ng build guitar-chat → dist/guitar-chat
```

## Struktura Projektu

```
guitar-neck-ui/
├── src/
│   ├── app/
│   │   ├── domain/                       # Domain contract (commands, queries, state)
│   │   │   ├── commands.ts              # DomainCommand types
│   │   │   ├── queries.ts               # DomainQuery types
│   │   │   ├── state.ts                 # DomainState, DomainError, DomainResult
│   │   │   └── domain.service.ts        # DomainService — centralna fasada domenowa
│   │   ├── freatboard/                   # Renderowanie gryfu
│   │   │   └── freatboard.component.{ts,html,scss}
│   │   ├── guitar-neck/                  # Kontener gryfu
│   │   ├── home-page/                    # Główna strona (toolbox + gryf + metronom)
│   │   ├── header/                       # Nagłówek strony
│   │   ├── footer/                       # Stopka strony
│   │   ├── legend/                       # Legenda interwałów
│   │   ├── metronome/                    # Metronom z AudioContext
│   │   │   ├── metronome-engine.service.ts
│   │   │   └── metronome.component.{ts,html,scss}
│   │   ├── pattern-display/              # Panel wyświetlania patternu + practice prompts
│   │   ├── range-toolbar/                # Selektor zakresu progów (presety)
│   │   ├── string-toggle/                # Włącznik/wyłącznik strun
│   │   ├── toolbox/                      # Toolbox UI (sentence-style builder)
│   │   │   ├── toolbox-builder.component.ts
│   │   │   ├── dropdown.component.ts
│   │   │   └── model.ts
│   │   ├── services/                     # Serwisy aplikacji
│   │   │   ├── fretboard-state.service.ts         # FretboardStateService
│   │   │   ├── fretboard-orchestration.service.ts # FretboardOrchestrationService
│   │   │   ├── tonal-facade.service.ts            # TonalFacadeService
│   │   │   ├── note.service.ts                    # FretboardNotePositionService
│   │   │   ├── fretboard-note-query.service.ts    # FretboardNoteQueryService
│   │   │   ├── fretboard-display.service.ts       # FretboardDisplayService
│   │   │   ├── marker-role.service.ts             # MarkerRoleService
│   │   │   └── pattern-builder.service.ts         # PatternBuilderService
│   │   └── shared/
│   │       ├── UICommands.ts             # DEPRECATED — Command Pattern (do usunięcia)
│   │       ├── note-utils.ts             # Helper do nut z interwałów
│   │       ├── pattern-resolver.ts       # Resolver patternów
│   │       ├── practice-prompts.data.ts  # Podpowiedzi ćwiczeń
│   │       ├── tonal-adapter.ts          # Mapowanie nazw Tonal ↔ UI
│   │       └── model/
│   │           ├── guitarNote.ts         # Model nuty
│   │           ├── music-selection.ts    # Model wyboru muzycznego
│   │           └── patternInfo.ts        # Model informacji o patternie
│   ├── environments/
│   │   ├── environment.ts               # Konfiguracja dev
│   │   └── environment.prod.ts          # Konfiguracja prod
│   └── styles.scss                      # Globalne CSS + zmienne
├── projects/guitar-chat/                # AI chat (POSTPONED)
├── docs/
│   ├── adr/                             # Architecture Decision Records
│   ├── api/                             # API documentation
│   └── color-palette.md
├── plans/                               # Plany implementacji
├── BACKLOG.md                           # Backlog projektu
├── AGENTS.md                            # Instrukcje dla agentów AI
└── *.md                                 # Dokumentacja (ARCHITECTURE, API, PRODUCT)
```

## Konfiguracja

### Środowiska Angular
`src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  geminiApiKey: '',                  // POSTPONED
  features: { chatEnabled: false }
};
```

Brak `apiUrl` — wszystkie obliczenia są lokalne (Tonal.js).

## Deployment (Cloudflare Workers — static assets)

Aplikacja jest statycznym SPA deployowanym jako **Cloudflare Worker z assetami statycznymi**. Plik [`wrangler.toml`](wrangler.toml) w katalogu głównym repo konfiguruje SPA routing.

### Jak to działa

- Cloudflare wykrywa [`wrangler.toml`](wrangler.toml) i traktuje projekt jako Worker z assetami statycznymi
- `not_found_handling = "single-page-application"` zapewnia Angular routing przy odświeżeniu strony
- Żadne dodatkowe pliki (`_redirects`, `functions/`, `_middleware.ts`) nie są potrzebne

### Wymagania
- Konto Cloudflare ([dash.cloudflare.com](https://dash.cloudflare.com))
- Repozytorium pushnięte na GitHub

### Konfiguracja w Cloudflare Dashboard

1. **Usuń istniejący projekt** (jeśli istnieje): Workers & Pages → `guitar-neck-ui` → Settings → Danger zone → Delete
2. **Stwórz nowy**: Workers & Pages → Create → Connect to Git → wybierz repozytorium
3. **Build command**: `npm run build:prod`
4. **Build output directory**: `dist/guitar-neck-ui/browser`
5. **Deploy command**: `npx wrangler deploy` (pre-filled przez Cloudflare)

### Environment variables (Production)

| Variable | Value |
|---|---|
| `geminiApiKey` | (pusty string) |
| `chatEnabled` | `false` |

### Automatyczny deployment

Po podłączeniu każdy push do `master` automatycznie:
1. Odpala `npm run build:prod`
2. Publikuje na `https://guitar-neck-ui.madler-andrzej.workers.dev`

### Własna domena (opcjonalnie)

W Cloudflare Workers dashboard → Triggers → Custom domains → dodaj domenę.

## Dokumentacja

- Dokumentacja techniczna generowana przez Compodoc: `npm run compodoc`
- Dokumentacja API: [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)
- **Domain Contract API** (nowość): [`docs/api/domain-contract-api.md`](docs/api/domain-contract-api.md)
- Architektura: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- ADR 0005 — Domain Contract: [`docs/adr/0005-domain-contract-toolbox-ai.md`](docs/adr/0005-domain-contract-toolbox-ai.md)
- Glossary: [`docs/glossary.md`](docs/glossary.md)
- Backlog: [`BACKLOG.md`](BACKLOG.md)