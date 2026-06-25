import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardNotePositionService } from './note.service';
import { IntervalService } from './interval.service';
import { FretboardStateService } from './guitar-neck.service';
import { MusicPatternApiService } from './scales-and-triads.service';

@Injectable({ providedIn: 'root' })
export class FretboardOrchestrationService {
  constructor(
    private noteService: FretboardNotePositionService,
    private patternApi: MusicPatternApiService,
    private intervalService: IntervalService,
    private guitarNeckService: FretboardStateService
  ) {}

  displayScale(scaleName: string, rootNote: string): Observable<GuitarNote[]> {
    return this.patternApi.resolveScaleNotes(scaleName, rootNote).pipe(
      map(scaleNotes => {
        const selectedNotes = this.noteService.findPositionsByScaleNotes(scaleNotes);
        const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(selectedNotes);
        this.intervalService.markIntervals(rootNote, scaleName, highlightedNotes);
        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error selecting scale:', error);
        return of([]);
      })
    );
  }

  displayChord(triadType: string, rootNote: string): Observable<GuitarNote[]> {
    this.clearFretboard();

    return this.patternApi.resolveChordNotes(triadType, rootNote).pipe(
      map(chordNotes => {
        const selectedNotes = this.noteService.findPositionsByChordNotes(chordNotes);
        const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(selectedNotes);
        this.intervalService.markIntervals(rootNote, triadType, highlightedNotes);

        return highlightedNotes;
      }),
      catchError(error => {
        console.error('Error selecting triad:', error);
        return of([]);
      })
    );
  }

  displaySingleNote(noteName: string){
    const selectedNotes = this.noteService.findPositionsByNoteName(noteName);
   this.guitarNeckService.applyHighlightedNotes(selectedNotes);
  }

  displayAllNotes() {
    this.guitarNeckService.showAll();
  }
  public resetFretboard(): void {
    this.guitarNeckService.clearFretboard();
  }

  private clearFretboard(): void {
    this.guitarNeckService.clearFretboard();
  }

  displayCustomPattern(notes: string[], rootNote: string) {
    this.clearFretboard();
    const selectedNotes = this.noteService.findPositionsByScaleNotes(notes);
    const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(selectedNotes);

    this.intervalService.markCustomIntervals(rootNote, highlightedNotes);

    return highlightedNotes;
  }
}
