import { TestBed } from '@angular/core/testing';
import { NoteSelectionService } from './note-selection.service';
import { MusicTheoryFacadeService } from './music-theory-facade.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('NoteSelectionService', () => {
  let service: NoteSelectionService;
  let musicTheoryFacadeSpy: jasmine.SpyObj<MusicTheoryFacadeService>;
  let mockNotes: GuitarNote[];

  beforeEach(() => {
    mockNotes = [
      { string: 1, fret: 0, note: 'C', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 2, fret: 4, note: 'E', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true },
      { string: 3, fret: 7, note: 'G', selected: false, isRoot: false, isFifth: false, isThird: false, visible: true }
    ];

    musicTheoryFacadeSpy = jasmine.createSpyObj('MusicTheoryFacadeService', [
      'selectScale',
      'selectTriad',
      'clearFretboard'
    ]);

    TestBed.configureTestingModule({
      providers: [
        NoteSelectionService,
        { provide: MusicTheoryFacadeService, useValue: musicTheoryFacadeSpy }
      ]
    });

    service = TestBed.inject(NoteSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should select scale using music theory facade', () => {
    musicTheoryFacadeSpy.selectScale.and.returnValue(mockNotes);

    const result = service.selectScale('Major', 'C');

    expect(musicTheoryFacadeSpy.selectScale).toHaveBeenCalledWith('Major', 'C');
    expect(result).toEqual(mockNotes);
  });

  it('should select triad using music theory facade', () => {
    musicTheoryFacadeSpy.selectTriad.and.returnValue(mockNotes);

    const result = service.selectTriad('C', 'Major');

    expect(musicTheoryFacadeSpy.selectTriad).toHaveBeenCalledWith('C', 'Major');
    expect(result).toEqual(mockNotes);
  });

  it('should clear fretboard using music theory facade', () => {
    service.clearFretboard();

    expect(musicTheoryFacadeSpy.clearFretboard).toHaveBeenCalled();
  });
});
