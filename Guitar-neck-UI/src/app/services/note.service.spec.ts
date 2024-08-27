import { NoteService } from './note.service';
import { ScaleService } from './scales.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('NoteService', () => {
  let noteService: NoteService;
  let scaleService: ScaleService;

  beforeEach(() => {
    scaleService = new ScaleService();
    noteService = new NoteService(scaleService);
  });

  it('should generate all notes on the fretboard', () => {
    const expectedNotes: GuitarNote[] = [
      // Define your expected notes here
    ];

    const allNotes = noteService.getAllnotes();

    expect(allNotes).toEqual(expectedNotes);
  });

  it('should filter notes by note name', () => {
    const noteName = 'C';
    const expectedNotes: GuitarNote[] = [
      // Define your expected notes here
    ];

    const filteredNotes = noteService.getNotesByNoteName(noteName);

    expect(filteredNotes).toEqual(expectedNotes);
  });

  it('should filter notes by scale', () => {
    const scaleName = 'Major scale';
    const rootNote = 'C';
    const expectedNotes: GuitarNote[] = [
      // Define your expected notes here
    ];

    const filteredNotes = noteService.getNotesByScale(scaleName, rootNote);

    expect(filteredNotes).toEqual(expectedNotes);
  });

  it('should filter notes by triad', () => {
    const triadType = 'Major Triad';
    const rootNote = 'C';
    const expectedNotes: GuitarNote[] = [
      // Define your expected notes here
    ];

    const filteredNotes = noteService.getNotesByTriad(triadType, rootNote);

    expect(filteredNotes).toEqual(expectedNotes);
  });
});
