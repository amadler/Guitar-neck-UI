# ADR 0004: Nowa architektura layoutu — Command Bar + Bottom Panel

**Status**: proposed

## Context

Nowy layout z Google Slides wprowadza fundamentalną zmianę w organizacji UI:
1. **Command Bar** na górze — zastępuje toolbox (dock) na dole
2. **Bottom Panel** — Scale Info | Chord Info | Metronome — zastępuje osobne komponenty pod gryfem
3. **Relationship strip** — przeniesiony do sekcji fretboardu, poniżej gryfu
4. **String toggles** — pionowa lista po lewej stronie gryfu

Obecna struktura (`home-page.component.html`) ma dock na dole z toolboxem + metronomem, a pod gryfem osobno legend/relationship-strip/pattern-display.

## Decyzja

Nowa struktura `home-page.component.html`:

```
app-shell
├── app-header                    (nowy wygląd BEM)
├── command-bar                   (nowy komponent lub sekcja w home-page)
│   ├── mode selects              (Show/Compare/Build)
│   ├── key/pattern selects
│   ├── Apply button
│   └── range buttons             (przeniesione z range-toolbar)
├── fretboard-section             (nowa sekcja)
│   ├── string-toggles            (pionowo po lewej)
│   ├── app-guitar-neck           (fretboard)
│   └── relationship-strip        (pod gryfem, tylko w scale-chord mode)
├── bottom-panel                  (nowy komponent lub sekcja)
│   ├── scale-info                (z pattern-display)
│   ├── chord-info                (z pattern-display)
│   └── metronome                 (z docka)
└── app-footer                    (opcjonalnie)
```

## Alternatywy

- **Dock na dole + Command Bar na górze**: za dużo UI, dwa miejsca do interakcji
- **Command Bar tylko dla Compare, reszta w docku**: niepełna migracja, hybryda
- **Wszystko w headerze**: za dużo elementów w headerze

## Konsekwencje

- `home-page.component.html` wymaga restrukturyzacji
- `range-toolbar.component` — zmiana z card-style na inline buttons
- `pattern-display.component` — zmiana layoutu na Scale Info / Chord Info cards
- `relationship-strip.component` — przeniesienie do fretboard-section
- `metronome.component` — przeniesienie do bottom-panel
- `footer` — do decyzji czy zostaje
- Dock (toolbox) znika — `toolbox-builder` przenosi się do command-bar