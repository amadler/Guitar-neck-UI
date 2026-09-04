import { AsyncPipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardNotePositionService } from '../services/note.service';
import { FretboardStateService } from '../services/fretboard-state.service';

@Component({
    selector: 'app-guitar-neck',
    imports: [AsyncPipe, FreatboardComponent],
    templateUrl: './guitar-neck.component.html',
    styleUrl: './guitar-neck.component.scss'
})
export class GuitarNeckComponent {
  neckConfig = neckConfig;
  guitarNotes: GuitarNote[];
  @ViewChild(FreatboardComponent) freatboardComponent!: FreatboardComponent;

  constructor(
    private noteService: FretboardNotePositionService,
    private guitarNeckService: FretboardStateService,
  ) {
    this.guitarNotes =  this.noteService.getAllPositions();
    this.guitarNeckService.notes = this.guitarNotes;
    this.guitarNeckService.hideAllNotes();
  }

  onNoteClicked(note: GuitarNote): void {
    console.log('onNoteClicked$', note);
  }

}
