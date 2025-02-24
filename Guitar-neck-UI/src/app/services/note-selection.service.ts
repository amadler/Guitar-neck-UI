/* NoteSelectionService koordynuje wybór nut na podstawie skali lub trójdźwięku. */
import { Injectable } from '@angular/core';
import { MusicTheoryFacadeService } from './music-theory-facade.service';

@Injectable({ providedIn: 'root' })
export class NoteSelectionService {
  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  selectTriad(rootNote: string, triadName: string): void {
    this.musicTheoryFacade.selectTriad(triadName, rootNote);
  }

  selectScale(scaleName: string, rootNote: string): void {
    this.musicTheoryFacade.selectScale(scaleName, rootNote);
  }
}
