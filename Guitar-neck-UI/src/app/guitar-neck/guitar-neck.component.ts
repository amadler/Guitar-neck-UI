import { Component, ViewChild } from '@angular/core';
import GuitarNeck from '../shared/GuitarNeck';
import { neckConfig } from '../shared/model/neckConfig';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { GuitarNote } from '../shared/model/guitarNote';
import { NoteService } from '../services/note.service';

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
  constructor(private noteService: NoteService) {
    this.guitarNotes = this.noteService.getAllnotes();
  }

  @ViewChild(FreatboardComponent) freatboardComponent!: FreatboardComponent;

  onNoteClicked(note: GuitarNote): void {
    console.log('onNoteClicked$', note);
  }
}
