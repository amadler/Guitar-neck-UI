/* GuitarNeckService zarządza stanem gryfu.*/
import { Injectable } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardNotePositionService } from './note.service';
import { IntervalService } from './interval.service';

export type MarkerDisplayMode = 'interval-colors' | 'note-names' | 'neutral-dots';

@Injectable({ providedIn: 'root' })
export class FretboardStateService {
  notes: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets }, (_, i) => i + 1);
  /** Per-string active state. true = show notes on this string. Reset on clearFretboard(). */
  activeStrings: boolean[];
  /** Which visual mode the fretboard markers use. */
  markerDisplayMode: MarkerDisplayMode = 'interval-colors';
  /** Whether there is an active result (notes highlighted/show all) on the fretboard. */
  hasActiveResult = false;
  constructor(
    private noteService: FretboardNotePositionService,
    private intervalService: IntervalService
  ) {
    this.notes = this.noteService.getAllPositions();
    this.activeStrings = this.strings.map(() => true);
  }

  applyHighlightedNotes(notes: GuitarNote[]): GuitarNote[] {
    this.notes.forEach(note => {
        note.visible = false;
        note.selected = false;
    });

    notes.forEach(noteToShow => {
        const matchingNotes = this.notes.filter(n =>
            n.note === noteToShow.note &&
            n.string === noteToShow.string
        );

        matchingNotes.forEach(note => {
            note.visible = true;
            note.selected = true;
        });
    });

    this.hasActiveResult = notes.length > 0;

    return this.notes.filter(note => note.selected);
  }

  /** Toggle a single string on/off. Used by StringToggleComponent events. */
  toggleString(index: number, active: boolean): void {
    if (index >= 0 && index < this.activeStrings.length) {
      this.activeStrings[index] = active;
    }
  }

  /** Reset all strings to active. Called on clearFretboard(). */
  private resetActiveStrings(): void {
    this.activeStrings = this.strings.map(() => true);
  }

  hideAllNotes() {
    this.notes.forEach(note => note.visible = false);
  }

  showAll() {
    this.notes.forEach(note => note.visible = true);
    this.hasActiveResult = true;
  }

  clearSelection() {
    this.notes.forEach(note => note.selected = false);
  }

  clearFretboard() {
    this.intervalService.removeIntervals(this.notes);
    this.hideAllNotes();
    this.clearSelection();
    this.hasActiveResult = false;
    // Note: activeStrings are NOT reset here — they persist until the user manually toggles them.
  }
}
