import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from './note.service';
import { IntervalService } from './interval.service';
import { GuitarNeckService } from './guitar-neck.service';
import { ScaleAndTriadService } from './scales-and-triads.service';
import { EXTENDED_CHORD_PATTERNS } from '../shared/model/extendedChordTypes';

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
    this.clearFretboard();

    const isExtendedChord = EXTENDED_CHORD_PATTERNS.some(p => p.name === triadType);
    console.log('Chord type:', triadType, 'Is extended:', isExtendedChord); // Debugging

    const chordNotes = this.scaleAndTriadService.generateTriad(triadType, rootNote);
    const selectedNotes = this.noteService.getNotesByTriad(chordNotes);
    const highlightedNotes = this.guitarNeckService.selectNotes(selectedNotes);

    if (isExtendedChord) {
      console.log('Marking extended chord intervals for:', triadType); // Debugging
      this.intervalService.markExtendedChordIntervals(rootNote, triadType, highlightedNotes);
    } else {
      console.log('Marking basic triad intervals for:', triadType); // Debugging
      this.intervalService.markRootThirdFifth(rootNote, triadType, highlightedNotes);
    }

    return highlightedNotes;
  }

  clearFretboard(): void {
    this.guitarNeckService.clearFretboard();
  }
}
