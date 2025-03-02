import { GuitarNeckService } from "../services/guitar-neck.service";
import { NoteSelectionService } from "../services/note-selection.service";
import { NoteService } from "../services/note.service";
import { ExtendedChordService } from '../services/extended-chord.service';

export interface Command {
  execute(): void;
}

export class DisplaySingleNoteCommand implements Command {
  constructor(
    private noteService: NoteService,
    private guitarNeckService: GuitarNeckService,
    private keys: string) {}

  execute(): void {
    const notes = this.noteService.getNotesByNoteName(this.keys);
    this.guitarNeckService.selectNotes(notes);
  }
}

export class DisplayAllNotesCommand implements Command {
  constructor(private guitarNeckService: GuitarNeckService) {}

  execute(): void {
    this.guitarNeckService.showAllNotes();
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

export class DisplayTriadCommand implements Command {
  constructor(
    private noteSelectionService: NoteSelectionService,
    private triadName: string,
    private rootNote: string
  ) {}

  execute(): void {
    this.noteSelectionService.selectTriad(this.triadName, this.rootNote)
      .subscribe({
        next: (notes) => console.log('Triad displayed:', notes),
        error: (error) => console.error('Error displaying triad:', error)
      });
  }
}

export class DisplayExtendedChordCommand implements Command {
  constructor(
    private extendedChordService: ExtendedChordService,
    private chordName: string,
    private rootNote: string
  ) {}

  execute(): void {
    this.extendedChordService.selectExtendedChord(this.chordName, this.rootNote)
      .subscribe({
        next: (notes) => console.log('Extended chord displayed:', notes),
        error: (error) => console.error('Error displaying extended chord:', error)
      });
  }
}
