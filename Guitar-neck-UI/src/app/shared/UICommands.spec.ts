import { TestBed } from '@angular/core/testing';
import {
  Command,
  DisplaySingleNoteCommand,
  DisplayAllNotesCommand,
  DisplayScaleCommand,
  DisplayTriadCommand
} from './UICommands';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { NoteService } from '../services/note.service';
import { NoteSelectionService } from '../services/note-selection.service';
import { GuitarNote } from './model/guitarNote';
import { SCALE_PATTERNS } from './model/scaleTypes';

describe('UICommands', () => {
  let guitarNeckService: jasmine.SpyObj<GuitarNeckService>;
  let noteService: jasmine.SpyObj<NoteService>;
  let noteSelectionService: jasmine.SpyObj<NoteSelectionService>;

  beforeEach(() => {
    guitarNeckService = jasmine.createSpyObj('GuitarNeckService', ['selectNotes', 'showAllNotes']);
    noteService = jasmine.createSpyObj('NoteService', ['getNotesByNoteName']);
    noteSelectionService = jasmine.createSpyObj('NoteSelectionService', ['selectScale', 'selectTriad']);

    TestBed.configureTestingModule({
      providers: [
        { provide: GuitarNeckService, useValue: guitarNeckService },
        { provide: NoteService, useValue: noteService },
        { provide: NoteSelectionService, useValue: noteSelectionService }
      ]
    });
  });

  describe('DisplaySingleNoteCommand', () => {
    it('should select notes for a given key', () => {
      const mockNotes: GuitarNote[] = [
        { string: 1, fret: 0, note: 'A', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true }
      ];
      noteService.getNotesByNoteName.and.returnValue(mockNotes);

      const command = new DisplaySingleNoteCommand(noteService, guitarNeckService, 'A');
      command.execute();

      expect(noteService.getNotesByNoteName).toHaveBeenCalledWith('A');
      expect(guitarNeckService.selectNotes).toHaveBeenCalledWith(mockNotes);
    });
  });

  describe('DisplayAllNotesCommand', () => {
    it('should show all notes', () => {
      const command = new DisplayAllNotesCommand(guitarNeckService);
      command.execute();

      expect(guitarNeckService.showAllNotes).toHaveBeenCalled();
    });
  });

  describe('DisplayScaleCommand', () => {
    let scalePatternsSpy: jasmine.Spy;

    beforeEach(() => {
      scalePatternsSpy = spyOn(SCALE_PATTERNS, 'find');
    });

    it('should select scale when pattern exists', () => {
      scalePatternsSpy.and.returnValue({ name: 'Major', intervals: [2, 2, 1, 2, 2, 2, 1] });
      const command = new DisplayScaleCommand(noteSelectionService, 'Major', 'C');
      command.execute();

      expect(noteSelectionService.selectScale).toHaveBeenCalledWith('Major', 'C');
    });

    it('should log error when scale pattern not found', () => {
      scalePatternsSpy.and.returnValue(undefined);
      spyOn(console, 'error');
      const command = new DisplayScaleCommand(noteSelectionService, 'InvalidScale', 'C');
      command.execute();

      expect(console.error).toHaveBeenCalledWith('Scale pattern not found: InvalidScale');
      expect(noteSelectionService.selectScale).not.toHaveBeenCalled();
    });
  });

  describe('DisplayTriadCommand', () => {
    it('should select triad when pattern exists', () => {
      const command = new DisplayTriadCommand(noteSelectionService, 'Major Triad', 'C');
      command.execute();

      expect(noteSelectionService.selectTriad).toHaveBeenCalledWith('C', 'Major Triad');
    });

    it('should log error when triad pattern not found', () => {
      spyOn(console, 'error');
      const command = new DisplayTriadCommand(noteSelectionService, 'InvalidTriad', 'C');
      command.execute();

      expect(console.error).toHaveBeenCalledWith('Triad pattern not found: InvalidTriad');
      expect(noteSelectionService.selectTriad).not.toHaveBeenCalled();
    });
  });
});
