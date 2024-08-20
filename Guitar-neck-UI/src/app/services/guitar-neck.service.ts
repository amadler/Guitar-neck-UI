import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';

@Injectable({
  providedIn: 'root'
})
export class GuitarNeckService {
  notes!: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets - 1 }, (_, i) => i);

  isNoteOnFret(string: string, fret: number): boolean {
    return this.notes.some(note => this.isMatchingNoteOnFret(note, string, fret));
  }

  isMarkedFret(string: string, fret: number): boolean{
    const markedFrets = neckConfig.markedFrets;
    return string === 'D' && markedFrets.includes(fret + 1);
  }

  isMarkedTwelffeFret(string: string, fret: number): boolean {
    const markedFrets = neckConfig.markedTwelffeFrets;
    return string === 'D' && markedFrets.includes(fret + 1);
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
      const noteToHighlight = this.notes.find(n => n.note === note.note && n.string === note.string);
      if (noteToHighlight) {
        noteToHighlight.visible = true;
        noteToHighlight.selected = true;
      }
    }
    );
    return notes;
  }

}
