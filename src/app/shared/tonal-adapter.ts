/**
 * TonalAdapter — mapowanie między Guitar Neck UI a Tonal.js.
 *
 * Odpowiedzialności:
 * 1. Mapowanie nazw interwałów (Tonal '3M' ↔ UI 'major-3rd')
 * 2. Mapowanie nazw patternów (UI 'dominant-7th' → Tonal '7')
 * 3. Fallback do CHORD_PATTERNS/SCALE_PATTERNS dla patternów bez Tonal
 *
 * Żadnej logiki biznesowej, żadnych zależności Angular.
 */

// ============================================================
// Interval name mapping
// ============================================================

export type IntervalName =
  | 'root'
  | 'minor-2nd' | 'major-2nd'
  | 'minor-3rd' | 'major-3rd'
  | 'perfect-4th'
  | 'diminished-5th' | 'perfect-5th'
  | 'minor-6th' | 'major-6th'
  | 'minor-7th' | 'major-7th';

export const INTERVAL_MAP: Record<string, IntervalName> = {
  '1P': 'root', '2m': 'minor-2nd', '2M': 'major-2nd',
  '3m': 'minor-3rd', '3M': 'major-3rd',
  '4P': 'perfect-4th',
  '5d': 'diminished-5th', '5P': 'perfect-5th',
  '6m': 'minor-6th', '6M': 'major-6th',
  '7m': 'minor-7th', '7M': 'major-7th',
};

// ============================================================
// Interval semitone mapping — single source of truth
// ============================================================

/** Maps interval symbol to semitone count. Used by DomainService.handleShowInterval(). */
export const INTERVAL_SEMITONE_MAP: Record<string, number> = {
  '1': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4,
  '4': 5, 'b5': 6, '5': 7, 'b6': 8, '6': 9,
  'b7': 10, '7': 11,
};

// ============================================================
// Pattern name mapping: UI name → Tonal name
// ============================================================

/**
 * Mapuje nasze nazwy akordów na nazwy Tonal.
 * Klucz: nazwa z CHORD_PATTERNS (np. "dominant-7th")
 * Wartość: nazwa dla chordGet() (np. "7")
 *
 * Patternów brakujących w Tonal (add11) nie ma w tej mapie —
 * są obsługiwane osobno w resolveChordNotes().
 */
export const CHORD_NAME_TO_TONAL: Record<string, string> = {
  'major': 'major',
  'minor': 'minor',
  'diminished': 'diminished',
  'augmented': 'augmented',
  'dominant-7th': '7',
  'major-7th': 'maj7',
  'minor-7th': 'm7',
  'half-diminished-7th': 'm7b5',
  'diminished-7th': 'dim7',
  '9': '9',
  'minor-9': 'm9',
  'major-9': 'maj9',
  '11': '11',
  'minor-11': 'm11',
  '13': '13',
  'minor-13': 'm13',
  'sus2': 'sus2',
  'sus4': 'sus4',
  'add9': 'add9',
  'add13': 'add13',
  '5': '5',
  // Unicode variants — Tonal uses ASCII b/# not ♭/♯
  '7♭5': '7b5',
  '7♯5': '7#5',
  '7♭9': '7b9',
  '7♯9': '7#9',
};

/**
 * Mapuje nasze nazwy skal na nazwy Tonal.
 * Klucz: nazwa z SCALE_PATTERNS (np. "blues-scale")
 * Wartość: nazwa dla scaleGet() (np. "blues")
 */
export const SCALE_NAME_TO_TONAL: Record<string, string> = {
  'major': 'major',
  'dorian': 'dorian',
  'phrygian': 'phrygian',
  'lydian': 'lydian',
  'mixolydian': 'mixolydian',
  'minor': 'minor',
  'locrian': 'locrian',
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  'blues-scale': 'blues',
  'harmonic-minor': 'harmonic minor',
  'harmonic-major': 'harmonic major',
  'melodic-minor-ascending': 'melodic minor',
  'whole-tone': 'whole tone',
  'diminished-scale': 'diminished',
  'augmented-scale': 'augmented',
  'hungarian-minor': 'hungarian minor',
  'phrygian-dominant': 'phrygian dominant',
  'neapolitan-major': 'neapolitan major',
  'persian-scale': 'persian',
  'chromatic-scale': 'chromatic',
  'enigmatic-scale': 'enigmatic',
  // These don't exist in Tonal — will use fallback
  // 'melodic-minor-descending'
  // 'neapolitan-minor'
  // 'byzantine-scale'
  // 'arabic-scale'
  // 'japanese-scale'
  // 'flamenco-scale'
  // 'tritone-scale'
  // 'custom_metal_riff'
};

/** Zbiór nazw skal które NIE istnieją w Tonal — wymagają fallbacku. */
export const SCALES_NOT_IN_TONAL = new Set([
  'melodic-minor-descending',
  'neapolitan-minor',
  'byzantine-scale',
  'arabic-scale',
  'japanese-scale',
  'flamenco-scale',
  'tritone-scale',
  'custom_metal_riff',
]);

/** Zbiór nazw akordów które NIE istnieją w Tonal — wymagają fallbacku. */
export const CHORDS_NOT_IN_TONAL = new Set([
  'add11',
]);