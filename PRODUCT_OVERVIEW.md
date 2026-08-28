# Guitar Neck UI - Przegląd Produktu

## Cel Produktu
Guitar Neck UI to interaktywne narzędzie edukacyjne zaprojektowane, aby pomóc gitarzystom w nauce i wizualizacji skal, akordów oraz wzorów muzycznych na gryfie gitary. Aplikacja łączy tradycyjne metody nauki z możliwościami sztucznej inteligencji.

## Główne Funkcjonalności

### 0. Wybór Trybu Aplikacji (ModeSelector)
- Ekran startowy z dwoma kartami: **Scale** i **Scale + Chord**
- `AppMode` zarządza widocznością formularzy i legend
- Bezpośrednie przełączanie między trybami bez resetowania gryfu

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
- Tryb **Scale + Chord** — niezależny wybór skali i akordu
  - Akord nie musi być diatoniczny względem skali (np. C major scale + E major chord)
  - Wizualizacja relacji przez 5 ról markerów: scale-tone, chord-tone, scale-root, chord-root, chord-tone-outside-scale
  - Każda rola ma dedykowaną klasę CSS (złote obramowania) — kolory interwałowe wyłączone w tym trybie
  - `RelationshipStripComponent` zastępuje `LegendComponent` — pokazuje legendę ról + które nuty akordu są w skali / poza skalą
  - Nuty akordu spoza skali są renderowane na gryfie (np. G# dla C major + E major)
- Custom pattern — użytkownik wpisuje interwały, aplikacja generuje nuty na gryfie
- `MarkerDisplayMode` — 3 tryby wyświetlania znaczników na gryfie: kolory interwałowe, nazwy nut, neutralne kropki
- Włączanie/wyłączanie poszczególnych strun (`StringToggleComponent`)
- Wybór zakresu progów z presetami (`RangeToolbarComponent`)

### 2.5. Metronom
- Wbudowany metronom z silnikiem AudioContext
- Obsługa metrum 2/4, 3/4, 4/4, 6/8
- Zakres tempa 20–300 BPM
- Funkcja tap-tempo (do 6 tapnięć)
- Wizualny wskaźnik bieżącego uderzenia
- Automatycznie wyświetlany gdy AI chat jest wyłączony

### 2.6. Podgląd Patternu i Ćwiczenia
- Panel wyświetlający szczegóły wybranej skali lub akordu (nuty, interwały, półtony, kroki)
- Podpowiedzi ćwiczeń (practice prompts) dopasowane do typu patternu
- 3 tryby wyświetlania znaczników na gryfie: kolory interwałowe, nazwy nut, neutralne kropki
- Legenda kolorów interwałowych

### 3. Asystent AI
- Czat z asystentem muzycznym
- Sugestie muzyczne oparte na zapytaniach użytkownika
- Inteligentne rekomendacje skal i akordów
- Kontekstowe wyjaśnienia teorii muzycznej
- Możliwość bezpośredniego zastosowania sugestii na gryfie

## Przepływ Pracy Użytkownika

### Podstawowe Operacje (tryb scale-only)
1. Wybór narzędzia (skala, akord, pojedyncza nuta)
2. Wybór tonacji
3. Wizualizacja na gryfie
4. Interakcja z nutami

### Scale-Chord Relation (tryb scale-chord)
1. Wybór trybu **Scale + Chord** na ekranie startowym (ModeSelector)
2. Niezależny wybór skali (typ + tonacja) i akordu (typ + tonacja)
3. Kliknięcie **Show** → wyświetlenie skali na gryfie z nałożonymi rolami akordu
4. `RelationshipStripComponent` pokazuje:
   - Legendę 5 ról wizualnych
   - Listę nut akordu które są wewnątrz skali
   - Listę nut akordu które są poza skalą (np. "Outside: G#")
5. Nuty akordu spoza skali są widoczne na gryfie z pomarańczowym obramowaniem (`chord-tone-outside-scale`)

### Ćwiczenia z Metronomem
1. Wybór skali/akordu na gryfie
2. Włączenie metronomu i ustawienie tempa
3. Korzystanie z podpowiedzi ćwiczeń
4. Gra zgodnie z zaleceniami (np. "Graj jeden dźwięk na klik metronomu")

### Praca z AI
1. Zadawanie pytań w czacie
2. Otrzymywanie sugestii muzycznych
3. Bezpośrednie stosowanie sugestii na gryfie
4. Eksploracja różnych wariantów muzycznych

## Integracje
- **Tonal.js** — lokalny silnik teorii muzyki (skale, akordy, interwały). Żadnego backendu.
- **Gemini AI** — (**POSTPONED**) silnik AI dla sugestii muzycznych, wymaga klucza API
- **guitar-neck-shared / guitar-toolbox-lib** — npm pakiety z patternami i komponentem toolbox

## Planowany Rozwój
- Dodanie nowych wzorów muzycznych
- Rozszerzenie możliwości AI
- Wprowadzenie ćwiczeń i zadań
- Personalizacja doświadczenia użytkownika
- Rozbudowa metronomu o wizualne akcenty i zapis rytmiczny
- System progresji ćwiczeń z ocenianiem

## Ograniczenia Techniczne
- AI Chat (Gemini) — **wstrzymany**, wymaga klucza API i włączenia flagi `chatEnabled`
- Logika teorii muzyki jest obliczana lokalnie przez Tonal.js — nie wymaga backendu

## Wsparcie
- Dokumentacja użytkownika dostępna w aplikacji
- Intuicyjny interfejs z podpowiedziami
- Responsywny design działający na różnych urządzeniach
