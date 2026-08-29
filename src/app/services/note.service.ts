/**
 * NoteService zarządza nutami na gryfie.
 **/

import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from 'guitar-neck-shared';

@Injectable({ providedIn: 'root' })
export class FretboardNotePositionService {
  guitarStrings = neckConfig.stringNotes;
  fretsCount = neckConfig.numberOfFrets;
  guitarNotes: GuitarNote[] = [];

  constructor() {
    this.generateFretboard();
  }

  private generateFretboard() {
    this.guitarNotes = [];
    for (let stringIndex = 0; stringIndex < this.guitarStrings.length; stringIndex++) {
      const openNote = this.guitarStrings[stringIndex];
      for (let fretIndex = 0; fretIndex <= this.fretsCount; fretIndex++) {
        const note = this.calculateNoteOnFret(openNote, fretIndex);
        const guitarNote = new GuitarNote(
          stringIndex + 1,
          fretIndex,
          note
        );
        this.guitarNotes.push(guitarNote);
        //   console.log(`Generated note: ${guitarNote.string} - ${guitarNote.fret} - ${guitarNote.note}`);
      }
    }
  }

  private calculateNoteOnFret(openNote: string, fretIndex: number): string {
    const notesOrder = neckConfig.chromaticNotes;
    const openNoteIndex = notesOrder.indexOf(openNote);
    const noteIndex = (openNoteIndex + fretIndex) % notesOrder.length;
    return notesOrder[noteIndex];
  }

  getAllPositions(): GuitarNote[] {
    return this.guitarNotes;
  }

  findPositionsByNoteName(noteName: string): GuitarNote[] {
    return this.guitarNotes.filter(note => note.note === noteName);
  }

  findPositionsByScaleNotes(scaleNotes: string[]): GuitarNote[] {
    return this.guitarNotes.filter(note => scaleNotes.includes(note.note));
  }
}
