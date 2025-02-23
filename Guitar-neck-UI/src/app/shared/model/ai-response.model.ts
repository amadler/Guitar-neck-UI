export interface AIResponse {
  textResponse: string;
  suggestions: MusicalSuggestion[];
}

export interface MusicalSuggestion {
  displayName: string;
  notes: string[];
}