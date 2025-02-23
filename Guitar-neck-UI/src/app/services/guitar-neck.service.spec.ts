import { TestBed } from '@angular/core/testing';
import { GuitarNeckService } from './guitar-neck.service';
import { NoteService } from './note.service';
import { IntervalService } from './interval.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from '../shared/model/neckConfig';

describe('GuitarNeckService', () => {
  let service: GuitarNeckService;
  let noteServiceSpy: jasmine.SpyObj<NoteService>;
  let intervalServiceSpy: jasmine.SpyObj<IntervalService>;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    mockNotes = [
      { string: 1, fret: 0, note: 'E', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 2, fret: 0, note: 'A', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 1, fret: 5, note: 'A', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true }
    ];

    noteServiceSpy = jasmine.createSpyObj('NoteService', ['getAllNotes']);
    intervalServiceSpy = jasmine.createSpyObj('IntervalService', ['removeIntervals']);

    noteServiceSpy.getAllNotes.and.returnValue(mockNotes);

    TestBed.configureTestingModule({
      providers: [
        GuitarNeckService,
        { provide: NoteService, useValue: noteServiceSpy },
        { provide: IntervalService, useValue: intervalServiceSpy }
      ]
    });

    service = TestBed.inject(GuitarNeckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with correct strings and frets', () => {
    expect(service.strings).toEqual(neckConfig.stringNotes);
    expect(service.frets.length).toBe(neckConfig.numberOfFrets - 1);
  });

  it('should initialize notes from NoteService', () => {
    expect(noteServiceSpy.getAllNotes).toHaveBeenCalled();
    expect(service.notes).toEqual(mockNotes);
  });

  describe('isNoteOnFret', () => {
    it('should return true when note exists on specific fret', () => {
      expect(service.isNoteOnFret('E', 0)).toBeTrue();
    });

    it('should return false when note does not exist on specific fret', () => {
      expect(service.isNoteOnFret('E', 1)).toBeFalse();
    });
  });

  describe('getNote', () => {
    it('should return note when it exists at position', () => {
      const note = service.getNote('E', 0);
      expect(note).toEqual(mockNotes[0]);
    });

    it('should return undefined when note does not exist at position', () => {
      const note = service.getNote('E', 1);
      expect(note).toBeUndefined();
    });
  });

  describe('getNoteName', () => {
    it('should return note name when note exists at position', () => {
      expect(service.getNoteName('E', 0)).toBe('E');
    });

    it('should return empty string when note does not exist at position', () => {
      expect(service.getNoteName('E', 1)).toBe('');
    });
  });

  describe('selectNotes', () => {
    it('should select and make visible specified notes', () => {
      const notesToSelect = [mockNotes[0]];
      const selectedNotes = service.selectNotes(notesToSelect);

      expect(selectedNotes.length).toBe(1);
      expect(selectedNotes[0].selected).toBeTrue();
      expect(selectedNotes[0].visible).toBeTrue();
    });

    it('should deselect and hide unspecified notes', () => {
      const notesToSelect = [mockNotes[0]];
      service.selectNotes(notesToSelect);

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
      service.showAllNotes();
      expect(service.notes.every(note => note.visible)).toBeTrue();
    });
  });

  describe('removeSelections', () => {
    it('should remove all selections', () => {
      service.notes[0].selected = true;
      service.removeSelections();
      expect(service.notes.every(note => !note.selected)).toBeTrue();
    });
  });

  describe('fretNoteClicked', () => {
    it('should return note when clicked on existing note', () => {
      const clickedNote = service.fretNoteClicked('E', 0);
      expect(clickedNote).toEqual(mockNotes[0]);
    });

    it('should return null when clicked on non-existing note', () => {
      const clickedNote = service.fretNoteClicked('E', 1);
      expect(clickedNote).toBeNull();
    });
  });

  describe('clearFretboard', () => {
    it('should clear all fretboard state', () => {
      service.clearFretboard();

      expect(intervalServiceSpy.removeIntervals).toHaveBeenCalledWith(service.notes);
      expect(service.notes.every(note => !note.visible)).toBeTrue();
      expect(service.notes.every(note => !note.selected)).toBeTrue();
    });
  });
});
