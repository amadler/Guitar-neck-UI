import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardStateService } from '../services/guitar-neck.service';
import { FretboardNoteQueryService } from '../services/fretboard-note-query.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';
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
    private guitarNeckService: FretboardStateService,
    private noteQueryService: FretboardNoteQueryService,
    private displayService: FretboardDisplayService
  ) {
    this.strings = neckConfig.stringNotes;
    this.frets = Array.from({ length: neckConfig.numberOfFrets }, (_, i) => i + 1);
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

  // -- Delegating properties: shield template from direct service access --

  get activeStrings(): boolean[] {
    return this.guitarNeckService.activeStrings;
  }

  get showNoteLabels(): boolean {
    return this.displayService.showNoteLabels;
  }

  protected getMarkerCssClass(interval: string | undefined): string {
    return this.displayService.getMarkerCssClass(interval);
  }

  /** Returns the marker-role CSS class for a note at the given position, or empty string. */
  protected getRoleCssClass(stringIndex: number, fret: number): string {
    return this.displayService.getRoleCssClass(stringIndex, fret);
  }

  // -- End delegating properties --

  protected isNoteInRange(fret: number): boolean {
    return fret >= this._fretRange.minFret && fret <= this._fretRange.maxFret;
  }

  protected isNoteOnFret(stringIndex: number, fret: number) {
    return this.noteQueryService.isNoteOnFret(stringIndex, fret);
  }

  protected isNoteSelected(stringIndex: number, fret: number): boolean | undefined {
    const note = this.getNote(stringIndex, fret);
    return note ? note.selected : false;
  }

  getNoteInterval(stringIndex: number, fret: number): string | undefined {
    const note = this.getNote(stringIndex, fret);
    //console.log('note', note?.interval);
    return note ? note.interval : undefined;
  }

  protected isMarkedFret(stringIndex: number, fret: number) {
    const markedFrets = neckConfig.markedFrets;
    return this.strings[stringIndex] === 'D' && markedFrets.includes(fret);
  }

  protected isMarkedTwelffeFret(stringIndex: number, fret: number) {
    const markedFrets = neckConfig.markedTwelffeFrets;
    return this.strings[stringIndex] === 'D' && markedFrets.includes(fret);
  }

  protected getNoteName(stringIndex: number, fret: number) {
    return this.noteQueryService.getNoteName(stringIndex, fret);
  }

  protected fretNoteClicked(stringIndex: number, fret: number) {
    const note = this.noteQueryService.fretNoteClicked(stringIndex, fret);
    this.onNoteClicked$.emit(note || undefined);
  }

  protected getNote(stringIndex: number, fret: number): GuitarNote | undefined {
    return this.noteQueryService.getNote(stringIndex, fret);
  }

  /** Handle string toggle checkbox events from StringToggleComponent. */
  protected onStringToggled(event: { stringIndex: number; active: boolean }): void {
    this.guitarNeckService.toggleString(event.stringIndex, event.active);
  }
}
