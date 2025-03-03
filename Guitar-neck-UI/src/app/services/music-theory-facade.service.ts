import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
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

  selectScale(scaleName: string, rootNote: string): Observable<GuitarNote[]> {
    return this.scaleAndTriadService.generateScale(scaleName, rootNote).pipe(
      map(scaleNotes => {
        const selectedNotes = this.noteService.getNotesByScale(scaleNotes);
        const highlightedNotes = this.guitarNeckService.selectNotes(selectedNotes);
        this.intervalService.markRootThirdFifth(rootNote, scaleName, highlightedNotes);
        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error selecting scale:', error);
        return of([]);
      })
    );
  }

  selectTriad(triadType: string, rootNote: string): Observable<GuitarNote[]> {
    this.clearFretboard();

    const isExtendedChord = EXTENDED_CHORD_PATTERNS.some(p => p.name === triadType);
    console.log('Chord type:', triadType, 'Is extended:', isExtendedChord);

    return this.scaleAndTriadService.generateTriad(triadType, rootNote).pipe(
      map(chordNotes => {
        const selectedNotes = this.noteService.getNotesByTriad(chordNotes);
        const highlightedNotes = this.guitarNeckService.selectNotes(selectedNotes);

        if (isExtendedChord) {
          console.log('Marking extended chord intervals for:', triadType);
          this.intervalService.markExtendedChordIntervals(rootNote, triadType, highlightedNotes);
        } else {
          this.intervalService.markRootThirdFifth(rootNote, triadType, highlightedNotes);
        }

        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error selecting triad:', error);
        return of([]);
      })
    );
  }

  selectNote(noteName: string){
    const selectedNotes = this.noteService.getNotesByNoteName(noteName);
   this.guitarNeckService.selectNotes(selectedNotes);
  }

  selectAllNotes() {
    this.guitarNeckService.showAllNotes();
  }
  public resetFretboard(): void {
    this.guitarNeckService.clearFretboard();
  }

  private clearFretboard(): void {
    this.guitarNeckService.clearFretboard();
  }
}
