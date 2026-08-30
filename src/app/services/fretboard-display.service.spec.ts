import { TestBed } from '@angular/core/testing';
import { FretboardDisplayService } from './fretboard-display.service';
import { FretboardStateService } from './guitar-neck.service';
import { MarkerRoleService } from './marker-role.service';
import { FretboardNotePositionService } from './note.service';

describe('FretboardDisplayService', () => {
  let service: FretboardDisplayService;
  let guitarNeckService: FretboardStateService;
  let markerRoleService: MarkerRoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FretboardDisplayService,
        FretboardStateService,
        MarkerRoleService,
        FretboardNotePositionService,
      ],
    });
    service = TestBed.inject(FretboardDisplayService);
    guitarNeckService = TestBed.inject(FretboardStateService);
    markerRoleService = TestBed.inject(MarkerRoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMarkerCssClass', () => {
    it('should return empty string when chord relation is active (role-based)', () => {
      guitarNeckService.scaleChordState = {
        scale: { type: 'scale', name: 'major', rootNote: 'C' },
        chord: { type: 'chord', name: 'major', rootNote: 'C' },
      } as any;
      expect(service.getMarkerCssClass('root')).toBe('');
    });

    it('should return interval class when no chord relation', () => {
      guitarNeckService.scaleChordState = null;
      guitarNeckService.markerDisplayMode = 'interval-colors';
      expect(service.getMarkerCssClass('root')).toBe('guitar-neck__root');
      expect(service.getMarkerCssClass('major-3rd')).toBe('guitar-neck__major-3rd');
    });

    it('should return neutral class in note-names mode', () => {
      guitarNeckService.scaleChordState = null;
      guitarNeckService.markerDisplayMode = 'note-names';
      expect(service.getMarkerCssClass('root')).toBe('guitar-neck__neutral');
    });

    it('should return neutral-dot class in neutral-dots mode', () => {
      guitarNeckService.scaleChordState = null;
      guitarNeckService.markerDisplayMode = 'neutral-dots';
      expect(service.getMarkerCssClass('root')).toBe('guitar-neck__neutral-dot');
    });
  });

  describe('getRoleCssClass', () => {
    it('should return empty string when no scaleChordState', () => {
      guitarNeckService.scaleChordState = null;
      expect(service.getRoleCssClass(1, 0)).toBe('');
    });

    it('should return correct class for a given role', () => {
      // Set up a scale+chord relation and compute roles
      const mockNote = [
        { string: 1, fret: 0, note: 'C', selected: true, interval: '', visible: true },
      ];
      guitarNeckService.notes = mockNote as any;
      guitarNeckService.scaleChordState = {
        scale: { type: 'scale', name: 'major', rootNote: 'C' },
        chord: { type: 'chord', name: 'major', rootNote: 'C' },
      } as any;

      const state = guitarNeckService.scaleChordState!;
      markerRoleService.computeRoles(mockNote as any, state.scale, state.chord);

      const cssClass = service.getRoleCssClass(0, 0);
      expect(cssClass).toBe('guitar-neck__role-chord-root');
    });

    it('should return empty string for note without a role', () => {
      guitarNeckService.scaleChordState = {
        scale: { type: 'scale', name: 'major', rootNote: 'C' },
        chord: { type: 'chord', name: 'major', rootNote: 'C' },
      } as any;
      expect(service.getRoleCssClass(99, 99)).toBe('');
    });
  });

  describe('showNoteLabels', () => {
    it('should be true in interval-colors mode', () => {
      guitarNeckService.markerDisplayMode = 'interval-colors';
      expect(service.showNoteLabels).toBeTrue();
    });

    it('should be true in note-names mode', () => {
      guitarNeckService.markerDisplayMode = 'note-names';
      expect(service.showNoteLabels).toBeTrue();
    });

    it('should be false in neutral-dots mode', () => {
      guitarNeckService.markerDisplayMode = 'neutral-dots';
      expect(service.showNoteLabels).toBeFalse();
    });
  });

  describe('hasRelation', () => {
    it('should be false when scaleChordState is null', () => {
      guitarNeckService.scaleChordState = null;
      expect(service.hasRelation).toBeFalse();
    });

    it('should be true when scaleChordState exists', () => {
      guitarNeckService.scaleChordState = {} as any;
      expect(service.hasRelation).toBeTrue();
    });
  });

  describe('getActiveIntervals', () => {
    it('should return empty array when no active result', () => {
      guitarNeckService.hasActiveResult = false;
      expect(service.getActiveIntervals()).toEqual([]);
    });

    it('should return unique intervals from selected notes', () => {
      guitarNeckService.hasActiveResult = true;
      guitarNeckService.notes = [
        { string: 1, fret: 0, note: 'C', selected: true, interval: 'root', visible: true },
        { string: 2, fret: 1, note: 'E', selected: true, interval: 'major-3rd', visible: true },
        { string: 3, fret: 2, note: 'G', selected: true, interval: 'perfect-5th', visible: true },
      ] as any;

      const intervals = service.getActiveIntervals();
      expect(intervals).toContain('root');
      expect(intervals).toContain('major-3rd');
      expect(intervals).toContain('perfect-5th');
    });
  });
});
