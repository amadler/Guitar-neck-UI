import { GuitarNeckService } from "../services/guitar-neck.service";
import { NoteSelectionService } from "../services/note-selection.service";
import { NoteService } from "../services/note.service";
import { SCALE_PATTERNS } from "./model/scaleTypes";
import { TRIAD_PATTERNS } from "./model/triadTypes";

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
    private keys: string) {}

    execute(): void {
      const scalePattern = SCALE_PATTERNS.find(pattern => pattern.name === this.scaleName);
      if (scalePattern) {
        const selectedNotes = this.noteSelectionService.selectScale(scalePattern.name, this.keys);
      } else {
        console.error(`Scale pattern not found: ${this.scaleName}`);
      }
    }
}

export class DisplayTriadCommand implements Command {
  constructor(
    private noteSelectionService: NoteSelectionService,
    private triadName: string,
    private keys: string) {}

  execute(): void {
    const triadPattern = TRIAD_PATTERNS.find(pattern => pattern.name === this.triadName);
    if (triadPattern) {
      const selectedNotes = this.noteSelectionService.selectTriad(triadPattern.name, this.keys);
    } else {
      console.error(`Triad pattern not found: ${this.triadName}`);
    }
  }
}
