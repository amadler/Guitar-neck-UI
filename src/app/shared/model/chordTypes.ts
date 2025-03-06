export interface ChordPattern {
  name: string;
  intervals: number[];
}

export const CHORD_PATTERNS: ChordPattern[] = [
  {
    name: 'major',
    intervals: [4, 3],
  },
  {
    name: 'minor',
    intervals: [3, 4],
  },
  {
    name: 'augmented',
    intervals: [4, 4],
  },
  {
    name: 'diminished',
    intervals: [3, 3],
  },
  {
    name: 'sus2',
    intervals: [2, 5],
  },
  {
    name: 'sus4',
    intervals: [5, 2],
  },
  {
    name: 'major-7th',
    intervals: [4, 3, 4],
  },
  {
    name: 'minor-7th',
    intervals: [3, 4, 3],
  },
  {
    name: 'dominant-7th',
    intervals: [4, 3, 3],
  },
  {
    name: 'half-diminished-7th',
    intervals: [3, 3, 4],
  },
  {
    name: 'diminished-7th',
    intervals: [3, 3, 3],
  }
];
