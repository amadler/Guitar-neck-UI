import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainResult, DomainError, DomainState } from './state';
import { PatternType } from '../services/tonal-facade.service';
import { INTERVAL_SEMITONE_MAP } from '../shared/tonal-adapter';

/**
 * DomainValidator — stateless validation helpers.
 * Each method returns DomainResult on failure, or null on success.
 * Keeps DomainService handlers clean and short.
 */
export class DomainValidator {
  static validatePattern(name: string, type: PatternType): DomainResult<never> | null {
    const patterns = type === 'scale' ? SCALE_PATTERNS : CHORD_PATTERNS;
    if (!patterns.some(p => p.name === name)) {
      return {
        success: false,
        error: DomainError.PATTERN_NOT_FOUND,
        message: `Unknown ${type}: "${name}". Available ${type}s: ${patterns.map(p => p.name).join(', ')}`,
      };
    }
    return null;
  }

  static validateRootNote(note: string): DomainResult<never> | null {
    if (!neckConfig.chromaticNotes.includes(note)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${note}". Valid notes: ${neckConfig.chromaticNotes.join(', ')}`,
      };
    }
    return null;
  }

  static validateFretRange(range: { min: number; max: number } | undefined): DomainResult<never> | null {
    if (!range) return null;
    const { min, max } = range;
    if (min < 0 || max > 24 || min > max) {
      return {
        success: false,
        error: DomainError.INVALID_FRET_RANGE,
        message: `Invalid fret range: ${min}-${max}. Valid range: 0-24, min <= max.`,
      };
    }
    return null;
  }

  static validateInterval(interval: string): { semitone: number; error?: DomainResult<never> } {
    const semitone = INTERVAL_SEMITONE_MAP[interval];
    if (semitone === undefined) {
      return {
        semitone: -1,
        error: {
          success: false,
          error: DomainError.INVALID_INTERVAL,
          message: `Invalid interval: "${interval}". Valid intervals: ${Object.keys(INTERVAL_SEMITONE_MAP).join(', ')}`,
        },
      };
    }
    return { semitone };
  }

  /** Validate string index (1-6). */
  static validateStringIndex(string: number): DomainResult<never> | null {
    if (!Number.isInteger(string) || string < 1 || string > 6) {
      return {
        success: false,
        error: DomainError.INVALID_POSITION,
        message: `Invalid string: ${string}. Valid strings: 1-6.`,
      };
    }
    return null;
  }

  /** Validate fret number (0-24). */
  static validateFret(fret: number): DomainResult<never> | null {
    if (!Number.isInteger(fret) || fret < 0 || fret > 24) {
      return {
        success: false,
        error: DomainError.INVALID_POSITION,
        message: `Invalid fret: ${fret}. Valid frets: 0-24.`,
      };
    }
    return null;
  }

  /** Validate a single position (string + fret). */
  static validatePosition(string: number, fret: number): DomainResult<never> | null {
    const stringErr = this.validateStringIndex(string);
    if (stringErr) return stringErr;
    const fretErr = this.validateFret(fret);
    if (fretErr) return fretErr;
    return null;
  }

  /** Validate that a note actually sounds at the given (string, fret) position. */
  static validateNoteAtPosition(
    string: number,
    fret: number,
    expectedNote: string,
    getNoteAtPosition: (string: number, fret: number) => string | null,
  ): DomainResult<never> | null {
    const posErr = this.validatePosition(string, fret);
    if (posErr) return posErr;

    const actualNote = getNoteAtPosition(string, fret);
    if (actualNote === null) {
      return {
        success: false,
        error: DomainError.INVALID_POSITION,
        message: `Position (string ${string}, fret ${fret}) is out of range.`,
      };
    }

    // Compare by chroma (pitch class) for enharmonic safety
    const chromaMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'Fb': 4, 'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10,
      'B': 11, 'Cb': 11,
    };
    const expectedChroma = chromaMap[expectedNote];
    const actualChroma = chromaMap[actualNote];
    if (expectedChroma === undefined || actualChroma === undefined || expectedChroma !== actualChroma) {
      return {
        success: false,
        error: DomainError.POSITION_NOTE_MISMATCH,
        message: `Note "${expectedNote}" does not sound at string ${string}, fret ${fret}. Found: "${actualNote}".`,
      };
    }
    return null;
  }

  /** Validate that an exercise task has valid parameters. */
  static validateExerciseTask(
    rootNote: string,
    expectedIntervals: string[],
  ): DomainResult<never> | null {
    const rootErr = this.validateRootNote(rootNote);
    if (rootErr) return rootErr;

    if (!expectedIntervals || expectedIntervals.length === 0) {
      return {
        success: false,
        error: DomainError.INVALID_INTERVAL,
        message: 'Expected intervals must be a non-empty array.',
      };
    }

    for (const interval of expectedIntervals) {
      const { error } = this.validateInterval(interval);
      if (error) return error;
    }

    return null;
  }

  /** Validate that an exercise is currently active. */
  static validateExerciseActive(state: DomainState): DomainResult<never> | null {
    if (!state.exerciseMode || !state.exerciseTask) {
      return {
        success: false,
        error: DomainError.NO_ACTIVE_EXERCISE,
        message: 'No active exercise. Use start-exercise first.',
      };
    }
    return null;
  }

}