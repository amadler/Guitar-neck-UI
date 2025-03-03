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

