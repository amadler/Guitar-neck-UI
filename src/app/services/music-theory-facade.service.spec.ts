import { TestBed } from '@angular/core/testing';
import { FretboardOrchestrationService } from './music-theory-facade.service';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService } from './guitar-neck.service';
import { MarkerRoleService } from './marker-role.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('FretboardOrchestrationService', () => {
  let service: FretboardOrchestrationService;
  let noteService: jasmine.SpyObj<FretboardNotePositionService>;
  let guitarNeckService: jasmine.SpyObj<FretboardStateService>;
  let markerRoleService: jasmine.SpyObj<MarkerRoleService>;

  const mockNote = (string: number, fret: number, note: string): GuitarNote =>
    ({ string, fret, note, selected: false, interval: '', visible: false }) as GuitarNote;

  beforeEach(() => {
    const noteSpy = jasmine.createSpyObj('FretboardNotePositionService', [
      'findPositionsByScaleNotes',
    ]);
    const neckSpy = jasmine.createSpyObj('FretboardStateService', [
      'applyHighlightedNotes',
      'clearFretboard',
    ]);
    const markerSpy = jasmine.createSpyObj('MarkerRoleService', [
      'computeRoles',
    ]);

    TestBed.configureTestingModule({
      providers: [
        FretboardOrchestrationService,
        { provide: FretboardNotePositionService, useValue: noteSpy },
        { provide: FretboardStateService, useValue: neckSpy },
        { provide: MarkerRoleService, useValue: markerSpy },
      ],
    });

    service = TestBed.inject(FretboardOrchestrationService);
    noteService = TestBed.inject(FretboardNotePositionService) as jasmine.SpyObj<FretboardNotePositionService>;
    guitarNeckService = TestBed.inject(FretboardStateService) as jasmine.SpyObj<FretboardStateService>;
    markerRoleService = TestBed.inject(MarkerRoleService) as jasmine.SpyObj<MarkerRoleService>;

    // Default mock setup
    guitarNeckService.notes = [];
    guitarNeckService.scaleChordState = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('displayScale', () => {
    it('should find positions and highlight them for a known scale', () => {
      const positions = [mockNote(1, 0, 'E'), mockNote(1, 5, 'A')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);
      guitarNeckService.applyHighlightedNotes.and.returnValue(positions);

      const result = service.displayScale('major', 'C');

      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalled();
      expect(guitarNeckService.applyHighlightedNotes).toHaveBeenCalledWith(positions);
      expect(result).toEqual(positions);
    });

    it('should mark intervals on highlighted notes', () => {
      const positions = [mockNote(1, 0, 'C'), mockNote(1, 2, 'D')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);
      guitarNeckService.applyHighlightedNotes.and.returnValue(positions);

      service.displayScale('major', 'C');

      // Root note should have interval 'root'
      expect(positions[0].interval).toBe('root');
      // D should have an interval set (not empty)
      expect(positions[1].interval).not.toBe('');
    });
  });

  describe('displayChord', () => {
    it('should clear fretboard then display chord notes', () => {
      const positions = [mockNote(1, 0, 'C'), mockNote(1, 4, 'E'), mockNote(1, 7, 'G')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);
      guitarNeckService.applyHighlightedNotes.and.returnValue(positions);

      const result = service.displayChord('major', 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalled();
      expect(guitarNeckService.applyHighlightedNotes).toHaveBeenCalled();
      expect(result).toEqual(positions);
    });
  });

  describe('displayCustomPattern', () => {
    it('should display custom notes with intervals relative to root', () => {
      const notes = ['C', 'E', 'G'];
      const positions = [mockNote(1, 0, 'C'), mockNote(1, 4, 'E'), mockNote(1, 7, 'G')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);
      guitarNeckService.applyHighlightedNotes.and.returnValue(positions);

      const result = service.displayCustomPattern(notes, 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(notes);
      expect(result).toEqual(positions);
    });
  });

  describe('displayScaleWithChord', () => {
    it('should set scaleChordState and compute roles', () => {
      const scalePositions = [mockNote(1, 0, 'C')];
      const outsidePositions: GuitarNote[] = [];
      const allPositions = [...scalePositions, ...outsidePositions];

      noteService.findPositionsByScaleNotes.and.returnValues(scalePositions, outsidePositions);
      guitarNeckService.applyHighlightedNotes.and.returnValue(allPositions);

      service.displayScaleWithChord('major', 'C', 'major', 'C');

      expect(guitarNeckService.scaleChordState).not.toBeNull();
      expect(guitarNeckService.scaleChordState!.scale.name).toBe('major');
      expect(guitarNeckService.scaleChordState!.chord!.name).toBe('major');
      expect(markerRoleService.computeRoles).toHaveBeenCalled();
    });
  });
});