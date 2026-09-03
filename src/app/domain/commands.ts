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
 * Show a single interval from a root note on the fretboard.
 * Uses displayCustomPattern internally with proper enharmonic spelling.
 */
export interface ShowIntervalCommand {
  type: 'show-interval';
  rootNote: string;
  interval: string; // e.g., 'b3', '3', '5', 'b7'
}

/**
 * Clear the fretboard, reset state to default.
 */
export interface ClearViewCommand {
  type: 'clear-view';
}

/**
 * A domain command expresses a user intent to change the fretboard view.
 * It does NOT describe how to mutate state — that mapping is the responsibility of DomainService.
 */
export type DomainCommand =
  | ShowPatternCommand
  | ComparePatternsCommand
  | ShowIntervalCommand
  | SetViewCommand
  | SetEmphasisCommand
  | ClearViewCommand;