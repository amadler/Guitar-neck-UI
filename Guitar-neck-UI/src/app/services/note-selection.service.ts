/* NoteSelectionService koordynuje wybór nut na podstawie skali lub trójdźwięku. */
import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicTheoryFacadeService } from './music-theory-facade.service';

@Injectable({ providedIn: 'root' })
export class NoteSelectionService {
  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  selectScale(scaleName: string, rootNote: string): GuitarNote[] {
    return this.musicTheoryFacade.selectScale(scaleName, rootNote);
  }

  selectTriad(rootNote: string, triadType: string): GuitarNote[] {
    return this.musicTheoryFacade.selectTriad(rootNote, triadType);
  }

  clearFretboard() {
    this.musicTheoryFacade.clearFretboard();
  }
}
