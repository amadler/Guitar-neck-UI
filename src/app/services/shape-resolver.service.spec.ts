import { TestBed } from '@angular/core/testing';
import { ShapeResolverService } from './shape-resolver.service';

describe('ShapeResolverService', () => {
  let service: ShapeResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShapeResolverService);
  });

  describe('resolveShape', () => {
    it('should resolve cowboy-C to correct positions', () => {
      const result = service.resolveShape('cowboy-C');
      expect(result.success).toBe(true);
      expect(result.positions.length).toBe(5);
      expect(result.rootNote).toBe('C');
      // String 5, fret 3 = C (root)
      expect(result.positions[0]).toEqual({ string: 5, fret: 3, label: 'root' });
    });

    it('should resolve barre-E-form with rootNote F', () => {
      const result = service.resolveShape('barre-E-form', 'F');
      expect(result.success).toBe(true);
      expect(result.positions.length).toBe(6);
      // E-form root on string 6: E + 1 semitone = F at fret 1
      expect(result.positions[0]).toEqual({ string: 6, fret: 1, label: 'root' });
    });

    it('should reject barre shape without rootNote', () => {
      const result = service.resolveShape('barre-E-form');
      expect(result.success).toBe(false);
      expect(result.message).toContain('requires rootNote');
    });

    it('should reject cowboy shape with wrong rootNote', () => {
      const result = service.resolveShape('cowboy-C', 'F');
      expect(result.success).toBe(false);
      expect(result.message).toContain('cowboy-C');
    });

    it('should return error for nonexistent shape', () => {
      const result = service.resolveShape('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should resolve barre-A-form with rootNote Bb (enharmonic)', () => {
      const result = service.resolveShape('barre-A-form', 'Bb');
      expect(result.success).toBe(true);
      // A-form root on string 5: A + 1 semitone = Bb at fret 1
      expect(result.positions[0]).toEqual({ string: 5, fret: 1, label: 'root' });
    });
  });

  describe('resolveShape with caged shapes', () => {
    it('should resolve caged-Am-form with rootNote G', () => {
      const result = service.resolveShape('caged-Am-form', 'G');
      expect(result.success).toBe(true);
      expect(result.positions.length).toBe(5);
      // Am-form root on string 5: A→G = 10 semitones → fret 10
      expect(result.positions[0]).toEqual({ string: 5, fret: 10, label: 'root' });
    });

    it('should resolve caged-Em-form with rootNote F', () => {
      const result = service.resolveShape('caged-Em-form', 'F');
      expect(result.success).toBe(true);
      expect(result.positions.length).toBe(6);
      // Em-form root on string 6: E→F = 1 semitone → fret 1
      expect(result.positions[0]).toEqual({ string: 6, fret: 1, label: 'root' });
    });

    it('should resolve caged-Dm-form with rootNote G', () => {
      const result = service.resolveShape('caged-Dm-form', 'G');
      expect(result.success).toBe(true);
      expect(result.positions.length).toBe(4);
      // Dm-form root on string 4: D→G = 5 semitones → fret 5
      expect(result.positions[0]).toEqual({ string: 4, fret: 5, label: 'root' });
    });

    it('should reject caged shape without rootNote', () => {
      const result = service.resolveShape('caged-Am-form');
      expect(result.success).toBe(false);
      expect(result.message).toContain('requires rootNote');
    });

    it('should resolve caged-Cm-form with rootNote F (baseFret=3)', () => {
      const result = service.resolveShape('caged-Cm-form', 'F');
      expect(result.success).toBe(true);
      // Cm-form root on string 5: A→F = 8 semitones → rootFret=8
      // baseFret=3, so actualFret = 8 - 3 + fretOffset
      // Position 0: string 5, fretOffset 3 → fret 8
      // Position 1: string 4, fretOffset 1 → fret 6
      expect(result.positions[0]).toEqual({ string: 5, fret: 8, label: 'root' });
      expect(result.positions[1]).toEqual({ string: 4, fret: 6, label: 'b3' });
    });

    it('should resolve caged-Gm-form with rootNote A (baseFret=3)', () => {
      const result = service.resolveShape('caged-Gm-form', 'A');
      expect(result.success).toBe(true);
      // Gm-form root on string 6: E→A = 5 semitones → rootFret=5
      // baseFret=3, so actualFret = 5 - 3 + fretOffset
      // Position 0: string 6, fretOffset 3 → fret 5
      // Position 1: string 5, fretOffset 1 → fret 3
      expect(result.positions[0]).toEqual({ string: 6, fret: 5, label: 'root' });
      expect(result.positions[1]).toEqual({ string: 5, fret: 3, label: 'b3' });
    });

    it('should resolve caged-Cm-form with rootNote B (octave wrap, rootFret < baseFret)', () => {
      const result = service.resolveShape('caged-Cm-form', 'B');
      expect(result.success).toBe(true);
      // Cm-form root on string 5: A→B = 2 semitones → rootFret=2
      // baseFret=3, so rootFret < baseFret → shift up octave: rootFret=14
      // Position 0: string 5, fretOffset 3 → fret 14
      expect(result.positions[0]).toEqual({ string: 5, fret: 14, label: 'root' });
      // All positions must be non-negative
      expect(result.positions.every(p => p.fret >= 0)).toBe(true);
    });

    it('should resolve caged-Gm-form with rootNote F (octave wrap, rootFret < baseFret)', () => {
      const result = service.resolveShape('caged-Gm-form', 'F');
      expect(result.success).toBe(true);
      // Gm-form root on string 6: E→F = 1 semitone → rootFret=1
      // baseFret=3, so rootFret < baseFret → shift up octave: rootFret=13
      // Position 0: string 6, fretOffset 3 → fret 13
      expect(result.positions[0]).toEqual({ string: 6, fret: 13, label: 'root' });
      // All positions must be non-negative
      expect(result.positions.every(p => p.fret >= 0)).toBe(true);
    });
  });

  describe('getAvailableShapes', () => {
    it('should return all shapes when no category', () => {
      const shapes = service.getAvailableShapes();
      expect(shapes.length).toBeGreaterThan(0);
    });

    it('should filter by category', () => {
      const cowboyShapes = service.getAvailableShapes('cowboy');
      expect(cowboyShapes.every(s => s.category === 'cowboy')).toBe(true);
    });

    it('should filter by caged category', () => {
      const cagedShapes = service.getAvailableShapes('caged');
      expect(cagedShapes.length).toBe(5);
      expect(cagedShapes.every(s => s.category === 'caged')).toBe(true);
    });
  });
});