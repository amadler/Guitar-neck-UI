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
  fretOffset: number;   // 0 = lowest fret in the shape (after baseFret normalisation)
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
  /**
   * For movable shapes where the root fret is not the lowest fret in the shape
   * (e.g. CAGED C-form, G-form). All positions are normalised so fretOffset 0
   * is the lowest fret. baseFret is the fret of the root note above the lowest fret.
   * The resolver calculates: actualFret = rootFret - baseFret + fretOffset.
   */
  baseFret?: number;
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

  // ─── CAGED minor shapes ────────────────────────────────────────────
  //
  // Each CAGED form is a movable shape based on the open chord voicing.
  // Positions are normalised so fretOffset 0 = lowest fret in the shape.
  // baseFret indicates the root note's fret above the lowest fret.
  // The resolver calculates: actualFret = rootFret - baseFret + fretOffset.
  //
  // Open chord references (fret numbers from nut, x = muted):
  //   Cm:  x-3-1-0-1-3  →  C-Eb-G-C-G
  //   Am:  x-0-2-2-1-0  →  A-E-A-C-E
  //   Gm:  3-1-0-0-0-3  →  G-Bb-D-G-Bb-G
  //   Em:  0-2-2-0-0-0  →  E-B-E-G-B-E
  //   Dm:  x-x-0-2-3-1  →  D-A-D-F

  {
    id: 'caged-Cm-form',
    name: 'CAGED Cm-form (minor)',
    category: 'caged',
    rootString: 5,
    stringSet: [5, 4, 3, 2, 1],
    baseFret: 3,
    // Open Cm: x-3-1-0-1-3 → C-Eb-G-C-G
    // Lowest fret = 0 (strings 3, 1). Root on string 5 at fret 3.
    positions: [
      { string: 5, fretOffset: 3, label: 'root' },     // C  (3 above lowest)
      { string: 4, fretOffset: 1, label: 'b3' },       // Eb (1 above lowest)
      { string: 3, fretOffset: 0, label: '5' },        // G  (lowest)
      { string: 2, fretOffset: 1, label: 'root' },     // C  (1 above lowest)
      { string: 1, fretOffset: 3, label: '5' },        // G  (3 above lowest)
    ],
  },
  {
    id: 'caged-Am-form',
    name: 'CAGED Am-form (minor)',
    category: 'caged',
    rootString: 5,
    stringSet: [5, 4, 3, 2, 1],
    // Open Am: x-0-2-2-1-0 → A-E-A-C-E
    // Lowest fret = 0 (strings 5, 1). Root on string 5 at fret 0.
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // A  (lowest)
      { string: 4, fretOffset: 2, label: '5' },        // E  (2 above lowest)
      { string: 3, fretOffset: 2, label: 'root' },     // A  (2 above lowest)
      { string: 2, fretOffset: 1, label: 'b3' },       // C  (1 above lowest)
      { string: 1, fretOffset: 0, label: '5' },        // E  (lowest)
    ],
  },
  {
    id: 'caged-Gm-form',
    name: 'CAGED Gm-form (minor)',
    category: 'caged',
    rootString: 6,
    stringSet: [6, 5, 4, 3, 2, 1],
    baseFret: 3,
    // Open Gm: 3-1-0-0-3-3 → G-Bb-D-G-D-G
    // Lowest fret = 0 (strings 4, 3). Root on string 6 at fret 3.
    // String 2 at fret 3 = D (5th), not open B (major 3rd).
    positions: [
      { string: 6, fretOffset: 3, label: 'root' },     // G  (3 above lowest)
      { string: 5, fretOffset: 1, label: 'b3' },       // Bb (1 above lowest)
      { string: 4, fretOffset: 0, label: '5' },        // D  (lowest)
      { string: 3, fretOffset: 0, label: 'root' },     // G  (lowest)
      { string: 2, fretOffset: 3, label: '5' },        // D  (3 above lowest)
      { string: 1, fretOffset: 3, label: 'root' },     // G  (3 above lowest)
    ],
  },
  {
    id: 'caged-Em-form',
    name: 'CAGED Em-form (minor)',
    category: 'caged',
    rootString: 6,
    stringSet: [6, 5, 4, 3, 2, 1],
    // Open Em: 0-2-2-0-0-0 → E-B-E-G-B-E
    // Lowest fret = 0 (strings 6, 3, 2, 1). Root on string 6 at fret 0.
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // E  (lowest)
      { string: 5, fretOffset: 2, label: '5' },        // B  (2 above lowest)
      { string: 4, fretOffset: 2, label: 'root' },     // E  (2 above lowest)
      { string: 3, fretOffset: 0, label: 'b3' },       // G  (lowest)
      { string: 2, fretOffset: 0, label: '5' },        // B  (lowest)
      { string: 1, fretOffset: 0, label: 'root' },     // E  (lowest)
    ],
  },
  {
    id: 'caged-Dm-form',
    name: 'CAGED Dm-form (minor)',
    category: 'caged',
    rootString: 4,
    stringSet: [4, 3, 2, 1],
    // Open Dm: x-x-0-2-3-1 → D-A-D-F
    // Lowest fret = 0 (string 4). Root on string 4 at fret 0.
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },     // D  (lowest)
      { string: 3, fretOffset: 2, label: '5' },        // A  (2 above lowest)
      { string: 2, fretOffset: 3, label: 'root' },     // D  (3 above lowest)
      { string: 1, fretOffset: 1, label: 'b3' },       // F  (1 above lowest)
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