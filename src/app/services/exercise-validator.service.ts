import { Injectable, inject } from '@angular/core';
import { TonalFacadeService } from './tonal-facade.service';
import { SelectedNotePosition, ExerciseResult } from '../domain/state';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';

/**
 * Reverse map: Tonal interval name (e.g., '3M') → UI symbol (e.g., '3').
 * Built from INTERVAL_CONFIG which is the single source of truth.
 */
const TONAL_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  INTERVAL_CONFIG.map(i => [i.tonalName, i.symbol])
);

/**
 * ExerciseValidatorService — validates user's selected notes against expected intervals.
 *
 * Uses TonalFacadeService for interval calculation (the only allowed Tonal.js importer).
 * Returns raw data only — the agent decides how to comment.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseValidatorService {
  private tonalFacade = inject(TonalFacadeService);

  /**
   * Validate selected notes against expected intervals from a root note.
   *
   * @param selectedNotes - Notes the user clicked on the fretboard.
   * @param rootNote - The reference note for interval calculation.
   * @param expectedIntervals - Valid interval symbols (e.g., ['5'], ['1', 'b3']).
   * @returns ExerciseResult with per-note correctness — no hardcoded text.
   */
  validate(
    selectedNotes: SelectedNotePosition[],
    rootNote: string,
    expectedIntervals: string[],
    expectedPositions?: Array<{ string: number; fret: number }>,
  ): ExerciseResult {
    const correct: boolean[] = [];
    let correctCount = 0;
    let incorrectCount = 0;

    for (const note of selectedNotes) {
      // Calculate interval from root to selected note using Tonal
      const tonalInterval = this.tonalFacade.intervalBetween(rootNote, note.note);
      // Map Tonal interval name (e.g., '3M') to UI symbol (e.g., '3')
      const symbol = TONAL_TO_SYMBOL[tonalInterval] ?? '';
      const isCorrect = expectedIntervals.includes(symbol);
      correct.push(isCorrect);
      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }

    // Check completeness: did the user find ALL expected positions?
    let missingCount: number | undefined;
    let missingPositions: Array<{ string: number; fret: number }> | undefined;

    if (expectedPositions && expectedPositions.length > 0) {
      const selectedSet = new Set(
        selectedNotes.map(n => `${n.string},${n.fret}`)
      );
      missingPositions = expectedPositions.filter(
        p => !selectedSet.has(`${p.string},${p.fret}`)
      );
      missingCount = missingPositions.length;
    }

    return {
      correct,
      selectedNotes,
      correctCount,
      incorrectCount,
      missingCount,
      missingPositions,
    };
  }
}