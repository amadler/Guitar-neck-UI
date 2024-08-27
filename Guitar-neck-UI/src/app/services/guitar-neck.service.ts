import { Injectable } from '@angular/core';
import { neckConfig } from '../shared/model/neckConfig';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from './note.service';
import { NoteSelectionService } from './note-selection.service';
import { IntervalService } from './interval.service';

@Injectable({
  providedIn: 'root'
})
export class GuitarNeckService {
  notes!: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets - 1 }, (_, i) => i);

  constructor(
    private noteSelectionService: NoteSelectionService,
    private intervalService: IntervalService
  ) { }

  private isMatchingNoteOnFret(note: GuitarNote, string: string, fret: number) {
    return this.strings[this.strings.length - note.string] === string && note.fret === fret && note.visible;
  }

  isNoteOnFret(string: string, fret: number): boolean {
    //console.log('isNoteOnFret');
    // TODO: This is a performance bottleneck.  To many invocations of fn.
    return this.notes.some(note => this.isMatchingNoteOnFret(note, string, fret));
  }

  getNote(string: string, fret: number): GuitarNote | undefined {
   // console.log('getNote');
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret));
  }

  getNoteName(string: string, fret: number): string {
  //  console.log('getNoteName');
    const note = this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret));
    return note ? note.note : '';
  }
  selectNotes(notes: GuitarNote[]): GuitarNote[] {
    console.log('selectNotes');
    this.notes.forEach(note => note.visible = false);
    notes.forEach(note => {
      const notesToHighlight = this.notes.filter(n => n.note === note.note && n.string === note.string);
      notesToHighlight.forEach(noteToHighlight => {
        noteToHighlight.visible = true;
        noteToHighlight.selected = true;
      });
    });
    return this.notes.filter(note => note.selected);
  }

  fretNoteClicked(string: string, fret: number): GuitarNote | null {
  //  console.log('fretNoteClicked');
    return this.notes.find(note => this.isMatchingNoteOnFret(note, string, fret)) || null;
  }

  hideAllNotes() {
   // console.log('hideAllNotes');
    this.notes.forEach(note => note.visible = false);
  }

  showAllNotes() {
  //  console.log('showAllNotes');
    this.notes.forEach(note => note.visible = true);
  }

  removeSelections() {
   // console.log('removeSelections');
    this.notes.forEach(note => note.selected = false);
  }


  clearFretboard() {
 //   console.log('clearFretboard');
    this.intervalService.removeIntervals(this.notes);
    this.hideAllNotes();
    this.removeSelections();
  }

  selectScale(scaleName: string, rootNote: string): GuitarNote[] {
  //  console.log('selectScale');
    return this.noteSelectionService.selectScale(scaleName, rootNote);
  }

  selectTriad(triadType: string, rootNote: string): GuitarNote[] {
  //  console.log('selectTriad');
    return this.noteSelectionService.selectTriad(triadType, rootNote);
  }
}
