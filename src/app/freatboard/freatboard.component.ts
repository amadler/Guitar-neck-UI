import { Component, EventEmitter, Output, ChangeDetectionStrategy, inject, output } from '@angular/core';
import type { GuitarNote } from '../shared/model/guitarNote';
import { DomainService } from '../domain/domain.service';
import { FretboardStateService } from '../services/fretboard-state.service';
import { FretboardNoteQueryService } from '../services/fretboard-note-query.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';
import { NgClass } from '@angular/common';
import { neckConfig } from 'guitar-neck-shared';
import { StringToggleComponent } from '../string-toggle/string-toggle.component';

@Component({
  selector: 'app-freatboard',
  templateUrl: './freatboard.component.html',
  imports: [NgClass, StringToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./freatboard.component.scss']
})
export class FreatboardComponent {
  private domainService = inject(DomainService);
  private guitarNeckService = inject(FretboardStateService);
  private noteQueryService = inject(FretboardNoteQueryService);
  private displayService = inject(FretboardDisplayService);

  onNoteClicked$ = output<GuitarNote>();
  strings: string[] = [];
  frets: number[] = [];

  constructor() {
    this.strings = neckConfig.stringNotes;
    this.frets = Array.from({ length: neckConfig.numberOfFrets }, (_, i) => i + 1);
  }

  /** Returns true when the fretboard has been initialized with a snapshot. */
  get hasSnapshot(): boolean {
    return this.guitarNeckService.currentSnapshot() !== null;
  }

  get fretRange() {
    return this.domainService.currentState().fretRange;
  }

  // -- Delegating properties: shield template from direct service access --

  get activeStrings(): boolean[] {
    return this.domainService.currentState().enabledStrings;
  }

  get showNoteLabels(): boolean {
    return this.displayService.showNoteLabels;
  }

  /** Whether the fretboard is in exercise selection mode. */
  get exerciseMode(): boolean {
    return this.domainService.currentState().exerciseMode;
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
    return fret >= this.fretRange.min && fret <= this.fretRange.max;
  }

  protected isNoteOnFret(stringIndex: number, fret: number) {
    return this.noteQueryService.isNoteOnFret(stringIndex, fret);
  }

  protected isNoteSelected(stringIndex: number, fret: number): boolean | undefined {
    const note = this.getNote(stringIndex, fret);
    return note ? note.selected : false;
  }

  /** Check if a position is in the exercise selectedNotes list. */
  protected isExerciseSelected(stringIndex: number, fret: number): boolean {
    const selected = this.domainService.currentState().selectedNotes ?? [];
    return selected.some(n => n.string === stringIndex + 1 && n.fret === fret);
  }

  getNoteInterval(stringIndex: number, fret: number): string | undefined {
    const note = this.getNote(stringIndex, fret);
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
    if (note) {
      // In exercise mode, toggle selection directly
      if (this.exerciseMode) {
        const isSelected = this.isExerciseSelected(stringIndex, fret);
        if (isSelected) {
          this.domainService.execute({
            type: 'deselect-note',
            string: stringIndex + 1,
            fret,
          });
        } else {
          this.domainService.execute({
            type: 'select-note',
            note: note.note,
            string: stringIndex + 1,
            fret,
          });
        }
      } else {
        this.onNoteClicked$.emit(note);
      }
    }
  }

  protected getNote(stringIndex: number, fret: number) {
    return this.noteQueryService.getNote(stringIndex, fret);
  }

  /** Handle string toggle checkbox events from StringToggleComponent. */
  protected onStringToggled(event: { stringIndex: number; active: boolean }): void {
    const enabled = [...this.domainService.currentState().enabledStrings];
    if (event.stringIndex >= 0 && event.stringIndex < enabled.length) {
      enabled[event.stringIndex] = event.active;
    }
    this.domainService.execute({ type: 'set-view', enabledStrings: enabled });
  }
}