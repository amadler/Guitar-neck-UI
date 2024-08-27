/**
 * ScaleAndTriadService generuje skale i trójdźwięki.
 **/

import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { SCALE_PATTERNS } from '../shared/model/scaleTypes';
import { TRIAD_PATTERNS } from '../shared/model/triadTypes';

@Injectable({ providedIn: 'root' })
export class ScaleAndTriadService {
  private chromaticNotes = neckConfig.chromaticNotes;

  constructor() {}

  private generateNotes(patterns: any[], patternName: string, rootNote: string): string[] {
    const pattern = patterns.find(p => p.name === patternName);
    if (!pattern) {
      throw new Error(`${patternName} pattern not found`);
    }

    const rootNoteIndex = this.chromaticNotes.indexOf(rootNote);
    if (rootNoteIndex === -1) {
      throw new Error(`Root note ${rootNote} not found in chromatic scale`);
    }

    const notes = [rootNote];
    let currentIndex = rootNoteIndex;

    for (const interval of pattern.intervals) {
      currentIndex = (currentIndex + interval) % this.chromaticNotes.length;
      notes.push(this.chromaticNotes[currentIndex]);
    }

    return notes;
  }

  generateScale(scaleName: string, rootNote: string): string[] {
    return this.generateNotes(SCALE_PATTERNS, scaleName, rootNote);
  }

  generateTriad(triadType: string, rootNote: string): string[] {
    return this.generateNotes(TRIAD_PATTERNS, triadType, rootNote);
  }
}
