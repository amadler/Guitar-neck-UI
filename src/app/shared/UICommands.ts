import { NoteSelectionService } from "../services/note-selection.service";

export interface Command {
  execute(): void;
}

export class DisplaySingleNoteCommand implements Command {
  constructor(
    private noteSelectionService: NoteSelectionService,
    private keys: string) {}

  execute(): void {
    this.noteSelectionService.selectNote(this.keys);
  }
}

export class DisplayAllNotesCommand implements Command {
  constructor(private noteSelectionService: NoteSelectionService,) {}

  execute(): void {
    // TODO: error handling for selectAllNotes if it returns an Observable
    this.noteSelectionService.selectAllNotes();
  }
}

export class DisplayScaleCommand implements Command {
  constructor(
    private noteSelectionService: NoteSelectionService,
    private scaleName: string,
    private rootNote: string
  ) {}

  execute(): void {
    this.noteSelectionService.selectScale(this.scaleName, this.rootNote)
      .subscribe({
        next: (notes) => console.log('Scale displayed:', notes),
        error: (error) => console.error('Error displaying scale:', error)
      });
  }
}

export class DisplayChordCommand implements Command {
  constructor(
    private noteSelectionService: NoteSelectionService,
    private triadName: string,
    private rootNote: string
  ) {}

  execute(): void {
    this.noteSelectionService.selectChord(this.triadName, this.rootNote)
      .subscribe({
        next: (notes) => console.log('Chord displayed:', notes),
        error: (error) => console.error('Error displaying chord:', error)
      });
  }
}

export class DisplayCustomPatternCommand implements Command {
  constructor(
    private noteSelectionService: NoteSelectionService,
    private intervals: number[],
    private rootNote: string
  ) {}

  execute(): void {
    const notes = this.calculateNotesFromIntervals();
    this.noteSelectionService.selectNotes(notes, this.rootNote).subscribe();
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

