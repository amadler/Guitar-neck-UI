import { TestBed } from '@angular/core/testing';
import { FretboardNotePositionService } from './note.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from 'guitar-neck-shared';

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
        expect(eNotes.some(note => note.string === 1 && note.fret === 0)).toBe(true);
        expect(eNotes.some(note => note.string === 6 && note.fret === 0)).toBe(true);
    });

    it('should return correct notes for a scale', () => {
        const cMajorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const scaleNotes = service.findPositionsByScaleNotes(cMajorScale);

        scaleNotes.forEach(note => {
            expect(cMajorScale).toContain(note.note);
        });
    });

    it('should return correct notes for a triad (via findPositionsByScaleNotes)', () => {
        const cMajorTriad = ['C', 'E', 'G'];
        const triadNotes = service.findPositionsByScaleNotes(cMajorTriad);

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

    // ─── getNoteAtPosition ─────────────────────────────────────────────

    it('getNoteAtPosition should return C at string 5, fret 3', () => {
        expect(service.getNoteAtPosition(5, 3)).toBe('C');
    });

    it('getNoteAtPosition should return null for string 0', () => {
        expect(service.getNoteAtPosition(0, 3)).toBeNull();
    });

    it('getNoteAtPosition should return null for string 7', () => {
        expect(service.getNoteAtPosition(7, 3)).toBeNull();
    });

    it('getNoteAtPosition should return null for fret 25', () => {
        expect(service.getNoteAtPosition(1, 25)).toBeNull();
    });

    it('getNoteAtPosition should return open string note at fret 0', () => {
        expect(service.getNoteAtPosition(6, 0)).toBe('E');
        expect(service.getNoteAtPosition(5, 0)).toBe('A');
        expect(service.getNoteAtPosition(4, 0)).toBe('D');
        expect(service.getNoteAtPosition(3, 0)).toBe('G');
        expect(service.getNoteAtPosition(2, 0)).toBe('B');
        expect(service.getNoteAtPosition(1, 0)).toBe('E');
    });

    // ─── findPositionsByExactCoordinates ────────────────────────────────

    it('findPositionsByExactCoordinates should find a single position', () => {
        const positions = service.findPositionsByExactCoordinates([{ string: 5, fret: 3 }]);
        expect(positions.length).toBe(1);
        expect(positions[0].string).toBe(5);
        expect(positions[0].fret).toBe(3);
        expect(positions[0].note).toBe('C');
    });

    it('findPositionsByExactCoordinates should skip out-of-range positions', () => {
        const positions = service.findPositionsByExactCoordinates([
            { string: 5, fret: 3 },
            { string: 0, fret: 3 },
            { string: 5, fret: 25 },
        ]);
        expect(positions.length).toBe(1);
        expect(positions[0].string).toBe(5);
        expect(positions[0].fret).toBe(3);
    });

    it('findPositionsByExactCoordinates should return empty array for no matches', () => {
        const positions = service.findPositionsByExactCoordinates([{ string: 0, fret: 0 }]);
        expect(positions.length).toBe(0);
    });
});
