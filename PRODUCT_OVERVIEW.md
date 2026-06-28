# Guitar Neck UI - Przegląd Produktu

## Cel Produktu
Guitar Neck UI to interaktywne narzędzie edukacyjne zaprojektowane, aby pomóc gitarzystom w nauce i wizualizacji skal, akordów oraz wzorów muzycznych na gryfie gitary. Aplikacja łączy tradycyjne metody nauki z możliwościami sztucznej inteligencji.

## Główne Funkcjonalności

### 1. Interaktywny Gryf Gitary
- Wizualizacja wszystkich nut na gryfie
- Możliwość wyboru pojedynczych nut
- Interaktywne klikanie i zaznaczanie nut
- Wyświetlanie nazw nut na progach

### 2. Narzędzia Muzyczne
- Wyświetlanie skal muzycznych (26 patternów)
- Wizualizacja akordów (26 patternów: triady, akordy extended 7/9/11/13, sus, add)
- Oznaczanie interwałów (root, 2nd, 3rd, 4th, 5th, 6th, 7th — małe/wielkie)
- Wybór tonacji (12 nut z #)
- Custom pattern — użytkownik wpisuje interwały, aplikacja generuje nuty na gryfie

### 3. Asystent AI
- Czat z asystentem muzycznym
- Sugestie muzyczne oparte na zapytaniach użytkownika
- Inteligentne rekomendacje skal i akordów
- Kontekstowe wyjaśnienia teorii muzycznej
- Możliwość bezpośredniego zastosowania sugestii na gryfie

## Przepływ Pracy Użytkownika

### Podstawowe Operacje
1. Wybór narzędzia (skala, akord, pojedyncza nuta)
2. Wybór tonacji
3. Wizualizacja na gryfie
4. Interakcja z nutami

### Praca z AI
1. Zadawanie pytań w czacie
2. Otrzymywanie sugestii muzycznych
3. Bezpośrednie stosowanie sugestii na gryfie
4. Eksploracja różnych wariantów muzycznych

## Integracje
- **music-theory-api** — backend do obliczania nut skal i akordów (Docker, port 3000)
- **Gemini AI** — (**POSTPONED**) silnik AI dla sugestii muzycznych, wymaga klucza API
- **guitar-neck-shared / guitar-toolbox-lib** — npm pakiety z patternami i komponentem toolbox

## Planowany Rozwój
- Dodanie nowych wzorów muzycznych
- Rozszerzenie możliwości AI
- Wprowadzenie ćwiczeń i zadań
- Personalizacja doświadczenia użytkownika

## Ograniczenia Techniczne
- Wymagany backend `music-theory-api` (Docker) do obliczania nut skal i akordów
- AI Chat (Gemini) — **wstrzymany**, wymaga klucza API i włączenia flagi `chatEnabled`
- Backend nie dekoduje Unicode w nazwach patternów (♭/♯) — zgłoszono do fixa

## Wsparcie
- Dokumentacja użytkownika dostępna w aplikacji
- Intuicyjny interfejs z podpowiedziami
- Responsywny design działający na różnych urządzeniach
