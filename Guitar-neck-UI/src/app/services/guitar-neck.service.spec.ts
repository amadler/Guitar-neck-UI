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

  it('should check if note exists on specific fret', () => {
    expect(service.isNoteOnFret('E', 0)).toBeTrue();
    expect(service.isNoteOnFret('E', 1)).toBeFalse();
  });

  it('should get note from specific position', () => {
    const note = service.getNote('E', 0);
    expect(note).toEqual(mockNotes[0]);
  });

  it('should get note name from specific position', () => {
    // Test a position where a note exists
    expect(service.getNoteName('E', 0)).toBe('E');
    // Test a position where no note exists
    expect(service.getNoteName('C', 0)).toBe('');  // Changed from 'B' to 'C' since 'C' is not in mockNotes
  });

  it('should select specific notes', () => {
    const notesToSelect = [mockNotes[0]];
    const selectedNotes = service.selectNotes(notesToSelect);

    expect(selectedNotes.length).toBe(1);
    expect(selectedNotes[0].selected).toBeTrue();
    expect(selectedNotes[0].visible).toBeTrue();
  });

  it('should hide all notes', () => {
    service.hideAllNotes();
    expect(service.notes.every(note => !note.visible)).toBeTrue();
  });

  it('should show all notes', () => {
    service.hideAllNotes();
    service.showAllNotes();
    expect(service.notes.every(note => note.visible)).toBeTrue();
  });

  it('should remove all selections', () => {
    service.selectNotes([mockNotes[0]]);
    service.removeSelections();
    expect(service.notes.every(note => !note.selected)).toBeTrue();
  });

  it('should return note when fret is clicked', () => {
    const clickedNote = service.fretNoteClicked('E', 0);
    expect(clickedNote).toEqual(mockNotes[0]);
  });

  it('should clear fretboard', () => {
    service.clearFretboard();

    expect(intervalServiceSpy.removeIntervals).toHaveBeenCalledWith(service.notes);
    expect(service.notes.every(note => !note.visible)).toBeTrue();
    expect(service.notes.every(note => !note.selected)).toBeTrue();
  });
});
