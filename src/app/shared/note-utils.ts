/**
 * note-utils.ts — pitch class (chroma) helpers for enharmonic-safe note comparison.
 *
 * Chroma = pitch class 0-11, independent of spelling (e.g. C# and Db both = 1).
 * Use these functions instead of string comparison when matching notes
 * across different sources (Tonal.js vs neckConfig.chromaticNotes).
 */

const CHROMA_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

/** Map a note name to its pitch class (0-11). Returns -1 for unknown names. */
export function noteToChroma(noteName: string): number {
  return CHROMA_MAP[noteName] ?? -1;
}

/** Compare two note names by pitch class (enharmonic-aware). */
export function samePitch(a: string, b: string): boolean {
  return noteToChroma(a) === noteToChroma(b);
}

/**
 * Chroma-to-interval mapping: semitone distance → Tonal interval name.
 * Used as a spelling-safe alternative to Tonal's distance().
 */
const CHROMA_TO_INTERVAL: Record<number, string> = {
  0: '1P',   // root / perfect unison
  1: '2m',   // minor 2nd
  2: '2M',   // major 2nd
  3: '3m',   // minor 3rd
  4: '3M',   // major 3rd
  5: '4P',   // perfect 4th
  6: '5d',   // diminished 5th
  7: '5P',   // perfect 5th
  8: '6m',   // minor 6th
  9: '6M',   // major 6th
  10: '7m',  // minor 7th
  11: '7M',  // major 7th
};

/**
 * Calculate the interval between two notes using pitch class only.
 * Spelling-independent — unlike Tonal's distance(), this works correctly
 * for enharmonic equivalents (e.g. C→D# and C→Eb both return '3m').
 */
export function intervalBetween(rootNote: string, otherNote: string): string {
  const rootChroma = noteToChroma(rootNote);
  const otherChroma = noteToChroma(otherNote);
  if (rootChroma === -1 || otherChroma === -1) return '';
  const semitones = (otherChroma - rootChroma + 12) % 12;
  return CHROMA_TO_INTERVAL[semitones] || '';
}

/**
 * Find the preferred spelling of a pitch class given a root note and interval quality.
 * Returns flat spelling for minor intervals (b2, b3, b5, b6, b7) and sharp for others.
 */
export function spellNote(rootNote: string, semitone: number, interval: string): string {
  // Flat spellings for minor/diminished intervals
  const flatChromatic: string[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  // Sharp spellings for major/perfect/augmented intervals
  const sharpChromatic: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const rootChroma = noteToChroma(rootNote);
  if (rootChroma === -1) return sharpChromatic[(rootChroma + semitone) % 12];

  const targetChroma = (rootChroma + semitone) % 12;

  // Minor intervals (b2, b3, b5, b6, b7) → prefer flat spelling
  if (interval.startsWith('b')) {
    return flatChromatic[targetChroma];
  }
  // Major/perfect/augmented intervals → prefer sharp spelling
  return sharpChromatic[targetChroma];
}