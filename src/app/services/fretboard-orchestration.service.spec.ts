import { beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardOrchestrationService } from './fretboard-orchestration.service';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService, ScaleChordState } from './fretboard-state.service';
import { MarkerRoleService } from './marker-role.service';
import { TonalFacadeService } from './tonal-facade.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { signal } from "@angular/core";
import { MusicSelection } from "../shared/model/music-selection";

describe('FretboardOrchestrationService', () => {
  let service: FretboardOrchestrationService;
  let noteService: MockedObject<FretboardNotePositionService>;
  let guitarNeckService: MockedObject<FretboardStateService>;
  let markerRoleService: MockedObject<MarkerRoleService>;
  let tonalFacade: MockedObject<TonalFacadeService>;

  const mockNote = (string: number, fret: number, note: string): GuitarNote => ({ string, fret, note, selected: false, interval: '', visible: false }) as GuitarNote;

  beforeEach(() => {
    const noteSpy = {
      findPositionsByScaleNotes: vi.fn().mockName("FretboardNotePositionService.findPositionsByScaleNotes")
    };
    const neckSpy = {
      applyHighlightedNotes: vi.fn().mockName("FretboardStateService.applyHighlightedNotes"),
      clearFretboard: vi.fn().mockName("FretboardStateService.clearFretboard"),
      scaleChordState: signal<ScaleChordState | null>(null),
      hasActiveResult: signal(false),
      currentSelection: signal<MusicSelection | null>(null),
      notes: [],
    };
    const markerSpy = {
      computeRoles: vi.fn().mockName("MarkerRoleService.computeRoles")
    };
    const tonalSpy = {
      resolvePattern: vi.fn().mockName("TonalFacadeService.resolvePattern"),
      intervalBetween: vi.fn().mockName("TonalFacadeService.intervalBetween"),
      mapInterval: vi.fn().mockName("TonalFacadeService.mapInterval"),
      simplifyNote: vi.fn().mockName("TonalFacadeService.simplifyNote")
    };

    TestBed.configureTestingModule({
      providers: [
        FretboardOrchestrationService,
        { provide: FretboardNotePositionService, useValue: noteSpy },
        { provide: FretboardStateService, useValue: neckSpy },
        { provide: MarkerRoleService, useValue: markerSpy },
        { provide: TonalFacadeService, useValue: tonalSpy },
      ],
    });

    service = TestBed.inject(FretboardOrchestrationService);
    noteService = TestBed.inject(FretboardNotePositionService) as MockedObject<FretboardNotePositionService>;
    guitarNeckService = TestBed.inject(FretboardStateService) as MockedObject<FretboardStateService>;
    markerRoleService = TestBed.inject(MarkerRoleService) as MockedObject<MarkerRoleService>;
    tonalFacade = TestBed.inject(TonalFacadeService) as MockedObject<TonalFacadeService>;

    // Default mock setup
    guitarNeckService.notes = [];
    guitarNeckService.scaleChordState.set(null);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('displayScale', () => {
    it('should resolve scale, find positions, highlight, and mark intervals', () => {
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const rawNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      tonalFacade.resolvePattern.mockReturnValue({ simplified: scaleNotes, raw: rawNotes });

      const positions = [mockNote(1, 0, 'C'), mockNote(1, 2, 'D')];
      noteService.findPositionsByScaleNotes.mockReturnValue(positions);

      const highlighted = positions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.mockReturnValue(highlighted);

      tonalFacade.intervalBetween.mockReturnValue('1P');
      tonalFacade.mapInterval.mockReturnValue('root');
      tonalFacade.simplifyNote.mockImplementation((n: string) => n);

      const result = service.displayScale('major', 'C');

      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(scaleNotes);
      expect(guitarNeckService.applyHighlightedNotes).toHaveBeenCalledWith(positions);
      expect(result).toEqual(highlighted);
    });
  });

  describe('displayChord', () => {
    it('should clear fretboard, resolve chord, find positions, highlight, and mark intervals', () => {
      guitarNeckService.notes = [mockNote(1, 0, 'C')];
      tonalFacade.resolvePattern.mockReturnValue({ simplified: ['C', 'E', 'G'], raw: ['C', 'E', 'G'] });

      const positions = [mockNote(1, 0, 'C'), mockNote(2, 0, 'E')];
      noteService.findPositionsByScaleNotes.mockReturnValue(positions);

      const highlighted = positions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.mockReturnValue(highlighted);

      tonalFacade.intervalBetween.mockReturnValue('1P');
      tonalFacade.mapInterval.mockReturnValue('root');
      tonalFacade.simplifyNote.mockImplementation((n: string) => n);

      const result = service.displayChord('major', 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'chord');
      expect(result).toEqual(highlighted);
    });
  });

  describe('displayCustomPattern', () => {
    it('should clear fretboard, find positions, highlight, and mark intervals', () => {
      guitarNeckService.notes = [mockNote(1, 0, 'C')];
      const notes = ['C', 'D', 'E'];
      const positions = [mockNote(1, 0, 'C')];
      noteService.findPositionsByScaleNotes.mockReturnValue(positions);

      const highlighted = positions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.mockReturnValue(highlighted);

      tonalFacade.intervalBetween.mockReturnValue('1P');
      tonalFacade.mapInterval.mockReturnValue('root');

      const result = service.displayCustomPattern(notes, 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(notes);
      expect(result).toEqual(highlighted);
    });
  });

  describe('displayScaleWithChord', () => {
    it('should resolve both scale and chord, combine positions, and compute roles', () => {
      guitarNeckService.notes = [mockNote(1, 0, 'C')];
      guitarNeckService.scaleChordState.set(null);

      tonalFacade.resolvePattern.mockImplementation((name: string, root: string, type: string) => {
        if (type === 'scale')
          return { simplified: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], raw: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] };
        return { simplified: ['C', 'E', 'G'], raw: ['C', 'E', 'G'] };
      });

      const scalePositions = [mockNote(1, 0, 'C')];
      const outsidePositions: GuitarNote[] = [];
      noteService.findPositionsByScaleNotes.mockReturnValueOnce(scalePositions).mockReturnValueOnce(outsidePositions);

      const highlighted = scalePositions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.mockReturnValue(highlighted);

      markerRoleService.computeRoles.mockReturnValue(new Map());

      const result = service.displayScaleWithChord('major', 'C', 'major', 'C');

      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'chord');
      expect(guitarNeckService.scaleChordState()).toBeTruthy();
      expect(markerRoleService.computeRoles).toHaveBeenCalled();
      expect(result).toEqual(highlighted);
    });
  });
});
