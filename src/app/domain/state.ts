import { EmphasisSpec } from './commands';

/**
 * A selected note position on the fretboard.
 * Records the exact string and fret, not just the note name.
 */
export interface SelectedNotePosition {
  note: string;
  string: number;
  fret: number;
}

/**
 * Canonical state — minimal, immutable source of truth.
 *
 * patternType is NOT stored here — it is derived from `mode`:
 * - 'scale' → patternType = 'scale'
 * - 'chord' → patternType = 'chord'
 * - 'scale-chord' → two patterns (primary + compareTarget)
 * - 'custom' → no patternType
 */
export interface DomainState {
  /** Application mode — the user's current intent. */
  mode: 'scale' | 'chord' | 'scale-chord' | 'custom';

  /** Root/tonic note of the current pattern. */
  rootNote: string;

  /** Name of the selected pattern (e.g., 'major', 'minor-pentatonic', 'maj7'). */
  patternName: string;

  /** Second pattern for comparison in scale-chord mode. */
  compareTarget?: {
    rootNote: string;
    patternName: string;
    patternType: 'scale' | 'chord';
  };

  /** Visible fret range on the fretboard. */
  fretRange: { min: number; max: number };

  /** Active strings (6 elements). true = show notes on this string. */
  enabledStrings: boolean[];

  /** Which intervals or roles to highlight. */
  emphasis?: EmphasisSpec;

  /** How fretboard markers are rendered. */
  markerDisplayMode: 'interval-colors' | 'note-names' | 'neutral-dots';

  /** Notes manually selected by clicking specific positions on the fretboard. */
  selectedNotes?: SelectedNotePosition[];
}

/** Default initial state. */
export const DEFAULT_DOMAIN_STATE: DomainState = {
  mode: 'scale',
  rootNote: 'C',
  patternName: 'major',
  fretRange: { min: 0, max: 24 },
  enabledStrings: [true, true, true, true, true, true],
  markerDisplayMode: 'interval-colors',
};

/**
 * Domain errors for validation failures.
 */
export enum DomainError {
  PATTERN_NOT_FOUND = 'PATTERN_NOT_FOUND',
  INVALID_ROOT_NOTE = 'INVALID_ROOT_NOTE',
  INVALID_FRET_RANGE = 'INVALID_FRET_RANGE',
  INVALID_INTERVAL = 'INVALID_INTERVAL',
  UNKNOWN_COMMAND = 'UNKNOWN_COMMAND',
  EMPTY_RESULT = 'EMPTY_RESULT',
}

/**
 * Result type for both commands and queries.
 */
export type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError; message: string };