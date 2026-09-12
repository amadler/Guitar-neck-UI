import { AsyncPipe } from '@angular/common';
import { Component, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardNotePositionService } from '../services/note.service';
import { FretboardStateService } from '../services/fretboard-state.service';

@Component({
  selector: 'app-guitar-neck',
  imports: [FreatboardComponent],
  templateUrl: './guitar-neck.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guitar-neck.component.scss'
})
export class GuitarNeckComponent {
  private noteService = inject(FretboardNotePositionService);
  private guitarNeckService = inject(FretboardStateService);

  neckConfig = neckConfig;
  @ViewChild(FreatboardComponent) freatboardComponent!: FreatboardComponent;

  constructor() {
    const allPositions = this.noteService.getAllPositions();
    this.guitarNeckService.initialize(allPositions);
  }

  onNoteClicked(note: GuitarNote): void {
    console.log('onNoteClicked$', note);
  }

}