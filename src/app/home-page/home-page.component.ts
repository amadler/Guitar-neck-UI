import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgIf } from '@angular/common';
import { FretboardStateService } from '../services/guitar-neck.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { Command, DisplayAllNotesCommand, DisplayScaleCommand, DisplaySingleNoteCommand, DisplayChordCommand, DisplayCustomPatternCommand } from '../shared/UICommands';
import { ToolboxSearchQuery } from 'guitar-toolbox-lib';
import { FretboardOrchestrationService } from '../services/music-theory-facade.service';
import { ToolboxFormComponent } from 'guitar-toolbox-lib';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { environment } from '../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { LegendComponent } from '../legend/legend.component';
import { PatternDisplayComponent } from '../pattern-display/pattern-display.component';
import { MetronomeComponent } from '../metronome/metronome.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
  imports: [
    NgIf,
    ToolboxFormComponent,
    GuitarNeckComponent,
    HeaderComponent,
    FooterComponent,
    LegendComponent,
    PatternDisplayComponent,
    MetronomeComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  chatEnabled = environment.features.chatEnabled;

  constructor(
    private guitarNeckService: FretboardStateService,
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private patternBuilder: PatternBuilderService,
  ) { }

  toolboxSubmit(event: ToolboxSearchQuery): void {
    this.guitarNeckService.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    const { musicElements, keys, type } = event;

    let command: Command;
    if (type === 'custom' && Array.isArray(musicElements)) {
      command = new DisplayCustomPatternCommand(
        this.fretboardOrchestrationService,
        musicElements,
        keys
      );
    } else if (type === 'basic' && musicElements === 'All notes') {
      command = new DisplayAllNotesCommand(this.fretboardOrchestrationService);
      this.patternBuilder.clearCurrentPattern();
    } else if (type === 'basic') {
      command = new DisplaySingleNoteCommand(this.fretboardOrchestrationService, keys);
      this.patternBuilder.clearCurrentPattern();
    } else if (type === 'chord' && typeof musicElements === 'string') {
      command = new DisplayChordCommand(this.fretboardOrchestrationService, musicElements, keys);
      this.patternBuilder.setCurrentPattern(musicElements, keys, 'chord');
    } else if (type === 'scale' && typeof musicElements === 'string') {
      command = new DisplayScaleCommand(this.fretboardOrchestrationService, musicElements, keys);
      this.patternBuilder.setCurrentPattern(musicElements, keys, 'scale');
    } else {
      return;
    }

    command.execute();
  }
}
