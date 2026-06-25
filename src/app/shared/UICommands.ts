import { FretboardOrchestrationService } from "../services/music-theory-facade.service";

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
    this.fretboardOrchestrationService.displayScale(this.scaleName, this.rootNote)
      .subscribe({
        next: (notes) => console.log('Scale displayed:', notes),
        error: (error) => console.error('Error displaying scale:', error)
      });
  }
}

export class DisplayChordCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private triadName: string,
    private rootNote: string
  ) {}

  execute(): void {
    this.fretboardOrchestrationService.displayChord(this.triadName, this.rootNote)
      .subscribe({
        next: (notes) => console.log('Chord displayed:', notes),
        error: (error) => console.error('Error displaying chord:', error)
      });
  }
}

export class DisplayCustomPatternCommand implements Command {
  constructor(
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private intervals: number[],
    private rootNote: string
  ) {}

  execute(): void {
    const notes = this.calculateNotesFromIntervals();
    this.fretboardOrchestrationService.displayCustomPattern(notes, this.rootNote);
  }

  private calculateNotesFromIntervals(): string[] {
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = chromaticScale.indexOf(this.rootNote);
    const notes = [this.rootNote];

    let currentIndex = rootIndex;
    for (const interval of this.intervals) {
      currentIndex = (currentIndex + interval) % 12;
      notes.push(chromaticScale[currentIndex]);
    }

    return notes;
  }
}

