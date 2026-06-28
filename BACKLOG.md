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
OPEN — do decyzji: usunąć czy zaimplementować.

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
OPEN — wymaga refactoringu.

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
