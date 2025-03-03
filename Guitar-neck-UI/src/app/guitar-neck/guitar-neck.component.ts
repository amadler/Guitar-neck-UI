import { Component, ViewChild } from '@angular/core';
import GuitarNeck from '../shared/GuitarNeck';
import { neckConfig } from '../shared/model/neckConfig';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from '../services/note.service';
import { GuitarNeckService } from '../services/guitar-neck.service';

@Component({
  selector: 'app-guitar-neck',
  standalone: true,
  imports: [FreatboardComponent],
  templateUrl: './guitar-neck.component.html',
  styleUrl: './guitar-neck.component.scss'
})
export class GuitarNeckComponent {
  neckConfig = neckConfig;
  neck= new GuitarNeck(neckConfig);
  guitarNotes: GuitarNote[];
  @ViewChild(FreatboardComponent) freatboardComponent!: FreatboardComponent;

  constructor(
    private noteService: NoteService,
    private guitarNeckService: GuitarNeckService
  ) {
    this.guitarNotes =  this.noteService.getAllNotes();
    this.guitarNeckService.notes = this.guitarNotes;
    this.guitarNeckService.hideAllNotes();
  }

  onNoteClicked(note: GuitarNote): void {
    console.log('onNoteClicked$', note);
  }

}
