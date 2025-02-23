import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { aiConfig } from '../shared/config/ai-config';
import { AIResponse, MusicalSuggestion } from '../shared/model/ai-response.model';
import { AVAILABLE_PATTERNS } from '../shared/config/music-patterns.config';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeminiSuggestion {
  displayName: string;
  notes: string[];
  type: 'scale' | 'triad';
}

interface GeminiParsedResponse {
  textResponse: string;
  suggestions: GeminiSuggestion[];
}

interface RawSuggestion {
  displayName: string;
  notes: string[];
  [key: string]: any; // dla dodatkowych właściwości
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly baseUrl: string;
  private readonly headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.baseUrl = `${aiConfig.endpoint}/${aiConfig.model}:generateContent`;
    this.headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('x-goog-api-key', aiConfig.apiKey);
  }

  generateResponse(userInput: string): Observable<AIResponse> {
    const payload = {
      contents: [{
        parts: [{
          text: this.createPrompt(userInput)
        }]
      }],
      generationConfig: {
        temperature: aiConfig.temperature,
        maxOutputTokens: aiConfig.maxTokens,
        topK: 1,
        topP: 0.1,
        stopSequences: ["```"]
      }
    };

    return this.http.post<GeminiResponse>(this.baseUrl, payload, { headers: this.headers })
      .pipe(
        map(response => {
          // Sprawdzamy czy odpowiedź jest poprawna przed przetworzeniem
          this.validateResponse(response);
          const textContent = response.candidates[0].content.parts[0].text;
          return this.parseResponse(textContent);
        }),
        catchError(error => {
          console.error('Gemini API error:', error);
          const errorMessage = error.error?.error?.message ||
                             error.message ||
                             'Failed to generate response';
          throw new Error(errorMessage);
        })
      );
  }

  private validateResponse(response: GeminiResponse): void {
    // 1. Sprawdza czy odpowiedź ma prawidłową strukturę
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response structure');
    }

    const textContent = response.candidates[0].content.parts[0].text;

    // 2. Sprawdza czy odpowiedź nie jest obcięta
    if (!textContent.includes('}')) {
      throw new Error('Incomplete JSON response');
    }

    // 3. Sprawdza czy odpowiedź to prawidłowy JSON
    try {
      JSON.parse(textContent);
    } catch {
      throw new Error('Invalid JSON in response');
    }
  }

  private parseResponse(textContent: string): AIResponse {
    try {
      const parsedJson = JSON.parse(textContent);

      return {
        textResponse: typeof parsedJson.textResponse === 'string'
          ? parsedJson.textResponse
          : 'No explanation provided',
        suggestions: Array.isArray(parsedJson.suggestions)
          ? parsedJson.suggestions
              .filter((suggestion: RawSuggestion) =>
                suggestion &&
                typeof suggestion.displayName === 'string' &&
                Array.isArray(suggestion.notes) &&
                this.validateSuggestionType(suggestion.displayName)
              )
              .map((suggestion: RawSuggestion) => ({
                displayName: suggestion.displayName.trim(),
                notes: suggestion.notes
                  .map((note: string) => String(note).trim())
                  .filter((note: string) => note.match(/^[A-G][#b]?$/)),
                type: this.getSuggestionType(suggestion.displayName)
              }))
              .filter((suggestion: MusicalSuggestion) => suggestion.notes.length > 0)
          : []
      };
    } catch (error) {
      console.error('JSON parsing error:', error);
      return {
        textResponse: 'Failed to parse response',
        suggestions: []
      };
    }
  }

  private validateSuggestionType(displayName: string): boolean {
    return AVAILABLE_PATTERNS.scales.includes(displayName) ||
           AVAILABLE_PATTERNS.triads.includes(displayName);
  }

  private getSuggestionType(displayName: string): 'scale' | 'triad' | 'extendedChord' {
    if (AVAILABLE_PATTERNS.scales.includes(displayName)) return 'scale';
    if (AVAILABLE_PATTERNS.triads.includes(displayName)) return 'triad';
    if (AVAILABLE_PATTERNS.extendedChords.includes(displayName)) return 'extendedChord';
    return 'triad'; // fallback do istniejącego zachowania
  }

  private createPrompt(userInput: string): string {
    return `You are a JSON-only response API. Respond exclusively with valid JSON.
Input: "${userInput}"

When suggesting patterns, ONLY use these exact names:
Triads: ${AVAILABLE_PATTERNS.triads.map(t => `"${t}"`).join(', ')}
Scales: ${AVAILABLE_PATTERNS.scales.map(s => `"${s}"`).join(', ')}

Response format:
{
  "textResponse": "plain text explanation",
  "suggestions": [
    {
      "displayName": "exact pattern name from the lists above",
      "notes": ["root note"],
      "type": "triad" or "scale"
    }
  ]
}`;
  }
}
