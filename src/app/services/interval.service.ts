/* IntervalService oznacza nuty jako root, third, fifth.
*/

import { Injectable } from '@angular/core';
import { neckConfig, CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
@Injectable({ providedIn: 'root' })
export class IntervalService {
  markIntervals(rootNote: string, patternName: string, selectedNotes: GuitarNote[], patternType: 'scale' | 'chord' = 'chord') {
    const patterns = patternType === 'scale' ? SCALE_PATTERNS : CHORD_PATTERNS;
    const pattern = patterns.find(p => p.name === patternName);
    if (!pattern) {
      console.warn(`Unknown pattern: ${patternName}`);
      return;
    }

    const rootNoteIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    if (rootNoteIndex === -1) {
      console.warn(`Invalid root note: ${rootNote}`);
      return;
    }

    // Calculate all possible intervals from the root note
    const intervalNotes = new Map<string, string>();
    let currentIndex = rootNoteIndex;
    intervalNotes.set(neckConfig.chromaticNotes[currentIndex], 'root');

    // Build cumulative intervals
    let semitoneCount = 0;
    pattern.intervals.forEach(interval => {
      semitoneCount += interval;
      currentIndex = (rootNoteIndex + semitoneCount) % 12;
      const note = neckConfig.chromaticNotes[currentIndex];
      intervalNotes.set(note, this.getIntervalName(semitoneCount));
    });

    // Assign intervals to selected notes
    selectedNotes.forEach(note => {
      note.interval = intervalNotes.get(note.note) || '';
    });
  }

  markCustomIntervals(rootNote: string, selectedNotes: GuitarNote[]) {
    const rootNoteIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    if (rootNoteIndex === -1) {
      console.warn(`Invalid root note: ${rootNote}`);
      return;
    }

    const intervalNotes = new Map<string, string>();
    intervalNotes.set(rootNote, 'root');

    selectedNotes.forEach(note => {
      const noteIndex = neckConfig.chromaticNotes.indexOf(note.note);
      if (noteIndex === -1) {
        return;
      }

      const semitones = (noteIndex - rootNoteIndex + 12) % 12;
      intervalNotes.set(note.note, this.getIntervalName(semitones));
    });

    selectedNotes.forEach(note => {
      note.interval = intervalNotes.get(note.note) || '';
    });
  }

  removeIntervals(notes: GuitarNote[]) {
    notes.forEach(note => {
      note.interval = '';
    });
  }

  private getIntervalName(semitones: number): string {
    const intervals: { [key: number]: string } = {
      0: 'root',
      1: 'minor-2nd',
      2: 'major-2nd',
      3: 'minor-3rd',
      4: 'major-3rd',
      5: 'perfect-4th',
      6: 'diminished-5th',
      7: 'perfect-5th',
      8: 'minor-6th',
      9: 'major-6th',
      10: 'minor-7th',
      11: 'major-7th'
    };
    return intervals[semitones % 12] || '';
  }
}
