import { Component } from '@angular/core';
import { NoteService } from '../services/note.service';
import { GuitarNeckService } from '../services/guitar-neck.service';
import { Command, DisplayAllNotesCommand, DisplayScaleCommand, DisplaySingleNoteCommand, DisplayTriadCommand } from '../shared/UICommands';
import { ToolboxSearchQuery } from '../shared/model/musicElements';
import { NoteSelectionService } from '../services/note-selection.service';
import { AISuggestionService } from '../services/ai-suggestion.service';
import { ToolboxFormComponent } from '../toolbox-form/toolbox-form.component';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { AISuggestionsComponent } from '../ai-suggestions/ai-suggestions.component';
import { ChatComponent } from '../chat/chat.component';
import { AIResponse } from '../shared/model/ai-response.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    ToolboxFormComponent,
    GuitarNeckComponent,
    AISuggestionsComponent,
    ChatComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  constructor(
    private noteService: NoteService,
    private guitarNeckService: GuitarNeckService,
    private noteSelectionService: NoteSelectionService,
    private aiSuggestionService: AISuggestionService,
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
      command = new DisplayTriadCommand(this.noteSelectionService, event.musicElements, event.keys);
    } else {
      command = new DisplayScaleCommand(this.noteSelectionService, event.musicElements, event.keys);
    }

    command.execute();
  }

  handleAIResponse(aiResponse: AIResponse) {
    this.aiSuggestionService.setResponse(aiResponse);
  }
}
