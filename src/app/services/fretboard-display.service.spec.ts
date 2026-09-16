import type { MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardDisplayService } from './fretboard-display.service';
import { FretboardStateService } from './fretboard-state.service';
import { MarkerRoleService } from './marker-role.service';
import { FretboardNotePositionService } from './note.service';
import { DomainService } from '../domain/domain.service';
import { signal } from "@angular/core";
import { FretboardSnapshot } from "../shared/model/fretboard-snapshot";

describe('FretboardDisplayService', () => {
  let service: FretboardDisplayService;
  let guitarNeckService: FretboardStateService;
  let markerRoleService: MarkerRoleService;
  let domainService: Partial<MockedObject<DomainService>>;
  let mockState: any;

  /** Helper to set currentSnapshot on the service. */
  function setSnapshot(overrides: Partial<FretboardSnapshot> = {}): void {
    const defaultSnapshot: FretboardSnapshot = {
      notes: [],
      hasActiveResult: false,
      currentSelection: null,
      scaleChordState: null,
      ...overrides,
    };
    guitarNeckService.setSnapshot(defaultSnapshot);
  }

  beforeEach(() => {
    mockState = {
      markerDisplayMode: 'interval-colors',
      fretRange: { min: 0, max: 24 },
      enabledStrings: [true, true, true, true, true, true],
    };

    domainService = {
      execute: vi.fn().mockName("DomainService.execute"),
      currentState: signal(mockState) as any
    };

    TestBed.configureTestingModule({
      providers: [
        FretboardDisplayService,
        FretboardStateService,
        MarkerRoleService,
        FretboardNotePositionService,
        { provide: DomainService, useValue: domainService },
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
      setSnapshot({
        scaleChordState: {
          scale: { type: 'scale', name: 'major', rootNote: 'C' } as any,
          chord: { type: 'chord', name: 'major', rootNote: 'C' } as any,
        },
      });
      expect(service.getMarkerCssClass('root')).toBe('');
    });

    it('should return interval class when no chord relation', () => {
      setSnapshot({ scaleChordState: null });
      mockState.markerDisplayMode = 'interval-colors';
      expect(service.getMarkerCssClass('root')).toBe('fretboard__dot--root');
      expect(service.getMarkerCssClass('major-3rd')).toBe('fretboard__dot--major-3rd');
    });

    it('should return neutral class in note-names mode', () => {
      setSnapshot({ scaleChordState: null });
      mockState.markerDisplayMode = 'note-names';
      expect(service.getMarkerCssClass('root')).toBe('fretboard__dot--neutral');
    });

    it('should return neutral-dot class in neutral-dots mode', () => {
      setSnapshot({ scaleChordState: null });
      mockState.markerDisplayMode = 'neutral-dots';
      expect(service.getMarkerCssClass('root')).toBe('fretboard__dot--neutral-dot');
    });
  });

  describe('getRoleCssClass', () => {
    it('should return empty string when no scaleChordState', () => {
      setSnapshot({ scaleChordState: null });
      expect(service.getRoleCssClass(1, 0)).toBe('');
    });

    it('should return correct class for a given role', () => {
      const mockNote = [
        { string: 1, fret: 0, note: 'C', selected: true, interval: '', visible: true },
      ];
      setSnapshot({
        notes: mockNote as any,
        scaleChordState: {
          scale: { type: 'scale', name: 'major', rootNote: 'C' } as any,
          chord: { type: 'chord', name: 'major', rootNote: 'C' } as any,
        },
      });

      const state = guitarNeckService.currentSnapshot()!.scaleChordState!;
      markerRoleService.computeRoles(mockNote as any, state.scale, state.chord);

      const cssClass = service.getRoleCssClass(0, 0);
      expect(cssClass).toBe('fretboard__dot--role-chord-root');
    });

    it('should return empty string for note without a role', () => {
      setSnapshot({
        scaleChordState: {
          scale: { type: 'scale', name: 'major', rootNote: 'C' } as any,
          chord: { type: 'chord', name: 'major', rootNote: 'C' } as any,
        },
      });
      expect(service.getRoleCssClass(99, 99)).toBe('');
    });
  });

  describe('showNoteLabels', () => {
    it('should be true in interval-colors mode', () => {
      mockState.markerDisplayMode = 'interval-colors';
      expect(service.showNoteLabels).toBe(true);
    });

    it('should be true in note-names mode', () => {
      mockState.markerDisplayMode = 'note-names';
      expect(service.showNoteLabels).toBe(true);
    });

    it('should be false in neutral-dots mode', () => {
      mockState.markerDisplayMode = 'neutral-dots';
      expect(service.showNoteLabels).toBe(false);
    });
  });

  describe('hasRelation', () => {
    it('should be false when scaleChordState is null', () => {
      setSnapshot({ scaleChordState: null });
      expect(service.hasRelation).toBe(false);
    });

    it('should be true when scaleChordState exists', () => {
      setSnapshot({ scaleChordState: {} as any });
      expect(service.hasRelation).toBe(true);
    });
  });

  describe('getActiveIntervals', () => {
    it('should return empty array when no active result', () => {
      setSnapshot({ hasActiveResult: false });
      expect(service.getActiveIntervals()).toEqual([]);
    });

    it('should return unique intervals from selected notes', () => {
      setSnapshot({
        hasActiveResult: true,
        notes: [
          { string: 1, fret: 0, note: 'C', selected: true, interval: 'root', visible: true },
          { string: 2, fret: 1, note: 'E', selected: true, interval: 'major-3rd', visible: true },
          { string: 3, fret: 2, note: 'G', selected: true, interval: 'perfect-5th', visible: true },
        ] as any,
      });

      const intervals = service.getActiveIntervals();
      expect(intervals).toContain('root');
      expect(intervals).toContain('major-3rd');
      expect(intervals).toContain('perfect-5th');
    });
  });
});