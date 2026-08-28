import { FretboardOrchestrationService } from "../services/music-theory-facade.service";
import { calculateNotesFromIntervals } from './interval-note.helper';

export interface Command {
  execute(): void;
}

export class DisplaySingleNoteCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private keys: string) {}

  execute(): void {
    this.fretboardOrchestrationService.displaySingleNote(this.keys);
  }
}

export class DisplayAllNotesCommand implements Command {
  constructor(private fretboardOrchestrationService: FretboardOrchestrationService,) {}

  execute(): void {
    this.fretboardOrchestrationService.displayAllNotes();
  }
}

export class DisplayScaleCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private scaleName: string,
    private rootNote: string
  ) {}

  execute(): void {
    const notes = this.fretboardOrchestrationService.displayScale(this.scaleName, this.rootNote);
    console.log('Scale displayed:', notes);
  }
}

export class DisplayChordCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private triadName: string,
    private rootNote: string
  ) {}

  execute(): void {
    const notes = this.fretboardOrchestrationService.displayChord(this.triadName, this.rootNote);
    console.log('Chord displayed:', notes);
  }
}

export class DisplayCustomPatternCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private intervals: number[],
    private rootNote: string
  ) {}

  execute(): void {
    const notes = calculateNotesFromIntervals(this.rootNote, this.intervals);
    this.fretboardOrchestrationService.displayCustomPattern(notes, this.rootNote);
  }
}