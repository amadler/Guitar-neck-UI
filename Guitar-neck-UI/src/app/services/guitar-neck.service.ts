import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from './note.service';

@Injectable({
  providedIn: 'root'
})
export class GuitarNeckService {
  notes!: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets - 1 }, (_, i) => i);

  constructor(
    private noteService: NoteService
  ) { }

  isNoteOnFret(string: string, fret: number): boolean {
    return this.notes.some(note => this.isMatchingNoteOnFret(note, string, fret));
  }

  private isMatchingNoteOnFret(note: GuitarNote, string: string, fret: number) {
    return this.strings[this.strings.length - note.string] === string && note.fret === fret && note.visible;
  }

  getNote(string: string, fret: number): GuitarNote | undefined {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret));
  }
  getNoteName(string: string, fret: number): string {
    const note = this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret));
    return note ? note.note : '';
  }

  fretNoteClicked(string: string, fret: number): GuitarNote | null {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret)) || null;
  }

  getStringNameByNumber(string: number): string {
    return this.strings[this.strings.length - string];
  }

  removeSelections() {
    this.notes.forEach(note => note.selected = false);
  }

  hideAllNotes() {
    this.notes.forEach(note => note.visible = false);
  }

  showAllNotes() {
    this.notes.forEach(note => note.visible = true);
  }

  selectNotes(notes: GuitarNote[]): GuitarNote[] {
    //return selected notes and hide all other notes
    this.hideAllNotes();

    notes.forEach(note => {
      const notesToHighlight = this.notes.filter(n => n.note === note.note && n.string === note.string);
      notesToHighlight.forEach(noteToHighlight => {
        noteToHighlight.visible = true;
        noteToHighlight.selected = true;
      });
    });
    return this.notes.filter(note => note.selected);
  }

  selectScale(scaleName: string, rootNote: string): GuitarNote[] {
    const scaleNotes = this.noteService.getNotesByScale(scaleName, rootNote);
    return this.selectNotes(scaleNotes);
  }

  clearFretboard() {
    this.hideAllNotes();
    this.removeSelections();

  }
}
