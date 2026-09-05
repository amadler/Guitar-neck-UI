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

// ─── Nowe komendy semantyczne ─────────────────────────────────────────

/**
 * Show a chord voicing on specific strings with optional inversion/spread.
 * AI opisuje intencję muzyczną, aplikacja oblicza pozycje.
 */
export interface ShowVoicingCommand {
  type: 'show-voicing';
  chordType: string;           // 'maj7', 'min', 'dim' — istniejące nazwy
  rootNote: string;            // 'C', 'F#'
  voicing: {
    stringSet: number[];       // które struny (np. [5,4,3])
    inversion?: number;        // 0=root, 1=1st, 2=2nd
    spread?: boolean;          // rozproszony bas?
    omit?: string[];           // które nuty pominąć (np. ['5'])
  };
  fretRange?: { min: number; max: number };
}

/**
 * Show an arpeggio pattern — sequence of intervals on specific strings.
 */
export interface ShowArpeggioCommand {
  type: 'show-arpeggio';
  chordType: string;           // 'Am', 'Cmajor7'
  rootNote: string;
  pattern: string[];           // sekwencja interwałowa: ['root', '3', '5', '3', 'root']
  strings: number[];           // na których strunach grać
  fretRange?: { min: number; max: number };
}

/**
 * Show a lick — specific notes at specific positions.
 * Każda pozycja jest walidowana: string (1-6), fret (0-24), zgodność nuty.
 */
export interface ShowLickCommand {
  type: 'show-lick';
  notes: Array<{
    note: string;              // nazwa nuty: 'C', 'E', 'G'
    string: number;            // struna 1-6
    fret?: number;             // opcjonalnie: konkretny próg
  }>;
  rootNote?: string;           // dla oznaczeń interwałowych
  label?: string;              // 'Am spread arpeggio'
}

/**
 * Resolve a named shape (cowboy chord, barre, triad inversion) to positions.
 * Uses the shape registry.
 */
export interface ResolveShapeCommand {
  type: 'resolve-shape';
  shapeId: string;              // np. 'cowboy-C', 'barre-E-form'
  rootNote?: string;            // dla movable shapes
  position?: number;            // fret position (0 = open)
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
  | ClearViewCommand
  | ShowVoicingCommand
  | ShowArpeggioCommand
  | ShowLickCommand
  | ResolveShapeCommand;