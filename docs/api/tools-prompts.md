# Tools & Prompts — testowanie agenta AI

Kompletna lista wszystkich akcji (tooli) dostępnych dla agenta AI w czacie.
Każdy tool opisany z przykładowym promptem testowym i oczekiwanym rezultatem.

## Spis treści

1. [Tryb standardowy — wyświetlanie](#1-tryb-standardowy---wyświetlanie)
2. [Tryb standardowy — konfiguracja](#2-tryb-standardowy---konfiguracja)
3. [Tryb standardowy — kwerendy](#3-tryb-standardowy---kwerendy)
4. [Tryb ćwiczeń](#4-tryb-ćwiczeń)
5. [Testy kombinowane](#5-testy-kombinowane)

---

## 1. Tryb standardowy — wyświetlanie

### 1.1 `show_pattern` — skala

**Prompt:**
```
Pokaż skalę C-dur na gryfie
```

**Oczekiwany rezultat:**
- Gryf pokazuje nuty C, D, E, F, G, A, B z interwałami (1, 2, 3, 4, 5, 6, 7)
- Tryb: `scale`, pattern: `major`, root: `C`

**Warianty do testowania:**
```
Pokaż skalę A-moll
Pokaż G-dur w zakresie 0-12 próg
Pokaż pentatonikę E-moll
```

---

### 1.2 `show_pattern` — akord

**Prompt:**
```
Pokaż akord C-dur na gryfie
```

**Oczekiwany rezultat:**
- Gryf pokazuje nuty C, E, G z interwałami (1, 3, 5)
- Tryb: `chord`, pattern: `major`, root: `C`

**Warianty:**
```
Pokaż Am
Pokaż G7
Pokaż Dm7 w zakresie 0-12
```

---

### 1.3 `show_pattern` — z emphasis

**Prompt:**
```
Pokaż C-dur, podświetl tylko root i tercję
```

**Oczekiwany rezultat:**
- Skala C-dur na gryfie
- Tylko nuty C (root) i E (3) są w pełni widoczne
- Pozostałe nuty przyciemnione (`.fretboard__dot--dimmed`)

---

### 1.4 `show_intervals`

**Prompt:**
```
Pokaż interwał tercji małej od A
```

**Oczekiwany rezultat:**
- Gryf pokazuje A (root) i C (b3) na wszystkich strunach
- Tryb: `custom`, pattern: `intervals-b3`, root: `A`

**Warianty:**
```
Pokaż interwały 1 i 5 od D
Pokaż triadę C-dur (1, 3, 5)
Pokaż tercję wielką od G
```

---

### 1.5 `compare_patterns`

**Prompt:**
```
Porównaj skalę C-dur z akordem Am
```

**Oczekiwany rezultat:**
- Gryf pokazuje unię nut C-dur i A-moll
- Nuty wspólne i spoza skali mają role wizualne (scale-tone, chord-tone, chord-tone-outside)
- Tryb: `scale-chord`

**Warianty:**
```
Pokaż G-dur z Em
Porównaj C-dur z C7
```

---

### 1.6 `resolve_shape`

**Prompt:**
```
Pokaż chwyt C-dur (cowboy)
```

**Oczekiwany rezultat:**
- Gryf pokazuje pozycje chwytu C-dur (cowboy C: struna 3 próg 0, struna 5 próg 3, itd.)
- Tryb: `positions`, shape: `cowboy-C`

**Warianty:**
```
Pokaż barre F (forma E)
Pokaż chwyt Am
Pokaż barre Bb (forma A)
```

---

### 1.7 `clear_view`

**Prompt:**
```
Wyczyść widok
```

**Oczekiwany rezultat:**
- Gryf pusty (żadnych markerów)
- Stan zresetowany do domyślnego (tryb: scale, root: C, pattern: major)
- `enabledStrings` zachowane

---

## 2. Tryb standardowy — konfiguracja

### 2.1 `set_view` — zakres progów

**Prompt:**
```
Pokaż tylko progi 3-7
```

**Oczekiwany rezultat:**
- Widok ograniczony do progów 3-7
- Pattern pozostaje bez zmian

---

### 2.2 `set_view` — aktywne struny

**Prompt:**
```
Wyłącz struny 1 i 6
```

**Oczekiwany rezultat:**
- Struny 1 (E) i 6 (E) wyłączone — nuty na nich niewidoczne
- Pozostałe struny aktywne

---

### 2.3 `set_view` — tryb markerów

**Prompt:**
```
Pokaż nazwy nut zamiast interwałów
```

**Oczekiwany rezultat:**
- Markery pokazują nazwy nut (C, D, E...) zamiast kolorów interwałowych
- Tryb: `note-names`

**Warianty:**
```
Pokaż neutralne kropki (bez nazw)
Wróć do kolorów interwałowych
```

---

### 2.4 `set_emphasis`

**Prompt:**
```
Na bieżącym patternie podświetl tylko root i kwintę
```

**Oczekiwany rezultat:**
- Tylko nuty z interwałem 1 i 5 są w pełni widoczne
- Pozostałe przyciemnione

---

### 2.5 `set_ai_mode`

**Prompt:**
```
Włącz tryb AI
```

**Oczekiwany rezultat:**
- Metronom znika
- Czat zajmuje stałą szerokość
- `aiModeEnabled: true`

---

## 3. Tryb standardowy — kwerendy

Te akcje są wywoływane przez agenta w tle, ale można je wymusić promptem.

### 3.1 `get_current_view`

**Prompt:**
```
Jaki jest aktualny widok?
```

**Oczekiwany rezultat:**
- Agent odczytuje stan i odpowiada np. "Aktualny widok: scale major (C)"

---

### 3.2 `get_available_patterns`

**Prompt:**
```
Jakie skale i akordy są dostępne?
```

**Oczekiwany rezultat:**
- Agent zwraca listę dostępnych skal i akordów

---

### 3.3 `get_pattern_details`

**Prompt:**
```
Pokaż szczegóły skali C-dur
```

**Oczekiwany rezultat:**
- Agent zwraca nuty, interwały, semitony skali C-dur

---

### 3.4 `detect_chord`

**Prompt:**
```
Jaki akord tworzą nuty C, E, G?
```

**Oczekiwany rezultat:**
- Agent odpowiada "C major" (lub podobnie)

---

### 3.5 `detect_scale`

**Prompt:**
```
Jaką skalę tworzą nuty C, D, E, F, G, A, B?
```

**Oczekiwany rezultat:**
- Agent odpowiada "major" lub "ionian"

---

### 3.6 `get_key_analysis`

**Prompt:**
```
Przeanalizuj tonację C-dur
```

**Oczekiwany rezultat:**
- Agent zwraca skalę, triady, akordy 7, dominanty sekundarne

---

### 3.7 `get_available_shapes`

**Prompt:**
```
Jakie chwyty gitarowe są dostępne?
```

**Oczekiwany rezultat:**
- Agent zwraca listę dostępnych kształtów (cowboy, barre, caged)

---

### 3.8 `resolve_shape_query`

**Prompt:**
```
Jakie pozycje ma chwyt C-dur (cowboy)?
```

**Oczekiwany rezultat:**
- Agent zwraca pozycje (string, fret) bez wyświetlania na gryfie

---

## 4. Tryb ćwiczeń

### 4.1 `start_exercise` — podstawowy

**Prompt:**
```
Rozpocznij ćwiczenie: znajdź wszystkie kwinty czyste (5) względem A w zakresie 0-12
```

**Oczekiwany rezultat:**
- Pasek ćwiczenia z pytaniem: "Znajdź wszystkie 5 (kwintę czystą) względem A"
- Gryf pusty (brak markerów), wszystkie pozycje w zakresie 0-12 klikalne
- Przycisk "Sprawdź"

**Test:**
- Kliknij A na strunie 5 (próg 0) — powinno być błędne (A to root, nie kwinta)
- Kliknij E na strunie 6 (próg 0) — powinno być błędne
- Kliknij E na strunie 5 (próg 7) — powinno być poprawne (E to kwinta od A)
- Kliknij "Sprawdź" — wynik: poprawne: 1, błędne: 2

---

### 4.2 `start_exercise` — z `showIntervals`

**Prompt:**
```
Rozpocznij ćwiczenie: znajdź wszystkie kwinty czyste (5) względem D w zakresie 0-12. Pokaż prymę (1) jako punkt odniesienia.
```

**Oczekiwany rezultat:**
- Pasek ćwiczenia z pytaniem
- Gryf pokazuje D (pryma) na wszystkich strunach jako półprzezroczyste markery z obwódką
- Reszta pozycji klikalna
- Kliknięcie na D — nic się nie dzieje (reference, nieklikalne)

**Test:**
- Kliknij D (reference) — brak reakcji ✅
- Kliknij A na strunie 5 (próg 5) — zaznacza się (A to kwinta od D) ✅
- Kliknij "Sprawdź" — reference nie są brane pod uwagę przy walidacji ✅

**Warianty:**
```
Rozpocznij ćwiczenie: znajdź tercje wielkie (3) od C w zakresie 0-12. Pokaż prymę i kwintę (1, 5).
Rozpocznij ćwiczenie: znajdź wszystkie dźwięki akordu C-dur (1, 3, 5). Pokaż cały akord jako punkt odniesienia.
```

---

### 4.3 `start_exercise` — z `fretRange` i `enabledStrings`

**Prompt:**
```
Rozpocznij ćwiczenie: znajdź wszystkie kwinty od G na strunach 4,5,6 w zakresie 3-7
```

**Oczekiwany rezultat:**
- Widok ograniczony do progów 3-7
- Aktywne tylko struny 4, 5, 6
- Pozostałe struny wyłączone (niewidoczne)

---

### 4.4 `submit_exercise`

Po zaznaczeniu nut, kliknij "Sprawdź" w UI — agent automatycznie otrzymuje wynik.

**Prompt** (jeśli agent sam nie sprawdzi):
```
Sprawdź ćwiczenie
```

**Oczekiwany rezultat:**
- Agent odpowiada z wynikiem: "Poprawne: X, błędne: Y"
- Gryf czyszczony (markery referencyjne znikają)
- Tryb ćwiczenia wyłączony

---

### 4.5 `get_exercise_result`

**Prompt:**
```
Jaki był wynik ostatniego ćwiczenia?
```

**Oczekiwany rezultat:**
- Agent odczytuje `lastExerciseResult` i podaje szczegóły

---

## 5. Testy kombinowane

Sekwencje testujące interakcje między toolami.

### 5.1 Ćwiczenie → clear_view

```
1. Rozpocznij ćwiczenie: znajdź kwinty od D, pokaż prymę
2. Wyczyść widok
```

**Oczekiwane:**
- Po kroku 1: markery referencyjne D widoczne, tryb ćwiczenia aktywny
- Po kroku 2: wszystko zniknęło, stan domyślny

---

### 5.2 Ćwiczenie → nowe ćwiczenie

```
1. Rozpocznij ćwiczenie: znajdź kwinty od D, pokaż prymę
2. Rozpocznij ćwiczenie: znajdź tercje od C, pokaż prymę i kwintę
```

**Oczekiwane:**
- Po kroku 1: markery D widoczne
- Po kroku 2: markery D zniknęły, pojawiły się markery C i G

---

### 5.3 Skala → ćwiczenie

```
1. Pokaż skalę C-dur
2. Rozpocznij ćwiczenie: znajdź kwinty od C
```

**Oczekiwane:**
- Po kroku 1: skala C-dur na gryfie
- Po kroku 2: skala znika, ćwiczenie aktywne, gryf pusty (bez markerów)

---

### 5.4 Ćwiczenie → sprawdź → nowy pattern

```
1. Rozpocznij ćwiczenie: znajdź kwinty od A
2. Kliknij E na strunie 5 (próg 7)
3. Kliknij "Sprawdź"
4. Pokaż skalę A-dur
```

**Oczekiwane:**
- Po kroku 3: ćwiczenie zakończone, wynik widoczny, gryf czysty
- Po kroku 4: skala A-dur na gryfie

---

### 5.5 show_intervals → ćwiczenie z showIntervals

```
1. Pokaż interwały 1 i 5 od D
2. Rozpocznij ćwiczenie: znajdź tercje od D, pokaż prymę
```

**Oczekiwane:**
- Po kroku 1: D i A na gryfie (tryb custom)
- Po kroku 2: D i A znikają, pojawia się tylko D (pryma) jako reference marker

---

### 5.6 Ćwiczenie — wiele interwałów

```
Rozpocznij ćwiczenie: znajdź wszystkie dźwięki akordu C-dur (1, 3, 5) w zakresie 0-12. Pokaż prymę (1) jako punkt odniesienia.
```

**Test:**
- Kliknij C (reference) — brak reakcji ✅
- Kliknij E na strunie 4 (próg 2) — zaznacza się (E to tercja wielka) ✅
- Kliknij G na strunie 6 (próg 3) — zaznacza się (G to kwinta) ✅
- Kliknij F na strunie 4 (próg 3) — zaznacza się (F to nie 1, 3, ani 5 — będzie błędne) ✅
- Kliknij "Sprawdź" — poprawne: 2, błędne: 1 ✅

---

## Podsumowanie — wszystkie narzędzia agenta

| # | Tool name | Action type | Kategoria |
|---|-----------|-------------|-----------|
| 1 | `show_pattern` | Command | Wyświetlanie |
| 2 | `show_intervals` | Command | Wyświetlanie |
| 3 | `compare_patterns` | Command | Wyświetlanie |
| 4 | `resolve_shape` | Command | Wyświetlanie |
| 5 | `clear_view` | Command | Konfiguracja |
| 6 | `set_view` | Command | Konfiguracja |
| 7 | `set_emphasis` | Command | Konfiguracja |
| 8 | `set_ai_mode` | Command | Konfiguracja |
| 9 | `start_exercise` | Command | Ćwiczenia |
| 10 | `submit_exercise` | Command | Ćwiczenia |
| 11 | `get_current_view` | Query | Kwerendy |
| 12 | `get_available_patterns` | Query | Kwerendy |
| 13 | `get_pattern_details` | Query | Kwerendy |
| 14 | `detect_chord` | Query | Kwerendy |
| 15 | `detect_scale` | Query | Kwerendy |
| 16 | `get_key_analysis` | Query | Kwerendy |
| 17 | `get_available_shapes` | Query | Kwerendy |
| 18 | `resolve_shape_query` | Query | Kwerendy |
| 19 | `get_exercise_result` | Query | Ćwiczenia |