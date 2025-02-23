export interface MusicalSuggestion {
  displayName: string;
  notes: string[];
  type: 'scale' | 'triad' | 'extendedChord';
}

export interface AIResponse {
  textResponse: string;
  suggestions: MusicalSuggestion[];
}
