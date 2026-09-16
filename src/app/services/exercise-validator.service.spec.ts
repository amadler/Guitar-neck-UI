import { TestBed } from '@angular/core/testing';
import { ExerciseValidatorService } from './exercise-validator.service';
import { SelectedNotePosition } from '../domain/state';

describe('ExerciseValidatorService', () => {
  let service: ExerciseValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseValidatorService);
  });

  describe('validate', () => {
    it('should return correctCount=0 for empty selectedNotes', () => {
      const result = service.validate([], 'A', ['5']);
      expect(result.correctCount).toBe(0);
      expect(result.incorrectCount).toBe(0);
      expect(result.correct).toEqual([]);
    });

    it('should mark correct fifths relative to A', () => {
      // E is a perfect 5th above A (7 semitones)
      const notes: SelectedNotePosition[] = [
        { note: 'E', string: 1, fret: 7 },
      ];
      const result = service.validate(notes, 'A', ['5']);
      expect(result.correctCount).toBe(1);
      expect(result.incorrectCount).toBe(0);
      expect(result.correct).toEqual([true]);
    });

    it('should mark incorrect notes that are not the expected interval', () => {
      // C is a minor 3rd above A, not a 5th
      const notes: SelectedNotePosition[] = [
        { note: 'C', string: 2, fret: 3 },
      ];
      const result = service.validate(notes, 'A', ['5']);
      expect(result.correctCount).toBe(0);
      expect(result.incorrectCount).toBe(1);
      expect(result.correct).toEqual([false]);
    });

    it('should handle mixed correct and incorrect notes', () => {
      const notes: SelectedNotePosition[] = [
        { note: 'E', string: 1, fret: 7 },   // 5th above A ✓
        { note: 'C', string: 2, fret: 3 },   // b3 above A ✗
        { note: 'A', string: 3, fret: 2 },   // root (1) above A ✓
      ];
      const result = service.validate(notes, 'A', ['1', '5']);
      expect(result.correctCount).toBe(2);
      expect(result.incorrectCount).toBe(1);
      expect(result.correct).toEqual([true, false, true]);
    });

    it('should detect missing positions when expectedPositions is provided', () => {
      const notes: SelectedNotePosition[] = [
        { note: 'E', string: 1, fret: 7 }, // one correct fifth
      ];
      const expectedPositions = [
        { string: 1, fret: 7 },  // E on string 1
        { string: 2, fret: 2 },  // E on string 2
        { string: 3, fret: 9 },  // E on string 3
      ];
      const result = service.validate(notes, 'A', ['5'], expectedPositions);
      expect(result.correctCount).toBe(1);
      expect(result.incorrectCount).toBe(0);
      expect(result.missingCount).toBe(2);
      expect(result.missingPositions?.length).toBe(2);
      // Should NOT include the found position in missing
      expect(result.missingPositions).not.toContain(expect.objectContaining({ string: 1, fret: 7 }));
    });

    it('should report no missing when all expected positions are found', () => {
      const notes: SelectedNotePosition[] = [
        { note: 'E', string: 1, fret: 7 },
        { note: 'E', string: 2, fret: 2 },
      ];
      const expectedPositions = [
        { string: 1, fret: 7 },
        { string: 2, fret: 2 },
      ];
      const result = service.validate(notes, 'A', ['5'], expectedPositions);
      expect(result.correctCount).toBe(2);
      expect(result.missingCount).toBe(0);
      expect(result.missingPositions?.length).toBe(0);
    });

    it('should handle b3 interval correctly', () => {
      const notes: SelectedNotePosition[] = [
        { note: 'C', string: 2, fret: 3 }, // C is b3 above A
      ];
      const result = service.validate(notes, 'A', ['b3']);
      expect(result.correctCount).toBe(1);
      expect(result.correct).toEqual([true]);
    });

    it('should handle major 3rd interval correctly', () => {
      const notes: SelectedNotePosition[] = [
        { note: 'C#', string: 2, fret: 4 }, // C# is 3 above A
      ];
      const result = service.validate(notes, 'A', ['3']);
      expect(result.correctCount).toBe(1);
      expect(result.correct).toEqual([true]);
    });
  });
});