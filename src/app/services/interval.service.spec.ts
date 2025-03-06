import { TestBed } from '@angular/core/testing';
import { IntervalService } from './interval.service';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from '../shared/model/neckConfig';

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
      { string: 1, fret: 0, note: 'C', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 2, fret: 1, note: 'E', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 3, fret: 2, note: 'G', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 4, fret: 3, note: 'A', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true }
    ];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('markRootThirdFifth', () => {
    it('should mark root, third, and fifth for C major', () => {
      service.markRootThirdFifth('C', 'Major', mockNotes);

      const cNote = mockNotes.find(n => n.note === 'C');
      const eNote = mockNotes.find(n => n.note === 'E');
      const gNote = mockNotes.find(n => n.note === 'G');

      expect(cNote?.isRoot).toBeTrue();
      expect(eNote?.isThird).toBeTrue();
      expect(gNote?.isFifth).toBeTrue();
    });

    it('should mark root, third, and fifth for A minor', () => {
      service.markRootThirdFifth('A', 'Minor', mockNotes);

      const aNote = mockNotes.find(n => n.note === 'A');
      const cNote = mockNotes.find(n => n.note === 'C');
      const eNote = mockNotes.find(n => n.note === 'E');

      expect(aNote?.isRoot).toBeTrue();
      expect(cNote?.isThird).toBeTrue();
      expect(eNote?.isFifth).toBeTrue();
    });

    it('should handle chromatic wrapping correctly', () => {
      // Testing with B major (B-D#-F#)
      const bMajorNotes: GuitarNote[] = [
        { string: 1, fret: 0, note: 'B', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true },
        { string: 2, fret: 1, note: 'D#', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true },
        { string: 3, fret: 2, note: 'F#', selected: true, isRoot: false, isFifth: false, isThird: false, visible: true }
      ];

      service.markRootThirdFifth('B', 'Major', bMajorNotes);

      expect(bMajorNotes[0].isRoot).toBeTrue();
      expect(bMajorNotes[1].isThird).toBeTrue();
      expect(bMajorNotes[2].isFifth).toBeTrue();
    });
  });

  describe('removeIntervals', () => {
    it('should remove all interval markings', () => {
      // First mark some intervals
      service.markRootThirdFifth('C', 'Major', mockNotes);

      // Then remove them
      service.removeIntervals(mockNotes);

      mockNotes.forEach(note => {
        expect(note.isRoot).toBeFalse();
        expect(note.isThird).toBeFalse();
        expect(note.isFifth).toBeFalse();
      });
    });

    it('should handle empty array', () => {
      expect(() => service.removeIntervals([])).not.toThrow();
    });
  });
});
