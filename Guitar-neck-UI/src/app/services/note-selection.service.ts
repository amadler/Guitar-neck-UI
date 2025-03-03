/* NoteSelectionService koordynuje wybór nut na podstawie skali lub trójdźwięku. */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicTheoryFacadeService } from './music-theory-facade.service';

@Injectable({ providedIn: 'root' })
export class NoteSelectionService {
  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  selectTriad(triadName: string, rootNote: string): Observable<GuitarNote[]> {
    return this.musicTheoryFacade.selectTriad(triadName, rootNote);
  }

  selectScale(scaleName: string, rootNote: string): Observable<GuitarNote[]> {
    return this.musicTheoryFacade.selectScale(scaleName, rootNote);
  }

  selectNote(noteName: string){
    this.musicTheoryFacade.selectNote(noteName);
  }

  selectAllNotes(){
    this.musicTheoryFacade.selectAllNotes();
  }
}
