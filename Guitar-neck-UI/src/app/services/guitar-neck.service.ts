/* GuitarNeckService zarządza stanem gryfu.*/
import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from './note.service';
import { IntervalService } from './interval.service';
import { switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GuitarNeckService {
  notes: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets - 1 }, (_, i) => i);

  constructor(
    private noteService: NoteService,
    private intervalService: IntervalService
  ) {
    this.notes = this.noteService.getAllNotes();
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

  selectNotes(notes: GuitarNote[]): GuitarNote[] {
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

  showAllNotes() {
    this.notes.forEach(note => note.visible = true);
  }

  removeSelections() {
    this.notes.forEach(note => note.selected = false);
  }

  fretNoteClicked(string: string, fret: number): GuitarNote | null {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret)) || null;
  }

  clearFretboard() {
    this.intervalService.removeIntervals(this.notes);
    this.hideAllNotes();
    this.removeSelections();
  }
}
