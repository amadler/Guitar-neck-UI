import { TestBed } from '@angular/core/testing';
import { FretboardStateService } from './guitar-neck.service';
import { FretboardNotePositionService } from './note.service';
import { IntervalService } from './interval.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from 'guitar-neck-shared';

describe('GuitarNeckService', () => {
  let service: FretboardStateService;
  let noteServiceSpy: jasmine.SpyObj<FretboardNotePositionService>;
  let intervalServiceSpy: jasmine.SpyObj<IntervalService>;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    mockNotes = [
      { string: 1, fret: 0, note: 'E', selected: false, interval: '', visible: true },
      { string: 2, fret: 0, note: 'A', selected: false, interval: '', visible: true },
      { string: 1, fret: 5, note: 'A', selected: false, interval: '', visible: true }
    ];

    noteServiceSpy = jasmine.createSpyObj('FretboardNotePositionService', ['getAllPositions']);
    intervalServiceSpy = jasmine.createSpyObj('IntervalService', ['removeIntervals']);

    noteServiceSpy.getAllPositions.and.returnValue(mockNotes);

    TestBed.configureTestingModule({
      providers: [
        FretboardStateService,
        { provide: FretboardNotePositionService, useValue: noteServiceSpy },
        { provide: IntervalService, useValue: intervalServiceSpy }
      ]
    });

    service = TestBed.inject(FretboardStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with correct strings and frets', () => {
    expect(service.strings).toEqual(neckConfig.stringNotes);
    expect(service.frets.length).toBe(neckConfig.numberOfFrets);
  });

  it('should initialize activeStrings with all true', () => {
    expect(service.activeStrings.length).toBe(neckConfig.stringNotes.length);
    expect(service.activeStrings.every(Boolean)).toBeTrue();
  });

  it('should initialize notes from NoteService', () => {
    expect(noteServiceSpy.getAllPositions).toHaveBeenCalled();
    expect(service.notes).toEqual(mockNotes);
  });

  describe('isNoteOnFret', () => {
    it('should return true when note exists on specific fret', () => {
      expect(service.isNoteOnFret('E', 0)).toBeTrue();
    });

    it('should return false when note does not exist on specific fret', () => {
      expect(service.isNoteOnFret('E', 1)).toBeFalse();
    });

    it('should return false when the string is toggled off', () => {
      service.toggleString(0, false);
      expect(service.isNoteOnFret('E', 0)).toBeFalse();
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

  describe('toggleString', () => {
    it('should set a string as inactive', () => {
      service.toggleString(0, false);
      expect(service.activeStrings[0]).toBeFalse();
    });

    it('should set a string as active', () => {
      service.toggleString(0, false);
      service.toggleString(0, true);
      expect(service.activeStrings[0]).toBeTrue();
    });

    it('should ignore out-of-range index', () => {
      service.toggleString(99, false);
      expect(service.activeStrings.every(Boolean)).toBeTrue();
    });
  });

  describe('clearFretboard', () => {
    it('should clear notes, selections, and intervals but preserve activeStrings', () => {
      service.toggleString(0, false);
      service.toggleString(1, false);
      service.clearFretboard();

      expect(intervalServiceSpy.removeIntervals).toHaveBeenCalledWith(service.notes);
      expect(service.notes.every(note => !note.visible)).toBeTrue();
      expect(service.notes.every(note => !note.selected)).toBeTrue();
      // activeStrings must persist — only the user can change them manually
      expect(service.activeStrings[0]).toBeFalse();
      expect(service.activeStrings[1]).toBeFalse();
    });
  });
});
