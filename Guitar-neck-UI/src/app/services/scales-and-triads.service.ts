/**
 * ScaleAndTriadService generuje skale i trójdźwięki.
 **/

import { inject, Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { SCALE_PATTERNS } from '../shared/model/scaleTypes';
import { TRIAD_PATTERNS } from '../shared/model/triadTypes';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScaleAndTriadService {
  private chromaticNotes = neckConfig.chromaticNotes;

  constructor(
    private ht:HttpClient
  ) {
  }

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

  getScaleReq(text: string): Observable<any> {
    return this.ht.get('http://localhost:3000/scale/', {
      params: {
        text: text
      }
    }).pipe(
      catchError(error => {
        console.error('Error fetching scale:', error);
        return throwError(() => new Error('Failed to fetch scale'));
      })
    );
  }
}
