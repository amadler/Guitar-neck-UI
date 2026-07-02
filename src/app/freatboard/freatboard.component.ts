import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardStateService } from '../services/guitar-neck.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { neckConfig } from 'guitar-neck-shared';
import { RangeToolbarComponent } from '../range-toolbar/range-toolbar.component';
import { StringToggleComponent } from '../string-toggle/string-toggle.component';

@Component({
  selector: 'app-freatboard',
  templateUrl: './freatboard.component.html',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RangeToolbarComponent, StringToggleComponent],
  styleUrls: ['./freatboard.component.scss']
})
export class FreatboardComponent implements OnInit {
  @Output() onNoteClicked$: EventEmitter<GuitarNote> = new EventEmitter<GuitarNote>();
  @Input({required: true}) notes: GuitarNote[] = []; // Initialize with empty array
  strings: string[] = [];
  frets: number[] = [];
  private _fretRange = { minFret: 0, maxFret: 24 };

  constructor(
    protected guitarNeckService: FretboardStateService
  ) {
    this.strings = guitarNeckService.strings;
    this.frets = guitarNeckService.frets;
  }

  ngOnInit(): void {
    if (this.notes) {
      this.guitarNeckService.notes = this.notes;
    }
  }

  get fretRange() {
    return this._fretRange;
  }

  set fretRange(range: { minFret: number, maxFret: number }) {
    this._fretRange = range;
  }

  protected isNoteInRange(fret: number): boolean {
    return fret >= this._fretRange.minFret && fret <= this._fretRange.maxFret;
  }

  protected isNoteOnFret(string: string, fret: number) {
    return this.guitarNeckService.isNoteOnFret(string, fret);
  }

  protected isNoteSelected(string: string, fret: number): boolean | undefined {
    const note = this.getNote(string, fret);
    return note ? note.selected : false;
  }

  getNoteInterval(string: string, fret: number): string | undefined {
    const note = this.getNote(string, fret);
    //console.log('note', note?.interval);
    return note ? note.interval : undefined;
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

  /** Handle string toggle checkbox events from StringToggleComponent. */
  protected onStringToggled(event: { stringIndex: number; active: boolean }): void {
    this.guitarNeckService.toggleString(event.stringIndex, event.active);
  }
}


/*


*/
