import { Component } from '@angular/core';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { Command, DisplayAllNotesCommand, DisplayScaleCommand, DisplaySingleNoteCommand, DisplayChordCommand } from '../shared/UICommands';
import { ToolboxSearchQuery } from '../shared/model/musicElements';
import { NoteSelectionService } from '../services/note-selection.service';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { GuitarChatModule } from '@guitar-ui/chat';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    ToolboxFormComponent,
    GuitarNeckComponent,
    GuitarChatModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  constructor(
    private guitarNeckService: GuitarNeckService,
    private noteSelectionService: NoteSelectionService,
  ) { }

  toolboxSubmit(event: ToolboxSearchQuery): void {
    this.guitarNeckService.clearFretboard();

    let command: Command;
    console.log('musicElements', event);
    if (event.type === 'basic' && event.musicElements === 'All notes') {
      command = new DisplaySingleNoteCommand(this.noteSelectionService, event.keys);
    } else if (event.type === 'basic' ) {
      command = new DisplayAllNotesCommand(this.noteSelectionService);
    } else if ((event.type === 'chord')) {
      command = new DisplayChordCommand(this.noteSelectionService, event.musicElements, event.keys);
    } else {
      command = new DisplayScaleCommand(this.noteSelectionService, event.musicElements, event.keys);
    }

    command.execute();
  }
}
