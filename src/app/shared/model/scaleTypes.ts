export interface ScalePattern {
  name: string;
  intervals: number[];
}

export const SCALE_PATTERNS: ScalePattern[] = [
  {
    name: 'major-pentatonic',
    intervals: [2, 2, 3, 2, 3],
  },
  {
    name: 'minor-pentatonic',
    intervals: [3, 2, 2, 3, 2],
  },
  {
    name: 'major',
    intervals: [2, 2, 1, 2, 2, 2, 1],
  },
  {
    name: 'minor',
    intervals: [2, 1, 2, 2, 1, 2, 2],
  },
  {
    name: 'ionian',
    intervals: [2, 2, 1, 2, 2, 2, 1],
  },
  {
    name: 'dorian',
    intervals: [2, 1, 2, 2, 2, 1, 2],
  },
  {
    name: 'phrygian',
    intervals: [1, 2, 2, 2, 1, 2, 2],
  },
  {
    name: 'lydian',
    intervals: [2, 2, 2, 1, 2, 2, 1],
  },
  {
    name: 'mixolydian',
    intervals: [2, 2, 1, 2, 2, 1, 2],
  },
  {
    name: 'aeolian',
    intervals: [2, 1, 2, 2, 1, 2, 2],
  },
  {
    name: 'locrian',
    intervals: [1, 2, 2, 1, 2, 2, 2],
  },
  {
    name: 'diminished',
    intervals: [2, 1, 2, 1, 2, 1, 2, 1],
  },
  {
    name: 'augmented',
    intervals: [3, 1, 3, 1, 3, 1],
  },
  {
    name: 'harmonic',
    intervals: [2, 1, 2, 2, 1, 3, 1],
  },
  {
    name: 'melodic',
    intervals: [2, 1, 2, 2, 2, 2, 1],
  },
  {
    name: 'blues',
    intervals: [3, 2, 1, 1, 3, 2],
  },
  {
    name: "chromatic",
    intervals: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  }
];
