export interface PatternInfo {
  name: string;
  rootNote: string;
  type: 'scale' | 'chord';
  notes: string[];
  intervals: string[];
  semitones: number[];
  steps: string[];
}
