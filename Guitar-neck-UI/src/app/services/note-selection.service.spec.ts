import { TestBed } from '@angular/core/testing';
import { NoteSelectionService } from './note-selection.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('NoteSelectionService', () => {
  let service: NoteSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
describe('NoteSelectionService', () => {
  let service: NoteSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoteSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('selectNotes', () => {
    it('should select the specified notes and mark them as visible and selected', () => {
      const notes: GuitarNote[] = [
        { note: 'A', string: 1, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'B', string: 2, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'C', string: 3, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ];
      const allNotes: GuitarNote[] = [
        { note: 'A', string: 1, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'B', string: 2, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'C', string: 3, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'D', string: 4, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ];

      const selectedNotes = service.selectNotes(notes, allNotes);

      expect(selectedNotes).toEqual([
        { note: 'A', string: 1, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'B', string: 2, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'C', string: 3, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ]);
    });
  });

  describe('selectScale', () => {
    it('should select the notes of the specified scale and mark them as visible and selected', () => {
      const scaleName = 'Major';
      const rootNote = 'C';
      const allNotes: GuitarNote[] = [
        { note: 'C', string: 1, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'D', string: 2, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'E', string: 3, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'F', string: 4, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'G', string: 5, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'A', string: 6, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'B', string: 7, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ];

      const selectedNotes = service.selectScale(scaleName, rootNote, allNotes);

      expect(selectedNotes).toEqual([
        { note: 'C', string: 1, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'D', string: 2, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'E', string: 3, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'F', string: 4, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'G', string: 5, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'A', string: 6, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'B', string: 7, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ]);
    });
  });

  describe('selectTriad', () => {
    it('should select the notes of the specified triad and mark them as visible and selected', () => {
      const triadType = 'Major';
      const rootNote = 'C';
      const allNotes: GuitarNote[] = [
        { note: 'C', string: 1, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'D', string: 2, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'E', string: 3, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'F', string: 4, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'G', string: 5, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'A', string: 6, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'B', string: 7, visible: false, selected: false, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ];

      const selectedNotes = service.selectTriad(triadType, rootNote, allNotes);

      expect(selectedNotes).toEqual([
        { note: 'C', string: 1, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'E', string: 3, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false },
        { note: 'G', string: 5, visible: true, selected: true, fret: 0, isRoot: false, isFifth: false, isThird: false }
      ]);
    });
  });
});
