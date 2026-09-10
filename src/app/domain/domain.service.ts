import { Injectable, signal, inject } from '@angular/core';
import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand } from './commands';
import { DomainQuery, GetPatternDetailsResult, KeyAnalysis } from './queries';
import { DomainState, DomainResult, DomainError, DEFAULT_DOMAIN_STATE } from './state';
import { DomainValidator } from './domain-validator';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { FretboardNotePositionService } from '../services/note.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { TonalFacadeService, PatternType } from '../services/tonal-facade.service';
import { PatternInfo } from '../shared/model/patternInfo';
import { spellNote } from '../shared/note-utils';
import { ShapeResolverService } from '../services/shape-resolver.service';

// Handler types use `any` for the registry parameter because the narrowing
// happens inside each handler via the `& { type: ... }` intersection.
// The execute/query methods provide the type-safe entry point.
type CommandHandler = (command: any) => DomainResult<DomainState>;
type QueryHandler = (query: any) => DomainResult<any>;

/**
 * DomainService — central facade for the domain contract.
 *
 * Accepts DomainCommand (user intents) and DomainQuery (read requests).
 * Validates inputs via DomainValidator, delegates to existing application services,
 * and maintains immutable DomainState via signal.
 *
 * Both Toolbox and AI use this same service.
 * Commands are dispatched via Registry Pattern — no switch/if-else chains.
 */
@Injectable({ providedIn: 'root' })
export class DomainService {
  private orchestration = inject(FretboardOrchestrationService);
  private patternBuilder = inject(PatternBuilderService);
  private tonalFacade = inject(TonalFacadeService);
  private noteService = inject(FretboardNotePositionService);
  private shapeResolver = inject(ShapeResolverService);

  private stateSignal = signal<DomainState>(DEFAULT_DOMAIN_STATE);

  /** Current state snapshot. */
  readonly currentState = this.stateSignal.asReadonly();
  /** Saved marker display mode to restore after Compare mode. */
  private previousMarkerDisplayMode: DomainState['markerDisplayMode'] = 'interval-colors';

  private commandHandlers = new Map<string, CommandHandler>();
  private queryHandlers = new Map<string, QueryHandler>();

  constructor() {
    this.registerCommandHandlers();
    this.registerQueryHandlers();
  }

  // ─── Registry ─────────────────────────────────────────────────────────

  private registerCommandHandlers(): void {
    this.commandHandlers.set('show-pattern', (c) => this.handleShowPattern(c));
    this.commandHandlers.set('show-interval', (c) => this.handleShowInterval(c));
    this.commandHandlers.set('compare-patterns', (c) => this.handleComparePatterns(c));
    this.commandHandlers.set('set-view', (c) => this.handleSetView(c));
    this.commandHandlers.set('set-emphasis', (c) => this.handleSetEmphasis(c));
    this.commandHandlers.set('clear-view', (_c) => this.handleClearView());
    this.commandHandlers.set('resolve-shape', (c) => this.handleResolveShape(c));
    this.commandHandlers.set('set-ai-mode', (c) => this.handleSetAiMode(c));
  }

  private registerQueryHandlers(): void {
    this.queryHandlers.set('get-current-view', (_q) => ({ success: true as const, data: this.currentState() }));
    this.queryHandlers.set('get-available-patterns', (_q) => ({
      success: true as const,
      data: {
        scales: SCALE_PATTERNS.map(p => p.name),
        chords: CHORD_PATTERNS.map(p => p.name),
      },
    }));
    this.queryHandlers.set('get-pattern-details', (q) => this.handleGetPatternDetails(q));
    this.queryHandlers.set('detect-chord', (q) => this.handleDetectChord(q));
    this.queryHandlers.set('detect-scale', (q) => this.handleDetectScale(q));
    this.queryHandlers.set('get-key-analysis', (q) => this.handleGetKeyAnalysis(q));
    this.queryHandlers.set('get-available-shapes', (q) => this.handleGetAvailableShapes(q));
    this.queryHandlers.set('resolve-shape-query', (q) => this.handleResolveShapeQuery(q));
  }

  // ─── Commands ───────────────────────────────────────────────────────

  execute(command: DomainCommand): DomainResult<DomainState> {
    const handler = this.commandHandlers.get(command.type);
    if (!handler) {
      return {
        success: false,
        error: DomainError.UNKNOWN_COMMAND,
        message: `Unknown command type: ${(command as any).type}`,
      };
    }
    return handler(command);
  }

  // ─── Queries ─────────────────────────────────────────────────────────

  query<T = unknown>(query: DomainQuery): DomainResult<T> {
    const handler = this.queryHandlers.get(query.type);
    if (!handler) {
      return {
        success: false,
        error: DomainError.UNKNOWN_COMMAND,
        message: `Unknown query type: ${(query as any).type}`,
      };
    }
    return handler(query) as DomainResult<T>;
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

  private handleShowInterval(command: DomainCommand & { type: 'show-interval' }): DomainResult<DomainState> {
    const { rootNote, interval } = command;

    const err = DomainValidator.validateRootNote(rootNote);
    if (err) return err;

    const { semitone, error } = DomainValidator.validateInterval(interval);
    if (error) return error;

    const note = spellNote(rootNote, semitone, interval);
    this.orchestration.displayCustomPattern([rootNote, note], rootNote);

    return this.emitState({
      ...this.currentState(),
      mode: 'custom',
      displayMode: 'legend',
      rootNote,
      patternName: `interval-${interval}`,
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

  // ─── Nowe query handlers ────────────────────────────────────────────

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
