import { Injectable } from '@angular/core';
import { EXTENDED_CHORD_PATTERNS } from '../shared/model/extendedChordTypes';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicTheoryFacadeService } from './music-theory-facade.service';

@Injectable({
  providedIn: 'root'
})
export class ExtendedChordService {
  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  selectExtendedChord(chordName: string, rootNote: string): GuitarNote[] {
    const pattern = EXTENDED_CHORD_PATTERNS.find(p => p.name === chordName);
    if (!pattern) {
      console.error(`Extended chord pattern not found: ${chordName}`);
      return [];
    }

    return this.musicTheoryFacade.selectTriad(chordName, rootNote);
  }

  isExtendedChord(name: string): boolean {
    return EXTENDED_CHORD_PATTERNS.some(pattern => pattern.name === name);
  }
}
