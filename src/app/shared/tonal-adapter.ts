/**
 * TonalAdapter — mapowanie nazw interwałów między Tonal.js a Guitar Neck UI.
 *
 * Tonal używa notacji: '1P', '2M', '3m', '3M', '4P', '5P', '5d', '6m', '6M', '7m', '7M'
 * Guitar Neck UI używa: 'root', 'major-2nd', 'minor-3rd', 'major-3rd', itd.
 *
 * Jedyna odpowiedzialność: mapowanie string → string.
 * Żadnej logiki biznesowej, żadnych zależności.
 */

/** Nazwy interwałów w formacie używanym przez Guitar Neck UI. */
export type IntervalName =
  | 'root'
  | 'minor-2nd' | 'major-2nd'
  | 'minor-3rd' | 'major-3rd'
  | 'perfect-4th'
  | 'diminished-5th' | 'perfect-5th'
  | 'minor-6th' | 'major-6th'
  | 'minor-7th' | 'major-7th';

/** Mapowanie Tonal → Guitar Neck UI. */
export const INTERVAL_MAP: Record<string, IntervalName> = {
  '1P': 'root',
  '2m': 'minor-2nd',
  '2M': 'major-2nd',
  '3m': 'minor-3rd',
  '3M': 'major-3rd',
  '4P': 'perfect-4th',
  '5d': 'diminished-5th',
  '5P': 'perfect-5th',
  '6m': 'minor-6th',
  '6M': 'major-6th',
  '7m': 'minor-7th',
  '7M': 'major-7th',
};

/** Odwrotne mapowanie Guitar Neck UI → Tonal. */
export const REVERSE_INTERVAL_MAP: Record<string, string> = {
  'root': '1P',
  'minor-2nd': '2m',
  'major-2nd': '2M',
  'minor-3rd': '3m',
  'major-3rd': '3M',
  'perfect-4th': '4P',
  'diminished-5th': '5d',
  'perfect-5th': '5P',
  'minor-6th': '6m',
  'major-6th': '6M',
  'minor-7th': '7m',
  'major-7th': '7M',
};