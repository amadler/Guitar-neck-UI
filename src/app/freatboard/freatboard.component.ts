import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { neckConfig } from '../shared/model/neckConfig';
import { FretRangeSelectorComponent } from '../fret-range-selector/fret-range-selector.component';
import { LegendComponent } from "./components/legend/legend.component";

@Component({
  selector: 'app-freatboard',
  templateUrl: './freatboard.component.html',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FretRangeSelectorComponent, LegendComponent],
  styleUrls: ['./freatboard.component.scss']
})
export class FreatboardComponent implements OnInit {
  @Output() onNoteClicked$: EventEmitter<GuitarNote> = new EventEmitter<GuitarNote>();
  @Input({required: true}) notes: GuitarNote[] = []; // Initialize with empty array
  strings: string[] = [];
  frets: number[] = [];
  private _fretRange = { minFret: 0, maxFret: 24 };

  constructor(
    private guitarNeckService: GuitarNeckService
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
    // Opcjonalnie: odśwież wyświetlanie nut w nowym zakresie
    this.refreshNotesInRange();
  }

  protected isNoteInRange(fret: number): boolean {
    return fret >= this._fretRange.minFret && fret <= this._fretRange.maxFret;
  }

  private refreshNotesInRange() {
    // Tutaj logika odświeżania wyświetlanych nut w zakresie
    // Możesz to zaimplementować według potrzeb
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
    console.log('note', note?.interval);
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
}


/*


*/
