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
  frets = Array.from({ length: neckConfig.numberOfFrets - 1 }, (_, i) => i);

  constructor(
    private noteService: FretboardNotePositionService,
    private intervalService: IntervalService
  ) {
    this.notes = this.noteService.getAllPositions();
  }

  private isMatchingNoteOnFret(note: GuitarNote, string: string, fret: number) {
    return this.strings[note.string - 1] === string && note.fret === fret && note.visible;
  }

  isNoteOnFret(string: string, fret: number): boolean {
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
  }
}
