import { beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardOrchestrationService } from './fretboard-orchestration.service';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService, ScaleChordState } from './fretboard-state.service';
import { MarkerRoleService } from './marker-role.service';
import { TonalFacadeService } from './tonal-facade.service';
import { GuitarNote, createGuitarNote } from '../shared/model/guitarNote';
import { signal } from "@angular/core";
import { MusicSelection } from "../shared/model/music-selection";
import { FretboardSnapshot } from "../shared/model/fretboard-snapshot";

describe('FretboardOrchestrationService', () => {
  let service: FretboardOrchestrationService;
  let noteService: MockedObject<FretboardNotePositionService>;
  let guitarNeckService: MockedObject<FretboardStateService>;
  let markerRoleService: MockedObject<MarkerRoleService>;
  let tonalFacade: MockedObject<TonalFacadeService>;

  const mockNote = (string: number, fret: number, note: string): GuitarNote =>
    createGuitarNote(string, fret, note, false);

  /** Create a minimal FretboardSnapshot for testing. */
  function makeSnapshot(notes: GuitarNote[]): FretboardSnapshot {
    return {
      notes: notes.map(n => ({
        string: n.string,
        fret: n.fret,
        note: n.note,
        visible: true,
        selected: true,
        interval: '',
      })),
      hasActiveResult: notes.length > 0,
      currentSelection: null,
      scaleChordState: null,
    };
  }

  beforeEach(() => {
    const noteSpy = {
      findPositionsByScaleNotes: vi.fn().mockName("FretboardNotePositionService.findPositionsByScaleNotes")
    };
    const currentSnapshot = signal<FretboardSnapshot | null>(null);
    const neckSpy = {
      applyHighlightedNotes: vi.fn().mockName("FretboardStateService.applyHighlightedNotes"),
      clearFretboard: vi.fn().mockName("FretboardStateService.clearFretboard"),
      currentSnapshot,
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

      const snapshot = makeSnapshot(positions);
      guitarNeckService.applyHighlightedNotes.mockReturnValue(snapshot);

      tonalFacade.intervalBetween.mockReturnValue('1P');
      tonalFacade.mapInterval.mockReturnValue('root');
      tonalFacade.simplifyNote.mockImplementation((n: string) => n);

      service.displayScale('major', 'C');

      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(scaleNotes);
      expect(guitarNeckService.applyHighlightedNotes).toHaveBeenCalledWith(positions, expect.any(Map), null, null);
    });
  });

  describe('displayChord', () => {
    it('should clear fretboard, resolve chord, find positions, highlight, and mark intervals', () => {
      tonalFacade.resolvePattern.mockReturnValue({ simplified: ['C', 'E', 'G'], raw: ['C', 'E', 'G'] });

      const positions = [mockNote(1, 0, 'C'), mockNote(2, 0, 'E')];
      noteService.findPositionsByScaleNotes.mockReturnValue(positions);

      const snapshot = makeSnapshot(positions);
      guitarNeckService.applyHighlightedNotes.mockReturnValue(snapshot);

      tonalFacade.intervalBetween.mockReturnValue('1P');
      tonalFacade.mapInterval.mockReturnValue('root');
      tonalFacade.simplifyNote.mockImplementation((n: string) => n);

      service.displayChord('major', 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'chord');
    });
  });

  describe('displayCustomPattern', () => {
    it('should clear fretboard, find positions, highlight, and mark intervals', () => {
      const notes = ['C', 'D', 'E'];
      const positions = [mockNote(1, 0, 'C')];
      noteService.findPositionsByScaleNotes.mockReturnValue(positions);

      const snapshot = makeSnapshot(positions);
      guitarNeckService.applyHighlightedNotes.mockReturnValue(snapshot);

      tonalFacade.intervalBetween.mockReturnValue('1P');
      tonalFacade.mapInterval.mockReturnValue('root');

      service.displayCustomPattern(notes, 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(notes);
    });
  });

  describe('displayScaleWithChord', () => {
    it('should resolve both scale and chord, combine positions, and compute roles', () => {
      tonalFacade.resolvePattern.mockImplementation((name: string, root: string, type: string) => {
        if (type === 'scale')
          return { simplified: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], raw: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] };
        return { simplified: ['C', 'E', 'G'], raw: ['C', 'E', 'G'] };
      });

      const scalePositions = [mockNote(1, 0, 'C')];
      const outsidePositions: GuitarNote[] = [];
      noteService.findPositionsByScaleNotes.mockReturnValueOnce(scalePositions).mockReturnValueOnce(outsidePositions);

      const snapshot = makeSnapshot(scalePositions);
      guitarNeckService.applyHighlightedNotes.mockReturnValue(snapshot);

      markerRoleService.computeRoles.mockReturnValue(new Map());

      service.displayScaleWithChord('major', 'C', 'major', 'C');

      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'chord');
      expect(markerRoleService.computeRoles).toHaveBeenCalled();
    });
  });
});