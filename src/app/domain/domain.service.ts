import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand } from './commands';
import { DomainQuery, GetAvailablePatternsResult, GetCurrentViewResult, GetPatternDetailsResult } from './queries';
import { DomainState, DomainResult, DomainError, DEFAULT_DOMAIN_STATE } from './state';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { TonalFacadeService, PatternType } from '../services/tonal-facade.service';
import { PatternInfo } from '../shared/model/patternInfo';
import { spellNote } from '../shared/note-utils';
import { INTERVAL_SEMITONE_MAP } from '../shared/tonal-adapter';

type CommandHandler = (command: any) => DomainResult<DomainState>;
type QueryHandler = (query: any) => DomainResult<any>;

/**
 * DomainService — central facade for the domain contract.
 *
 * Accepts DomainCommand (user intents) and DomainQuery (read requests).
 * Validates inputs, delegates to existing application services,
 * and maintains immutable DomainState via BehaviorSubject.
 *
 * Both Toolbox and AI use this same service.
 *
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

  /**
   * Execute a domain command.
   * Returns the new state on success, or an error on validation failure.
   */
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

  /**
   * Execute a domain query.
   * Returns the requested data on success, or an error on failure.
   */
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

    if (!this.isValidPattern(patternName, patternType)) {
      return {
        success: false,
        error: DomainError.PATTERN_NOT_FOUND,
        message: `Unknown ${patternType}: "${patternName}". Available patterns: ${patternType === 'scale'
          ? SCALE_PATTERNS.map(p => p.name).join(', ')
          : CHORD_PATTERNS.map(p => p.name).join(', ')
          }`,
      };
    }

    if (!this.isValidRootNote(rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${rootNote}". Valid notes: ${neckConfig.chromaticNotes.join(', ')}`,
      };
    }

    if (command.fretRange) {
      const { min, max } = command.fretRange;
      if (min < 0 || max > 24 || min > max) {
        return {
          success: false,
          error: DomainError.INVALID_FRET_RANGE,
          message: `Invalid fret range: ${min}-${max}. Valid range: 0-24, min <= max.`,
        };
      }
    }

    if (patternType === 'scale') {
      this.orchestration.displayScale(patternName, rootNote);
    } else {
      this.orchestration.displayChord(patternName, rootNote);
    }

    this.patternBuilder.setCurrentPattern(patternName, rootNote, patternType);

    const newState: DomainState = {
      ...this.currentState,
      mode: patternType === 'scale' ? 'scale' : 'chord',
      rootNote,
      patternName,
      compareTarget: undefined,
      emphasis: command.emphasis ?? this.currentState.emphasis,
      fretRange: command.fretRange ?? this.currentState.fretRange,
    };

    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }

  private handleShowInterval(command: DomainCommand & { type: 'show-interval' }): DomainResult<DomainState> {
    const { rootNote, interval } = command;

    if (!this.isValidRootNote(rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${rootNote}". Valid notes: ${neckConfig.chromaticNotes.join(', ')}`,
      };
    }

    const semitone = INTERVAL_SEMITONE_MAP[interval];
    if (semitone === undefined) {
      return {
        success: false,
        error: DomainError.INVALID_INTERVAL,
        message: `Invalid interval: "${interval}". Valid intervals: ${Object.keys(INTERVAL_SEMITONE_MAP).join(', ')}`,
      };
    }

    const note = spellNote(rootNote, semitone, interval);
    const notes = [rootNote, note];
    this.orchestration.displayCustomPattern(notes, rootNote);

    const newState: DomainState = {
      ...this.currentState,
      mode: 'custom',
      rootNote,
      patternName: `interval-${interval}`,
      compareTarget: undefined,
    };

    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }

  private handleComparePatterns(command: DomainCommand & { type: 'compare-patterns' }): DomainResult<DomainState> {
    const { primary, secondary } = command;

    if (!this.isValidPattern(primary.patternName, primary.patternType)) {
      return {
        success: false,
        error: DomainError.PATTERN_NOT_FOUND,
        message: `Unknown ${primary.patternType}: "${primary.patternName}"`,
      };
    }
    if (!this.isValidPattern(secondary.patternName, secondary.patternType)) {
      return {
        success: false,
        error: DomainError.PATTERN_NOT_FOUND,
        message: `Unknown ${secondary.patternType}: "${secondary.patternName}"`,
      };
    }

    if (!this.isValidRootNote(primary.rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${primary.rootNote}"`,
      };
    }
    if (!this.isValidRootNote(secondary.rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${secondary.rootNote}"`,
      };
    }

    this.orchestration.displayScaleWithChord(
      primary.patternName, primary.rootNote,
      secondary.patternName, secondary.rootNote,
    );

    this.patternBuilder.setCurrentPattern(primary.patternName, primary.rootNote, primary.patternType);
    this.patternBuilder.setRelatedChord(secondary.patternName, secondary.rootNote);

    const newState: DomainState = {
      ...this.currentState,
      mode: 'scale-chord',
      rootNote: primary.rootNote,
      patternName: primary.patternName,
      compareTarget: {
        rootNote: secondary.rootNote,
        patternName: secondary.patternName,
        patternType: secondary.patternType,
      },
    };

    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }

  private handleSetView(command: DomainCommand & { type: 'set-view' }): DomainResult<DomainState> {
    const newState: DomainState = {
      ...this.currentState,
      fretRange: command.fretRange ?? this.currentState.fretRange,
      enabledStrings: command.enabledStrings ?? this.currentState.enabledStrings,
      markerDisplayMode: command.markerDisplayMode ?? this.currentState.markerDisplayMode,
    };

    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }

  private handleSetEmphasis(command: DomainCommand & { type: 'set-emphasis' }): DomainResult<DomainState> {
    const newState: DomainState = {
      ...this.currentState,
      emphasis: command.emphasis,
    };

    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }

  private handleClearView(): DomainResult<DomainState> {
    this.orchestration.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    const newState: DomainState = {
      ...DEFAULT_DOMAIN_STATE,
      enabledStrings: this.currentState.enabledStrings,
    };

    this.stateSubject.next(newState);
    return { success: true, data: newState };
  }

  // ─── Query handlers ──────────────────────────────────────────────────

  private handleGetPatternDetails(query: { type: 'get-pattern-details'; patternType: PatternType; patternName: string; rootNote: string }): DomainResult<GetPatternDetailsResult> {
    const { patternType, patternName, rootNote } = query;

    if (!this.isValidPattern(patternName, patternType)) {
      return {
        success: false,
        error: DomainError.PATTERN_NOT_FOUND,
        message: `Unknown ${patternType}: "${patternName}"`,
      };
    }

    if (!this.isValidRootNote(rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${rootNote}"`,
      };
    }

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

  // ─── Validation helpers ──────────────────────────────────────────────

  private isValidPattern(name: string, type: PatternType): boolean {
    const patterns = type === 'scale' ? SCALE_PATTERNS : CHORD_PATTERNS;
    return patterns.some(p => p.name === name);
  }

  private isValidRootNote(note: string): boolean {
    return neckConfig.chromaticNotes.includes(note);
  }
}