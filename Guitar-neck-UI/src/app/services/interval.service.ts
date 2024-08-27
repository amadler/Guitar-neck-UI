import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';

@Injectable({
  providedIn: 'root'
})
export class IntervalService {
  private isMajorScale(scaleName: string): boolean {
    return scaleName.includes('Major');
  }

  markRootThirdFifth(rootNote: string, scaleName: string, selectedNotes: GuitarNote[]) {
    const rootNoteIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    const isMajor = this.isMajorScale(scaleName);

    const thirdNoteIndex = isMajor
      ? (rootNoteIndex + 4) % neckConfig.chromaticNotes.length // Major third
      : (rootNoteIndex + 3) % neckConfig.chromaticNotes.length; // Minor third

    const fifthNoteIndex = (rootNoteIndex + 7) % neckConfig.chromaticNotes.length; // Perfect fifth

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

  removeIntervals(notes:GuitarNote[]) {
    //  console.log('removeIntervals');
      notes.forEach(note => {
        note.isRoot = false;
        note.isFifth = false;
        note.isThird = false;
      });
    }
}
