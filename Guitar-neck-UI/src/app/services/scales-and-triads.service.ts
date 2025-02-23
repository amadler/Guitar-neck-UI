/**
 * ScaleAndTriadService generuje skale i trójdźwięki.
 **/

import { inject, Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { SCALE_PATTERNS } from '../shared/model/scaleTypes';
import { TRIAD_PATTERNS } from '../shared/model/triadTypes';
import { EXTENDED_CHORD_PATTERNS } from '../shared/model/extendedChordTypes';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScaleAndTriadService {
  private chromaticNotes = neckConfig.chromaticNotes;

  constructor(private ht: HttpClient) {}

  private generateNotes(patterns: any[], patternName: string, rootNote: string): string[] {
    const pattern = patterns.find(p => p.name === patternName);

    if (!pattern) {
      throw new Error(`Pattern "${patternName}" not found`);
    }

    const rootNoteIndex = this.chromaticNotes.indexOf(rootNote);
    if (rootNoteIndex === -1) {
      throw new Error(`Root note "${rootNote}" not found in chromatic scale`);
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
    const isExtendedChord = EXTENDED_CHORD_PATTERNS.some(p => p.name === triadType);
    const patterns = isExtendedChord ? EXTENDED_CHORD_PATTERNS : TRIAD_PATTERNS;
    return this.generateNotes(patterns, triadType, rootNote);
  }

  getScaleReq(text: string): Observable<any> {
    return this.ht.get('http://localhost:3000/scale/', {
      params: { text: text }
    }).pipe(
      catchError(error => {
        console.error('Error fetching scale:', error);
        return throwError(() => new Error('Failed to fetch scale'));
      })
    );
  }
}
