# Guitar Neck UI - Dokumentacja API

## Core Services

### MusicTheoryFacadeService
Główna fasada integrująca logikę muzyczną.

```typescript
interface MusicTheoryFacadeService {
  /**
   * Generuje kompletną skalę muzyczną
   * @param name - Nazwa skali (np. "major", "minor")
   * @param rootNote - Nuta początkowa (np. "C", "F#")
   * @returns GuitarNote[] - Tablica nut na gryfie gitary
   */
  generateScale(name: string, rootNote: string): GuitarNote[];

  /**
   * Generuje akord
   * @param name - Nazwa akordu (np. "major", "minor", "dim")
   * @param rootNote - Nuta podstawowa akordu
   * @returns GuitarNote[] - Tablica nut tworzących akord
   */
  generateChord(name: string, rootNote: string): GuitarNote[];
}
```

### GuitarNeckService
Zarządza stanem gryfu gitary.

```typescript
interface GuitarNeckService {
  /**
   * Aktualizuje stan wybranej nuty na gryfie
   * @param fret - Numer progu (0-24)
   * @param string - Numer struny (0-5)
   * @param selected - Stan zaznaczenia
   */
  updateNoteState(fret: number, string: number, selected: boolean): void;

  /**
   * Zwraca aktualny stan gryfu
   * @returns Observable<GuitarNote[]> - Strumień aktualnego stanu nut
   */
  getNeckState(): Observable<GuitarNote[]>;

  /**
   * Czyści wszystkie zaznaczenia na gryfie
   */
  clearSelection(): void;
}
```

## AI Services

### AIService
Obsługuje komunikację z API Gemini.

```typescript
interface AIService {
  /**
   * Generuje odpowiedź AI na podstawie zapytania użytkownika
   * @param userInput - Tekst zapytania użytkownika
   * @returns Observable<AIResponse> - Odpowiedź AI z sugestiami muzycznymi
   */
  generateResponse(userInput: string): Observable<AIResponse>;
}
```

### AISuggestionService
Zarządza sugestiami muzycznymi od AI.

```typescript
interface AISuggestionService {
  /**
   * Ustawia nową odpowiedź AI
   * @param response - Odpowiedź z sugestiami muzycznymi
   */
  setResponse(response: AIResponse): void;

  /**
   * Zwraca strumień aktualnych sugestii
   * @returns Observable<MusicalSuggestion[]>
   */
  getSuggestions(): Observable<MusicalSuggestion[]>;
}
```

## Components

### GuitarNeckComponent
Interaktywna wizualizacja gryfu gitary.

```typescript
interface GuitarNeckComponent {
  /**
   * Tablica nut do wyświetlenia na gryfie
   * @input notes: GuitarNote[]
   */
  @Input() notes: GuitarNote[];

  /**
   * Emituje informację o kliknięciu nuty
   * @output noteClick: EventEmitter<GuitarNote>
   */
  @Output() noteClick: EventEmitter<GuitarNote>;
}
```

### ChatComponent
Interfejs konwersacji z AI.

```typescript
interface ChatComponent {
  /**
   * Wysyła wiadomość do AI
   * @param message - Tekst wiadomości
   */
  sendMessage(message: string): void;

  /**
   * Aktualny stan konwersacji
   * @property messages: Array<{text: string, isUser: boolean, suggestions?: MusicalSuggestion[]}>
   */
  messages: ChatMessage[];
}
```

## Modele Danych

```typescript
interface GuitarNote {
  fret: number;      // Numer progu (0-24)
  string: number;    // Numer struny (0-5)
  note: string;      // Nazwa nuty (np. "C", "F#")
  selected: boolean; // Stan zaznaczenia
}

interface MusicalSuggestion {
  displayName: string;                           // Nazwa wzoru muzycznego
  notes: string[];                              // Tablica nut
  type: 'scale' | 'triad' | 'extendedChord';   // Typ sugestii
}

interface AIResponse {
  textResponse: string;             // Tekstowa odpowiedź AI
  suggestions: MusicalSuggestion[]; // Sugestie muzyczne
}
```

## Stałe i Konfiguracja

```typescript
interface AIConfig {
  apiKey: string;     // Klucz API Gemini
  endpoint: string;   // Endpoint API
  model: string;      // Nazwa modelu
  temperature: number;// Parametr kreatywności (0-1)
  maxTokens: number;  // Maksymalna długość odpowiedzi
}

const AVAILABLE_PATTERNS = {
  scales: ['major', 'minor', 'pentatonic'],
  triads: ['major', 'minor', 'diminished'],
  extendedChords: ['7', 'maj7', 'm7']
}
```