import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgIf } from '@angular/common';
import { FretboardStateService } from '../services/guitar-neck.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { MusicSelection } from '../shared/model/music-selection';
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

    let command: Command | null = null;
    if (type === 'custom' && Array.isArray(musicElements)) {
      command = this.buildCustomPatternCommand(musicElements, keys);
    } else if (type === 'basic' && musicElements === 'All notes') {
      command = this.buildAllNotesCommand();
    } else if (type === 'basic') {
      command = this.buildSingleNoteCommand(keys);
    } else if (type === 'chord' && typeof musicElements === 'string') {
      command = this.buildChordCommand(musicElements, keys);
    } else if (type === 'scale' && typeof musicElements === 'string') {
      command = this.buildScaleCommand(musicElements, keys);
    }

    command?.execute();
  }

  private buildCustomPatternCommand(intervals: number[], root: string): Command {
    this.guitarNeckService.currentSelection = {
      type: 'custom',
      rootNote: root,
      intervals,
    };
    return new DisplayCustomPatternCommand(
      this.fretboardOrchestrationService,
      intervals,
      root
    );
  }

  private buildAllNotesCommand(): Command {
    this.guitarNeckService.currentSelection = {
      type: 'all-notes',
    };
    return new DisplayAllNotesCommand(this.fretboardOrchestrationService);
  }

  private buildSingleNoteCommand(root: string): Command {
    this.guitarNeckService.currentSelection = {
      type: 'note',
      rootNote: root,
      notes: [root],
    };
    return new DisplaySingleNoteCommand(this.fretboardOrchestrationService, root);
  }

  private buildChordCommand(name: string, root: string): Command {
    this.patternBuilder.setCurrentPattern(name, root, 'chord');
    return new DisplayChordCommand(this.fretboardOrchestrationService, name, root);
  }

  private buildScaleCommand(name: string, root: string): Command {
    this.patternBuilder.setCurrentPattern(name, root, 'scale');
    return new DisplayScaleCommand(this.fretboardOrchestrationService, name, root);
  }
}
