import { DomainValidator } from './domain-validator';

describe('DomainValidator', () => {
  describe('validatePosition', () => {
    it('should return null for valid position (5, 3)', () => {
      expect(DomainValidator.validatePosition(5, 3)).toBeNull();
    });

    it('should return error for string out of range (7, 3)', () => {
      const result = DomainValidator.validatePosition(7, 3);
      expect(result).not.toBeNull();
      expect(result!.success).toBe(false);
    });

    it('should return error for fret out of range (5, 25)', () => {
      const result = DomainValidator.validatePosition(5, 25);
      expect(result).not.toBeNull();
      expect(result!.success).toBe(false);
    });

    it('should return error for string 0', () => {
      expect(DomainValidator.validatePosition(0, 3)).not.toBeNull();
    });

    it('should return error for negative fret', () => {
      expect(DomainValidator.validatePosition(5, -1)).not.toBeNull();
    });
  });

  describe('validateStringIndex', () => {
    it('should accept strings 1-6', () => {
      for (let s = 1; s <= 6; s++) {
        expect(DomainValidator.validateStringIndex(s)).toBeNull();
      }
    });

    it('should reject string 0', () => {
      expect(DomainValidator.validateStringIndex(0)).not.toBeNull();
    });

    it('should reject string 7', () => {
      expect(DomainValidator.validateStringIndex(7)).not.toBeNull();
    });
  });

  describe('validateFret', () => {
    it('should accept frets 0-24', () => {
      for (let f = 0; f <= 24; f++) {
        expect(DomainValidator.validateFret(f)).toBeNull();
      }
    });

    it('should reject fret 25', () => {
      expect(DomainValidator.validateFret(25)).not.toBeNull();
    });
  });

  describe('validateNoteAtPosition', () => {
    const mockGetNote = (_s: number, _f: number) => {
      if (_s === 5 && _f === 3) return 'C';
      if (_s === 5 && _f === 0) return 'A';
      return null;
    };

    it('should return null when note matches', () => {
      const result = DomainValidator.validateNoteAtPosition(5, 3, 'C', mockGetNote);
      expect(result).toBeNull();
    });

    it('should return error when note does not match', () => {
      const result = DomainValidator.validateNoteAtPosition(5, 3, 'F', mockGetNote);
      expect(result).not.toBeNull();
      expect(result!.success).toBe(false);
      if (result && !result.success) {
        expect(result.error).toBe('POSITION_NOTE_MISMATCH');
      }
    });

    it('should return error for out of range position', () => {
      const result = DomainValidator.validateNoteAtPosition(7, 3, 'C', mockGetNote);
      expect(result).not.toBeNull();
    });
  });
});