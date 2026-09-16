import type { MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardStateService } from './fretboard-state.service';
import { FretboardNotePositionService } from './note.service';
import { GuitarNote, createGuitarNote } from '../shared/model/guitarNote';

describe('GuitarNeckService', () => {
  let service: FretboardStateService;
  let noteServiceSpy: Partial<MockedObject<FretboardNotePositionService>>;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    mockNotes = [
      createGuitarNote(1, 0, 'E'),
      createGuitarNote(2, 0, 'A'),
      createGuitarNote(1, 5, 'A'),
    ];

    noteServiceSpy = {
      getAllPositions: vi.fn().mockName("FretboardNotePositionService.getAllPositions")
    };

    noteServiceSpy.getAllPositions!.mockReturnValue(mockNotes);

    TestBed.configureTestingModule({
      providers: [
        FretboardStateService,
        { provide: FretboardNotePositionService, useValue: noteServiceSpy },
      ]
    });

    service = TestBed.inject(FretboardStateService);
    service.initialize(mockNotes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null snapshot', () => {
    expect(service.currentSnapshot()).toBeNull();
  });

  describe('applyHighlightedNotes', () => {
    it('should return a snapshot with selected notes visible', () => {
      const notesToSelect = [mockNotes[0]];
      const snapshot = service.applyHighlightedNotes(notesToSelect);

      expect(snapshot.hasActiveResult).toBe(true);
      expect(snapshot.notes.length).toBe(3);

      const selectedNote = snapshot.notes.find(n => n.string === 1 && n.fret === 0);
      expect(selectedNote).toBeDefined();
      expect(selectedNote!.visible).toBe(true);
      expect(selectedNote!.selected).toBe(true);
    });

    it('should return a snapshot with unselected notes hidden', () => {
      const notesToSelect = [mockNotes[0]];
      const snapshot = service.applyHighlightedNotes(notesToSelect);

      const unselectedNotes = snapshot.notes.filter(n => n.string !== 1 || n.fret !== 0);
      unselectedNotes.forEach(note => {
        expect(note.selected).toBe(false);
        expect(note.visible).toBe(false);
      });
    });

    it('should not mutate the original allPositions array', () => {
      const notesToSelect = [mockNotes[0]];
      service.applyHighlightedNotes(notesToSelect);

      // Original notes should still have default values
      expect(mockNotes[0].visible).toBe(true);
      expect(mockNotes[0].selected).toBe(false);
    });
  });

  describe('hideAllNotes', () => {
    it('should return a snapshot with all notes hidden', () => {
      const snapshot = service.hideAllNotes();
      expect(snapshot.notes.every(note => !note.visible)).toBe(true);
      expect(snapshot.hasActiveResult).toBe(false);
    });
  });

  describe('showAll', () => {
    it('should return a snapshot with all notes visible', () => {
      const snapshot = service.showAll();
      expect(snapshot.notes.every(note => note.visible)).toBe(true);
      expect(snapshot.hasActiveResult).toBe(true);
    });
  });

  describe('clearFretboard', () => {
    it('should set an empty snapshot (not null) so the fretboard stays rendered', () => {
      // First set a snapshot
      const snapshot = service.applyHighlightedNotes([mockNotes[0]]);
      service.setSnapshot(snapshot);
      expect(service.currentSnapshot()).not.toBeNull();
      expect(service.currentSnapshot()!.hasActiveResult).toBe(true);

      // Then clear — snapshot should still exist but be empty
      service.clearFretboard();
      expect(service.currentSnapshot()).not.toBeNull();
      expect(service.currentSnapshot()!.hasActiveResult).toBe(false);
      expect(service.currentSnapshot()!.notes.every(n => n.visible === false)).toBe(true);
    });
  });

  describe('snapshot includes currentSelection and scaleChordState', () => {
    it('should pass currentSelection and scaleChordState through to snapshot', () => {
      const selection = { type: 'scale' as const, name: 'major', rootNote: 'C' };
      const scaleChordState = { scale: selection, chord: null };
      const snapshot = service.applyHighlightedNotes([mockNotes[0]], undefined, selection, scaleChordState);

      expect(snapshot.currentSelection).toEqual(selection);
      expect(snapshot.scaleChordState).toEqual(scaleChordState);
    });
  });
});