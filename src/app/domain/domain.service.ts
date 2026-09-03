import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand } from './commands';
import { DomainQuery, GetPatternDetailsResult } from './queries';
import { DomainState, DomainResult, DomainError, DEFAULT_DOMAIN_STATE } from './state';
import { DomainValidator } from './domain-validator';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { TonalFacadeService, PatternType } from '../services/tonal-facade.service';
import { PatternInfo } from '../shared/model/patternInfo';
import { spellNote } from '../shared/note-utils';

type CommandHandler = (command: any) => DomainResult<DomainState>;
type QueryHandler = (query: any) => DomainResult<any>;

/**
 * DomainService — central facade for the domain contract.
 *
 * Accepts DomainCommand (user intents) and DomainQuery (read requests).
 * Validates inputs via DomainValidator, delegates to existing application services,
 * and maintains immutable DomainState via BehaviorSubject.
 *
 * Both Toolbox and AI use this same service.
 * Commands are dispatched via Registry Pattern — no switch/if-else chains.
 */
@Injectable({ providedIn: 'root' })
export class DomainService {
  private stateSubject = new BehaviorSubject<DomainState>(DEFAULT_DOMAIN_STATE);

  /** Observable stream of state snapshots. */
  state$: Observable<DomainState> = this.stateSubject.asObservable();

  /** Current state snapshot. */
  get currentState(): DomainState {
    return this.stateSubject.value;
  }

  private commandHandlers = new Map<string, CommandHandler>();
  private queryHandlers = new Map<string, QueryHandler>();

  constructor(
    private orchestration: FretboardOrchestrationService,
    private patternBuilder: PatternBuilderService,
    private tonalFacade: TonalFacadeService,
  ) {
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

    return this.emitState({
      ...this.currentState,
      mode: patternType === 'scale' ? 'scale' : 'chord',
      rootNote,
      patternName,
      compareTarget: undefined,
      emphasis: command.emphasis ?? this.currentState.emphasis,
      fretRange: command.fretRange ?? this.currentState.fretRange,
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
      ...this.currentState,
      mode: 'custom',
      rootNote,
      patternName: `interval-${interval}`,
      compareTarget: undefined,
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

    return this.emitState({
      ...this.currentState,
      mode: 'scale-chord',
      rootNote: primary.rootNote,
      patternName: primary.patternName,
      compareTarget: {
        rootNote: secondary.rootNote,
        patternName: secondary.patternName,
        patternType: secondary.patternType,
      },
    });
  }

  private handleSetView(command: DomainCommand & { type: 'set-view' }): DomainResult<DomainState> {
    return this.emitState({
      ...this.currentState,
      fretRange: command.fretRange ?? this.currentState.fretRange,
      enabledStrings: command.enabledStrings ?? this.currentState.enabledStrings,
      markerDisplayMode: command.markerDisplayMode ?? this.currentState.markerDisplayMode,
    });
  }

  private handleSetEmphasis(command: DomainCommand & { type: 'set-emphasis' }): DomainResult<DomainState> {
    return this.emitState({
      ...this.currentState,
      emphasis: command.emphasis,
    });
  }

  private handleClearView(): DomainResult<DomainState> {
    this.orchestration.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    return this.emitState({
      ...DEFAULT_DOMAIN_STATE,
      enabledStrings: this.currentState.enabledStrings,
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

  // ─── Helpers ─────────────────────────────────────────────────────────

  private emitState(newState: DomainState): DomainResult<DomainState> {
    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }
}