export interface ChordPattern {
  name: string;
  intervals: number[];
}

export const CHORD_PATTERNS: ChordPattern[] = [
  {
    name: 'Major',
    intervals: [4, 3], // Root -> Major Third (4) -> Perfect Fifth (3)
  },
  {
    name: 'Minor',
    intervals: [3, 4], // Root -> Minor Third (3) -> Perfect Fifth (4)
  },
  {
    name: 'Augmented',
    intervals: [4, 4], // Root -> Major Third (4) -> Augmented Fifth (4)
  },
  {
    name: 'Diminished',
    intervals: [3, 3], // Root -> Minor Third (3) -> Diminished Fifth (3)
  },
  {
    name: 'Sus2',
    intervals: [2, 5], // Root -> Major Second (2) -> Perfect Fifth (5)
  },
  {
    name: 'Sus4',
    intervals: [5, 2], // Root -> Perfect Fourth (5) -> Perfect Fifth (2)
  },
  // extended chords
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
  },
  {
    name: 'custom-pattern',
    intervals: [], // będzie dynamicznie uzupełniane
  }
];
