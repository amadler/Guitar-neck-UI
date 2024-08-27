import { Component } from '@angular/core';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { NoteService } from '../services/note.service';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { Command, DisplayAllNotesCommand, DisplayScaleCommand, DisplaySingleNoteCommand, DisplayTriadCommand } from '../shared/UICommands';
import { ToolboxSearchQuery } from '../shared/model/musicElements';
import { NoteSelectionService } from '../services/note-selection.service';

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
    private guitarNeckService: GuitarNeckService,
    private noteSelectionService: NoteSelectionService,

  ) { }

  toolboxSubmit(event:ToolboxSearchQuery): void {
    console.log('toolboxSubmit', event.musicElements, event.keys);
    this.guitarNeckService.clearFretboard();

    let command: Command;

    if (event.musicElements === 'Single note') {
      command = new DisplaySingleNoteCommand(this.noteService, this.guitarNeckService, event.keys);
    } else if (event.musicElements === 'All notes') {
      command = new DisplayAllNotesCommand(this.guitarNeckService);
    } else if (event.musicElements.includes('Triad')) {
      command = new DisplayTriadCommand(this.guitarNeckService, event.musicElements, event.keys);
    } else {
      command = new DisplayScaleCommand(this.guitarNeckService, event.musicElements, event.keys);
    }

    command.execute();
  }
}
