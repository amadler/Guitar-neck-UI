/* GuitarNeckService zarządza stanem gryfu.*/
import { Injectable } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardNotePositionService } from './note.service';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class FretboardStateService {
  notes: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets }, (_, i) => i + 1);
  /** Per-string active state. true = show notes on this string. Reset on clearFretboard(). */
  activeStrings: boolean[];
  /** When true, note markers use interval-specific colors. When false, all markers are neutral. */
  intervalColorsEnabled = true;

  constructor(
    private noteService: FretboardNotePositionService,
    private intervalService: IntervalService
  ) {
    this.notes = this.noteService.getAllPositions();
    this.activeStrings = this.strings.map(() => true);
  }

  private isMatchingNoteOnFret(note: GuitarNote, string: string, fret: number) {
    return this.strings[note.string - 1] === string && note.fret === fret && note.visible;
  }

  isNoteOnFret(string: string, fret: number): boolean {
    const stringIndex = this.strings.indexOf(string);
    if (stringIndex >= 0 && !this.activeStrings[stringIndex]) {
      return false;
    }
    return this.notes.some(note => this.isMatchingNoteOnFret(note, string, fret));
  }

  getNote(string: string, fret: number): GuitarNote | undefined {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret));
  }

  getNoteName(string: string, fret: number): string {
    const note = this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret));
    return note ? note.note : '';
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
  }

  clearSelection() {
    this.notes.forEach(note => note.selected = false);
  }

  fretNoteClicked(string: string, fret: number): GuitarNote | null {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret)) || null;
  }

  clearFretboard() {
    this.intervalService.removeIntervals(this.notes);
    this.hideAllNotes();
    this.clearSelection();
    // Note: activeStrings are NOT reset here — they persist until the user manually toggles them.
  }
}
