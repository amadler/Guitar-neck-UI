import { Component } from '@angular/core';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { NoteService } from '../services/note.service';
import { GuitarNeckService } from '../services/guitar-neck.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ToolboxFormComponent, GuitarNeckComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  constructor(
    private noteService: NoteService,
    private guitarNeckService: GuitarNeckService

  ) { }
  toolboxSubmit(event:any): void {
    this.guitarNeckService.clearFretboard()
    switch(event.musicElements) {
      case 'Single note':
        console.log('Single note', event.keys);
        const notes = this.noteService.getNotesByNoteName(event.keys);
        this.guitarNeckService.selectNotes(notes);
        break;
      case 'All notes':
        console.log('All notes', event.keys);

        this.guitarNeckService.showAllNotes();
        break;
      default:
        console.log('Unknown music element');
    }
  }
}
