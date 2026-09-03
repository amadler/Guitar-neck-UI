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

/**
 * DomainService — central facade for the domain contract.
 *
 * Accepts DomainCommand (user intents) and DomainQuery (read requests).
 * Validates inputs, delegates to existing application services,
 * and maintains immutable DomainState via BehaviorSubject.
 *
 * Both Toolbox and AI use this same service.
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

  constructor(
    private orchestration: FretboardOrchestrationService,
    private patternBuilder: PatternBuilderService,
    private tonalFacade: TonalFacadeService,
  ) { }

  // ─── Commands ───────────────────────────────────────────────────────

  /**
   * Execute a domain command.
   * Returns the new state on success, or an error on validation failure.
   */
  execute(command: DomainCommand): DomainResult<DomainState> {
    switch (command.type) {
      case 'show-pattern':
        return this.handleShowPattern(command);
      case 'show-interval':
        return this.handleShowInterval(command);
      case 'compare-patterns':
        return this.handleComparePatterns(command);
      case 'set-view':
        return this.handleSetView(command);
      case 'set-emphasis':
        return this.handleSetEmphasis(command);
      case 'clear-view':
        return this.handleClearView();
      default:
        return {
          success: false,
          error: DomainError.UNKNOWN_COMMAND,
          message: `Unknown command type: ${(command as any).type}`,
        };
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────

  /**
   * Execute a domain query.
   * Returns the requested data on success, or an error on failure.
   */
  query<T = unknown>(query: DomainQuery): DomainResult<T> {
    switch (query.type) {
      case 'get-current-view':
        return { success: true, data: this.currentState as unknown as T };

      case 'get-available-patterns': {
        const data = {
          scales: SCALE_PATTERNS.map(p => p.name),
          chords: CHORD_PATTERNS.map(p => p.name),
        } as unknown as T;
        return { success: true, data };
      }

      case 'get-pattern-details':
        return this.handleGetPatternDetails(query) as DomainResult<T>;

      default:
        return {
          success: false,
          error: DomainError.UNKNOWN_COMMAND,
          message: `Unknown query type: ${(query as any).type}`,
        };
    }
  }

  // ─── Command handlers ────────────────────────────────────────────────

  private handleShowPattern(command: DomainCommand & { type: 'show-pattern' }): DomainResult<DomainState> {
    const { patternType, patternName, rootNote } = command;

    // Validate pattern exists
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

    // Validate root note
    if (!this.isValidRootNote(rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${rootNote}". Valid notes: ${neckConfig.chromaticNotes.join(', ')}`,
      };
    }

    // Validate fret range if provided
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

    // Delegate to existing orchestration service
    if (patternType === 'scale') {
      this.orchestration.displayScale(patternName, rootNote);
    } else {
      this.orchestration.displayChord(patternName, rootNote);
    }

    // Update PatternBuilder for downstream consumers
    this.patternBuilder.setCurrentPattern(patternName, rootNote, patternType);

    // Build new immutable state snapshot
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

    // Validate root note
    if (!this.isValidRootNote(rootNote)) {
      return {
        success: false,
        error: DomainError.INVALID_ROOT_NOTE,
        message: `Invalid root note: "${rootNote}". Valid notes: ${neckConfig.chromaticNotes.join(', ')}`,
      };
    }

    // Validate interval using single source of truth
    const semitone = INTERVAL_SEMITONE_MAP[interval];
    if (semitone === undefined) {
      return {
        success: false,
        error: DomainError.INVALID_INTERVAL,
        message: `Invalid interval: "${interval}". Valid intervals: ${Object.keys(INTERVAL_SEMITONE_MAP).join(', ')}`,
      };
    }

    // Use spellNote for correct enharmonic spelling
    const note = spellNote(rootNote, semitone, interval);
    const notes = [rootNote, note];
    this.orchestration.displayCustomPattern(notes, rootNote);

    // Build new state snapshot
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

    // Validate both patterns
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

    // Validate root notes
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

    // Delegate to existing orchestration
    this.orchestration.displayScaleWithChord(
      primary.patternName, primary.rootNote,
      secondary.patternName, secondary.rootNote,
    );

    // Update PatternBuilder
    this.patternBuilder.setCurrentPattern(primary.patternName, primary.rootNote, primary.patternType);
    this.patternBuilder.setRelatedChord(secondary.patternName, secondary.rootNote);

    // Build new state snapshot
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
      enabledStrings: this.currentState.enabledStrings, // preserve string toggles
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
