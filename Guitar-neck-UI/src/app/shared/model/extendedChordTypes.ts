export interface ExtendedChordPattern {
  name: string;
  intervals: number[];
}

export const EXTENDED_CHORD_PATTERNS: ExtendedChordPattern[] = [
  {
    name: 'Major 7th',
    intervals: [4, 3, 4], // Major triad + major seventh
  },
  {
    name: 'Minor 7th',
    intervals: [3, 4, 3], // Minor triad + minor seventh
  },
  {
    name: 'Dominant 7th',
    intervals: [4, 3, 3], // Major triad + minor seventh
  },
  {
    name: 'Half-diminished 7th',
    intervals: [3, 3, 4], // Diminished triad + minor seventh
  },
  {
    name: 'Diminished 7th',
    intervals: [3, 3, 3], // Diminished triad + diminished seventh
  }
];
