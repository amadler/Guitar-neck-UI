import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from '../shared/model/neckConfig';

@Injectable({ providedIn: 'root' })
export class NoteService {
  guitarStrings = neckConfig.stringNotes; // Nazwy strun od najgrubszej do najcieńszej
  fretsCount = neckConfig.numberOfFrets; // Liczba progów
  guitarNotes: GuitarNote[] = [];

  private getFretboard() {
    for (let stringIndex = 0; stringIndex < this.guitarStrings.length; stringIndex++) {
      const openNote = this.guitarStrings[stringIndex]; // Dźwięk struny bez zadziałania na progu
      // Przejście przez każdy próg
      for (let fretIndex = 0; fretIndex <= this.fretsCount; fretIndex++) {
        const note = this.calculateNoteOnFret(openNote, fretIndex); // Obliczanie dźwięku na danym progu
        this.guitarNotes.push( new GuitarNote(
          this.guitarStrings.length - stringIndex, // Numer struny (liczonej od dołu)
          fretIndex, // Numer progu
          note // Nazwa dźwięku
        ));
      }
    }
    return this.guitarNotes;
  }
  // Funkcja obliczająca nazwę dźwięku na danym progu
  private calculateNoteOnFret(openNote: any, fretIndex: number) {
    const notesOrder = neckConfig.chromaticNotes; // Nazwy dźwięków
    const openNoteIndex = notesOrder.indexOf(openNote); // Indeks dźwięku struny bez zadziałania na progu
    const noteIndex = (openNoteIndex + fretIndex) % notesOrder.length; // Indeks dźwięku na danym progu
    const note = notesOrder[noteIndex]; // Nazwa dźwięku na danym progu
    return note;
  }

  getAllnotes() {
    this.getFretboard();
    return this.guitarNotes;
  }

  getNotesByNoteName(noteName: string) {
    return this.guitarNotes.filter(note => note.note === noteName);
  }
}
