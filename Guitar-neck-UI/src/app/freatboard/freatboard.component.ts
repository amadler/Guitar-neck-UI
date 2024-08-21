import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { NgIf, NgFor } from '@angular/common';
import { neckConfig } from '../shared/model/neckConfig';
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

  protected isNoteOnFret(string: string, fret: number) {
    return this.guitarNeckService.isNoteOnFret(string, fret);
  }

  protected isNoteSelected(string: string, fret: number): boolean | undefined {
    const note = this.getNote(string, fret);
    return note ? note.selected : false;
  }
  protected isMarkedFret(string: string, fret: number) {
    const markedFrets = neckConfig.markedFrets;
    return string === 'D' && markedFrets.includes(fret);
  }

  protected isMarkedTwelffeFret(string: string, fret: number) {
    const markedFrets = neckConfig.markedTwelffeFrets;
    return string === 'D' && markedFrets.includes(fret);
  }

  protected getNoteName(string: string, fret: number) {
    return this.guitarNeckService.getNoteName(string, fret);
  }

  protected fretNoteClicked(string: string, fret: number) {
    const note = this.guitarNeckService.fretNoteClicked(string, fret);
    this.onNoteClicked$.emit(note || undefined);
  }

  protected getNote(string: string, fret: number): GuitarNote | undefined {
    return this.guitarNeckService.getNote(string, fret);
  }
}
