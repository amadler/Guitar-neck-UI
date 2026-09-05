/**
 * NoteService zarządza nutami na gryfie.
 **/

import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from 'guitar-neck-shared';
import { noteToChroma } from '../shared/note-utils';

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
    const chromas = new Set(scaleNotes.map(noteToChroma));
    return this.guitarNotes.filter(note => chromas.has(noteToChroma(note.note)));
  }

  /**
   * Zwraca nutę na danej pozycji (string, fret) lub null jeśli poza zakresem.
   * String index: 1-6, Fret: 0-24.
   */
  getNoteAtPosition(string: number, fret: number): string | null {
    if (string < 1 || string > 6) return null;
    if (fret < 0 || fret > this.fretsCount) return null;
    const openNote = this.guitarStrings[string - 1];
    return this.calculateNoteOnFret(openNote, fret);
  }

  /**
   * Znajduje konkretne pozycje po współrzędnych (string, fret).
   * Zwraca tablicę GuitarNote dla dokładnie tych pozycji.
   * Pozycje poza zakresem są pomijane.
   */
  findPositionsByExactCoordinates(positions: Array<{ string: number; fret: number }>): GuitarNote[] {
    const result: GuitarNote[] = [];
    for (const pos of positions) {
      const note = this.guitarNotes.find(
        n => n.string === pos.string && n.fret === pos.fret
      );
      if (note) {
        result.push(note);
      }
    }
    return result;
  }
}