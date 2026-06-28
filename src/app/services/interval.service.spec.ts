import { TestBed } from '@angular/core/testing';
import { IntervalService } from './interval.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from 'guitar-neck-shared';

describe('IntervalService', () => {
  let service: IntervalService;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IntervalService]
    });
    service = TestBed.inject(IntervalService);

    // Initialize mock notes before each test
    mockNotes = [
      { string: 1, fret: 0, note: 'C', selected: true, interval: '', visible: true },
      { string: 2, fret: 1, note: 'E', selected: true, interval: '', visible: true },
      { string: 3, fret: 2, note: 'G', selected: true, interval: '', visible: true },
      { string: 4, fret: 3, note: 'A', selected: true, interval: '', visible: true }
    ];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('markIntervals', () => {
    it('should mark root, third, and fifth for C major', () => {
      service.markIntervals('C', 'major', mockNotes);

      const cNote = mockNotes.find(n => n.note === 'C');
      const eNote = mockNotes.find(n => n.note === 'E');
      const gNote = mockNotes.find(n => n.note === 'G');

      expect(cNote?.interval).toBe('root');
      expect(eNote?.interval).toBe('major-3rd');
      expect(gNote?.interval).toBe('perfect-5th');
    });

    it('should mark root, third, and fifth for A minor', () => {
      service.markIntervals('A', 'minor', mockNotes);

      const aNote = mockNotes.find(n => n.note === 'A');
      const cNote = mockNotes.find(n => n.note === 'C');
      const eNote = mockNotes.find(n => n.note === 'E');

      expect(aNote?.interval).toBe('root');
      expect(cNote?.interval).toBe('minor-3rd');
      expect(eNote?.interval).toBe('perfect-5th');
    });

    it('should handle chromatic wrapping correctly', () => {
      // Testing with B major (B-D#-F#)
      const bMajorNotes: GuitarNote[] = [
        { string: 1, fret: 0, note: 'B', selected: true, interval: '', visible: true },
        { string: 2, fret: 1, note: 'D#', selected: true, interval: '', visible: true },
        { string: 3, fret: 2, note: 'F#', selected: true, interval: '', visible: true }
      ];

      service.markIntervals('B', 'major', bMajorNotes);

      expect(bMajorNotes[0].interval).toBe('root');
      expect(bMajorNotes[1].interval).toBe('major-3rd');
      expect(bMajorNotes[2].interval).toBe('perfect-5th');
    });

    describe('patternType parameter', () => {
      it('should use scale intervals when patternType is "scale" — C major scale has 7 notes', () => {
        // C major scale notes: C, D, E, F, G, A, B
        const scaleNotes: GuitarNote[] = [
          { string: 1, fret: 0, note: 'C', selected: true, interval: '', visible: true },
          { string: 2, fret: 2, note: 'D', selected: true, interval: '', visible: true },
          { string: 3, fret: 4, note: 'E', selected: true, interval: '', visible: true },
          { string: 4, fret: 5, note: 'F', selected: true, interval: '', visible: true },
          { string: 5, fret: 7, note: 'G', selected: true, interval: '', visible: true },
          { string: 6, fret: 9, note: 'A', selected: true, interval: '', visible: true },
          { string: 6, fret: 11, note: 'B', selected: true, interval: '', visible: true }
        ];

        service.markIntervals('C', 'major', scaleNotes, 'scale');

        expect(scaleNotes.find(n => n.note === 'C')?.interval).toBe('root');
        expect(scaleNotes.find(n => n.note === 'D')?.interval).toBe('major-2nd');
        expect(scaleNotes.find(n => n.note === 'E')?.interval).toBe('major-3rd');
        expect(scaleNotes.find(n => n.note === 'F')?.interval).toBe('perfect-4th');
        expect(scaleNotes.find(n => n.note === 'G')?.interval).toBe('perfect-5th');
        expect(scaleNotes.find(n => n.note === 'A')?.interval).toBe('major-6th');
        expect(scaleNotes.find(n => n.note === 'B')?.interval).toBe('major-7th');
      });

      it('should use chord intervals when patternType is "chord" — C major chord has 3 notes', () => {
        const chordNotes: GuitarNote[] = [
          { string: 1, fret: 0, note: 'C', selected: true, interval: '', visible: true },
          { string: 2, fret: 1, note: 'E', selected: true, interval: '', visible: true },
          { string: 3, fret: 2, note: 'G', selected: true, interval: '', visible: true }
        ];

        service.markIntervals('C', 'major', chordNotes, 'chord');

        expect(chordNotes.find(n => n.note === 'C')?.interval).toBe('root');
        expect(chordNotes.find(n => n.note === 'E')?.interval).toBe('major-3rd');
        expect(chordNotes.find(n => n.note === 'G')?.interval).toBe('perfect-5th');
      });

      it('should default to chord when patternType is not provided', () => {
        service.markIntervals('C', 'major', mockNotes);

        const eNote = mockNotes.find(n => n.note === 'E');
        expect(eNote?.interval).toBe('major-3rd');
      });

      it('should use scale intervals for A minor scale', () => {
        const scaleNotes: GuitarNote[] = [
          { string: 1, fret: 0, note: 'A', selected: true, interval: '', visible: true },
          { string: 2, fret: 2, note: 'B', selected: true, interval: '', visible: true },
          { string: 3, fret: 3, note: 'C', selected: true, interval: '', visible: true },
          { string: 4, fret: 5, note: 'D', selected: true, interval: '', visible: true },
          { string: 5, fret: 7, note: 'E', selected: true, interval: '', visible: true },
          { string: 6, fret: 8, note: 'F', selected: true, interval: '', visible: true },
          { string: 6, fret: 10, note: 'G', selected: true, interval: '', visible: true }
        ];

        service.markIntervals('A', 'minor', scaleNotes, 'scale');

        expect(scaleNotes.find(n => n.note === 'A')?.interval).toBe('root');
        expect(scaleNotes.find(n => n.note === 'B')?.interval).toBe('major-2nd');
        expect(scaleNotes.find(n => n.note === 'C')?.interval).toBe('minor-3rd');
        expect(scaleNotes.find(n => n.note === 'D')?.interval).toBe('perfect-4th');
        expect(scaleNotes.find(n => n.note === 'E')?.interval).toBe('perfect-5th');
        expect(scaleNotes.find(n => n.note === 'F')?.interval).toBe('minor-6th');
        expect(scaleNotes.find(n => n.note === 'G')?.interval).toBe('minor-7th');
      });
    });
  });

  describe('removeIntervals', () => {
    it('should remove all interval markings', () => {
      // First mark some intervals
      service.markIntervals('C', 'major', mockNotes);

      // Then remove them
      service.removeIntervals(mockNotes);

      mockNotes.forEach(note => {
        expect(note.interval).toBe('');
      });
    });

    it('should handle empty array', () => {
      expect(() => service.removeIntervals([])).not.toThrow();
    });
  });
});
