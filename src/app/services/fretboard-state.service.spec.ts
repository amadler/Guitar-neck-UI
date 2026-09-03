import { TestBed } from '@angular/core/testing';
import { FretboardStateService } from './fretboard-state.service';
import { FretboardNotePositionService } from './note.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('GuitarNeckService', () => {
  let service: FretboardStateService;
  let noteServiceSpy: jasmine.SpyObj<FretboardNotePositionService>;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    mockNotes = [
      { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true },
      { string: 2, fret: 0, note: 'A', selected: false, interval: '', visible: true },
      { string: 1, fret: 5, note: 'A', selected: false, interval: '', visible: true }
    ];

    noteServiceSpy = jasmine.createSpyObj('FretboardNotePositionService', ['getAllPositions']);

    noteServiceSpy.getAllPositions.and.returnValue(mockNotes);

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
    expect(noteServiceSpy.getAllPositions).toHaveBeenCalled();
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
      expect(selectedNotes[0].selected).toBeTrue();
      expect(selectedNotes[0].visible).toBeTrue();
    });

    it('should deselect and hide unspecified notes', () => {
      const notesToSelect = [mockNotes[0]];
      service.applyHighlightedNotes(notesToSelect);

      const unselectedNotes = service.notes.filter(note => note !== mockNotes[0]);
      unselectedNotes.forEach(note => {
        expect(note.selected).toBeFalse();
        expect(note.visible).toBeFalse();
      });
    });
  });

  describe('hideAllNotes and showAllNotes', () => {
    it('should hide all notes', () => {
      service.hideAllNotes();
      expect(service.notes.every(note => !note.visible)).toBeTrue();
    });

    it('should show all notes', () => {
      service.hideAllNotes();
      service.showAll();
      expect(service.notes.every(note => note.visible)).toBeTrue();
    });
  });

  describe('removeSelections', () => {
    it('should remove all selections', () => {
      service.notes[0].selected = true;
      service.clearSelection();
      expect(service.notes.every(note => !note.selected)).toBeTrue();
    });
  });

  describe('clearFretboard', () => {
    it('should clear notes, selections, and intervals', () => {
      service.clearFretboard();

      expect(service.notes.every(note => !note.visible)).toBeTrue();
      expect(service.notes.every(note => !note.selected)).toBeTrue();
    });
  });

  describe('hasActiveResult', () => {
    it('should be false by default', () => {
      expect(service.hasActiveResult).toBeFalse();
    });

    it('should be true after applyHighlightedNotes with notes', () => {
      service.applyHighlightedNotes([mockNotes[0]]);
      expect(service.hasActiveResult).toBeTrue();
    });

    it('should be false after applyHighlightedNotes with empty array', () => {
      service.applyHighlightedNotes([]);
      expect(service.hasActiveResult).toBeFalse();
    });

    it('should be true after showAll', () => {
      service.showAll();
      expect(service.hasActiveResult).toBeTrue();
    });

    it('should be false after clearFretboard', () => {
      service.applyHighlightedNotes([mockNotes[0]]);
      expect(service.hasActiveResult).toBeTrue();
      service.clearFretboard();
      expect(service.hasActiveResult).toBeFalse();
    });
  });
});
