import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from './note.service';
import { IntervalService } from './interval.service';
import { GuitarNeckService } from './guitar-neck.service';
import { ScaleAndTriadService } from './scales-and-triads.service';

@Injectable({ providedIn: 'root' })
export class MusicTheoryFacadeService {
  constructor(
    private noteService: NoteService,
    private scaleAndTriadService: ScaleAndTriadService,
    private intervalService: IntervalService,
    private guitarNeckService: GuitarNeckService
  ) {}

  selectScale(scaleName: string, rootNote: string): GuitarNote[] {
    const scaleNotes = this.scaleAndTriadService.generateScale(scaleName, rootNote);
    const selectedNotes = this.noteService.getNotesByScale(scaleNotes);
    const highlightedNotes = this.guitarNeckService.selectNotes(selectedNotes);
    this.intervalService.markRootThirdFifth(rootNote, scaleName, highlightedNotes);
    return highlightedNotes;
  }

  selectTriad(triadType: string, rootNote: string): GuitarNote[] {
    const triadNotes = this.scaleAndTriadService.generateTriad(triadType, rootNote);
    const selectedNotes = this.noteService.getNotesByTriad(triadNotes);
    const highlightedNotes = this.guitarNeckService.selectNotes(selectedNotes);
    this.intervalService.markRootThirdFifth(rootNote, triadType, highlightedNotes);
    return highlightedNotes;
  }

  clearFretboard() {
    this.guitarNeckService.clearFretboard();
  }
}
