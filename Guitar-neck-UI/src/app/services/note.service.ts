/**
 * NoteService zarządza nutami na gryfie.
 **/

import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from '../shared/model/neckConfig';

@Injectable({ providedIn: 'root' })
export class NoteService {
  guitarStrings = neckConfig.stringNotes;
  fretsCount = neckConfig.numberOfFrets;
  guitarNotes: GuitarNote[] = [];

  constructor() {
    this.generateFretboard();
  }

  private generateFretboard() {
    for (let stringIndex = 0; stringIndex < this.guitarStrings.length; stringIndex++) {
      const openNote = this.guitarStrings[stringIndex];
      for (let fretIndex = 0; fretIndex <= this.fretsCount; fretIndex++) {
        const note = this.calculateNoteOnFret(openNote, fretIndex);
        this.guitarNotes.push(new GuitarNote(
          this.guitarStrings.length - stringIndex,
          fretIndex,
          note
        ));
      }
    }
  }

  private calculateNoteOnFret(openNote: any, fretIndex: number) {
    const notesOrder = neckConfig.chromaticNotes;
    const openNoteIndex = notesOrder.indexOf(openNote);
    const noteIndex = (openNoteIndex + fretIndex) % notesOrder.length;
    return notesOrder[noteIndex];
  }

  getAllNotes(): GuitarNote[] {
    return this.guitarNotes;
  }

  getNotesByNoteName(noteName: string): GuitarNote[] {
    return this.guitarNotes.filter(note => note.note === noteName);
  }

  getNotesByScale(scaleNotes: string[]): GuitarNote[] {
    return this.guitarNotes.filter(note => scaleNotes.includes(note.note));
  }

  getNotesByTriad(triadNotes: string[]): GuitarNote[] {
    return this.guitarNotes.filter(note => triadNotes.includes(note.note));
  }
}
