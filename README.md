# GuitarNeckUI

Interaktywna wizualizacja gryfu gitary z toolboxem skal/akordów i asystentem AI.

## Stack

- **Angular 18** (standalone components)
- **TypeScript**, RxJS
- **Karma/Jasmine** (testy)
- **Docker** (deploy)

## Zależności zewnętrzne

| Pakiet | Źródło | Opis |
|---|---|---|
| `guitar-neck-shared` ^1.0.2 | [public npm](https://npmjs.com) | Konfiguracja gryfu + wzorce interwałowe |
| `guitar-toolbox-lib` ^1.0.2 | [public npm](https://npmjs.com) | Komponent formularza skal/akordów |
| **Music Theory API** | osobne repo (Docker) | REST API do rozwiązywania nut skal/akordów (`localhost:3000`) |
| **Gemini AI** (opcjonalnie) | zewnętrzne API | AI chat (wylączony feature flagą w V1) |

## Development

### Frontend + backend lokalnie

```bash
# Terminal 1 – backend (osobne repo)
cd ../music-theory-api
docker compose up -d        # backend na http://localhost:3000

# Terminal 2 – frontend
npm install
npm start                   # frontend na http://localhost:4200
```

### Lub wszystko przez Docker

```bash
# Wymaga zbudowanego obrazu music-theory-api
npm run docker:build        # buduje obraz frontendu
npm run docker:up           # startuje backend + frontend
# Frontend na http://localhost:80
npm run docker:down         # zatrzymuje
npm run docker:logs         # logi
```

### Zmienne środowiskowe

Konfiguracja w [`src/environments/`](src/environments/):

```ts
// environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',        // backend API
  geminiApiKey: '',                        // Gemini AI (nieużywane w V1)
  features: { chatEnabled: false }        // feature flagi
};
```

## Build

```bash
npm run build             # development build → dist/
npm run build:prod        # production build → dist/
```

## Testy

```bash
npm test                  # Karma / Jasmine
```

## Deploy na VPS (AWS / Hetzner / inny)

### Opcja A – SCP na serwer

```bash
npm run build:prod
scp -r dist/guitar-neck-ui/* user@server:/var/www/guitar-neck/
```

### Opcja B – Docker

```bash
npm run build:prod
npm run docker:build
docker save -o guitar-neck-ui.tar guitar-neck-ui:latest
# Przenieś na serwer i uruchom:
docker load -i guitar-neck-ui.tar
docker compose up -d
```

## Feature flagi

| Flaga | Plik | Domyślnie | Opis |
|---|---|---|---|
| `features.chatEnabled` | `environment.ts` | `false` | Włącza/wyłącza czat AI (Gemini) |

## Struktura projektu

```
src/
├── app/
│   ├── home-page/           # Główna strona (agregator)
│   ├── guitar-neck/         # Kontener gryfu
│   ├── freatboard/          # Siatka gryfu (stringi × progi)
│   │   ├── components/legend/
│   │   └── fret-range-selector/
│   ├── services/            # Serwisy (stan, API, interwały, nuty)
│   └── shared/              # Modele, commandy, helpery
├── environments/            # Konfiguracja środowisk
└── assets/                  # Obrazy, scss
projects/
└── guitar-chat/             # Biblioteka AI chat (feature flag)
```

## Dokumentacja

- [Product overview](PRODUCT_OVERVIEW.md)
- [Architecture](ARCHITECTURE.md)
- [API docs](API_DOCUMENTATION.md)
- [Dev setup](DEVELOPMENT.md)
- [Deployment checklist](TODO_DEPLOY.md)


## Live preview: 
https://guitar-neck-ui.onrender.com/
