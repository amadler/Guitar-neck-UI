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
// Interval configuration — single source of truth
// ============================================================

export interface IntervalConfig {
  symbol: string;       // 'b3'
  semitone: number;     // 3
  label: string;        // 'minor 3'
  tonalName: string;    // '3m'
  cssClass: string;     // 'minor-3rd'
}

export type IntervalName =
  | 'root'
  | 'minor-2nd' | 'major-2nd'
  | 'minor-3rd' | 'major-3rd'
  | 'perfect-4th'
  | 'diminished-5th' | 'perfect-5th'
  | 'minor-6th' | 'major-6th'
  | 'minor-7th' | 'major-7th';

/** Single source of truth for all 12 intervals. */
export const INTERVAL_CONFIG: IntervalConfig[] = [
  { symbol: '1',  semitone: 0,  label: 'unison',    tonalName: '1P', cssClass: 'root' },
  { symbol: 'b2', semitone: 1,  label: 'minor 2',   tonalName: '2m', cssClass: 'minor-2nd' },
  { symbol: '2',  semitone: 2,  label: 'major 2',   tonalName: '2M', cssClass: 'major-2nd' },
  { symbol: 'b3', semitone: 3,  label: 'minor 3',   tonalName: '3m', cssClass: 'minor-3rd' },
  { symbol: '3',  semitone: 4,  label: 'major 3',   tonalName: '3M', cssClass: 'major-3rd' },
  { symbol: '4',  semitone: 5,  label: 'perfect 4', tonalName: '4P', cssClass: 'perfect-4th' },
  { symbol: 'b5', semitone: 6,  label: 'tritone',   tonalName: '5d', cssClass: 'diminished-5th' },
  { symbol: '5',  semitone: 7,  label: 'perfect 5', tonalName: '5P', cssClass: 'perfect-5th' },
  { symbol: 'b6', semitone: 8,  label: 'minor 6',   tonalName: '6m', cssClass: 'minor-6th' },
  { symbol: '6',  semitone: 9,  label: 'major 6',   tonalName: '6M', cssClass: 'major-6th' },
  { symbol: 'b7', semitone: 10, label: 'minor 7',   tonalName: '7m', cssClass: 'minor-7th' },
  { symbol: '7',  semitone: 11, label: 'major 7',   tonalName: '7M', cssClass: 'major-7th' },
];

// ============================================================
// Derived maps (built from INTERVAL_CONFIG)
// ============================================================

/** Maps Tonal interval name → UI CSS class name. */
export const INTERVAL_MAP: Record<string, IntervalName> =
  Object.fromEntries(INTERVAL_CONFIG.map(i => [i.tonalName, i.cssClass as IntervalName]));

/** Maps interval symbol → semitone count. Used by DomainService.handleShowInterval(). */
export const INTERVAL_SEMITONE_MAP: Record<string, number> =
  Object.fromEntries(INTERVAL_CONFIG.map(i => [i.symbol, i.semitone]));

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