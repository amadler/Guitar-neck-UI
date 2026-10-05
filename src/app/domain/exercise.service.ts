import { Injectable, inject } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { DomainState, DomainResult, DomainError, ExerciseTask, ExerciseResult } from './state';
import { DomainValidator } from './domain-validator';
import { StartExerciseCommand, SelectNoteCommand, DeselectNoteCommand } from './commands';
import { TonalFacadeService } from '../services/tonal-facade.service';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { ExerciseValidatorService } from '../services/exercise-validator.service';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';

/** Reverse map: Tonal interval name (e.g., '3M') → UI symbol (e.g., '3'). */
const TONAL_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  INTERVAL_CONFIG.map(i => [i.tonalName, i.symbol])
);

/**
 * ExerciseService — handles exercise-related domain commands.
 *
 * This service has NO state of its own. It receives the current DomainState,
 * performs validation and logic, and returns a new DomainState for the
 * DomainService to emit.
 *
 * DomainService delegates exercise commands here, keeping the exercise
 * logic separate from the fretboard view logic.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private tonalFacade = inject(TonalFacadeService);
  private orchestration = inject(FretboardOrchestrationService);

  /**
   * Start an exercise — validates, computes expected positions, clears the fretboard.
   */
  startExercise(
    command: StartExerciseCommand,
    currentState: DomainState,
  ): DomainResult<DomainState> {
    const { question, rootNote, expectedIntervals, showIntervals, fretRange, enabledStrings } = command;

    const err = DomainValidator.validateExerciseTask(rootNote, expectedIntervals)
      ?? DomainValidator.validateFretRange(fretRange);
    if (err) return err;

    const range = fretRange ?? currentState.fretRange;
    const strings = enabledStrings ?? currentState.enabledStrings;

    // Compute expected positions for completeness checking
    const expectedPositions = this.computeExpectedPositions(
      rootNote,
      expectedIntervals,
      range,
      strings,
    );

    // Compute reference positions for visual markers (if requested)
    let referencePositions: Array<{ string: number; fret: number }> | undefined;
    if (showIntervals && showIntervals.length > 0) {
      referencePositions = this.displayReferenceIntervals(rootNote, showIntervals, range, strings);
    }

    const task: ExerciseTask = {
      question,
      rootNote,
      expectedIntervals,
      showIntervals,
      referencePositions,
      fretRange: range,
      enabledStrings: strings,
      expectedPositions,
    };

    // Clear the fretboard so no old markers show during exercise
    this.orchestration.clearFretboard();

    // Display reference intervals on the fretboard (after clearing)
    if (referencePositions) {
      this.displayReferenceIntervalsOnFretboard(rootNote, showIntervals!);
    }

    return {
      success: true,
      data: {
        ...currentState,
        exerciseMode: true,
        exerciseTask: task,
        selectedNotes: [],
        lastExerciseResult: undefined,
        fretRange: range,
        enabledStrings: strings,
      },
    };
  }

  /**
   * Submit the current exercise for validation.
   */
  submitExercise(
    currentState: DomainState,
    exerciseValidator: ExerciseValidatorService,
  ): DomainResult<DomainState> {
    const activeErr = DomainValidator.validateExerciseActive(currentState);
    if (activeErr) return activeErr;

    const task = currentState.exerciseTask!;
    const notes = currentState.selectedNotes ?? [];

    const result: ExerciseResult = exerciseValidator.validate(
      notes,
      task.rootNote,
      task.expectedIntervals,
      task.expectedPositions,
    );

    // Clear the fretboard to remove reference markers
    this.orchestration.clearFretboard();

    // Reset exercise mode, store result, keep selectedNotes for agent to inspect
    return {
      success: true,
      data: {
        ...currentState,
        exerciseMode: false,
        exerciseTask: undefined,
        lastExerciseResult: result,
      },
    };
  }

  /**
   * Select a note on the fretboard during an exercise.
   */
  selectNote(
    command: SelectNoteCommand,
    currentState: DomainState,
  ): DomainResult<DomainState> {
    const { note, string, fret } = command;

    const err = DomainValidator.validateExerciseActive(currentState)
      ?? DomainValidator.validatePosition(string, fret);
    if (err) return err;

    const currentNotes = currentState.selectedNotes ?? [];

    // Avoid duplicates — same (string, fret) can't be selected twice
    if (currentNotes.some(n => n.string === string && n.fret === fret)) {
      return { success: true, data: currentState };
    }

    return {
      success: true,
      data: {
        ...currentState,
        selectedNotes: [...currentNotes, { note, string, fret }],
      },
    };
  }

  /**
   * Deselect a note on the fretboard during an exercise.
   */
  deselectNote(
    command: DeselectNoteCommand,
    currentState: DomainState,
  ): DomainResult<DomainState> {
    const { string, fret } = command;

    const err = DomainValidator.validateExerciseActive(currentState);
    if (err) return err;

    const currentNotes = currentState.selectedNotes ?? [];

    return {
      success: true,
      data: {
        ...currentState,
        selectedNotes: currentNotes.filter(n => !(n.string === string && n.fret === fret)),
      },
    };
  }

  /**
   * Compute all positions in the given fret range and enabled strings
   * that match the expected intervals from the root note.
   * Used for completeness checking in exercises.
   */
  private computeExpectedPositions(
    rootNote: string,
    expectedIntervals: string[],
    fretRange: { min: number; max: number },
    enabledStrings: boolean[],
  ): Array<{ string: number; fret: number }> {
    const positions: Array<{ string: number; fret: number }> = [];
    const { chromaticNotes, stringNotes } = neckConfig;

    for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
      if (!enabledStrings[stringIdx]) continue;
      const openNote = stringNotes[stringIdx];

      for (let fret = fretRange.min; fret <= fretRange.max; fret++) {
        const openIdx = chromaticNotes.indexOf(openNote);
        const noteIdx = (openIdx + fret) % chromaticNotes.length;
        const noteName = chromaticNotes[noteIdx];

        // Calculate interval from root to this note
        const tonalInterval = this.tonalFacade.intervalBetween(rootNote, noteName);
        // Map Tonal interval to UI symbol
        const symbol = TONAL_TO_SYMBOL[tonalInterval] ?? '';
        if (expectedIntervals.includes(symbol)) {
          positions.push({ string: stringIdx + 1, fret });
        }
      }
    }

    return positions;
  }

  /**
   * Compute reference interval positions for click prevention.
   * Uses the same logic as computeExpectedPositions but for showIntervals.
   */
  private displayReferenceIntervals(
    rootNote: string,
    intervals: string[],
    fretRange: { min: number; max: number },
    enabledStrings: boolean[],
  ): Array<{ string: number; fret: number }> {
    return this.computeExpectedPositions(rootNote, intervals, fretRange, enabledStrings);
  }

  /**
   * Display reference intervals on the fretboard as visual markers.
   * Uses displayCustomPattern to show root + all reference notes with interval annotations.
   */
  private displayReferenceIntervalsOnFretboard(
    rootNote: string,
    intervals: string[],
  ): void {
    // Compute notes from intervals via TonalFacade for proper enharmonic spelling
    const notes = intervals.map(interval => {
      const config = INTERVAL_CONFIG.find(i => i.symbol === interval)!;
      return this.tonalFacade.transposeNote(rootNote, config.tonalName);
    });

    // Display root + all computed notes in a single call
    this.orchestration.displayCustomPattern([rootNote, ...notes], rootNote);
  }
}