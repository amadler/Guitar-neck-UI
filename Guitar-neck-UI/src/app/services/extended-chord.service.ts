import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicTheoryFacadeService } from './music-theory-facade.service';
import { EXTENDED_CHORD_PATTERNS } from '../shared/model/extendedChordTypes';

@Injectable({
  providedIn: 'root'
})
export class ExtendedChordService {
  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  selectExtendedChord(chordName: string, rootNote: string): Observable<GuitarNote[]> {
    const pattern = EXTENDED_CHORD_PATTERNS.find(p => p.name === chordName);
    if (!pattern) {
      console.error(`Extended chord pattern not found: ${chordName}`);
      return of([]);
    }

    // Zwracamy Observable
    return this.musicTheoryFacade.selectTriad(chordName, rootNote);
  }

  isExtendedChord(name: string): boolean {
    return EXTENDED_CHORD_PATTERNS.some(pattern => pattern.name === name);
  }
}
