import { PatternType } from '../services/tonal-facade.service';

/**
 * Emphasis specification — which intervals or roles to highlight.
 * Part of a command, not a separate overlay.
 */
export interface EmphasisSpec {
  intervals?: string[];
  roles?: string[];
}

/**
 * Show a pattern (scale or chord) on the fretboard.
 * Replaces the previous view.
 * This is a user intent, not a state mutation instruction.
 */
export interface ShowPatternCommand {
  type: 'show-pattern';
  patternType: PatternType;
  patternName: string;
  rootNote: string;
  fretRange?: { min: number; max: number };
  emphasis?: EmphasisSpec;
}

/**
 * Compare two patterns (scale-chord mode).
 */
export interface ComparePatternsCommand {
  type: 'compare-patterns';
  primary: {
    patternType: PatternType;
    patternName: string;
    rootNote: string;
  };
  secondary: {
    patternType: PatternType;
    patternName: string;
    rootNote: string;
  };
}

/**
 * Change view configuration without changing the pattern.
 */
export interface SetViewCommand {
  type: 'set-view';
  fretRange?: { min: number; max: number };
  enabledStrings?: boolean[];
  markerDisplayMode?: 'interval-colors' | 'note-names' | 'neutral-dots';
}

/**
 * Change emphasis on the current pattern.
 */
export interface SetEmphasisCommand {
  type: 'set-emphasis';
  emphasis: EmphasisSpec;
}

/**
 * Show multiple intervals from a root note on the fretboard in one logical view.
 * Replaces multiple show-interval calls with a single command.
 * Uses displayCustomPattern internally with Tonal.js for enharmonic spelling.
 */
export interface ShowIntervalsCommand {
  type: 'show-intervals';
  rootNote: string;
  intervals: string[]; // e.g., ['1', 'b3'], ['1', '3', '5']
}
/**
 * Clear the fretboard, reset state to default.
 */
export interface ClearViewCommand {
  type: 'clear-view';
}

// ─── Resolve shape command ────────────────────────────────────────────

/**
 * Resolve a named shape (cowboy chord, barre) to positions.
 * Uses the shape registry.
 */
export interface ResolveShapeCommand {
  type: 'resolve-shape';
  shapeId: string;              // np. 'cowboy-C', 'barre-E-form'
  rootNote?: string;            // wymagane dla barre shapes; opcjonalne dla cowboy (mają własny rootNote)
}

/**
 * Toggle AI chat mode.
 * When enabled, the metronome hides and the chat gets a fixed width.
 */
export interface SetAiModeCommand {
  type: 'set-ai-mode';
  enabled: boolean;
}

/**
 * Start an exercise during a lesson.
 * Activates selection mode on the fretboard — user can click notes and submit.
 */
export interface StartExerciseCommand {
  type: 'start-exercise';
  question: string;
  rootNote: string;
  expectedIntervals: string[];
  /** Intervals to show on the fretboard as visual reference markers (not clickable). */
  showIntervals?: string[];
  fretRange?: { min: number; max: number };
  enabledStrings?: boolean[];
}

/**
 * Submit the current exercise for validation.
 * The app checks selected notes against expected intervals and returns ExerciseResult.
 */
export interface SubmitExerciseCommand {
  type: 'submit-exercise';
}

/**
 * Select a note on the fretboard (toggle on).
 */
export interface SelectNoteCommand {
  type: 'select-note';
  note: string;
  string: number;
  fret: number;
}

/**
 * Deselect a note on the fretboard (toggle off).
 */
export interface DeselectNoteCommand {
  type: 'deselect-note';
  string: number;
  fret: number;
}

/**
 * A domain command expresses a user intent to change the fretboard view.
 * It does NOT describe how to mutate state — that mapping is the responsibility of DomainService.
 */
export type DomainCommand =
  | ShowPatternCommand
  | ComparePatternsCommand
  | ShowIntervalsCommand
  | SetViewCommand
  | SetEmphasisCommand
  | ClearViewCommand
  | ResolveShapeCommand
  | SetAiModeCommand
  | StartExerciseCommand
  | SubmitExerciseCommand
  | SelectNoteCommand
  | DeselectNoteCommand;