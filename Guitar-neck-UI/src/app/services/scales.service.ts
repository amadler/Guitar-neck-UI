import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { SCALE_PATTERNS } from '../shared/model/scales';

@Injectable({
  providedIn: 'root'
})
export class ScaleService {
  private chromaticNotes = neckConfig.chromaticNotes;

  generateScale(scaleName: string, rootNote: string): string[] {
    const scalePattern = SCALE_PATTERNS.find(pattern => pattern.name === scaleName);
    if (!scalePattern) {
      throw new Error(`Scale pattern ${scaleName} not found`);
    }

    const rootNoteIndex = this.chromaticNotes.indexOf(rootNote);
    if (rootNoteIndex === -1) {
      throw new Error(`Root note ${rootNote} not found in chromatic scale`);
    }

    const scaleNotes = [rootNote];
    let currentIndex = rootNoteIndex;

    for (const interval of scalePattern.intervals) {
      currentIndex = (currentIndex + interval) % this.chromaticNotes.length;
      scaleNotes.push(this.chromaticNotes[currentIndex]);
    }

    return scaleNotes;
  }
}
