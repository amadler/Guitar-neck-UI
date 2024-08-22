export interface TriadPattern {
  name: string;
  intervals: number[];
}

export const TRIAD_PATTERNS: TriadPattern[] = [
  {
    name: 'Major Triad',
    intervals: [4, 3],
  },
  {
    name: 'Minor Triad',
    intervals: [3, 4],
  },
  {
    name: 'Augmented Triad',
    intervals: [4, 4],
  },
  {
    name: 'Diminished Triad',
    intervals: [3, 3],
  }
];
