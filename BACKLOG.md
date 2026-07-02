# Backlog — Guitar Neck UI

> Validation checklist:
> - [ ] Każdy wpis ma wszystkie sekcje: Title, Motivation, Solution, MVP, Done when, Status
> - [ ] Żadna sekcja nie jest pusta
> - [ ] Lokalizacja w kodzie podana jako `plik.ts:linia`

---

## AI Chat (Gemini)

### Motivation
Użytkownik mógłby zadawać pytania o teorię muzyki i otrzymywać sugestie skal/akordów do zastosowania na gryfie.

### Solution
Biblioteka `projects/guitar-chat` już istnieje — zawiera `ChatComponent`, `AISuggestionsComponent`, `AIService` (komunikacja z Gemini API). Wymaga:
1. Klucza API Gemini w `environment.ts`
2. Włączenia flagi `chatEnabled: true`
3. Ewentualnie serwera proxy dla klucza API (bezpieczeństwo)

### MVP
Odblokowanie istniejącego czatu z Gemini — wpisanie wiadomości → odpowiedź AI z sugestiami → kliknięcie sugestii → wyświetlenie na gryfie.

### Done when
- `chatEnabled: true` w produkcji
- Czat odpowiada na pytania muzyczne
- Sugestie AI można zastosować na gryfie

### Status
POSTPONED — brak klucza API Gemini, chat wyłączony flagą.

**Lokalizacja:** `projects/guitar-chat/`, `src/environments/environment.ts:6`

---

## refreshNotesInRange() — Dead code

### Motivation
W `FreatboardComponent` istnieje pusta metoda, która sugeruje niezaimplementowaną funkcję odświeżania nut w zakresie. Zaśmieca kod i może wprowadzać w błąd.

### Solution
Usunąć metodę lub zaimplementować faktyczne odświeżanie nut przy zmianie zakresu progów.

### MVP
Usunięcie pustej metody i jej wywołania (jeśli istnieje).

### Done when
- `refreshNotesInRange()` nie istnieje w kodzie
- Brak referencji do tej metody w projekcie

### Status
FIXED — usunięta w commit 8c0850a (merge 9dbf3ec).

**Lokalizacja:** `src/app/freatboard/freatboard.component.ts:50`

---

## ToolboxSearchQuery typing — runtime coercion

### Motivation
Custom patterny używają `musicElements: string | number[]` z runtime checkiem `isCustomToolboxSearchQuery()` zamiast dedykowanego typu. To traci bezpieczeństwo typów TypeScript.

### Solution
Wydzielić osobny interfejs dla custom patternów, np. `CustomToolboxSearchQuery extends ToolboxSearchQuery` z `musicElements: number[]`.

### MVP
Dodanie typu + usunięcie runtime coercion.

### Done when
- `CustomToolboxSearchQuery` jest używany zamiast runtime checku
- Brak `Array.isArray()` w logice typu

### Status
FIXED — usunięto CustomToolboxSearchQuery i isCustomToolboxSearchQuery(). Zachowano musicElements: string | number[] dla kompatybilności z guitar-toolbox-lib.

**Lokalizacja:** `src/app/shared/model/musicElements.ts:3`

---

## toolboxSubmit() — Command Factory

### Motivation
`toolboxSubmit()` w `HomePageComponent` zawiera rozbudowany łańcuch `if/else` do tworzenia komend. Łamie Open-Closed Principle — dodanie nowego typu wymaga zmiany istniejącego kodu.

### Solution
Wydzielić fabrykę komend, np. `CommandFactory.create(event: ToolboxSearchQuery): Command`. Każdy typ komendy rejestruje się w fabryce.

### MVP
Przeniesienie istniejącej logiki `if/else` do osobnej metody/fabryki.

### Done when
- `toolboxSubmit()` nie zawiera bezpośrednich `if/else` dla typów
- Nowy typ komendy można dodać bez zmiany `HomePageComponent`

### Status
OPEN — refactoring.

**Lokalizacja:** `src/app/home-page/home-page.component.ts:31`

---

## Pattern name URL decoding in backend — `:name` param

### Motivation
Nazwy patternów z Unicode (♭ = U+266D, ♯ = U+266F) są przesyłane w URL jako %E2%99%AD / %E2%99%AF. Backend (Elysia) nie dekoduje `:name` param, więc pattern `7♭9` nie jest znajdowany.

### Solution
Dodać `decodeURIComponent()` do handlera `:name` w `src/routes/chords.ts`, analogicznie jak zrobiono dla `:root`.

### MVP
Pojedyncza linia: `const chordType = decodeURIComponent(params.name);`

### Done when
- `GET /api/chords/7♭9/C%23` zwraca poprawne nuty (200 zamiast 400)
- `GET /api/chords/7♯5/C%23` działa

### Status
OPEN — wymaga zmiany w backendzie `music-theory-api`.

**Lokalizacja:** `src/routes/chords.ts` (backend repo)

---

## MusicSelection — domain abstraction

### Motivation
Obecnie każdy typ zaznaczenia (skala, akord, nuta, custom pattern) ma osobną komendę w `UICommands.ts` i osobną metodę w `FretboardOrchestrationService`. AI, toolbox i przyszli klienci (MCP, mobile) muszą znać szczegóły implementacji zamiast operować na wspólnym pojęciu domenowym "to, co jest zaznaczone na gryfie".

### Solution
Wprowadzić interfejs `MusicSelection`:

```typescript
interface MusicSelection {
  readonly type: 'scale' | 'chord' | 'note' | 'custom';
  readonly rootNote: string;
  readonly label: string;
  getNotes(): string[];
  getIntervals(): number[];
}
```

Zrefaktorować `FretboardOrchestrationService` z 5 metod (`displayScale`, `displayChord`, itd.) na jedną: `apply(selection: MusicSelection): Observable<GuitarNote[]>`. Stare metody zostają jako delegaty (0 breaking change).

Ujednolicić `UICommands.ts` — jedna komenda `ApplySelectionCommand` zamiast 5 osobnych.

### MVP
1. Interfejs `MusicSelection` w `src/app/shared/model/`
2. Klasy: `ScaleSelection`, `ChordSelection`, `NoteSelection`, `CustomSelection`
3. Pojedyncza metoda `apply(selection)` w fasadzie
4. Stare metody jako delegaty (backward compatible)

### Done when
- `MusicSelection` istnieje jako typ domenowy
- `FretboardOrchestrationService.apply(selection)` działa dla wszystkich typów
- Toolbox, CustomPattern i AI (po odblokowaniu) używają tego samego interfejsu
- Stare metody oznaczone jako `@deprecated` lub usunięte
- Wszystkie testy przechodzą (52/52)

### Status
OPEN — do implementacji.

**Lokalizacja:** `src/app/shared/model/musicElements.ts`, `src/app/services/music-theory-facade.service.ts`, `src/app/shared/UICommands.ts`

---

## Note readability on fretboard

### Motivation
Nazwy nut na gryfie są słabo widoczne — małe kropki (20px), brak obramowania, niski kontrast, linie gryfu konkurują z nutami.

### Solution
Zwiększyć rozmiar kropek, dodać border, box-shadow, text-shadow, zmniejszyć kontrast linii gryfu, wyróżnić root note (złota obwódka, scale(1.1)).

### MVP
Same CSS — zmiana zmiennych w `styles.scss` i stylów w `freatboard.component.scss`.

### Done when
- Nuty czytelne bez zoomowania
- Root note wizualnie wyróżniony
- Gęste skale pozostają czytelne

### Status
POSTPONED — próba implementacji cofnięta, wymaga nowego podejścia.

**Lokalizacja:** `src/styles.scss`, `src/app/freatboard/freatboard.component.scss`

---

## Fret numbering starts at 0 instead of 1

### Motivation
Gryf pokazuje numery progów jako 0, 1, 2, ..., 23 zamiast 1, 2, ..., 24. Na prawdziwej gitarze pierwszy próg to "1", a open string (0) nie ma numeru. To mylące dla użytkownika.

### Solution
Zmienić wyświetlanie w `freatboard.component.html` z `{{ fret }}` na `{{ fret + 1 }}` i oznaczyć open string jako "O" lub pominąć.

### MVP
Zmiana w jednej linii template'u: zamiana interpolacji na `fret + 1`.

### Done when
- Open string pokazuje "O" zamiast "0" (lub jest pomijany)
- Progi 1-24 pokazują prawidłowe numery
- Logika pozycji nut (indeks 0 = open string) pozostaje bez zmian

### Status
FIXED — `frets` inicjalizowane jako `Array.from({ length: numberOfFrets }, (_, i) => i + 1)`, czyli [1..24]. Open string (fret 0) wyświetlany poza indeksami.

**Lokalizacja:** `src/app/services/guitar-neck.service.ts:14`, `src/app/freatboard/freatboard.component.html:9`

---

## Remove unused uuid from GuitarNote

### Motivation
Każda z 150 instancji `GuitarNote` generuje UUID w konstruktorze (`import { v4 as uuidv4 } from 'uuid'`). UUID nie jest używany nigdzie w aplikacji — żaden serwis, komponent czy test nie odwołuje się do `note.id`. To niepotrzebny narzut: import całej biblioteki `uuid` do produkcyjnego bundle'a oraz 150 × 36 znaków uuid w pamięci.

### Solution
1. Usunąć `import { v4 as uuidv4 } from 'uuid'` z `GuitarNote`
2. Usunąć pole `id?: string` z klasy
3. Usunąć `this.id = uuidv4()` z konstruktora
4. Odinstalować paczkę `uuid` i `@types/uuid` z `package.json`
5. Usunąć `uuid` z `tsconfig.json` typów jeśli tam występuje

### MVP
Usunięcie pola `id` z modelu i wywołania `uuidv4()` — bez zmiany żadnej logiki biznesowej.

### Done when
- `GuitarNote` nie importuje uuid
- `GuitarNote` nie ma pola `id`
- Paczka `uuid` nie występuje w `package.json`
- Wszystkie testy przechodzą

### Status
FIXED — usunięto `uuid` import, pole `id` i `uuidv4()` z konstruktora. Usunięto `uuid` i `@types/uuid` z package.json.

**Lokalizacja:** `src/app/shared/model/guitarNote.ts:1`, `package.json:28-34`

---

## FretboardStateService O(n) lookup — zastąpić Array.find Mapą

### Motivation
`FretboardStateService` przechowuje nuty jako `GuitarNote[]` i wyszukuje je przez `Array.find()`, `Array.some()`, `Array.filter()` — operacje O(n) przy każdej metodzie:

- `isNoteOnFret()` → `Array.some()` — O(n)
- `getNote()` → `Array.find()` — O(n)
- `getNoteName()` → `Array.find()` — O(n)
- `fretNoteClicked()` → `Array.find()` — O(n)

W template'cie dla każdej z ~150 komórek wołane są wielokrotnie te metody (isNoteOnFret + getNoteName + isNoteSelected + getNoteInterval = potencjalnie ~600 lookupów na cykl detekcji zmian), każdy O(150). Dodatkowo:

- `applyHighlightedNotes()` ma zagnieżdżoną pętlę: dla każdej zaznaczonej nuty (np. 7 w skali) filtruje tablicę 150 elementów = 1050 iteracji.

### Solution
Zastąpić `GuitarNote[]` strukturą `Map<string, GuitarNote>` z kluczem `"stringName-fret"` (np. `"E-3"`, `"A-5"`). Wszystkie lookupi stają się O(1). Metody publiczne zachowują tę samą sygnaturę — żaden klient nie wymaga zmian.

```typescript
// Przykład:
private noteMap: Map<string, GuitarNote> = new Map();

private key(string: string, fret: number): string {
    return `${string}-${fret}`;
}

getNote(string: string, fret: number): GuitarNote | undefined {
    return this.noteMap.get(this.key(string, fret));
}
```

### MVP
1. Dodać `noteMap` w konstruktorze serwisu (wypełnić z istniejącej tablicy)
2. Przepisać `isNoteOnFret()`, `getNote()`, `getNoteName()`, `fretNoteClicked()` na lookup O(1)
3. Zoptymalizować `applyHighlightedNotes()` — użyć `noteMap` zamiast `Array.filter`
4. Zachować `notes: GuitarNote[]` jako czytelny getter/delegat jeśli potrzebny

### Done when
- Wszystkie metody lookupu używają `Map.get()` zamiast `Array.find/some/filter`
- `applyHighlightedNotes()` nie ma zagnieżdżonych pętli
- Wydajność: 600 lookupów × O(1) zamiast 600 × O(150)
- Wszystkie testy przechodzą

### Status
OPEN

**Lokalizacja:** `src/app/services/guitar-neck.service.ts:21-57`, `src/app/freatboard/freatboard.component.ts:47-83`

---

## Template bezpośrednio wywołuje serwisy — przenieść logikę do komponentu

### Motivation
Template `freatboard.component.html` wywołuje bezpośrednio metody serwisu dla każdej komórki siatki:

```html
<button *ngIf="!isNoteSelected(string, fret)"
        (click)="fretNoteClicked(string, fret)">
  {{ getNoteName(string, fret) }}
</button>
```

`isNoteSelected()`, `getNoteName()`, `getNoteInterval()`, `isNoteOnFret()` — wszystkie delegują do `FretboardStateService`. To powoduje:

1. **Trudność testowania** — template'u nie da się testować w izolacji
2. **Brak przewidywalności** — Angular nie wie, które komórki zależą od której części stanu
3. **Rozproszona odpowiedzialność** — logika prezentacji miesza się z logiką domenową
4. **Wiele wywołań przy każdej detekcji zmian** — Angular nie może zoptymalizować bo to metody a nie właściwości

### Solution
Wprowadzić macierz prezentacyjną — `FreatboardComponent` buduje lokalną strukturę danych `DisplayCell[][]` i template tylko iteruje po gotowych danych.

```typescript
interface DisplayCell {
    noteName: string;
    isVisible: boolean;
    isSelected: boolean;
    interval: string;
    isDot: boolean; // znacznik na gryfie
}
```

Serwis emituje zmiany przez `BehaviorSubject<DisplayCell[][]>`, komponent subskrybuje i aktualizuje widok. Template używa wyłącznie właściwości (nie metod):

```html
<button *ngIf="cell.isVisible && !cell.isSelected">
    {{ cell.noteName }}
</button>
```

To też naturalnie współgra z przejściem na Mapę (poprzedni item) — macierz buduje się w O(1) na komórkę.

### MVP
1. Interfejs `DisplayCell` w modelu
2. `FretboardStateService` wystawia `displayMatrix$: Observable<DisplayCell[][]>`
3. `FreatboardComponent` subskrybuje i template czyta tylko z `cell.*`
4. Usunąć metody-delegaty `isNoteOnFret()`, `getNoteName()` itp. z komponentu

### Done when
- Template nie woła żadnej metody serwisu ani komponentu — tylko `cell.property`
- `DisplayCell` istnieje jako model
- `FretboardStateService` pushuje nową macierz po każdej zmianie stanu
- Wszystkie testy przechodzą

### Status
OPEN

**Lokalizacja:** `src/app/freatboard/freatboard.component.html:14-35`, `src/app/freatboard/freatboard.component.ts:43-83`, `src/app/services/guitar-neck.service.ts:21-57`

---

## UI Color Palette Refresh

### Motivation

The current fretboard color palette evolved organically but has UX issues: interval colors are overly saturated and compete for attention; white fret markers visually compete with note markers; the planned "Note Names" mode (without interval colors) will require neutral note markers that remain clearly visible against the fretboard; the current palette lacks a clearly defined visual hierarchy. The goal is to improve readability while preserving existing interval semantics.

### Solution

Refresh the visual palette without changing application behavior. Keep the current interval-to-color mapping (users should not relearn colors). Replace saturated colors with a more balanced palette. Reduce visual prominence of fret markers by using a darker shade or lower opacity. Prepare the UI for a future display mode where all notes use a neutral color (white/light gray) while remaining distinguishable from fret markers. No logic changes, no API changes, no component changes — CSS only.

### MVP

- Update interval color palette in `src/styles.scss` and `src/app/freatboard/freatboard.component.scss`
- Reduce contrast of fretboard position markers (`--guitar-neck-dot-color`, `.guitar-neck__marker`)
- Verify readability on the existing dark fretboard (`--guitar-neck-bg-color: #333`)
- Verify that a neutral note color remains distinguishable from fret markers

### Done when

- Interval colors are less visually aggressive
- Root remains immediately recognizable
- Fret markers no longer compete with note markers
- Future "Note Names" mode can use a neutral note color without ambiguity
- Existing functionality remains unchanged

### Status

FIXED — softened all 11 interval colors (reduced saturation), `--interval-root` unchanged. CSS only, no logic changes. Branch `fix/ui-color-palette-refresh` awaiting merge.

**Lokalizacja:** `src/styles.scss:48-59`

---

## Show chord tones inside scale

### Motivation
Users need to understand the relationship between a selected chord and scale, not only view them separately.

### Solution
Show a selected scale on the fretboard and highlight chord tones on top of it. Differentiate:
- Scale tones (non-chord)
- Chord tones inside the scale
- Chord tones outside the scale
- Scale root
- Chord root

Do not show all outside-scale notes as a separate mode in MVP.

Implementation touches:
1. Extend `GuitarNote` model with a `toneType` property (`'scale' | 'chord-inside' | 'chord-outside' | 'scale-root' | 'chord-root'`)
2. Add `displayScaleWithChord()` method to `FretboardOrchestrationService` — calls API for both scale and chord notes, computes intersection/difference, marks each note's `toneType`
3. Extend `IntervalService.markIntervals()` or create new method to handle combined scale+chord interval marking
4. Update `FretboardStateService.applyHighlightedNotes()` to preserve and apply `toneType`
5. Add CSS classes in `freatboard.component.scss` for each tone type (distinct colors/visuals)
6. Update `freatboard.component.html` to render tone-type CSS classes on note markers
7. Optionally add a new `DisplayScaleWithChordCommand` in `UICommands.ts`

### MVP
User can select a scale and a chord, then see which chord tones belong to the scale and which chord tones fall outside it.

### Done when
- Scale tones are visible on the fretboard
- Chord tones inside the scale are clearly highlighted (distinct from plain scale tones)
- Chord tones outside the scale are clearly marked (distinct from chord-inside and plain scale)
- Scale root and chord root are visually distinguishable
- Existing scale-only and chord-only display still works unchanged
- All existing tests pass (69/69)

### Status
OPEN

**Lokalizacja:** `src/app/services/music-theory-facade.service.ts:18-49`, `src/app/services/interval.service.ts:9-41`, `src/app/shared/model/guitarNote.ts:1-20`, `src/app/freatboard/freatboard.component.ts`, `src/app/freatboard/freatboard.component.scss`, `src/app/shared/UICommands.ts:26-56`, `src/app/services/guitar-neck.service.ts:46-65`

---

## Disable result display controls when fretboard is empty

### Motivation

Some controls only affect the way an existing fretboard result is displayed. When no scale, chord, note or custom pattern is currently shown, these controls have no meaningful effect and may confuse the user.

### Solution

Disable result display controls until there is an active fretboard result.

Keep workspace filters available.

Available always:

- fret range
- string toggle
- toolbox selection

Disabled when no result is active:

- Notes
- Intervals
- Marker style
- Clear

### MVP

When the fretboard has no active result, result display controls are disabled. After showing a scale, chord, note or custom pattern, they become active.

### Done when

- Fret range remains usable before selecting music content.
- String toggle remains usable before selecting music content.
- Notes / Intervals / Marker style are disabled when there is no active result.
- Notes / Intervals / Marker style are enabled when a result is shown.
- Clear is disabled when there is nothing to clear.

### Status

FIXED — `hasActiveResult` property w FretboardStateService, [disabled] binding na `<select>` markerów, przycisk Clear z disabled state.

**Lokalizacja:** `src/app/services/guitar-neck.service.ts:19`, `src/app/legend/legend.component.html:23`, `src/app/legend/legend.component.ts:14`, `src/app/services/guitar-neck.service.spec.ts:235`, `src/app/legend/legend.component.spec.ts:74`

---

## Header Help Modal

### Motivation

First-time users may not immediately understand what Guitar Neck UI is for or where to start.

The app needs a simple entry point explaining its purpose and currently available core features.

### Solution

Connect the `?` icon in the header to a help/welcome modal.

The modal should briefly explain:

- what the app does,
- who it is for,
- what the user can currently try,
- that AI / Practice are planned or postponed.

### MVP

Clicking the `?` icon opens a modal with short static content.

Suggested content:

### Welcome to Guitar Neck UI

Guitar Neck UI helps you understand the guitar fretboard by visualizing notes, intervals, scales and chords directly on the neck.

Use it to explore how musical patterns are built and where they appear on the guitar.

### You can currently:

- show notes on the fretboard,
- display scales,
- display chords,
- create custom interval patterns,
- limit the view to a fret range,
- enable or disable strings,
- switch marker display style.

### Start here

Choose a scale or chord in the Toolbox, select a key, then click **Show**.

### Done when

- Header `?` icon opens a help modal.
- Modal is readable on desktop.
- Content is static.
- No onboarding flow is added.
- No user account, tracking or persistence is introduced.

### Status

FIXED — `helpModalOpen` + `toggleHelpModal()` w HeaderComponent, modal overlay z treścią, testy otwarcia/zamknięcia.

**Lokalizacja:** `src/app/header/header.component.ts:13`, `src/app/header/header.component.html:10`, `src/app/header/header.component.scss:1`, `src/app/header/header.component.spec.ts:25`

---

## Compare classic toolbox and overlay toolbox

### Motivation

The current toolbox is functional but takes too much vertical space and competes with the fretboard. A toolbox overlay may improve first-time user guidance and keep the fretboard as the main workspace.

### Solution

Prepare two UI variants:

- classic toolbox layout,
- toolbox overlay on the fretboard.

Hide Custom Pattern from the deploy-facing UI for now.

### MVP

Both variants allow selecting and showing:

- scale,
- chord,
- basic note.

Custom Pattern remains available internally but is not styled or promoted in the UI.

### Done when

- Classic toolbox still works.
- Overlay toolbox works for scale/chord/basic selection.
- Overlay closes after Show.
- Toolbox can be reopened after a result is shown.
- Custom Pattern is hidden from the deploy-facing UI.
- No music logic changes are introduced.

### Status

PLAN
