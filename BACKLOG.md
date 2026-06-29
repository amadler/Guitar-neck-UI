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
OPEN

**Lokalizacja:** `src/app/freatboard/freatboard.component.html:7`
