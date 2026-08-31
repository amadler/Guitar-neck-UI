# Guitar Neck UI — Informacje Rozwojowe

## Technologie

- **Frontend:** Angular 18.2, TypeScript 5.5, RxJS 7.8
- **Teoria muzyki:** Tonal.js 4 (`@tonaljs/tonal`) — lokalny silnik, bez backendu
- **Testy:** Karma 6.4, Jasmine 5.2, ChromeHeadless
- **Pakiety:** `guitar-neck-shared` ^1.0.2, `guitar-toolbox-lib` (lokalny workspace)
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

### Biblioteka guitar-toolbox-lib (wymagana przed buildem)
Toolbox jest lokalnym workspace. Przed pierwszym buildem GNUI:
```bash
cd ../guitar-toolbox
npm install
ng build guitar-toolbox-lib
cd ../Guitar\ neck\ UI
npm start
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
│   │   ├── freatboard/                    # Renderowanie gryfu
│   │   │   └── freatboard.component.{ts,html,scss}
│   │   ├── guitar-neck/                   # Kontener gryfu
│   │   ├── home-page/                     # Główna strona (toolbox + gryf + metronom)
│   │   ├── header/                        # Nagłówek strony
│   │   ├── footer/                        # Stopka strony
│   │   ├── legend/                        # Legenda interwałów
│   │   ├── metronome/                     # Metronom z AudioContext
│   │   │   ├── metronome-engine.service.ts
│   │   │   └── metronome.component.{ts,html,scss}
│   │   ├── pattern-display/               # Panel wyświetlania patternu + practice prompts
│   │   ├── range-toolbar/                 # Selektor zakresu progów (presety)
│   │   ├── string-toggle/                 # Włącznik/wyłącznik strun
│   │   ├── services/                      # Serwisy aplikacji
│   │   │   ├── fretboard-state.service.ts         # FretboardStateService
│   │   │   ├── fretboard-orchestration.service.ts # FretboardOrchestrationService
│   │   │   ├── tonal-facade.service.ts            # TonalFacadeService
│   │   │   ├── note.service.ts                    # FretboardNotePositionService
│   │   │   ├── fretboard-note-query.service.ts # FretboardNoteQueryService
│   │   │   ├── fretboard-display.service.ts    # FretboardDisplayService
│   │   │   ├── marker-role.service.ts          # MarkerRoleService
│   │   │   └── pattern-builder.service.ts      # PatternBuilderService
│   │   └── shared/
│   │       ├── UICommands.ts             # DEPRECATED — Command Pattern (do usunięcia)
│   │       ├── interval-note.helper.ts   # Helper do nut z interwałów
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

## Deployment (Cloudflare Pages)

Planowane: migracja z Docker/VPS na Cloudflare Pages (darmowy hosting statyczny).

### Wymagania
- Konto Cloudflare
- `npm run build` produkuje `dist/guitar-neck-ui/`

### Kroki (do zrobienia)
1. Podłączenie repozytorium do Cloudflare Pages
2. Konfiguracja build command: `npm run build`
3. Konfiguracja output directory: `dist/guitar-neck-ui`
4. Ustawienie zmiennych środowiskowych (geminiApiKey) przez Cloudflare Pages Secrets

## Dokumentacja

- Dokumentacja techniczna generowana przez Compodoc: `npm run compodoc`
- Dokumentacja API: [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)
- Architektura: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Backlog: [`BACKLOG.md`](BACKLOG.md)