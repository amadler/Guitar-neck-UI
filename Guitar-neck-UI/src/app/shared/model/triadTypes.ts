export interface TriadPattern {
  name: string;
  intervals: number[];
}

export const TRIAD_PATTERNS: TriadPattern[] = [
  {
    name: 'Major Triad',
    intervals: [4, 3], // Root -> Major Third (4) -> Perfect Fifth (3)
  },
  {
    name: 'Minor Triad',
    intervals: [3, 4], // Root -> Minor Third (3) -> Perfect Fifth (4)
  },
  {
    name: 'Augmented Triad',
    intervals: [4, 4], // Root -> Major Third (4) -> Augmented Fifth (4)
  },
  {
    name: 'Diminished Triad',
    intervals: [3, 3], // Root -> Minor Third (3) -> Diminished Fifth (3)
  },
  {
    name: 'Sus2',
    intervals: [2, 5], // Root -> Major Second (2) -> Perfect Fifth (5)
  },
  {
    name: 'Sus4',
    intervals: [5, 2], // Root -> Perfect Fourth (5) -> Perfect Fifth (2)
  }
];
