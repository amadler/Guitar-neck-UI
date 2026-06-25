import { Component } from '@angular/core';
import { FretboardStateService } from '../services/guitar-neck.service';
import { Command, DisplayAllNotesCommand, DisplayScaleCommand, DisplaySingleNoteCommand, DisplayChordCommand, DisplayCustomPatternCommand } from '../shared/UICommands';
import { isCustomToolboxSearchQuery, ToolboxSearchQuery } from '../shared/model/musicElements';
import { FretboardOrchestrationService } from '../services/music-theory-facade.service';
import { ToolboxFormComponent } from 'guitar-toolbox-lib';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { GuitarChatModule } from '../../../projects/guitar-chat/src/public-api';

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
    private guitarNeckService: FretboardStateService,
    private fretboardOrchestrationService: FretboardOrchestrationService,
  ) { }

  toolboxSubmit(event: ToolboxSearchQuery): void {
    this.guitarNeckService.clearFretboard();

    let command: Command;
    if (isCustomToolboxSearchQuery(event)) {
      command = new DisplayCustomPatternCommand(
        this.fretboardOrchestrationService,
        event.musicElements,
        event.keys
      );
    } else if (event.type === 'basic' && event.musicElements === 'All notes') {
      command = new DisplayAllNotesCommand(this.fretboardOrchestrationService);
    } else if (event.type === 'basic' && typeof event.musicElements === 'string') {
      command = new DisplaySingleNoteCommand(this.fretboardOrchestrationService, event.keys);
    } else if (event.type === 'chord' && typeof event.musicElements === 'string') {
      command = new DisplayChordCommand(this.fretboardOrchestrationService, event.musicElements, event.keys);
    } else if (event.type === 'scale' && typeof event.musicElements === 'string') {
      command = new DisplayScaleCommand(this.fretboardOrchestrationService, event.musicElements, event.keys);
    } else {
      return;
    }

    command.execute();
  }
}
