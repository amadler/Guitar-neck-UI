# Guitar Neck UI - Informacje Rozwojowe

## Technologie

- **Frontend:** Angular 18.2, TypeScript 5.5, RxJS 7.8
- **Testy:** Karma 6.4, Jasmine 5.2, ChromeHeadless
- **Backend:** music-theory-api (Elysia/Express, Docker, port 3000)
- **Pakiety:** `guitar-neck-shared` ^1.0.2, `guitar-toolbox-lib` ^1.0.2
- **AI (POSTPONED):** Gemini AI API (biblioteka `projects/guitar-chat`)

## Uruchomienie Projektu

### Wymagania
- Node.js 18+
- Angular CLI 18 (`npm install -g @angular/cli`)
- Docker (dla backendu `music-theory-api`)

### Instalacja
```bash
npm install
```

### Backend (Docker)
```bash
docker compose up -d music-theory-api   # uruchamia backend na porcie 3000
docker compose logs -f music-theory-api  # podgląd logów
```

### Frontend (dev server)
```bash
npm start           # ng serve → http://localhost:4200
npm run build       # ng build → dist/guitar-neck-ui
npm run build:prod  # ng build --configuration production
npm run watch       # ng build --watch --configuration development
```

### Testy
```bash
npm test            # ng test → Karma + ChromeHeadless
```

### Docker (pełny stack)
```bash
docker compose up -d            # backend + frontend (nginx)
docker compose down             # zatrzymanie
docker compose logs -f          # logi
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
│   │   ├── freatboard/              # Renderowanie gryfu
│   │   │   ├── components/legend/   # Legenda interwałów
│   │   │   └── freatboard.component.{ts,html,scss}
│   │   ├── fret-range-selector/     # Selektor zakresu progów
│   │   ├── guitar-neck/             # Kontener gryfu
│   │   ├── home-page/               # Główna strona (toolbox + gryf)
│   │   ├── services/                # Serwisy aplikacji
│   │   │   ├── guitar-neck.service.ts       # FretboardStateService
│   │   │   ├── interval.service.ts          # IntervalService
│   │   │   ├── music-theory-facade.service.ts # FretboardOrchestrationService
│   │   │   ├── note.service.ts              # FretboardNotePositionService
│   │   │   └── scales-and-triads.service.ts # MusicPatternApiService
│   │   └── shared/
│   │       ├── GuitarNeck.ts         # Klasa generująca tablicę gryfu
│   │       ├── UICommands.ts         # Command Pattern
│   │       ├── interval-note.helper.ts # Helper do nut z interwałów
│   │       └── model/
│   │           ├── guitarNote.ts     # Model nuty
│   │           └── musicElements.ts  # Modele zapytań
│   ├── environments/
│   │   ├── environment.ts           # Konfiguracja dev
│   │   └── environment.prod.ts      # Konfiguracja prod
│   └── styles.scss                  # Globalne CSS + zmienne
├── projects/guitar-chat/            # AI chat (POSTPONED)
├── docker-compose.yml               # Backend + frontend
├── Dockerfile                       # Frontend (nginx)
├── nginx.conf                       # Konfiguracja nginx
├── BACKLOG.md                       # Backlog projektu
├── AGENTS.md                        # Instrukcje dla agentów AI
└── *.md                             # Dokumentacja (ARCHITECTURE, API, PRODUCT)
```

## Konfiguracja

### Zmienne środowiskowe (`.env`)
```
CORS_ORIGIN=http://localhost:4200
```

### Środowiska Angular
`src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',  // music-theory-api
  geminiApiKey: '',                  // POSTPONED
  features: { chatEnabled: false }
};
```

## Dokumentacja

- Dokumentacja techniczna generowana przez Compodoc: `npm run compodoc`
- Dokumentacja API: [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)
- Architektura: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Backlog: [`BACKLOG.md`](BACKLOG.md)
