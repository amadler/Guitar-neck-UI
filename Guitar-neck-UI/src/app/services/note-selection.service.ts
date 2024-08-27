import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from './note.service';
import { IntervalService } from './interval.service';
import { GuitarNeckService } from './guitar-neck.service';

@Injectable({
  providedIn: 'root'
})
export class NoteSelectionService {
  allNotes: GuitarNote[] = [];
  constructor(
    private noteService: NoteService,
    private intervalService: IntervalService,
    private guitarNeckService: GuitarNeckService
  ) {
    this.allNotes = this.noteService.getAllnotes();
   }

  selectScale(scaleName: string, rootNote: string): GuitarNote[] {
    const scaleNotes = this.noteService.getNotesByScale(scaleName, rootNote);
    const selectedNotes = this.guitarNeckService.selectNotes(scaleNotes);
    this.intervalService.markRootThirdFifth(rootNote, scaleName, selectedNotes);
    return selectedNotes;
  }

  selectTriad(rootNote: string, triadType: string): GuitarNote[] {
    const triadNotes = this.noteService.getNotesByTriad(triadType, rootNote);
    const selectedNotes = this.guitarNeckService.selectNotes(triadNotes);
    this.intervalService.markRootThirdFifth(rootNote, triadType, selectedNotes);
    return selectedNotes;
  }
}

