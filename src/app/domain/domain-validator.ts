import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainResult, DomainError } from './state';
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
}