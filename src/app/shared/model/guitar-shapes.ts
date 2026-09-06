/**
 * GuitarShape — definicja kształtu na gryfie.
 *
 * Kształt to zestaw względnych pozycji (string, fretOffset) które mogą być
 * przesunięte (transposed) do konkretnego progu.
 *
 * Kategorie:
 * - cowboy: akordy otwarte (fixed position) — mają własne rootNote/chordType
 * - barre: movable shapes (E-form, A-form)
 * - caged: CAGED system forms
 * - custom: dowolne kształty
 */
export interface GuitarShapePosition {
  string: number;       // 1-6
  fretOffset: number;   // 0 = root fret position
  label?: string;       // interval label: 'root', '3', '5', etc.
}

export interface GuitarShape {
  id: string;
  name: string;
  category: 'cowboy' | 'barre' | 'caged' | 'custom';
  positions: GuitarShapePosition[];
  rootString: number;       // która struna ma root
  fixedFret?: number;       // dla cowboy chords — stała pozycja (0 = open)
  mutedStrings?: number[];  // które struny wyciszone
  stringSet?: number[];     // dla movable shapes — zestaw strun
  rootNote?: string;        // fixed root dla cowboy chords (np. 'C')
  chordType?: string;       // fixed chord type (np. 'major', 'minor')
}

/**
 * Rejestr wszystkich kształtów.
 * Dodanie nowego kształtu = dodanie wpisu do tej tablicy.
 * Zero zmian w serwisach.
 */
export const GUITAR_SHAPES: GuitarShape[] = [
  // ─── Cowboy chords (akordy otwarte) ────────────────────────────────

  {
    id: 'cowboy-C',
    name: 'C major (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    rootNote: 'C',
    chordType: 'major',
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 3, label: 'root' },    // A+3=C
      { string: 4, fretOffset: 2, label: '3' },        // D+2=E
      { string: 3, fretOffset: 0, label: '5' },        // G+0=G
      { string: 2, fretOffset: 1, label: 'root' },     // B+1=C
      { string: 1, fretOffset: 0, label: '3' },        // E+0=E
    ],
  },
  {
    id: 'cowboy-A',
    name: 'A major (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    rootNote: 'A',
    chordType: 'major',
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // A+0=A
      { string: 4, fretOffset: 2, label: '5' },        // D+2=E
      { string: 3, fretOffset: 2, label: 'root' },     // G+2=A
      { string: 2, fretOffset: 2, label: '3' },        // B+2=C#
      { string: 1, fretOffset: 0, label: '5' },        // E+0=E
    ],
  },
  {
    id: 'cowboy-G',
    name: 'G major (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    rootNote: 'G',
    chordType: 'major',
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 3, label: 'root' },     // E+3=G
      { string: 5, fretOffset: 2, label: '3' },        // A+2=B
      { string: 4, fretOffset: 0, label: '5' },        // D+0=D
      { string: 3, fretOffset: 0, label: 'root' },     // G+0=G
      { string: 2, fretOffset: 0, label: '3' },        // B+0=B
      { string: 1, fretOffset: 3, label: 'root' },     // E+3=G
    ],
  },
  {
    id: 'cowboy-E',
    name: 'E major (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    rootNote: 'E',
    chordType: 'major',
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // E+0=E
      { string: 5, fretOffset: 2, label: '5' },        // A+2=B
      { string: 4, fretOffset: 2, label: 'root' },     // D+2=E
      { string: 3, fretOffset: 1, label: '3' },        // G+1=G#
      { string: 2, fretOffset: 0, label: '5' },        // B+0=B
      { string: 1, fretOffset: 0, label: 'root' },     // E+0=E
    ],
  },
  {
    id: 'cowboy-D',
    name: 'D major (open)',
    category: 'cowboy',
    rootString: 4,
    fixedFret: 0,
    rootNote: 'D',
    chordType: 'major',
    mutedStrings: [6, 5],
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },     // D+0=D
      { string: 3, fretOffset: 2, label: '5' },        // G+2=A
      { string: 2, fretOffset: 3, label: 'root' },     // B+3=D
      { string: 1, fretOffset: 2, label: '3' },        // E+2=F#
    ],
  },
  {
    id: 'cowboy-Am',
    name: 'A minor (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    rootNote: 'A',
    chordType: 'minor',
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // A+0=A
      { string: 4, fretOffset: 2, label: '5' },        // D+2=E
      { string: 3, fretOffset: 2, label: 'root' },     // G+2=A
      { string: 2, fretOffset: 1, label: 'b3' },       // B+1=C
      { string: 1, fretOffset: 0, label: '5' },        // E+0=E
    ],
  },
  {
    id: 'cowboy-Em',
    name: 'E minor (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    rootNote: 'E',
    chordType: 'minor',
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // E+0=E
      { string: 5, fretOffset: 2, label: '5' },        // A+2=B
      { string: 4, fretOffset: 2, label: 'root' },     // D+2=E
      { string: 3, fretOffset: 0, label: 'b3' },       // G+0=G
      { string: 2, fretOffset: 0, label: '5' },        // B+0=B
      { string: 1, fretOffset: 0, label: 'root' },     // E+0=E
    ],
  },
  {
    id: 'cowboy-Dm',
    name: 'D minor (open)',
    category: 'cowboy',
    rootString: 4,
    fixedFret: 0,
    rootNote: 'D',
    chordType: 'minor',
    mutedStrings: [6, 5],
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },     // D+0=D
      { string: 3, fretOffset: 2, label: '5' },        // G+2=A
      { string: 2, fretOffset: 3, label: 'root' },     // B+3=D
      { string: 1, fretOffset: 1, label: 'b3' },       // E+1=F
    ],
  },
  {
    id: 'cowboy-C7',
    name: 'C7 (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    rootNote: 'C',
    chordType: 'dominant',
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 3, label: 'root' },     // A+3=C
      { string: 4, fretOffset: 2, label: '3' },        // D+2=E
      { string: 3, fretOffset: 3, label: 'b7' },       // G+3=Bb
      { string: 2, fretOffset: 1, label: 'root' },     // B+1=C
      { string: 1, fretOffset: 0, label: '3' },        // E+0=E
    ],
  },
  {
    id: 'cowboy-G7',
    name: 'G7 (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    rootNote: 'G',
    chordType: 'dominant',
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 3, label: 'root' },     // E+3=G
      { string: 5, fretOffset: 2, label: '3' },        // A+2=B
      { string: 4, fretOffset: 0, label: '5' },        // D+0=D
      { string: 3, fretOffset: 0, label: 'root' },     // G+0=G
      { string: 2, fretOffset: 0, label: '3' },        // B+0=B
      { string: 1, fretOffset: 1, label: 'b7' },       // E+1=F
    ],
  },

  // ─── Barre chords (E-form, A-form) ─────────────────────────────────

  {
    id: 'barre-E-form',
    name: 'Barre E-form (major)',
    category: 'barre',
    rootString: 6,
    stringSet: [6, 5, 4, 3, 2, 1],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // root on string 6
      { string: 5, fretOffset: 2, label: '5' },        // 5th
      { string: 4, fretOffset: 2, label: 'root' },     // root
      { string: 3, fretOffset: 1, label: '3' },        // 3rd
      { string: 2, fretOffset: 0, label: '5' },        // 5th
      { string: 1, fretOffset: 0, label: 'root' },     // root
    ],
  },
  {
    id: 'barre-Em-form',
    name: 'Barre Em-form (minor)',
    category: 'barre',
    rootString: 6,
    stringSet: [6, 5, 4, 3, 2, 1],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // root on string 6
      { string: 5, fretOffset: 2, label: '5' },        // 5th
      { string: 4, fretOffset: 2, label: 'root' },     // root
      { string: 3, fretOffset: 0, label: 'b3' },       // G+0=G (b3 from E)
      { string: 2, fretOffset: 0, label: '5' },        // 5th
      { string: 1, fretOffset: 0, label: 'root' },     // root
    ],
  },
  {
    id: 'barre-A-form',
    name: 'Barre A-form (major)',
    category: 'barre',
    rootString: 5,
    stringSet: [5, 4, 3, 2, 1],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // root on string 5
      { string: 4, fretOffset: 2, label: '5' },        // 5th
      { string: 3, fretOffset: 2, label: 'root' },     // root
      { string: 2, fretOffset: 2, label: '3' },        // 3rd
      { string: 1, fretOffset: 0, label: '5' },        // 5th
    ],
  },
  {
    id: 'barre-Am-form',
    name: 'Barre Am-form (minor)',
    category: 'barre',
    rootString: 5,
    stringSet: [5, 4, 3, 2, 1],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // root on string 5
      { string: 4, fretOffset: 2, label: '5' },        // 5th
      { string: 3, fretOffset: 2, label: 'root' },     // root
      { string: 2, fretOffset: 1, label: 'b3' },       // b3rd
      { string: 1, fretOffset: 0, label: '5' },        // 5th
    ],
  },
];

/**
 * Find a shape by ID.
 */
export function findShapeById(id: string): GuitarShape | undefined {
  return GUITAR_SHAPES.find(s => s.id === id);
}

/**
 * Get shapes by category.
 */
export function getShapesByCategory(category?: string): GuitarShape[] {
  if (!category) return GUITAR_SHAPES;
  return GUITAR_SHAPES.filter(s => s.category === category);
}