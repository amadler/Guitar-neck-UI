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
      ? (rootNoteIndex + 4) % neckConfig.chromaticNotes.length
      : (rootNoteIndex + 3) % neckConfig.chromaticNotes.length;

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

  removeIntervals(notes: GuitarNote[]) {
    notes.forEach(note => {
      note.isRoot = false;
      note.isFifth = false;
      note.isThird = false;
    });
  }
}
