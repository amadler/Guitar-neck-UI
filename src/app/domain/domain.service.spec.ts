import { TestBed } from '@angular/core/testing';
import { DomainService } from './domain.service';
import { DomainCommand } from './commands';
import { DomainQuery, KeyAnalysis } from './queries';
import { DomainState } from './state';

describe('DomainService', () => {
  let service: DomainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DomainService);
  });

  describe('execute', () => {
    it('should handle resolve-shape for cowboy-C', () => {
      const command: DomainCommand = { type: 'resolve-shape', shapeId: 'cowboy-C' };
      const result = service.execute(command);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('positions');
        expect(result.data.shapeInfo?.shapeId).toBe('cowboy-C');
      }
    });

    it('should return error for unknown command', () => {
      const result = service.execute({ type: 'unknown-command' as any });
      expect(result.success).toBe(false);
    });
  });

  describe('query', () => {
    it('should detect C major chord from notes C, E, G', () => {
      const query: DomainQuery = { type: 'detect-chord', notes: ['C', 'E', 'G'] };
      const result = service.query<{ chords: string[] }>(query);
      expect(result.success).toBe(true);
      if (result.success) {
        // Tonal.js returns chord symbols like 'CM' (not 'C major')
        expect(result.data.chords).toContain('CM');
      }
    });

    it('should detect major scale from C, D, E, F, G, A, B', () => {
      const query: DomainQuery = { type: 'detect-scale', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] };
      const result = service.query<{ scales: string[] }>(query);
      expect(result.success).toBe(true);
      if (result.success) {
        // Tonal.js returns scale names like 'C major' (not bare 'major')
        expect(result.data.scales).toContain('C major');
      }
    });

    it('should return key analysis for C major', () => {
      const query: DomainQuery = { type: 'get-key-analysis', tonic: 'C', mode: 'major' };
      const result = service.query<KeyAnalysis>(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tonic).toBe('C');
        expect(result.data.mode).toBe('major');
        expect(result.data.scale.length).toBeGreaterThan(0);
        expect(result.data.triads.length).toBeGreaterThan(0);
        expect(result.data.chords.length).toBeGreaterThan(0);
      }
    });

    it('should return available shapes', () => {
      const query: DomainQuery = { type: 'get-available-shapes' };
      const result = service.query<{ shapes: Array<{ id: string; name: string; category: string }> }>(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shapes.length).toBeGreaterThan(0);
      }
    });

    it('should return error for empty chord detection', () => {
      const query: DomainQuery = { type: 'detect-chord', notes: [] };
      const result = service.query(query);
      expect(result.success).toBe(false);
    });

    it('should return current DomainState snapshot (not a Signal)', () => {
      const result = service.query<DomainState>({ type: 'get-current-view' });
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify it's a plain object snapshot, not a Signal
        expect(result.data.mode).toBeDefined();
        expect(result.data.rootNote).toBeDefined();
        expect(typeof result.data).toBe('object');
        // Verify it's not a function (which would indicate a Signal leaked)
        expect(typeof (result.data as any).subscribe).toBe('undefined');
      }
    });
  });

  describe('exercise commands', () => {
    it('should start an exercise and set exerciseMode', () => {
      const command: DomainCommand = {
        type: 'start-exercise',
        question: 'Find all fifths relative to A',
        rootNote: 'A',
        expectedIntervals: ['5'],
      };
      const result = service.execute(command);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseMode).toBe(true);
        expect(result.data.exerciseTask?.question).toBe('Find all fifths relative to A');
        expect(result.data.exerciseTask?.rootNote).toBe('A');
        expect(result.data.exerciseTask?.expectedIntervals).toEqual(['5']);
        expect(result.data.selectedNotes).toEqual([]);
      }
    });

    it('should select a note during exercise', () => {
      // Start exercise first
      service.execute({
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
      });

      const result = service.execute({
        type: 'select-note',
        note: 'E',
        string: 1,
        fret: 7,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedNotes).toEqual([
          { note: 'E', string: 1, fret: 7 },
        ]);
      }
    });

    it('should deselect a note', () => {
      service.execute({ type: 'start-exercise', question: 'Find fifths', rootNote: 'A', expectedIntervals: ['5'] });
      service.execute({ type: 'select-note', note: 'E', string: 1, fret: 7 });
      service.execute({ type: 'select-note', note: 'E', string: 2, fret: 2 });

      const result = service.execute({ type: 'deselect-note', string: 1, fret: 7 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedNotes?.length).toBe(1);
        expect(result.data.selectedNotes).not.toContain(expect.objectContaining({ string: 1, fret: 7 }));
      }
    });

    it('should reject select-note without active exercise', () => {
      const result = service.execute({ type: 'select-note', note: 'E', string: 1, fret: 7 });
      expect(result.success).toBe(false);
    });

    it('should submit exercise and produce lastExerciseResult', () => {
      service.execute({ type: 'start-exercise', question: 'Find fifths', rootNote: 'A', expectedIntervals: ['5'] });
      service.execute({ type: 'select-note', note: 'E', string: 1, fret: 7 });

      const result = service.execute({ type: 'submit-exercise' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exerciseMode).toBe(false);
        expect(result.data.exerciseTask).toBeUndefined();
        expect(result.data.lastExerciseResult).toBeDefined();
        expect(result.data.lastExerciseResult!.correctCount).toBe(1);
        expect(result.data.lastExerciseResult!.incorrectCount).toBe(0);
      }
    });

    it('should reject submit-exercise without active exercise', () => {
      const result = service.execute({ type: 'submit-exercise' });
      expect(result.success).toBe(false);
    });

    it('should compute expectedPositions on start', () => {
      const result = service.execute({
        type: 'start-exercise',
        question: 'Find fifths',
        rootNote: 'A',
        expectedIntervals: ['5'],
        fretRange: { min: 0, max: 5 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Should have expectedPositions computed
        expect(result.data.exerciseTask?.expectedPositions).toBeDefined();
        expect(result.data.exerciseTask!.expectedPositions!.length).toBeGreaterThan(0);
      }
    });
  });
});