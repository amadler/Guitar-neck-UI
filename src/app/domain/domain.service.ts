import { Injectable, signal, inject } from '@angular/core';
import { SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand } from './commands';
import { DomainQuery, GetPatternDetailsResult } from './queries';
import { DomainState, DomainResult, DomainError, DEFAULT_DOMAIN_STATE } from './state';
import { DomainValidator } from './domain-validator';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { FretboardNotePositionService } from '../services/note.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { TonalFacadeService, PatternType } from '../services/tonal-facade.service';
import { PatternInfo } from '../shared/model/patternInfo';
import { spellNote } from '../shared/note-utils';
import { ShapeResolverService } from '../services/shape-resolver.service';

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
    this.commandHandlers.set('show-voicing', (c) => this.handleShowVoicing(c));
    this.commandHandlers.set('show-arpeggio', (c) => this.handleShowArpeggio(c));
    this.commandHandlers.set('show-lick', (c) => this.handleShowLick(c));
    this.commandHandlers.set('resolve-shape', (c) => this.handleResolveShape(c));
  }

  private registerQueryHandlers(): void {
    this.queryHandlers.set('get-current-view', (_q) => ({ success: true as const, data: this.currentState }));
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
    });
  }

  // ─── Nowe command handlers ──────────────────────────────────────────

  private handleShowVoicing(command: DomainCommand & { type: 'show-voicing' }): DomainResult<DomainState> {
    const { chordType, rootNote, voicing } = command;

    const err = DomainValidator.validatePattern(chordType, 'chord')
      ?? DomainValidator.validateRootNote(rootNote)
      ?? DomainValidator.validateVoicing(voicing)
      ?? DomainValidator.validateFretRange(command.fretRange);
    if (err) return err;

    // Resolve chord notes
    const { simplified } = this.tonalFacade.resolvePattern(chordType, rootNote, 'chord');
    if (simplified.length === 0) {
      return { success: false, error: DomainError.EMPTY_RESULT, message: `Chord "${chordType}" resolved to no notes.` };
    }

    // Apply inversion: rotate notes
    const inversion = voicing.inversion ?? 0;
    let chordNotes = [...simplified];
    for (let i = 0; i < inversion; i++) {
      chordNotes.push(chordNotes.shift()!);
    }

    // Apply omit
    if (voicing.omit && voicing.omit.length > 0) {
      const omitSet = new Set(voicing.omit);
      chordNotes = chordNotes.filter((_, idx) => {
        const interval = idx === 0 ? 'root' : this.tonalFacade.intervalBetween(rootNote, chordNotes[idx]);
        return !omitSet.has(interval);
      });
    }

    // Find positions on the specified strings within fretRange
    const range = command.fretRange ?? this.currentState().fretRange;
    const positions: Array<{ string: number; fret: number }> = [];

    for (let i = 0; i < voicing.stringSet.length && i < chordNotes.length; i++) {
      const string = voicing.stringSet[i];
      const targetNote = chordNotes[i];

      // Find the best fret for this note on this string within range
      const allPositions = this.noteService.findPositionsByNoteName(targetNote)
        .filter(n => n.string === string && n.fret >= range.min && n.fret <= range.max);

      if (allPositions.length === 0) {
        return {
          success: false,
          error: DomainError.EMPTY_RESULT,
          message: `Cannot find note "${targetNote}" on string ${string} in fret range ${range.min}-${range.max}.`,
        };
      }

      // Pick the lowest fret position (closest to nut)
      allPositions.sort((a, b) => a.fret - b.fret);
      positions.push({ string, fret: allPositions[0].fret });
    }

    // Apply spread: move some notes up an octave (12 frets)
    if (voicing.spread && positions.length > 1) {
      for (let i = 1; i < positions.length; i++) {
        if (positions[i].fret <= positions[i - 1].fret) {
          positions[i] = { ...positions[i], fret: positions[i].fret + 12 };
        }
      }
    }

    // Display
    const guitarNotes = this.noteService.findPositionsByExactCoordinates(positions);
    this.orchestration.displayPositions(guitarNotes, rootNote);

    return this.emitState({
      ...this.currentState(),
      mode: 'positions',
      rootNote,
      patternName: chordType,
      compareTarget: undefined,
      fretRange: command.fretRange ?? this.currentState().fretRange,
      shapeInfo: {
        positions: positions.map((p, i) => ({
          ...p,
          label: i < chordNotes.length ? this.tonalFacade.intervalBetween(rootNote, chordNotes[i]) : undefined,
        })),
      },
    });
  }

  private handleShowArpeggio(command: DomainCommand & { type: 'show-arpeggio' }): DomainResult<DomainState> {
    const { chordType, rootNote, pattern, strings } = command;

    const err = DomainValidator.validatePattern(chordType, 'chord')
      ?? DomainValidator.validateRootNote(rootNote)
      ?? DomainValidator.validateFretRange(command.fretRange);
    if (err) return err;

    // Validate strings
    for (const s of strings) {
      const strErr = DomainValidator.validateStringIndex(s);
      if (strErr) return strErr;
    }

    // Resolve chord notes
    const { simplified } = this.tonalFacade.resolvePattern(chordType, rootNote, 'chord');
    if (simplified.length === 0) {
      return { success: false, error: DomainError.EMPTY_RESULT, message: `Chord "${chordType}" resolved to no notes.` };
    }

    // Map interval names to chord notes
    const intervalMap: Record<string, string> = { root: simplified[0] };
    for (let i = 1; i < simplified.length; i++) {
      const interval = this.tonalFacade.intervalBetween(rootNote, simplified[i]);
      intervalMap[interval] = simplified[i];
    }

    // Build the arpeggio note sequence
    const arpeggioNotes: string[] = [];
    for (const step of pattern) {
      const note = intervalMap[step];
      if (!note) {
        return {
          success: false,
          error: DomainError.INVALID_INTERVAL,
          message: `Unknown interval in pattern: "${step}". Valid: ${Object.keys(intervalMap).join(', ')}`,
        };
      }
      arpeggioNotes.push(note);
    }

    // Find positions
    const range = command.fretRange ?? this.currentState().fretRange;
    const positions: Array<{ string: number; fret: number }> = [];

    for (let i = 0; i < arpeggioNotes.length && i < strings.length; i++) {
      const string = strings[i];
      const targetNote = arpeggioNotes[i];

      const allPositions = this.noteService.findPositionsByNoteName(targetNote)
        .filter(n => n.string === string && n.fret >= range.min && n.fret <= range.max);

      if (allPositions.length === 0) {
        return {
          success: false,
          error: DomainError.EMPTY_RESULT,
          message: `Cannot find note "${targetNote}" on string ${string} in fret range ${range.min}-${range.max}.`,
        };
      }

      allPositions.sort((a, b) => a.fret - b.fret);
      positions.push({ string, fret: allPositions[0].fret });
    }

    // Display
    const guitarNotes = this.noteService.findPositionsByExactCoordinates(positions);
    this.orchestration.displayPositions(guitarNotes, rootNote);

    return this.emitState({
      ...this.currentState(),
      mode: 'positions',
      rootNote,
      patternName: chordType,
      compareTarget: undefined,
      fretRange: command.fretRange ?? this.currentState().fretRange,
      shapeInfo: {
        positions: positions.map((p, i) => ({
          ...p,
          label: i < arpeggioNotes.length ? this.tonalFacade.intervalBetween(rootNote, arpeggioNotes[i]) : undefined,
        })),
      },
    });
  }

  private handleShowLick(command: DomainCommand & { type: 'show-lick' }): DomainResult<DomainState> {
    const { notes, rootNote } = command;

    // Validate each position
    for (const pos of notes) {
      const err = DomainValidator.validateStringIndex(pos.string);
      if (err) return err;

      if (pos.fret !== undefined) {
        const fretErr = DomainValidator.validateFret(pos.fret);
        if (fretErr) return fretErr;

        const noteErr = DomainValidator.validateNoteAtPosition(
          pos.string, pos.fret, pos.note,
          (s, f) => this.noteService.getNoteAtPosition(s, f),
        );
        if (noteErr) return noteErr;
      }
    }

    // Resolve positions: if fret not specified, find the best one
    const resolvedPositions: Array<{ string: number; fret: number }> = [];
    const range = this.currentState().fretRange;

    for (const pos of notes) {
      if (pos.fret !== undefined) {
        resolvedPositions.push({ string: pos.string, fret: pos.fret });
      } else {
        const allPositions = this.noteService.findPositionsByNoteName(pos.note)
          .filter(n => n.string === pos.string && n.fret >= range.min && n.fret <= range.max);

        if (allPositions.length === 0) {
          return {
            success: false,
            error: DomainError.EMPTY_RESULT,
            message: `Cannot find note "${pos.note}" on string ${pos.string} in fret range ${range.min}-${range.max}.`,
          };
        }

        allPositions.sort((a, b) => a.fret - b.fret);
        resolvedPositions.push({ string: pos.string, fret: allPositions[0].fret });
      }
    }

    // Display
    const guitarNotes = this.noteService.findPositionsByExactCoordinates(resolvedPositions);
    this.orchestration.displayPositions(guitarNotes, rootNote);

    return this.emitState({
      ...this.currentState(),
      mode: 'positions',
      rootNote: rootNote ?? this.currentState().rootNote,
      patternName: command.label ?? 'custom-lick',
      compareTarget: undefined,
      shapeInfo: {
        positions: resolvedPositions,
      },
    });
  }

  private handleResolveShape(command: DomainCommand & { type: 'resolve-shape' }): DomainResult<DomainState> {
    const { shapeId, rootNote, position } = command;

    const result = this.shapeResolver.resolveShape(shapeId, rootNote, position);
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

    return this.emitState({
      ...this.currentState(),
      mode: 'positions',
      rootNote: result.rootNote ?? this.currentState().rootNote,
      patternName: shapeId,
      compareTarget: undefined,
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

  private handleGetKeyAnalysis(query: { type: 'get-key-analysis'; tonic: string; mode: 'major' | 'minor' }): DomainResult<Record<string, unknown>> {
    const err = DomainValidator.validateRootNote(query.tonic);
    if (err) return err;

    const analysis = query.mode === 'major'
      ? this.tonalFacade.getMajorKey(query.tonic)
      : this.tonalFacade.getMinorKey(query.tonic);
    return { success: true, data: analysis as unknown as Record<string, unknown> };
  }

  private handleGetAvailableShapes(query: { type: 'get-available-shapes'; category?: string }): DomainResult<{ shapes: Array<{ id: string; name: string; category: string }> }> {
    const shapes = this.shapeResolver.getAvailableShapes(query.category);
    return { success: true, data: { shapes } };
  }

  private handleResolveShapeQuery(query: { type: 'resolve-shape-query'; shapeId: string; rootNote?: string; position?: number }): DomainResult<{ positions: Array<{ string: number; fret: number; label?: string }> }> {
    const result = this.shapeResolver.resolveShape(query.shapeId, query.rootNote, query.position);
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
}