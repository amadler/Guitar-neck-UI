export interface ScalePattern {
  name: string;
  intervals: number[];
}

export const SCALE_PATTERNS: ScalePattern[] = [
  {
    name: 'Major pentatonic',
    intervals: [2, 2, 3, 2, 3],
  },
  {
    name: 'Minor pentatonic',
    intervals: [3, 2, 2, 3, 2],
  },
  {
    name: 'Major scale',
    intervals: [2, 2, 1, 2, 2, 2, 1],
  },
  {
    name: 'Minor scale',
    intervals: [2, 1, 2, 2, 1, 2, 2],
  },
  {
    name: 'Ionian',
    intervals: [2, 2, 1, 2, 2, 2, 1],
  },
  {
    name: 'Dorian',
    intervals: [2, 1, 2, 2, 2, 1, 2],
  },
  {
    name: 'Phrygian',
    intervals: [1, 2, 2, 2, 1, 2, 2],
  },
  {
    name: 'Lydian',
    intervals: [2, 2, 2, 1, 2, 2, 1],
  },
  {
    name: 'Mixolydian',
    intervals: [2, 2, 1, 2, 2, 1, 2],
  },
  {
    name: 'Aeolian',
    intervals: [2, 1, 2, 2, 1, 2, 2],
  },
  {
    name: 'Locrian',
    intervals: [1, 2, 2, 1, 2, 2, 2],
  },
  {
    name: 'Diminished',
    intervals: [2, 1, 2, 1, 2, 1, 2, 1],
  },
  {
    name: 'Augmented',
    intervals: [3, 1, 3, 1, 3, 1],
  },
  {
    name: 'Harmonic',
    intervals: [2, 1, 2, 2, 1, 3, 1],
  },
  {
    name: 'Melodic',
    intervals: [2, 1, 2, 2, 2, 2, 1],
  },
  {
    name: 'Blues',
    intervals: [3, 2, 1, 1, 3, 2],
  }
];
