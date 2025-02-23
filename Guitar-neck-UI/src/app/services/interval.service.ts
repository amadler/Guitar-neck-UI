/* IntervalService oznacza nuty jako root, third, fifth.
*/

import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';

@Injectable({ providedIn: 'root' })
export class IntervalService {
  private isMajorScale(scaleName: string): boolean {
    return scaleName.includes('Major');
  }

  markRootThirdFifth(rootNote: string, scaleName: string, selectedNotes: GuitarNote[]) {
    const rootNoteIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    const isMajor = this.isMajorScale(scaleName);

    const thirdNoteIndex = isMajor
      ? (rootNoteIndex + 4) % neckConfig.chromaticNotes.length  // Wielka tercja (4 półtony)
      : (rootNoteIndex + 3) % neckConfig.chromaticNotes.length; // Mała tercja (3 półtony)

    const fifthNoteIndex = (rootNoteIndex + 7) % neckConfig.chromaticNotes.length;

    const thirdNote = neckConfig.chromaticNotes[thirdNoteIndex];
    const fifthNote = neckConfig.chromaticNotes[fifthNoteIndex];

    selectedNotes.forEach(note => {
      if (note.note === rootNote) {
        note.isRoot = true;
      }
      if (note.note === thirdNote) {
        note.isThird = true;
      }
      if (note.note === fifthNote) {
        note.isFifth = true;
      }
    });
  }

  // Nowa metoda dla akordów rozszerzonych
  markExtendedChordIntervals(rootNote: string, chordType: string, selectedNotes: GuitarNote[]) {
    const rootNoteIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    let thirdNoteIndex, fifthNoteIndex, seventhNoteIndex;

    // Dostosowanie do nazw z EXTENDED_CHORD_PATTERNS
    switch (chordType) {
      case 'Major 7th':
        thirdNoteIndex = (rootNoteIndex + 4) % 12; // Wielka tercja
        fifthNoteIndex = (rootNoteIndex + 7) % 12; // Czysta kwinta
        seventhNoteIndex = (rootNoteIndex + 11) % 12; // Wielka septyma
        break;
      case 'Minor 7th':
        thirdNoteIndex = (rootNoteIndex + 3) % 12; // Mała tercja
        fifthNoteIndex = (rootNoteIndex + 7) % 12; // Czysta kwinta
        seventhNoteIndex = (rootNoteIndex + 10) % 12; // Mała septyma
        break;
      case 'Dominant 7th':
        thirdNoteIndex = (rootNoteIndex + 4) % 12; // Wielka tercja
        fifthNoteIndex = (rootNoteIndex + 7) % 12; // Czysta kwinta
        seventhNoteIndex = (rootNoteIndex + 10) % 12; // Mała septyma
        break;
      case 'Half-diminished 7th':
        thirdNoteIndex = (rootNoteIndex + 3) % 12; // Mała tercja
        fifthNoteIndex = (rootNoteIndex + 6) % 12; // Zmniejszona kwinta
        seventhNoteIndex = (rootNoteIndex + 10) % 12; // Mała septyma
        break;
      case 'Diminished 7th':
        thirdNoteIndex = (rootNoteIndex + 3) % 12; // Mała tercja
        fifthNoteIndex = (rootNoteIndex + 6) % 12; // Zmniejszona kwinta
        seventhNoteIndex = (rootNoteIndex + 9) % 12; // Zmniejszona septyma
        break;
      default:
        console.warn(`Nieznany typ akordu rozszerzonego: ${chordType}`);
        return;
    }

    const thirdNote = neckConfig.chromaticNotes[thirdNoteIndex];
    const fifthNote = neckConfig.chromaticNotes[fifthNoteIndex];
    const seventhNote = neckConfig.chromaticNotes[seventhNoteIndex];

    selectedNotes.forEach(note => {
      if (note.note === rootNote) {
        note.isRoot = true;
      }
      if (note.note === thirdNote) {
        note.isThird = true;
      }
      if (note.note === fifthNote) {
        note.isFifth = true;
      }
      // Możesz dodać dodatkowe oznaczenie dla septymy jeśli potrzebujesz
    });
  }

  removeIntervals(notes: GuitarNote[]) {
    notes.forEach(note => {
      note.isRoot = false;
      note.isFifth = false;
      note.isThird = false;
    });
  }
}
