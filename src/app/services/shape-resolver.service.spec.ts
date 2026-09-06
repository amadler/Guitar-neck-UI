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

    it('should resolve barre-A-form with rootNote Bb', () => {
      const result = service.resolveShape('barre-A-form', 'Bb');
      expect(result.success).toBe(true);
      // A-form root on string 5: A + 1 semitone = Bb at fret 1
      expect(result.positions[0]).toEqual({ string: 5, fret: 1, label: 'root' });
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
  });
});