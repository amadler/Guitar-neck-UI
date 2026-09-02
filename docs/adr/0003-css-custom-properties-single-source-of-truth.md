# ADR 0003: CSS Custom Properties jako single source of truth dla markerów

**Status**: proposed

## Context

Obecnie te same kolory markerów są zdefiniowane w wielu miejscach:
- `styles.scss` — CSS custom properties `--interval-root` itd.
- `freatboard.component.scss` — klasy `.guitar-neck__root { background: var(--interval-root); }`
- `legend.component.scss` — klasy `.legend-roles__swatch--scale-root { background: var(--interval-root); }`
- `relationship-strip.component.scss` — klasy `.rel-legend__dot--scale-tone { background: #888; }` (hardcoded, nie zmienna)

Zmiana koloru wymaga modyfikacji w 3+ plikach. Brak jednego źródła prawdy prowadzi do rozjechania się kolorów między gryfem a legendą.

## Decyzja

CSS Custom Properties zdefiniowane w `:root` w `styles.scss` (lub w `_palette.scss`) są jedynym źródłem prawdy dla:
- **Kolorów markerów** — interval colors, role colors, neutral colors
- **Rozmiarów markerów** — `--marker-size`, `--marker-font-size`, `--marker-border-radius`
- **Styli obramowań** — `--marker-role-border`, `--marker-root-glow`

Wszystkie komponenty (fretboard, legend, relationship-strip) używają `var(--marker-*)` zamiast hardcoded values.

## Alternatywy

- **SCSS zmienne (`$marker-root`)**: nie przebijają się przez Shadow DOM, wymagają kompilacji
- **Każdy komponent własne zmienne**: duplikacja, brak jednego źródła prawdy
- **Mixin SCSS**: lepsze niż duplikacja, ale wciąż wymaga importów w każdym komponencie

## Konsekwencje

- Zmiana koloru = zmiana w jednym miejscu
- Legenda i fretboard zawsze spójne wizualnie
- Możliwość theme-switching w przyszłości (dark mode przez zmianę custom properties)
- Większa czytelność CSS — jedna sekcja `:root` z wszystkimi marker variables