# Guitar Neck UI - Informacje Rozwojowe

## Technologie
- Angular 18.2.0
- TypeScript
- RxJS
- Gemini AI API

## Uruchomienie Projektu

### Wymagania
- Node.js
- Angular CLI
- Klucz API dla Gemini AI

### Komendy
- `ng serve` - uruchomienie serwera deweloperskiego
- `ng build` - zbudowanie projektu
- `ng test` - uruchomienie testów
- `npx compodoc` - generowanie dokumentacji technicznej

## Struktura Projektu
- `/src/app/services` - serwisy aplikacji
- `/src/app/components` - komponenty UI
- `/src/app/shared` - współdzielone modele i utilities
- `/src/environments` - konfiguracja środowisk

## Konfiguracja
- Konfiguracja AI w `src/app/shared/config`
- Konfiguracja gryfu w `src/app/shared/model/neckConfig`
- Zmienne środowiskowe w `src/environments`

## Dokumentacja
- Dokumentacja techniczna generowana przez Compodoc
- Komentarze w kodzie dla głównych funkcjonalności
- Testy jednostkowe dla kluczowych komponentów