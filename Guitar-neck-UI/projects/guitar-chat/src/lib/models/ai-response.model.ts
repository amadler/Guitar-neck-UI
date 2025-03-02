export interface MusicalSuggestion {
  displayName: string;
  notes: string[];
  type: 'scale' | 'chord' | 'arpeggio';
  position?: number;
}

export interface AIResponse {
  textResponse: string;
  suggestions: MusicalSuggestion[];
}