import { beforeEach, describe, expect, it, vi, type MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { FretboardStateService } from './fretboard-state.service';
import { FretboardNotePositionService } from './note.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('GuitarNeckService', () => {
  let service: FretboardStateService;
  let noteServiceSpy: Partial<MockedObject<FretboardNotePositionService>>;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    mockNotes = [
      { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true },
      { string: 2, fret: 0, note: 'A', selected: false, interval: '', visible: true },
      { string: 1, fret: 5, note: 'A', selected: false, interval: '', visible: true }
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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize notes from NoteService', () => {
    expect(noteServiceSpy.getAllPositions!).toHaveBeenCalled();
    expect(service.notes).toEqual(mockNotes);
  });

  it('should build notesMap from constructor for O(1) lookup', () => {
    const note = (service as any).notesMap.get('1-0');
    expect(note).toBeDefined();
    expect(note.note).toBe('E');
    expect(note.string).toBe(1);
    expect(note.fret).toBe(0);

    const note2 = (service as any).notesMap.get('2-0');
    expect(note2).toBeDefined();
    expect(note2.note).toBe('A');
    expect(note2.string).toBe(2);
    expect(note2.fret).toBe(0);

    const note3 = (service as any).notesMap.get('1-5');
    expect(note3).toBeDefined();
    expect(note3.note).toBe('A');
    expect(note3.string).toBe(1);
    expect(note3.fret).toBe(5);
  });

  describe('selectNotes', () => {
    it('should select and make visible specified notes', () => {
      const notesToSelect = [mockNotes[0]];
      const selectedNotes = service.applyHighlightedNotes(notesToSelect);

      expect(selectedNotes.length).toBe(1);
      expect(selectedNotes[0].selected).toBe(true);
      expect(selectedNotes[0].visible).toBe(true);
    });

    it('should deselect and hide unspecified notes', () => {
      const notesToSelect = [mockNotes[0]];
      service.applyHighlightedNotes(notesToSelect);

      const unselectedNotes = service.notes.filter(note => note !== mockNotes[0]);
      unselectedNotes.forEach(note => {
        expect(note.selected).toBe(false);
        expect(note.visible).toBe(false);
      });
    });
  });

  describe('hideAllNotes and showAllNotes', () => {
    it('should hide all notes', () => {
      service.hideAllNotes();
      expect(service.notes.every(note => !note.visible)).toBe(true);
    });

    it('should show all notes', () => {
      service.hideAllNotes();
      service.showAll();
      expect(service.notes.every(note => note.visible)).toBe(true);
    });
  });

  describe('removeSelections', () => {
    it('should remove all selections', () => {
      service.notes[0].selected = true;
      service.clearSelection();
      expect(service.notes.every(note => !note.selected)).toBe(true);
    });
  });

  describe('clearFretboard', () => {
    it('should clear notes, selections, and intervals', () => {
      service.clearFretboard();

      expect(service.notes.every(note => !note.visible)).toBe(true);
      expect(service.notes.every(note => !note.selected)).toBe(true);
    });
  });

  describe('hasActiveResult', () => {
    it('should be false by default', () => {
      expect(service.hasActiveResult()).toBe(false);
    });

    it('should be true after applyHighlightedNotes with notes', () => {
      service.applyHighlightedNotes([mockNotes[0]]);
      expect(service.hasActiveResult()).toBe(true);
    });

    it('should be false after applyHighlightedNotes with empty array', () => {
      service.applyHighlightedNotes([]);
      expect(service.hasActiveResult()).toBe(false);
    });

    it('should be true after showAll', () => {
      service.showAll();
      expect(service.hasActiveResult()).toBe(true);
    });

    it('should be false after clearFretboard', () => {
      service.applyHighlightedNotes([mockNotes[0]]);
      expect(service.hasActiveResult()).toBe(true);
      service.clearFretboard();
      expect(service.hasActiveResult()).toBe(false);
    });
  });
});
