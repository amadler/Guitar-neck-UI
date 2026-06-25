import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  DisplaySingleNoteCommand,
  DisplayAllNotesCommand,
  DisplayScaleCommand,
  DisplayChordCommand
} from './UICommands';
import { FretboardOrchestrationService } from '../services/music-theory-facade.service';

describe('UICommands', () => {
  let fretboardOrchestrationService: jasmine.SpyObj<FretboardOrchestrationService>;

  beforeEach(() => {
    fretboardOrchestrationService = jasmine.createSpyObj('FretboardOrchestrationService', [
      'displaySingleNote',
      'displayAllNotes',
      'displayScale',
      'displayChord',
      'displayCustomPattern'
    ]);
    fretboardOrchestrationService.displayScale.and.returnValue(of([]));
    fretboardOrchestrationService.displayChord.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        { provide: FretboardOrchestrationService, useValue: fretboardOrchestrationService }
      ]
    });
  });

  describe('DisplaySingleNoteCommand', () => {
    it('should display a single note', () => {
      const command = new DisplaySingleNoteCommand(fretboardOrchestrationService, 'A');
      command.execute();

      expect(fretboardOrchestrationService.displaySingleNote).toHaveBeenCalledWith('A');
    });
  });

  describe('DisplayAllNotesCommand', () => {
    it('should show all notes', () => {
      const command = new DisplayAllNotesCommand(fretboardOrchestrationService);
      command.execute();

      expect(fretboardOrchestrationService.displayAllNotes).toHaveBeenCalled();
    });
  });

  describe('DisplayScaleCommand', () => {
    it('should display a scale', () => {
      const command = new DisplayScaleCommand(fretboardOrchestrationService, 'Major', 'C');
      command.execute();

      expect(fretboardOrchestrationService.displayScale).toHaveBeenCalledWith('Major', 'C');
    });
  });

  describe('DisplayTriadCommand', () => {
    it('should display a chord', () => {
      const command = new DisplayChordCommand(fretboardOrchestrationService, 'Major Triad', 'C');
      command.execute();

      expect(fretboardOrchestrationService.displayChord).toHaveBeenCalledWith('Major Triad', 'C');
    });
  });
});
