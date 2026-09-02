# Paleta kolorów markerów na gryfie

> Wygenerowano: 2026-09-02
> Przeznaczenie: dokument do wspólnego przeglądu z designerem

---

## 1. System kolorów — warstwy

Aplikacja operuje na **trzech warstwach** kolorowania markerów, które wykluczają się wzajemnie w zależności od kontekstu:

| Warstwa | Kiedy aktywna | Źródło kolorów |
|---------|---------------|----------------|
| **Interval colors** | Tylko skala wybrana (bez chord relation) | `styles.scss` linie 47-58 — CSS custom properties |
| **Marker roles** | Skala + akord wybrane (scale + chord relation) | `freatboard.component.scss` linie 220-253 — klasy `.guitar-neck__role-*` |
| **Neutral / Note names** | Przełącznik `markerDisplayMode` = `'note-names'` lub `'neutral-dots'` | `freatboard.component.scss` linie 159-166 |

---

## 2. Paleta interval colors (gdy tylko skala)

Kolory przypisane do interwałów muzycznych. Definiowane w `styles.scss` jako CSS custom properties, konsumowane przez klasy `.guitar-neck__*` w `freatboard.component.scss` i klasy `.interval--*` w `legend.component.scss`.

| Interwał | CSS variable | Kolor | Swatch |
|----------|-------------|-------|--------|
| Root (1) | `--interval-root` | `rgb(168, 18, 35)` — ciemna czerwień | 🟥 |
| Minor 2nd (♭2) | `--interval-minor-2nd` | `rgb(180, 110, 60)` — brązowo-pomarańczowy | 🟫 |
| Major 2nd (2) | `--interval-major-2nd` | `rgb(185, 140, 55)` — złoto-oliwkowy | 🟨 |
| Minor 3rd (♭3) | `--interval-minor-3rd` | `rgb(165, 155, 75)` — zielonkawo-oliwkowy | 🟩 |
| Major 3rd (3) | `--interval-major-3rd` | `rgb(110, 160, 70)` — zielony | 🟩 |
| Perfect 4th (4) | `--interval-perfect-4th` | `rgb(60, 140, 100)` — ciemnozielony | 🟩 |
| Diminished 5th (♭5) | `--interval-diminished-5th` | `rgb(60, 125, 120)` — niebiesko-zielony (teal) | 🟩 |
| Perfect 5th (5) | `--interval-perfect-5th` | `rgb(60, 115, 170)` — niebieski | 🟦 |
| Minor 6th (♭6) | `--interval-minor-6th` | `rgb(110, 75, 155)` — fioletowy | 🟪 |
| Major 6th (6) | `--interval-major-6th` | `rgb(140, 85, 165)` — jasny fiolet | 🟪 |
| Minor 7th (♭7) | `--interval-minor-7th` | `rgb(145, 65, 115)` — różowo-fioletowy | 🩷 |
| Major 7th (7) | `--interval-major-7th` | `rgb(130, 130, 130)` — szary | ⬜ |

### Znaczenie biznesowe

Użytkownik widzi **kształt interwałów** na gryfie względem roota skali. Każdy interwał ma unikalny kolor, co pozwala:
- Szybko odczytać strukturę skali (np. "3 jest zawsze zielone, ♭7 jest różowe")
- Porównywać wzorce między skalami
- Uczyć się interwałów na gryfie

---

## 3. Paleta marker roles (gdy skala + akord)

Gdy użytkownik wybierze zarówno skalę, jak i akord, system przestawia się na **role-based coloring**. Każda nuta otrzymuje rolę (z `marker-role.service.ts`) i odpowiedni kolor.

| Rola | Znaczenie muzyczne | Styl | Kolor | Swatch |
|------|-------------------|------|-------|--------|
| `scale-tone` | Nuta należy do skali, **ale NIE do akordu** | Wypełnienie `#888`, obramowanie `#666` | Szary | ⚫ |
| `scale-root` | **Root skali** (należy do skali) | Wypełnienie `#888`, obramowanie `#666`, **żółty glow** `#ffc107` | Szary + żółty pierścień | ⚫🟡 |
| `chord-tone` | Nuta należy **ZARÓWNO do skali, jak i do akordu** | Wypełnienie `#2196f3` (niebieski), obramowanie `#1565c0` | Niebieski | 🔵 |
| `chord-root` | **Root akordu** (należy do skali i akordu) | Wypełnienie `#2196f3`, obramowanie `#1565c0`, **żółty glow** `#ffc107` | Niebieski + żółty pierścień | 🔵🟡 |
| `chord-tone-outside-scale` | Nuta należy do akordu, **ale NIE do skali** (dźwięk obcy) | Wypełnienie przezroczyste, **pomarańczowa przerywana obwódka** `#ff9800` | Przezroczysty + pomarańczowy kontur | ◯🧡 |

### Znaczenie biznesowe

Główny przypadek użycia — **nauka współbrzmienia akordów ze skalą** (chord-scale relationship):
- **Szare** = nuty tła (skala, ale nie akord)
- **Niebieskie** = nuty akordu (wspólne)
- **Żółty glow** = root (punkt odniesienia)
- **Pomarańczowy kontur** = dźwięki spoza skali (attention — to brzmi "outside")

### Logika przypisywania ról

`marker-role.service.ts` `computeRoles()` — algorytm:

```
dla każdej nuty na gryfie:
  jeżeli (nuta w skali) i (nuta w akordzie):
    → chord-root (jeśli chroma = root akordu)
    → scale-root (jeśli chroma = root skali, a root akordu != root skali)
    → chord-tone (w pozostałych przypadkach)
  jeżeli (nuta w akordzie) i (NIE w skali):
    → chord-tone-outside-scale
  jeżeli (nuta w skali) i (NIE w akordzie):
    → scale-root (jeśli chroma = root skali)
    → scale-tone (w pozostałych przypadkach)
```

---

## 4. Tryby wyświetlania markerów

Użytkownik może przełączać tryb przez `<select>` w legendzie (`legend.component.html` linia 27-33):

| Tryb | Opis | Klasa CSS |
|------|------|-----------|
| `interval-colors` | Pokazuje kolory interwałowe (domyślny). Gdy chord relation aktywny → automatycznie przełącza na role-based. | `guitar-neck__<interval>` lub `guitar-neck__role-*` |
| `note-names` | Białe kropki z nazwami nut, bez kolorów | `guitar-neck__neutral` |
| `neutral-dots` | Białe kropki, bez nazw nut | `guitar-neck__neutral-dot` |

Zachowanie hybrydowe (`fretboard-display.service.ts` linia 28): gdy `scaleChordState.chord` jest ustawiony, `getMarkerCssClass()` zwraca pusty string, a kolor bierze się wyłącznie z `getRoleCssClass()`.

---

## 5. Legenda role-based (relationship-strip)

Niezależna legenda w `relationship-strip.component.scss` — powiela te same kolory co marker roles, ale zdefiniowane osobno jako klasy `.rel-legend__dot--*`:

| Klasa | Kolor | Etykieta |
|-------|-------|----------|
| `--scale-tone` | `#888` + `#666` border | "scale note" |
| `--scale-root` | `#888` + `#666` border + `#ffc107` glow | "scale root" |
| `--chord-tone` | `#2196f3` + `#1565c0` border | "chord tone in scale" |
| `--chord-root` | `#2196f3` + `#1565c0` border + `#ffc107` glow | "chord root" |
| `--outside` | transparent + `#ff9800` dashed | "chord outside scale" |

---

## 6. Podsumowanie — pełna tabela kolorów

| Zastosowanie | Kolor / CSS | Wartość |
|-------------|-------------|---------|
| 🟥 Root (1) | `--interval-root` | `rgb(168, 18, 35)` |
| 🟫 Minor 2nd (♭2) | `--interval-minor-2nd` | `rgb(180, 110, 60)` |
| 🟨 Major 2nd (2) | `--interval-major-2nd` | `rgb(185, 140, 55)` |
| 🟩 Minor 3rd (♭3) | `--interval-minor-3rd` | `rgb(165, 155, 75)` |
| 🟩 Major 3rd (3) | `--interval-major-3rd` | `rgb(110, 160, 70)` |
| 🟩 Perfect 4th (4) | `--interval-perfect-4th` | `rgb(60, 140, 100)` |
| 🟩 Diminished 5th (♭5) | `--interval-diminished-5th` | `rgb(60, 125, 120)` |
| 🟦 Perfect 5th (5) | `--interval-perfect-5th` | `rgb(60, 115, 170)` |
| 🟪 Minor 6th (♭6) | `--interval-minor-6th` | `rgb(110, 75, 155)` |
| 🟪 Major 6th (6) | `--interval-major-6th` | `rgb(140, 85, 165)` |
| 🩷 Minor 7th (♭7) | `--interval-minor-7th` | `rgb(145, 65, 115)` |
| ⬜ Major 7th (7) | `--interval-major-7th` | `rgb(130, 130, 130)` |
| ⚫ Scale tone / Scale root fill | — | `#888` |
| 🟡 Root glow (scale-root, chord-root) | — | `#ffc107` |
| 🔵 Chord tone / Chord root fill | — | `#2196f3` |
| 🔵 Chord tone border | — | `#1565c0` |
| ◯🧡 Chord outside scale border | — | `#ff9800` (dashed) |
| ⚪ Neutral dot | — | `rgba(255, 255, 255, 0.92)` |
| ⚪ Neutral (note-names) | — | `rgb(255, 255, 255)` |

---

## 7. Pliki źródłowe

| Plik | Zakres |
|------|--------|
| [`src/styles.scss`](../src/styles.scss:47) | Definicje CSS custom properties dla interval colors |
| [`src/app/freatboard/freatboard.component.scss`](../src/app/freatboard/freatboard.component.scss:108) | Klasy CSS dla markerów, role-based, neutral |
| [`src/app/legend/legend.component.scss`](../src/app/legend/legend.component.scss:1) | Legenda interval colors + role swatches |
| [`src/app/relationship-strip/relationship-strip.component.scss`](../src/app/relationship-strip/relationship-strip.component.scss:1) | Legenda role-based w relationship strip |
| [`src/app/services/marker-role.service.ts`](../src/app/services/marker-role.service.ts:1) | Logika przypisywania ról (scale-tone, chord-tone, etc.) |
| [`src/app/services/fretboard-display.service.ts`](../src/app/services/fretboard-display.service.ts:1) | Logika wyboru CSS class dla markera |
| [`src/app/services/fretboard-state.service.ts`](../src/app/services/fretboard-state.service.ts:1) | `ScaleChordState` — stan przełącznika między trybami |