import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { NgIf, NgFor } from '@angular/common';
@Component({
  selector: 'app-freatboard',
  templateUrl: './freatboard.component.html',
  standalone: true,
  imports: [NgIf, NgFor],
  styleUrls: ['./freatboard.component.scss']
})
export class FreatboardComponent implements OnInit {
  @Output() onNoteClicked$: EventEmitter<GuitarNote> = new EventEmitter<GuitarNote>();
  @Input() notes!: GuitarNote[];
  strings: string[];
  frets: number[];

  constructor(private guitarNeckService: GuitarNeckService) {
    this.strings = guitarNeckService.strings;
    this.frets = guitarNeckService.frets;
  }

  ngOnInit(): void {
    this.guitarNeckService.notes = this.notes;
  }

  isNoteOnFret(string: string, fret: number) {
    return this.guitarNeckService.isNoteOnFret(string, fret);
  }

  isNoteSelected(string: string, fret: number): boolean | undefined {
    const note = this.getNote(string, fret);
    return note ? note.selected : false;
  }

  getNoteName(string: string, fret: number) {
    return this.guitarNeckService.getNoteName(string, fret);
  }

  isMarkedFret(string: string, fret: number) {
    return this.guitarNeckService.isMarkedFret(string, fret-1);
  }

  isMarkedTwelffeFret(string: string, fret: number) {
    return this.guitarNeckService.isMarkedTwelffeFret(string, fret-1);
  }

  fretNoteClicked(string: string, fret: number) {
    const note = this.guitarNeckService.fretNoteClicked(string, fret);
    this.onNoteClicked$.emit(note || undefined);
  }

  getNote(string: string, fret: number): GuitarNote | undefined {
    return this.guitarNeckService.getNote(string, fret);
  }

  getStringNameByNumber(string: number): string {
    return this.guitarNeckService.getStringNameByNumber(string);
  }
  hideAllNotes() {
    this.guitarNeckService.hideAllNotes();
  }

  showAllNotes() {
    this.guitarNeckService.showAllNotes();
  }
  selectNotes(notes: GuitarNote[]) {
    this.hideAllNotes();
    this.notes = this.guitarNeckService.selectNotes(notes);
  }
}
