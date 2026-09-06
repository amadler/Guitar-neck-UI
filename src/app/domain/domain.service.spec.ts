import { TestBed } from '@angular/core/testing';
import { DomainService } from './domain.service';
import { DomainCommand } from './commands';
import { DomainQuery, KeyAnalysis } from './queries';

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
        expect(result.data.chords).toContain('C major');
      }
    });

    it('should detect major scale from C, D, E, F, G, A, B', () => {
      const query: DomainQuery = { type: 'detect-scale', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] };
      const result = service.query<{ scales: string[] }>(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scales).toContain('major');
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
  });
});