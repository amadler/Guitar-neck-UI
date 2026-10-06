import { TestBed } from '@angular/core/testing';
import { ExerciseService } from './exercise.service';
import { TonalFacadeService } from '../services/tonal-facade.service';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { ExerciseValidatorService } from '../services/exercise-validator.service';
import { StartExerciseCommand, SelectNoteCommand, DeselectNoteCommand } from './commands';
import { DomainState, DEFAULT_DOMAIN_STATE, DomainError, ExerciseResult } from './state';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let mockTonalFacade: {
    intervalBetween: ReturnType<typeof vi.fn>;
    transposeNote: ReturnType<typeof vi.fn>;
  };
  let mockOrchestration: {
    clearFretboard: ReturnType<typeof vi.fn>;
    displayCustomPattern: ReturnType<typeof vi.fn>;
  };
  let mockExerciseValidator: {
    validate: ReturnType<typeof vi.fn>;
  };

  // Chroma map for mock interval calculation (mirrors note-utils.ts)
  const CHROMA: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6,
    'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
  };
  const SEMITONE_TO_TONAL = ['1P', '2m', '2M', '3m', '3M', '4P', '5d', '5P', '6m', '6M', '7m', '7M'];
  const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  /** Create a DomainState with an active exercise for testing. */
  function activeExerciseState(overrides?: Partial<DomainState>): DomainState {
    return {
      ...DEFAULT_DOMAIN_STATE,
      exerciseMode: true,
      exerciseTask: {
        question: 'Find all fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
        fretRange: { min: 0, max: 24 },
        enabledStrings: [true, true, true, true, true, true],
      },
      selectedNotes: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    mockTonalFacade = {
      intervalBetween: vi.fn(),
      transposeNote: vi.fn(),
    };
    mockOrchestration = {
      clearFretboard: vi.fn(),
      displayCustomPattern: vi.fn(),
    };
    mockExerciseValidator = {
      validate: vi.fn(),
    };

    // Default mock: compute interval via chroma (spelling-independent)
    mockTonalFacade.intervalBetween.mockImplementation((root: string, note: string) => {
      const rootChroma = CHROMA[root];
      const noteChroma = CHROMA[note];
      if (rootChroma === undefined || noteChroma === undefined) return '';
      const semitones = (noteChroma - rootChroma + 12) % 12;
      return SEMITONE_TO_TONAL[semitones];
    });

    // Default mock: transpose by semitones, return sharp spelling
    mockTonalFacade.transposeNote.mockImplementation((note: string, interval: string) => {
      const intervalSemitones: Record<string, number> = {
        '1P': 0, '2m': 1, '2M': 2, '3m': 3, '3M': 4, '4P': 5,
        '5d': 6, '5P': 7, '6m': 8, '6M': 9, '7m': 10, '7M': 11,
      };
      const semitones = intervalSemitones[interval] ?? 0;
      const rootChroma = CHROMA[note];
      if (rootChroma === undefined) return note;
      const targetChroma = (rootChroma + semitones) % 12;
      return SHARP_NOTES[targetChroma];
    });

    TestBed.configureTestingModule({
      providers: [
        ExerciseService,
        { provide: TonalFacadeService, useValue: mockTonalFacade },
        { provide: FretboardOrchestrationService, useValue: mockOrchestration },
      ],
    });
    service = TestBed.inject(ExerciseService);
  });

  describe('startExercise', () => {
    it('should start an exercise and set exerciseMode', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find all fifths relative to A',
        rootNote: 'A',
        expectedIntervals: ['5'],
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseMode).toBe(true);
        expect(result.data.exerciseTask?.question).toBe('Find all fifths relative to A');
        expect(result.data.exerciseTask?.rootNote).toBe('A');
        expect(result.data.exerciseTask?.expectedIntervals).toEqual(['5']);
        expect(result.data.selectedNotes).toEqual([]);
        expect(result.data.lastExerciseResult).toBeUndefined();
      }
      expect(mockOrchestration.clearFretboard).toHaveBeenCalled();
    });

    it('should compute expectedPositions for the given range', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
        fretRange: { min: 0, max: 2 },
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(true);
      if (result.success) {
        const positions = result.data.exerciseTask!.expectedPositions!;
        expect(positions.length).toBeGreaterThan(0);
        // E is the 5th above A (7 semitones)
        // With range 0-2, E appears at: string 1 fret 0, string 4 fret 2, string 6 fret 0
        const hasString1Fret0 = positions.some(p => p.string === 1 && p.fret === 0);
        const hasString4Fret2 = positions.some(p => p.string === 4 && p.fret === 2);
        const hasString6Fret0 = positions.some(p => p.string === 6 && p.fret === 0);
        expect(hasString1Fret0).toBe(true);
        expect(hasString4Fret2).toBe(true);
        expect(hasString6Fret0).toBe(true);
      }
    });

    it('should use provided fretRange and enabledStrings', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
        fretRange: { min: 0, max: 5 },
        enabledStrings: [true, true, false, true, true, true],
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fretRange).toEqual({ min: 0, max: 5 });
        expect(result.data.enabledStrings).toEqual([true, true, false, true, true, true]);
      }
    });

    it('should fall back to current state values when optional params are omitted', () => {
      const state: DomainState = {
        ...DEFAULT_DOMAIN_STATE,
        fretRange: { min: 0, max: 3 },
        enabledStrings: [true, false, true, false, true, false],
      };

      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
      };

      const result = service.startExercise(command, state);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fretRange).toEqual({ min: 0, max: 3 });
        expect(result.data.enabledStrings).toEqual([true, false, true, false, true, false]);
      }
    });

    it('should display reference intervals when showIntervals is provided', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
        showIntervals: ['1', '5'],
        fretRange: { min: 0, max: 2 },
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseTask?.showIntervals).toEqual(['1', '5']);
        expect(result.data.exerciseTask?.referencePositions).toBeDefined();
      }
      // displayCustomPattern should be called with root + reference notes
      expect(mockOrchestration.displayCustomPattern).toHaveBeenCalled();
      // transposeNote('A', '1P') → 'A', transposeNote('A', '5P') → 'E'
      // displayCustomPattern(['A', 'A', 'E'], 'A')
      expect(mockOrchestration.displayCustomPattern).toHaveBeenCalledWith(
        ['A', 'A', 'E'],
        'A',
      );
    });

    it('should reject invalid root note', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'X',
        expectedIntervals: ['5'],
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.INVALID_ROOT_NOTE);
      }
    });

    it('should reject empty expectedIntervals', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: [],
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.INVALID_INTERVAL);
      }
    });

    it('should reject invalid fretRange', () => {
      const command: StartExerciseCommand = {
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
        fretRange: { min: -1, max: 5 },
      };

      const result = service.startExercise(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.INVALID_FRET_RANGE);
      }
    });
  });

  describe('submitExercise', () => {
    it('should submit exercise and return result', () => {
      const mockResult: ExerciseResult = {
        correct: [true],
        selectedNotes: [{ note: 'E', string: 1, fret: 7 }],
        correctCount: 1,
        incorrectCount: 0,
      };
      mockExerciseValidator.validate.mockReturnValue(mockResult);

      const state = activeExerciseState();
      const result = service.submitExercise(
        state,
        mockExerciseValidator as unknown as ExerciseValidatorService,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseMode).toBe(false);
        expect(result.data.exerciseTask).toBeUndefined();
        expect(result.data.lastExerciseResult).toBe(mockResult);
      }
      expect(mockOrchestration.clearFretboard).toHaveBeenCalled();
      expect(mockExerciseValidator.validate).toHaveBeenCalledWith(
        state.selectedNotes,
        state.exerciseTask!.rootNote,
        state.exerciseTask!.expectedIntervals,
        state.exerciseTask!.expectedPositions,
      );
    });

    it('should reject submit without active exercise', () => {
      const result = service.submitExercise(
        DEFAULT_DOMAIN_STATE,
        mockExerciseValidator as unknown as ExerciseValidatorService,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.NO_ACTIVE_EXERCISE);
      }
      expect(mockExerciseValidator.validate).not.toHaveBeenCalled();
    });
  });

  describe('selectNote', () => {
    it('should add a note to selectedNotes', () => {
      const command: SelectNoteCommand = {
        type: 'select-note',
        note: 'E',
        string: 1,
        fret: 7,
      };

      const state = activeExerciseState();
      const result = service.selectNote(command, state);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedNotes).toEqual([
          { note: 'E', string: 1, fret: 7 },
        ]);
      }
    });

    it('should avoid duplicate positions', () => {
      const command: SelectNoteCommand = {
        type: 'select-note',
        note: 'E',
        string: 1,
        fret: 7,
      };

      const state = activeExerciseState({
        selectedNotes: [{ note: 'E', string: 1, fret: 7 }],
      });
      const result = service.selectNote(command, state);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should return the same state object (no mutation)
        expect(result.data).toBe(state);
      }
    });

    it('should reject select without active exercise', () => {
      const command: SelectNoteCommand = {
        type: 'select-note',
        note: 'E',
        string: 1,
        fret: 7,
      };

      const result = service.selectNote(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.NO_ACTIVE_EXERCISE);
      }
    });

    it('should reject select on disabled string', () => {
      const command: SelectNoteCommand = {
        type: 'select-note',
        note: 'E',
        string: 3,
        fret: 7,
      };

      const state = activeExerciseState({
        enabledStrings: [true, true, false, true, true, true],
      });
      const result = service.selectNote(command, state);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.INVALID_POSITION);
        expect(result.message).toContain('disabled');
      }
    });

    it('should reject invalid position (string out of range)', () => {
      const command: SelectNoteCommand = {
        type: 'select-note',
        note: 'E',
        string: 7,
        fret: 3,
      };

      const state = activeExerciseState();
      const result = service.selectNote(command, state);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.INVALID_POSITION);
      }
    });

    it('should reject invalid position (fret out of range)', () => {
      const command: SelectNoteCommand = {
        type: 'select-note',
        note: 'E',
        string: 1,
        fret: 25,
      };

      const state = activeExerciseState();
      const result = service.selectNote(command, state);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.INVALID_POSITION);
      }
    });
  });

  describe('deselectNote', () => {
    it('should remove a note from selectedNotes', () => {
      const command: DeselectNoteCommand = {
        type: 'deselect-note',
        string: 1,
        fret: 7,
      };

      const state = activeExerciseState({
        selectedNotes: [
          { note: 'E', string: 1, fret: 7 },
          { note: 'E', string: 2, fret: 2 },
        ],
      });
      const result = service.deselectNote(command, state);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedNotes?.length).toBe(1);
        expect(result.data.selectedNotes?.some(n => n.string === 1 && n.fret === 7)).toBe(false);
        expect(result.data.selectedNotes?.some(n => n.string === 2 && n.fret === 2)).toBe(true);
      }
    });

    it('should succeed even if note is not in selectedNotes', () => {
      const command: DeselectNoteCommand = {
        type: 'deselect-note',
        string: 3,
        fret: 5,
      };

      const state = activeExerciseState({
        selectedNotes: [{ note: 'E', string: 1, fret: 7 }],
      });
      const result = service.deselectNote(command, state);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedNotes?.length).toBe(1);
      }
    });

    it('should reject deselect without active exercise', () => {
      const command: DeselectNoteCommand = {
        type: 'deselect-note',
        string: 1,
        fret: 7,
      };

      const result = service.deselectNote(command, DEFAULT_DOMAIN_STATE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DomainError.NO_ACTIVE_EXERCISE);
      }
    });
  });
});