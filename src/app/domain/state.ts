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
 * An exercise task set by the agent during a lesson.
 * The user must find/select notes matching the expected intervals.
 */
export interface ExerciseTask {
  /** Question text shown to the user (e.g., "Find all fifths relative to A"). */
  question: string;
  /** The reference note for interval calculation. */
  rootNote: string;
  /** Valid interval names the user should find (e.g., ['5'], ['1', 'b3']). */
  expectedIntervals: string[];
  /** Optional view constraint — limit which frets are visible. */
  fretRange?: { min: number; max: number };
  /** Optional view constraint — limit which strings are active. */
  enabledStrings?: boolean[];
  /**
   * All correct positions in the current fretRange and enabledStrings.
   * Computed by the app when the exercise starts.
   * Used to check completeness — did the user find ALL expected notes?
   */
  expectedPositions?: Array<{ string: number; fret: number }>;
}

/**
 * Result of an exercise submission.
 * Computed by the app via Tonal.js assertion, sent back to the agent.
 * The agent decides how to comment — this is just raw data.
 */
export interface ExerciseResult {
  /** Per-note correctness (same order as selectedNotes). */
  correct: boolean[];
  /** The notes the user selected. */
  selectedNotes: SelectedNotePosition[];
  /** Number of correctly selected notes. */
  correctCount: number;
  /** Number of incorrectly selected notes. */
  incorrectCount: number;
  /** Number of expected positions the user missed (only when expectedPositions is set). */
  missingCount?: number;
  /** Expected positions the user did not select (only when expectedPositions is set). */
  missingPositions?: Array<{ string: number; fret: number }>;
}

/**
 * Canonical state — minimal, immutable source of truth.
 *
 * patternType is NOT stored here — it is derived from `mode`:
 * - 'scale' → patternType = 'scale'
 * - 'chord' → patternType = 'chord'
 * - 'scale-chord' → two patterns (primary + compareTarget)
 * - 'custom' → no patternType
 *
 * aiModeEnabled is orthogonal to mode — it controls chat visibility,
 * not what is displayed on the fretboard.
 */
export interface DomainState {
  /** Application mode — the user's current intent. */
  mode: 'scale' | 'chord' | 'scale-chord' | 'custom' | 'positions';

  /** Whether AI chat mode is active — orthogonal to mode. */
  aiModeEnabled: boolean;

  /** Which overlay to show: legend (Show), relationship strip (Compare), or none. */
  displayMode: 'legend' | 'relationship' | null;

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

  /** For position-based display (show-voicing, show-arpeggio, show-lick, resolve-shape). */
  shapeInfo?: {
    shapeId?: string;
    positions: Array<{ string: number; fret: number; label?: string }>;
  };

  /** Whether the fretboard is in exercise selection mode. */
  exerciseMode: boolean;

  /** The current exercise task set by the agent (present only when exerciseMode is true). */
  exerciseTask?: ExerciseTask;

  /** The result of the last submitted exercise. Cleared when a new exercise starts. */
  lastExerciseResult?: ExerciseResult;
}

/** Default initial state. */
export const DEFAULT_DOMAIN_STATE: DomainState = {
  mode: 'scale',
  aiModeEnabled: false,
  displayMode: null,
  rootNote: 'C',
  patternName: 'major',
  fretRange: { min: 0, max: 24 },
  enabledStrings: [true, true, true, true, true, true],
  markerDisplayMode: 'interval-colors',
  exerciseMode: false,
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
  INVALID_POSITION = 'INVALID_POSITION',
  POSITION_NOTE_MISMATCH = 'POSITION_NOTE_MISMATCH',
  SHAPE_NOT_FOUND = 'SHAPE_NOT_FOUND',
  NO_ACTIVE_EXERCISE = 'NO_ACTIVE_EXERCISE',
}

/**
 * Result type for both commands and queries.
 */
export type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError; message: string };