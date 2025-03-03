/* IntervalService oznacza nuty jako root, third, fifth.
*/

import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';
import { CHORD_PATTERNS } from '../shared/model/chordTypes';
import { SCALE_PATTERNS } from '../shared/model/scaleTypes';

@Injectable({ providedIn: 'root' })
export class IntervalService {
  markIntervals(rootNote: string, patternName: string, selectedNotes: GuitarNote[]) {
    const pattern = [...CHORD_PATTERNS, ...SCALE_PATTERNS].find(p => p.name === patternName);
    if (!pattern) {
      console.warn(`Unknown pattern: ${patternName}`);
      return;
    }

    const rootNoteIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    const intervalIndices = this.calculateIntervalIndices(rootNoteIndex, pattern.intervals);
    const notes = intervalIndices.map(index => neckConfig.chromaticNotes[index]);

    selectedNotes.forEach(note => {
      const intervalPosition = notes.indexOf(note.note);
      if (intervalPosition !== -1) {
        switch(intervalPosition) {
          case 0: note.isRoot = true; break;
          case 1: note.isThird = true; break;
          case 2: note.isFifth = true; break;
        }
      }
    });
  }

  private calculateIntervalIndices(rootIndex: number, intervals: number[]): number[] {
    const indices = [rootIndex];
    let currentIndex = rootIndex;

    intervals.forEach(interval => {
      currentIndex = (currentIndex + interval) % 12;
      indices.push(currentIndex);
    });

    return indices;
  }

  removeIntervals(notes: GuitarNote[]) {
    notes.forEach(note => {
      note.isRoot = false;
      note.isFifth = false;
      note.isThird = false;
    });
  }
}
