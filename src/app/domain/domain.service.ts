import { Injectable, signal, inject } from '@angular/core';
import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand } from './commands';
import { DomainQuery, GetPatternDetailsResult, KeyAnalysis } from './queries';
import { DomainState, DomainResult, DomainError, DEFAULT_DOMAIN_STATE } from './state';
import { DomainValidator } from './domain-validator';
import { ExerciseService } from './exercise.service';
import { ExerciseValidatorService } from '../services/exercise-validator.service';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { FretboardNotePositionService } from '../services/note.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { TonalFacadeService, PatternType } from '../services/tonal-facade.service';
import { PatternInfo } from '../shared/model/patternInfo';
import { ShapeResolverService } from '../services/shape-resolver.service';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';

/** Reverse map: Tonal interval name (e.g., '3M') → UI symbol (e.g., '3'). */
const TONAL_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  INTERVAL_CONFIG.map(i => [i.tonalName, i.symbol])
);

/**
 * DomainService — central facade for the domain contract.
 *
 * Accepts DomainCommand (user intents) and DomainQuery (read requests).
 * Validates inputs via DomainValidator, delegates to existing application services,
 * and maintains immutable DomainState via signal.
 *
 * Both Toolbox and AI use this same service.
 * Commands are dispatched via switch on the discriminant type field.
 * Exercise commands are delegated to ExerciseService.
 */
@Injectable({ providedIn: 'root' })
export class DomainService {
  private orchestration = inject(FretboardOrchestrationService);
  private patternBuilder = inject(PatternBuilderService);
  private tonalFacade = inject(TonalFacadeService);
  private noteService = inject(FretboardNotePositionService);
  private shapeResolver = inject(ShapeResolverService);
  private exerciseService = inject(ExerciseService);
  private exerciseValidator = inject(ExerciseValidatorService);

  private stateSignal = signal<DomainState>(DEFAULT_DOMAIN_STATE);

  /** Current state snapshot. */
  readonly currentState = this.stateSignal.asReadonly();
  /** Saved marker display mode to restore after Compare mode. */
  private previousMarkerDisplayMode: DomainState['markerDisplayMode'] = 'interval-colors';

  // ─── Commands ───────────────────────────────────────────────────────

  execute(command: DomainCommand): DomainResult<DomainState> {
    console.log('execute command', command);
    switch (command.type) {
      case 'show-pattern':     return this.handleShowPattern(command);
      case 'show-intervals':   return this.handleShowIntervals(command);
      case 'compare-patterns': return this.handleComparePatterns(command);
      case 'set-view':         return this.handleSetView(command);
      case 'set-emphasis':     return this.handleSetEmphasis(command);
      case 'clear-view':       return this.handleClearView();
      case 'resolve-shape':    return this.handleResolveShape(command);
      case 'set-ai-mode':      return this.handleSetAiMode(command);
      case 'start-exercise':   return this.delegateExercise(this.exerciseService.startExercise(command, this.currentState()));
      case 'submit-exercise':  return this.delegateExercise(this.exerciseService.submitExercise(this.currentState(), this.exerciseValidator));
      case 'select-note':      return this.delegateExercise(this.exerciseService.selectNote(command, this.currentState()));
      case 'deselect-note':    return this.delegateExercise(this.exerciseService.deselectNote(command, this.currentState()));
      default: return {
        success: false,
        error: DomainError.UNKNOWN_COMMAND,
        message: `Unknown command type: ${(command as DomainCommand).type}`,
      };
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────

  query<T = unknown>(query: DomainQuery): DomainResult<T> {
    console.log('execute query', query);
    switch (query.type) {
      case 'get-current-view':
        return { success: true as const, data: this.currentState() } as DomainResult<T>;
      case 'get-available-patterns':
        return {
          success: true as const,
          data: {
            scales: SCALE_PATTERNS.map(p => p.name),
            chords: CHORD_PATTERNS.map(p => p.name),
          },
        } as DomainResult<T>;
      case 'get-pattern-details': return this.handleGetPatternDetails(query) as DomainResult<T>;
      case 'detect-chord':        return this.handleDetectChord(query) as DomainResult<T>;
      case 'detect-scale':        return this.handleDetectScale(query) as DomainResult<T>;
      case 'get-key-analysis':    return this.handleGetKeyAnalysis(query) as DomainResult<T>;
      case 'get-available-shapes': return this.handleGetAvailableShapes(query) as DomainResult<T>;
      case 'resolve-shape-query': return this.handleResolveShapeQuery(query) as DomainResult<T>;
      default: return {
        success: false,
        error: DomainError.UNKNOWN_COMMAND,
        message: `Unknown query type: ${(query as DomainQuery).type}`,
      } as DomainResult<T>;
    }
  }

  // ─── Command handlers ────────────────────────────────────────────────

  private handleShowPattern(command: DomainCommand & { type: 'show-pattern' }): DomainResult<DomainState> {
    const { patternType, patternName, rootNote } = command;

    const err = DomainValidator.validatePattern(patternName, patternType)
      ?? DomainValidator.validateRootNote(rootNote)
      ?? DomainValidator.validateFretRange(command.fretRange);
    if (err) return err;

    if (patternType === 'scale') {
      this.orchestration.displayScale(patternName, rootNote);
    } else {
      this.orchestration.displayChord(patternName, rootNote);
    }

    this.patternBuilder.setCurrentPattern(patternName, rootNote, patternType);
    this.patternBuilder.relatedChord.set(null); // clear stale relatedChord from compare mode

    return this.emitState({
      ...this.currentState(),
      mode: patternType === 'scale' ? 'scale' : 'chord',
      displayMode: 'legend',
      rootNote,
      patternName,
      compareTarget: undefined,
      emphasis: command.emphasis ?? this.currentState().emphasis,
      fretRange: command.fretRange ?? this.currentState().fretRange,
      markerDisplayMode: this.previousMarkerDisplayMode, // restore saved mode from compare
      shapeInfo: undefined,
    });
  }

  private handleShowIntervals(command: DomainCommand & { type: 'show-intervals' }): DomainResult<DomainState> {
    return this.applyShowIntervals(command.rootNote, command.intervals);
  }

  /**
   * Core logic for showing intervals — shared by both show-interval and show-intervals commands.
   * Validates, deduplicates, computes notes via Tonal.js, and displays in one call.
   */
  private applyShowIntervals(rootNote: string, intervals: string[]): DomainResult<DomainState> {
    const err = DomainValidator.validateRootNote(rootNote)
      ?? DomainValidator.validateIntervals(intervals);
    if (err) return err;

    // Deduplicate preserving first-occurrence order
    const uniqueIntervals = [...new Set(intervals)];

    // Compute notes via Tonal.js for proper enharmonic spelling
    const notes = uniqueIntervals.map(interval => {
      const config = INTERVAL_CONFIG.find(i => i.symbol === interval)!;
      return this.tonalFacade.transposeNote(rootNote, config.tonalName);
    });

    // Display root + all computed notes in a single call
    this.orchestration.displayCustomPattern([rootNote, ...notes], rootNote);

    return this.emitState({
      ...this.currentState(),
      mode: 'custom',
      displayMode: 'legend',
      rootNote,
      patternName: `intervals-${uniqueIntervals.join('-')}`,
      compareTarget: undefined,
      shapeInfo: undefined,
    });
  }

  private handleComparePatterns(command: DomainCommand & { type: 'compare-patterns' }): DomainResult<DomainState> {
    const { primary, secondary } = command;

    const err = DomainValidator.validatePattern(primary.patternName, primary.patternType)
      ?? DomainValidator.validatePattern(secondary.patternName, secondary.patternType)
      ?? DomainValidator.validateRootNote(primary.rootNote)
      ?? DomainValidator.validateRootNote(secondary.rootNote);
    if (err) return err;

    this.orchestration.displayScaleWithChord(
      primary.patternName, primary.rootNote,
      secondary.patternName, secondary.rootNote,
    );

    this.patternBuilder.setCurrentPattern(primary.patternName, primary.rootNote, primary.patternType);
    this.patternBuilder.setRelatedChord(secondary.patternName, secondary.rootNote);

    // Save current marker display mode and force note-names for compare mode
    this.previousMarkerDisplayMode = this.currentState().markerDisplayMode;

    return this.emitState({
      ...this.currentState(),
      mode: 'scale-chord',
      displayMode: 'relationship',
      rootNote: primary.rootNote,
      patternName: primary.patternName,
      compareTarget: {
        rootNote: secondary.rootNote,
        patternName: secondary.patternName,
        patternType: secondary.patternType,
      },
      markerDisplayMode: 'note-names',
      shapeInfo: undefined,
    });
  }

  private handleSetView(command: DomainCommand & { type: 'set-view' }): DomainResult<DomainState> {
    return this.emitState({
      ...this.currentState(),
      fretRange: command.fretRange ?? this.currentState().fretRange,
      enabledStrings: command.enabledStrings ?? this.currentState().enabledStrings,
      markerDisplayMode: command.markerDisplayMode ?? this.currentState().markerDisplayMode,
    });
  }

  private handleSetEmphasis(command: DomainCommand & { type: 'set-emphasis' }): DomainResult<DomainState> {
    return this.emitState({
      ...this.currentState(),
      emphasis: command.emphasis,
    });
  }

  private handleClearView(): DomainResult<DomainState> {
    this.orchestration.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    return this.emitState({
      ...DEFAULT_DOMAIN_STATE,
      enabledStrings: this.currentState().enabledStrings,
      aiModeEnabled: this.currentState().aiModeEnabled,
    });
  }

  private handleResolveShape(command: DomainCommand & { type: 'resolve-shape' }): DomainResult<DomainState> {
    const { shapeId, rootNote } = command;

    const result = this.shapeResolver.resolveShape(shapeId, rootNote);
    if (!result.success) {
      return {
        success: false,
        error: DomainError.SHAPE_NOT_FOUND,
        message: result.message ?? `Shape not found: "${shapeId}".`,
      };
    }

    // Display the resolved positions
    const guitarNotes = this.noteService.findPositionsByExactCoordinates(result.positions);
    this.orchestration.displayPositions(guitarNotes, result.rootNote);

    // Auto-fit fretRange to the resolved positions so the shape is always visible
    const fretRange = this.computeFretRangeFromPositions(result.positions);

    return this.emitState({
      ...this.currentState(),
      mode: 'positions',
      displayMode: 'legend',
      rootNote: result.rootNote ?? this.currentState().rootNote,
      patternName: shapeId,
      compareTarget: undefined,
      fretRange,
      shapeInfo: {
        shapeId,
        positions: result.positions.map(p => ({
          string: p.string,
          fret: p.fret,
          label: p.label,
        })),
      },
    });
  }

  private handleSetAiMode(command: DomainCommand & { type: 'set-ai-mode' }): DomainResult<DomainState> {
    return this.emitState({
      ...this.currentState(),
      aiModeEnabled: command.enabled,
    });
  }

  // ─── Query handlers ──────────────────────────────────────────────────

  private handleGetPatternDetails(query: { type: 'get-pattern-details'; patternType: PatternType; patternName: string; rootNote: string }): DomainResult<GetPatternDetailsResult> {
    const { patternType, patternName, rootNote } = query;

    const err = DomainValidator.validatePattern(patternName, patternType)
      ?? DomainValidator.validateRootNote(rootNote);
    if (err) return err;

    const resolved = this.tonalFacade.resolvePattern(patternName, rootNote, patternType);
    if (resolved.simplified.length === 0) {
      return {
        success: false,
        error: DomainError.EMPTY_RESULT,
        message: `Pattern "${patternName}" resolved to no notes for root "${rootNote}"`,
      };
    }

    const patterns = patternType === 'scale' ? SCALE_PATTERNS : CHORD_PATTERNS;
    const pattern = patterns.find(p => p.name === patternName);

    const details: PatternInfo = {
      name: patternName,
      rootNote,
      type: patternType,
      notes: resolved.simplified,
      intervals: resolved.raw.map(n => this.tonalFacade.intervalBetween(rootNote, n)),
      semitones: pattern?.intervals ?? [],
      steps: [],
    };

    return { success: true, data: details };
  }

  private handleDetectChord(query: { type: 'detect-chord'; notes: string[] }): DomainResult<{ chords: string[] }> {
    if (!query.notes || query.notes.length === 0) {
      return { success: false, error: DomainError.EMPTY_RESULT, message: 'No notes provided for chord detection.' };
    }
    const chords = this.tonalFacade.detectChord(query.notes);
    return { success: true, data: { chords } };
  }

  private handleDetectScale(query: { type: 'detect-scale'; notes: string[]; tonic?: string; match?: 'exact' | 'fit' }): DomainResult<{ scales: string[] }> {
    if (!query.notes || query.notes.length === 0) {
      return { success: false, error: DomainError.EMPTY_RESULT, message: 'No notes provided for scale detection.' };
    }
    const scales = this.tonalFacade.detectScale(query.notes, query.tonic, query.match);
    return { success: true, data: { scales } };
  }

  private handleGetKeyAnalysis(query: { type: 'get-key-analysis'; tonic: string; mode: 'major' | 'minor' }): DomainResult<KeyAnalysis> {
    const err = DomainValidator.validateRootNote(query.tonic);
    if (err) return err;

    if (query.mode === 'major') {
      const analysis = this.tonalFacade.getMajorKey(query.tonic);
      const keyAnalysis: KeyAnalysis = {
        tonic: query.tonic,
        mode: 'major',
        scale: [...analysis.scale],
        triads: [...analysis.triads],
        chords: [...analysis.chords],
        secondaryDominants: analysis.secondaryDominants ? [...analysis.secondaryDominants] : undefined,
      };
      return { success: true, data: keyAnalysis };
    }

    const analysis = this.tonalFacade.getMinorKey(query.tonic);
    const keyAnalysis: KeyAnalysis = {
      tonic: query.tonic,
      mode: 'minor',
      scale: analysis.natural ? [...analysis.natural.scale] : [],
      triads: analysis.natural ? [...analysis.natural.chords] : [],
      chords: analysis.harmonic ? [...analysis.harmonic.chords] : [],
    };
    return { success: true, data: keyAnalysis };
  }

  private handleGetAvailableShapes(query: { type: 'get-available-shapes'; category?: string }): DomainResult<{ shapes: Array<{ id: string; name: string; category: string }> }> {
    const shapes = this.shapeResolver.getAvailableShapes(query.category);
    return { success: true, data: { shapes } };
  }

  private handleResolveShapeQuery(query: { type: 'resolve-shape-query'; shapeId: string; rootNote?: string }): DomainResult<{ positions: Array<{ string: number; fret: number; label?: string }> }> {
    const result = this.shapeResolver.resolveShape(query.shapeId, query.rootNote);
    if (!result.success) {
      return { success: false, error: DomainError.SHAPE_NOT_FOUND, message: result.message ?? `Shape not found: "${query.shapeId}".` };
    }
    return { success: true, data: { positions: result.positions } };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private emitState(newState: DomainState): DomainResult<DomainState> {
    this.stateSignal.set(newState);
    return { success: true, data: newState };
  }

  /** Delegate to ExerciseService and emit state if successful. */
  private delegateExercise(result: DomainResult<DomainState>): DomainResult<DomainState> {
    if (!result.success) return result;
    this.stateSignal.set(result.data);
    return result;
  }

  /** Compute a fretRange that fits all given positions with ±1 fret padding. */
  private computeFretRangeFromPositions(
    positions: Array<{ string: number; fret: number }>,
  ): { min: number; max: number } {
    if (positions.length === 0) return this.currentState().fretRange;
    const frets = positions.map(p => p.fret);
    const min = Math.max(0, Math.min(...frets) - 1);
    const max = Math.min(neckConfig.numberOfFrets, Math.max(...frets) + 1);
    return { min, max };
  }
}