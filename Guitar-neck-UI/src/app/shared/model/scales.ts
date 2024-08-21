export interface ScalePattern {
  name: string;
  intervals: number[];
}

export const SCALE_PATTERNS: ScalePattern[] = [
  {
    name: 'Major pentatonic',
    intervals: [2, 2, 3, 2, 3], // Wzorzec interwałów dla pentatoniki
  },
  {
    name: 'Minor pentatonic',
    intervals: [3, 2, 2, 3, 2], // Wzorzec interwałów dla pentatoniki molowej
  },
  {
    name: 'Major scale',
    intervals: [2, 2, 1, 2, 2, 2, 1], // Wzorzec interwałów dla skali durowej
  },
  {
    name: 'Minor scale',
    intervals: [2, 1, 2, 2, 1, 2, 2], // Wzorzec interwałów dla skali molowej
  },
  //modal scales
  {
    name: 'Ionian',
    intervals: [2, 2, 1, 2, 2, 2, 1], // Wzorzec interwałów dla skali durowej
  },
  {
    name: 'Dorian',
    intervals: [2, 1, 2, 2, 2, 1, 2], // Wzorzec interwałów dla skali molowej
  },
  {
    name: 'Phrygian',
    intervals: [1, 2, 2, 2, 1, 2, 2], // Wzorzec interwałów dla skali molowej
  },
  {
    name: 'Lydian',
    intervals: [2, 2, 2, 1, 2, 2, 1], // Wzorzec interwałów dla skali molowej
  },
  {
    name: 'Mixolydian',
    intervals: [2, 2, 1, 2, 2, 1, 2], // Wzorzec interwałów dla skali molowej
  },
  {
    name: 'Aeolian',
    intervals: [2, 1, 2, 2, 1, 2, 2], // Wzorzec interwałów dla skali molowej
  },
  {
    name: 'Locrian',
    intervals: [1, 2, 2, 1, 2, 2, 2], // Wzorzec interwałów dla skali molowej
  },
  // DImiNiSHED, Augmented, Harmonic, Melodic, Blues, Pentatonic, Blues
  {
    name: 'Diminished',
    intervals: [2, 1, 2, 1, 2, 1, 2, 1], // Wzorzec interwałów dla skali zmniejszonej
  },
  {
    name: 'Augmented',
    intervals: [3, 1, 3, 1, 3, 1], // Wzorzec interwałów dla skali zwiększonej
  },
  {
    name: 'Harmonic',
    intervals: [2, 1, 2, 2, 1, 3, 1], // Wzorzec interwałów dla skali harmonicznej
  },
  {
    name: 'Melodic',
    intervals: [2, 1, 2, 2, 2, 2, 1], // Wzorzec interwałów dla skali melodycznej
  },
  {
    name: 'Blues',
    intervals: [3, 2, 1, 1, 3, 2], // Wzorzec interwałów dla skali bluesowej
  }

  // Dodaj inne wzorce skal według potrzeb

];


export interface TriadPattern {
  name: string;
  intervals: number[];
}

export const TRIAD_PATTERNS: TriadPattern[] = [
  {
    name: 'Major Triad',
    intervals: [4, 3], // Wzorzec interwałów dla trójdźwięku durowego
  },
  {
    name: 'Minor Triad',
    intervals: [3, 4], // Wzorzec interwałów dla trójdźwięku molowego
  },
  {
    name: 'Augmented Triad',
    intervals: [4, 4], // Wzorzec interwałów dla trójdźwięku zwiększonego
  },
  {
    name: 'Diminished Triad',
    intervals: [3, 3], // Wzorzec interwałów dla trójdźwięku zmniejszonego
  }
];
