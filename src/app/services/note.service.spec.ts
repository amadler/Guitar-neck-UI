import { TestBed } from '@angular/core/testing';
import { FretboardNotePositionService } from './note.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from '../shared/model/neckConfig';

describe('NoteService', () => {
  let service: FretboardNotePositionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FretboardNotePositionService]
    });
    service = TestBed.inject(FretboardNotePositionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with correct number of strings and frets', () => {
    expect(service.guitarStrings).toEqual(neckConfig.stringNotes);
    expect(service.fretsCount).toBe(neckConfig.numberOfFrets);
  });

  it('should generate correct number of notes for the fretboard', () => {
    const expectedNotesCount = service.guitarStrings.length * (service.fretsCount + 1);
    expect(service.getAllPositions().length).toBe(expectedNotesCount);
  });

  it('should calculate correct notes for open strings', () => {
    const openNotes = service.getAllPositions().filter(note => note.fret === 0);
    const expectedOpenNotes = neckConfig.stringNotes;

    openNotes.forEach((note, index) => {
      expect(note.note).toBe(expectedOpenNotes[index]);
    });
  });

  it('should return correct notes when searching by note name', () => {
    const eNotes = service.findPositionsByNoteName('E');

    eNotes.forEach(note => {
      expect(note.note).toBe('E');
    });

    // Standard tuning has E on 1st and 6th strings
    expect(eNotes.some(note => note.string === 1 && note.fret === 0)).toBeTrue();
    expect(eNotes.some(note => note.string === 6 && note.fret === 0)).toBeTrue();
  });

  it('should return correct notes for a scale', () => {
    const cMajorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const scaleNotes = service.findPositionsByScaleNotes(cMajorScale);

    scaleNotes.forEach(note => {
      expect(cMajorScale).toContain(note.note);
    });
  });

  it('should return correct notes for a triad', () => {
    const cMajorTriad = ['C', 'E', 'G'];
    const triadNotes = service.findPositionsByChordNotes(cMajorTriad);

    triadNotes.forEach(note => {
      expect(cMajorTriad).toContain(note.note);
    });
  });

  it('should calculate correct notes on specific frets', () => {
    // Test the 12th fret which should be an octave higher
    const openNotes = service.getAllPositions().filter(note => note.fret === 0);
    const twelfthFretNotes = service.getAllPositions().filter(note => note.fret === 12);

    openNotes.forEach((openNote, index) => {
      expect(openNote.note).toBe(twelfthFretNotes[index].note);
    });
  });
});
