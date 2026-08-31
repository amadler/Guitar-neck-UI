import { TestBed } from '@angular/core/testing';
import { FretboardOrchestrationService } from './fretboard-orchestration.service';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService } from './fretboard-state.service';
import { MarkerRoleService } from './marker-role.service';
import { TonalFacadeService } from './tonal-facade.service';
import { GuitarNote } from '../shared/model/guitarNote';

describe('FretboardOrchestrationService', () => {
  let service: FretboardOrchestrationService;
  let noteService: jasmine.SpyObj<FretboardNotePositionService>;
  let guitarNeckService: jasmine.SpyObj<FretboardStateService>;
  let markerRoleService: jasmine.SpyObj<MarkerRoleService>;
  let tonalFacade: jasmine.SpyObj<TonalFacadeService>;

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
    const tonalSpy = jasmine.createSpyObj('TonalFacadeService', [
      'resolvePattern',
      'intervalBetween',
      'mapInterval',
      'simplifyNote',
    ]);

    TestBed.configureTestingModule({
      providers: [
        FretboardOrchestrationService,
        { provide: FretboardNotePositionService, useValue: noteSpy },
        { provide: FretboardStateService, useValue: neckSpy },
        { provide: MarkerRoleService, useValue: markerSpy },
        { provide: TonalFacadeService, useValue: tonalSpy },
      ],
    });

    service = TestBed.inject(FretboardOrchestrationService);
    noteService = TestBed.inject(FretboardNotePositionService) as jasmine.SpyObj<FretboardNotePositionService>;
    guitarNeckService = TestBed.inject(FretboardStateService) as jasmine.SpyObj<FretboardStateService>;
    markerRoleService = TestBed.inject(MarkerRoleService) as jasmine.SpyObj<MarkerRoleService>;
    tonalFacade = TestBed.inject(TonalFacadeService) as jasmine.SpyObj<TonalFacadeService>;

    // Default mock setup
    guitarNeckService.notes = [];
    guitarNeckService.scaleChordState = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('displayScale', () => {
    it('should resolve scale, find positions, highlight, and mark intervals', () => {
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const rawNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      tonalFacade.resolvePattern.and.returnValue({ simplified: scaleNotes, raw: rawNotes });

      const positions = [mockNote(1, 0, 'C'), mockNote(1, 2, 'D')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);

      const highlighted = positions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.and.returnValue(highlighted);

      tonalFacade.intervalBetween.and.returnValue('1P');
      tonalFacade.mapInterval.and.returnValue('root');
      tonalFacade.simplifyNote.and.callFake((n: string) => n);

      const result = service.displayScale('major', 'C');

      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(scaleNotes);
      expect(guitarNeckService.applyHighlightedNotes).toHaveBeenCalledWith(positions);
      expect(result).toEqual(highlighted);
    });
  });

  describe('displayChord', () => {
    it('should clear fretboard, resolve chord, find positions, highlight, and mark intervals', () => {
      guitarNeckService.notes = [mockNote(1, 0, 'C')];
      tonalFacade.resolvePattern.and.returnValue({ simplified: ['C', 'E', 'G'], raw: ['C', 'E', 'G'] });

      const positions = [mockNote(1, 0, 'C'), mockNote(2, 0, 'E')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);

      const highlighted = positions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.and.returnValue(highlighted);

      tonalFacade.intervalBetween.and.returnValue('1P');
      tonalFacade.mapInterval.and.returnValue('root');
      tonalFacade.simplifyNote.and.callFake((n: string) => n);

      const result = service.displayChord('major', 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'chord');
      expect(result).toEqual(highlighted);
    });
  });

  describe('displayCustomPattern', () => {
    it('should clear fretboard, find positions, highlight, and mark intervals', () => {
      guitarNeckService.notes = [mockNote(1, 0, 'C')];
      const notes = ['C', 'D', 'E'];
      const positions = [mockNote(1, 0, 'C')];
      noteService.findPositionsByScaleNotes.and.returnValue(positions);

      const highlighted = positions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.and.returnValue(highlighted);

      tonalFacade.intervalBetween.and.returnValue('1P');
      tonalFacade.mapInterval.and.returnValue('root');

      const result = service.displayCustomPattern(notes, 'C');

      expect(guitarNeckService.clearFretboard).toHaveBeenCalled();
      expect(noteService.findPositionsByScaleNotes).toHaveBeenCalledWith(notes);
      expect(result).toEqual(highlighted);
    });
  });

  describe('displayScaleWithChord', () => {
    it('should resolve both scale and chord, combine positions, and compute roles', () => {
      guitarNeckService.notes = [mockNote(1, 0, 'C')];
      guitarNeckService.scaleChordState = null;

      tonalFacade.resolvePattern.and.callFake((name: string, root: string, type: string) => {
        if (type === 'scale') return { simplified: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], raw: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] };
        return { simplified: ['C', 'E', 'G'], raw: ['C', 'E', 'G'] };
      });

      const scalePositions = [mockNote(1, 0, 'C')];
      const outsidePositions: GuitarNote[] = [];
      noteService.findPositionsByScaleNotes.and.returnValues(scalePositions, outsidePositions);

      const highlighted = scalePositions.map(n => ({ ...n, visible: true, selected: true }));
      guitarNeckService.applyHighlightedNotes.and.returnValue(highlighted);

      markerRoleService.computeRoles.and.returnValue(new Map());

      const result = service.displayScaleWithChord('major', 'C', 'major', 'C');

      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'scale');
      expect(tonalFacade.resolvePattern).toHaveBeenCalledWith('major', 'C', 'chord');
      expect(guitarNeckService.scaleChordState).toBeTruthy();
      expect(markerRoleService.computeRoles).toHaveBeenCalled();
      expect(result).toEqual(highlighted);
    });
  });
});