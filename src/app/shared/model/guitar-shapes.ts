/**
 * GuitarShape — definicja kształtu na gryfie.
 *
 * Kształt to zestaw względnych pozycji (string, fretOffset) które mogą być
 * przesunięte (transposed) do konkretnego progu.
 *
 * Kategorie:
 * - cowboy: akordy otwarte (fixed position)
 * - barre: movable shapes (E-form, A-form)
 * - triad-inversion: triady na 3 strunach we wszystkich przewrotach
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
  category: 'cowboy' | 'barre' | 'triad-inversion' | 'caged' | 'custom';
  positions: GuitarShapePosition[];
  rootString: number;       // która struna ma root
  fixedFret?: number;       // dla cowboy chords — stała pozycja (0 = open)
  mutedStrings?: number[];  // które struny wyciszone
  stringSet?: number[];     // dla movable shapes — zestaw strun
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
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 3, label: 'root' },    // C
      { string: 4, fretOffset: 2, label: '3' },        // E
      { string: 3, fretOffset: 0, label: '5' },        // G (open)
      { string: 2, fretOffset: 1, label: 'root' },     // C
      { string: 1, fretOffset: 0, label: '3' },        // E (open)
    ],
  },
  {
    id: 'cowboy-A',
    name: 'A major (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // A (open)
      { string: 4, fretOffset: 2, label: '5' },        // E
      { string: 3, fretOffset: 2, label: '3' },        // C#
      { string: 2, fretOffset: 2, label: 'root' },     // A
      { string: 1, fretOffset: 0, label: '5' },        // E (open)
    ],
  },
  {
    id: 'cowboy-G',
    name: 'G major (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 3, label: 'root' },     // G
      { string: 5, fretOffset: 2, label: '5' },        // D
      { string: 4, fretOffset: 0, label: 'root' },     // G (open)
      { string: 3, fretOffset: 0, label: '5' },        // D (open)
      { string: 2, fretOffset: 0, label: '3' },        // B (open)
      { string: 1, fretOffset: 3, label: 'root' },     // G
    ],
  },
  {
    id: 'cowboy-E',
    name: 'E major (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // E (open)
      { string: 5, fretOffset: 2, label: '5' },        // B
      { string: 4, fretOffset: 2, label: '3' },        // G#
      { string: 3, fretOffset: 1, label: '5' },        // B
      { string: 2, fretOffset: 0, label: 'root' },     // E (open)
      { string: 1, fretOffset: 0, label: '3' },        // G# (open)
    ],
  },
  {
    id: 'cowboy-D',
    name: 'D major (open)',
    category: 'cowboy',
    rootString: 4,
    fixedFret: 0,
    mutedStrings: [6, 5],
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },     // D (open)
      { string: 3, fretOffset: 2, label: '3' },        // F#
      { string: 2, fretOffset: 3, label: '5' },        // A
      { string: 1, fretOffset: 2, label: 'root' },     // D
    ],
  },
  {
    id: 'cowboy-Am',
    name: 'A minor (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },     // A (open)
      { string: 4, fretOffset: 2, label: '5' },        // E
      { string: 3, fretOffset: 2, label: 'b3' },       // C
      { string: 2, fretOffset: 2, label: 'root' },     // A
      { string: 1, fretOffset: 0, label: '5' },        // E (open)
    ],
  },
  {
    id: 'cowboy-Em',
    name: 'E minor (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },     // E (open)
      { string: 5, fretOffset: 2, label: '5' },        // B
      { string: 4, fretOffset: 2, label: 'b3' },       // G
      { string: 3, fretOffset: 0, label: '5' },        // B (open)
      { string: 2, fretOffset: 0, label: 'root' },     // E (open)
      { string: 1, fretOffset: 0, label: 'b3' },       // G (open)
    ],
  },
  {
    id: 'cowboy-Dm',
    name: 'D minor (open)',
    category: 'cowboy',
    rootString: 4,
    fixedFret: 0,
    mutedStrings: [6, 5],
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },     // D (open)
      { string: 3, fretOffset: 2, label: 'b3' },       // F
      { string: 2, fretOffset: 3, label: '5' },        // A
      { string: 1, fretOffset: 1, label: 'root' },     // D
    ],
  },
  {
    id: 'cowboy-C7',
    name: 'C7 (open)',
    category: 'cowboy',
    rootString: 5,
    fixedFret: 0,
    mutedStrings: [6],
    positions: [
      { string: 5, fretOffset: 3, label: 'root' },     // C
      { string: 4, fretOffset: 2, label: '3' },        // E
      { string: 3, fretOffset: 0, label: '5' },        // G (open)
      { string: 2, fretOffset: 1, label: 'root' },     // C
      { string: 1, fretOffset: 0, label: 'b7' },       // Bb (open)
    ],
  },
  {
    id: 'cowboy-G7',
    name: 'G7 (open)',
    category: 'cowboy',
    rootString: 6,
    fixedFret: 0,
    mutedStrings: [],
    positions: [
      { string: 6, fretOffset: 3, label: 'root' },     // G
      { string: 5, fretOffset: 2, label: '5' },        // D
      { string: 4, fretOffset: 0, label: 'root' },     // G (open)
      { string: 3, fretOffset: 0, label: '5' },        // D (open)
      { string: 2, fretOffset: 0, label: '3' },        // B (open)
      { string: 1, fretOffset: 1, label: 'b7' },       // F
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
      { string: 4, fretOffset: 2, label: '3' },        // 3rd
      { string: 3, fretOffset: 1, label: '5' },        // 5th
      { string: 2, fretOffset: 0, label: 'root' },     // root
      { string: 1, fretOffset: 0, label: '3' },        // 3rd
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
      { string: 4, fretOffset: 2, label: 'b3' },       // b3rd
      { string: 3, fretOffset: 1, label: '5' },        // 5th
      { string: 2, fretOffset: 0, label: 'root' },     // root
      { string: 1, fretOffset: 0, label: 'b3' },       // b3rd
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
      { string: 3, fretOffset: 2, label: '3' },        // 3rd
      { string: 2, fretOffset: 2, label: 'root' },     // root
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
      { string: 3, fretOffset: 2, label: 'b3' },       // b3rd
      { string: 2, fretOffset: 2, label: 'root' },     // root
      { string: 1, fretOffset: 0, label: '5' },        // 5th
    ],
  },

  // ─── Triad inversions (3-string sets) ──────────────────────────────

  // Major triads — root position (R-3-5)
  {
    id: 'triad-maj-root-654',
    name: 'Major triad root pos. (6-5-4)',
    category: 'triad-inversion',
    rootString: 6,
    stringSet: [6, 5, 4],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },
      { string: 5, fretOffset: 0, label: '3' },
      { string: 4, fretOffset: 0, label: '5' },
    ],
  },
  {
    id: 'triad-maj-root-543',
    name: 'Major triad root pos. (5-4-3)',
    category: 'triad-inversion',
    rootString: 5,
    stringSet: [5, 4, 3],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },
      { string: 4, fretOffset: 0, label: '3' },
      { string: 3, fretOffset: 0, label: '5' },
    ],
  },
  {
    id: 'triad-maj-root-432',
    name: 'Major triad root pos. (4-3-2)',
    category: 'triad-inversion',
    rootString: 4,
    stringSet: [4, 3, 2],
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },
      { string: 3, fretOffset: 0, label: '3' },
      { string: 2, fretOffset: 0, label: '5' },
    ],
  },
  {
    id: 'triad-maj-root-321',
    name: 'Major triad root pos. (3-2-1)',
    category: 'triad-inversion',
    rootString: 3,
    stringSet: [3, 2, 1],
    positions: [
      { string: 3, fretOffset: 0, label: 'root' },
      { string: 2, fretOffset: 0, label: '3' },
      { string: 1, fretOffset: 0, label: '5' },
    ],
  },

  // Major triads — 1st inversion (3-5-R)
  {
    id: 'triad-maj-1st-654',
    name: 'Major triad 1st inv. (6-5-4)',
    category: 'triad-inversion',
    rootString: 4,
    stringSet: [6, 5, 4],
    positions: [
      { string: 6, fretOffset: 0, label: '3' },
      { string: 5, fretOffset: 0, label: '5' },
      { string: 4, fretOffset: 0, label: 'root' },
    ],
  },
  {
    id: 'triad-maj-1st-543',
    name: 'Major triad 1st inv. (5-4-3)',
    category: 'triad-inversion',
    rootString: 3,
    stringSet: [5, 4, 3],
    positions: [
      { string: 5, fretOffset: 0, label: '3' },
      { string: 4, fretOffset: 0, label: '5' },
      { string: 3, fretOffset: 0, label: 'root' },
    ],
  },
  {
    id: 'triad-maj-1st-432',
    name: 'Major triad 1st inv. (4-3-2)',
    category: 'triad-inversion',
    rootString: 2,
    stringSet: [4, 3, 2],
    positions: [
      { string: 4, fretOffset: 0, label: '3' },
      { string: 3, fretOffset: 0, label: '5' },
      { string: 2, fretOffset: 0, label: 'root' },
    ],
  },
  {
    id: 'triad-maj-1st-321',
    name: 'Major triad 1st inv. (3-2-1)',
    category: 'triad-inversion',
    rootString: 1,
    stringSet: [3, 2, 1],
    positions: [
      { string: 3, fretOffset: 0, label: '3' },
      { string: 2, fretOffset: 0, label: '5' },
      { string: 1, fretOffset: 0, label: 'root' },
    ],
  },

  // Major triads — 2nd inversion (5-R-3)
  {
    id: 'triad-maj-2nd-654',
    name: 'Major triad 2nd inv. (6-5-4)',
    category: 'triad-inversion',
    rootString: 5,
    stringSet: [6, 5, 4],
    positions: [
      { string: 6, fretOffset: 0, label: '5' },
      { string: 5, fretOffset: 0, label: 'root' },
      { string: 4, fretOffset: 0, label: '3' },
    ],
  },
  {
    id: 'triad-maj-2nd-543',
    name: 'Major triad 2nd inv. (5-4-3)',
    category: 'triad-inversion',
    rootString: 4,
    stringSet: [5, 4, 3],
    positions: [
      { string: 5, fretOffset: 0, label: '5' },
      { string: 4, fretOffset: 0, label: 'root' },
      { string: 3, fretOffset: 0, label: '3' },
    ],
  },
  {
    id: 'triad-maj-2nd-432',
    name: 'Major triad 2nd inv. (4-3-2)',
    category: 'triad-inversion',
    rootString: 3,
    stringSet: [4, 3, 2],
    positions: [
      { string: 4, fretOffset: 0, label: '5' },
      { string: 3, fretOffset: 0, label: 'root' },
      { string: 2, fretOffset: 0, label: '3' },
    ],
  },
  {
    id: 'triad-maj-2nd-321',
    name: 'Major triad 2nd inv. (3-2-1)',
    category: 'triad-inversion',
    rootString: 2,
    stringSet: [3, 2, 1],
    positions: [
      { string: 3, fretOffset: 0, label: '5' },
      { string: 2, fretOffset: 0, label: 'root' },
      { string: 1, fretOffset: 0, label: '3' },
    ],
  },

  // Minor triads — root position (R-b3-5)
  {
    id: 'triad-min-root-654',
    name: 'Minor triad root pos. (6-5-4)',
    category: 'triad-inversion',
    rootString: 6,
    stringSet: [6, 5, 4],
    positions: [
      { string: 6, fretOffset: 0, label: 'root' },
      { string: 5, fretOffset: 0, label: 'b3' },
      { string: 4, fretOffset: 0, label: '5' },
    ],
  },
  {
    id: 'triad-min-root-543',
    name: 'Minor triad root pos. (5-4-3)',
    category: 'triad-inversion',
    rootString: 5,
    stringSet: [5, 4, 3],
    positions: [
      { string: 5, fretOffset: 0, label: 'root' },
      { string: 4, fretOffset: 0, label: 'b3' },
      { string: 3, fretOffset: 0, label: '5' },
    ],
  },
  {
    id: 'triad-min-root-432',
    name: 'Minor triad root pos. (4-3-2)',
    category: 'triad-inversion',
    rootString: 4,
    stringSet: [4, 3, 2],
    positions: [
      { string: 4, fretOffset: 0, label: 'root' },
      { string: 3, fretOffset: 0, label: 'b3' },
      { string: 2, fretOffset: 0, label: '5' },
    ],
  },
  {
    id: 'triad-min-root-321',
    name: 'Minor triad root pos. (3-2-1)',
    category: 'triad-inversion',
    rootString: 3,
    stringSet: [3, 2, 1],
    positions: [
      { string: 3, fretOffset: 0, label: 'root' },
      { string: 2, fretOffset: 0, label: 'b3' },
      { string: 1, fretOffset: 0, label: '5' },
    ],
  },

  // Minor triads — 1st inversion (b3-5-R)
  {
    id: 'triad-min-1st-654',
    name: 'Minor triad 1st inv. (6-5-4)',
    category: 'triad-inversion',
    rootString: 4,
    stringSet: [6, 5, 4],
    positions: [
      { string: 6, fretOffset: 0, label: 'b3' },
      { string: 5, fretOffset: 0, label: '5' },
      { string: 4, fretOffset: 0, label: 'root' },
    ],
  },
  {
    id: 'triad-min-1st-543',
    name: 'Minor triad 1st inv. (5-4-3)',
    category: 'triad-inversion',
    rootString: 3,
    stringSet: [5, 4, 3],
    positions: [
      { string: 5, fretOffset: 0, label: 'b3' },
      { string: 4, fretOffset: 0, label: '5' },
      { string: 3, fretOffset: 0, label: 'root' },
    ],
  },
  {
    id: 'triad-min-1st-432',
    name: 'Minor triad 1st inv. (4-3-2)',
    category: 'triad-inversion',
    rootString: 2,
    stringSet: [4, 3, 2],
    positions: [
      { string: 4, fretOffset: 0, label: 'b3' },
      { string: 3, fretOffset: 0, label: '5' },
      { string: 2, fretOffset: 0, label: 'root' },
    ],
  },
  {
    id: 'triad-min-1st-321',
    name: 'Minor triad 1st inv. (3-2-1)',
    category: 'triad-inversion',
    rootString: 1,
    stringSet: [3, 2, 1],
    positions: [
      { string: 3, fretOffset: 0, label: 'b3' },
      { string: 2, fretOffset: 0, label: '5' },
      { string: 1, fretOffset: 0, label: 'root' },
    ],
  },

  // Minor triads — 2nd inversion (5-R-b3)
  {
    id: 'triad-min-2nd-654',
    name: 'Minor triad 2nd inv. (6-5-4)',
    category: 'triad-inversion',
    rootString: 5,
    stringSet: [6, 5, 4],
    positions: [
      { string: 6, fretOffset: 0, label: '5' },
      { string: 5, fretOffset: 0, label: 'root' },
      { string: 4, fretOffset: 0, label: 'b3' },
    ],
  },
  {
    id: 'triad-min-2nd-543',
    name: 'Minor triad 2nd inv. (5-4-3)',
    category: 'triad-inversion',
    rootString: 4,
    stringSet: [5, 4, 3],
    positions: [
      { string: 5, fretOffset: 0, label: '5' },
      { string: 4, fretOffset: 0, label: 'root' },
      { string: 3, fretOffset: 0, label: 'b3' },
    ],
  },
  {
    id: 'triad-min-2nd-432',
    name: 'Minor triad 2nd inv. (4-3-2)',
    category: 'triad-inversion',
    rootString: 3,
    stringSet: [4, 3, 2],
    positions: [
      { string: 4, fretOffset: 0, label: '5' },
      { string: 3, fretOffset: 0, label: 'root' },
      { string: 2, fretOffset: 0, label: 'b3' },
    ],
  },
  {
    id: 'triad-min-2nd-321',
    name: 'Minor triad 2nd inv. (3-2-1)',
    category: 'triad-inversion',
    rootString: 2,
    stringSet: [3, 2, 1],
    positions: [
      { string: 3, fretOffset: 0, label: '5' },
      { string: 2, fretOffset: 0, label: 'root' },
      { string: 1, fretOffset: 0, label: 'b3' },
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