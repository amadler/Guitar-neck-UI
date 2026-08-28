import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { AppStateService, AppMode } from '../app-state.service';
import { FretboardStateService } from '../services/guitar-neck.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { Command, DisplayAllNotesCommand, DisplayScaleCommand, DisplaySingleNoteCommand, DisplayChordCommand, DisplayCustomPatternCommand } from '../shared/UICommands';
import { FretboardOrchestrationService } from '../services/music-theory-facade.service';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { environment } from '../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { LegendComponent } from '../legend/legend.component';
import { PatternDisplayComponent } from '../pattern-display/pattern-display.component';
import { MetronomeComponent } from '../metronome/metronome.component';
import { RelationshipStripComponent } from '../relationship-strip/relationship-strip.component';
import { ScaleChordRelation, ToolboxSearchQuery } from 'guitar-toolbox-lib';
import { FormsWrapperComponent } from 'guitar-toolbox-lib';
import { ChatComponent } from '../../../projects/guitar-chat/src/lib/components/chat/chat.component';
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    GuitarNeckComponent,
    HeaderComponent,
    FooterComponent,
    LegendComponent,
    PatternDisplayComponent,
    MetronomeComponent,
    RelationshipStripComponent,
    FormsWrapperComponent,
    ChatComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  chatEnabled = environment.features.chatEnabled;

  /** Reactive app mode from AppStateService. */
  appMode$: Observable<AppMode>;

  constructor(
    private appState: AppStateService,
    private guitarNeckService: FretboardStateService,
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private patternBuilder: PatternBuilderService,
  ) {
    this.appMode$ = this.appState.appMode$;
  }
  appModeChanged(mode: AppMode): void {
    this.appState.setMode(mode)
  }
  // --- Scale + Chord relation handler ---

  /** Called when the ScaleChordForm emits a scale+chord relation. */
  onScaleChordFormShow(relation: ScaleChordRelation): void {
    debugger
    this.guitarNeckService.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    this.fretboardOrchestrationService.displayScaleWithChord(
      relation.scaleName,
      relation.scaleRoot,
      relation.chordName,
      relation.chordRoot,
    );

    this.patternBuilder.setCurrentPattern(relation.scaleName, relation.scaleRoot, 'scale');
    this.patternBuilder.setRelatedChord(relation.chordName, relation.chordRoot);
  }

  isToolboxSearchQuery(
    query: ToolboxSearchQuery | ScaleChordRelation
  ): query is ToolboxSearchQuery {
    return 'musicElements' in query && 'keys' in query;
  }

  toolboxSubmit(query: any): void {
    const payload = query as unknown as ToolboxSearchQuery | ScaleChordRelation;
    this.guitarNeckService.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    if (this.isToolboxSearchQuery(query)) {
      const { musicElements, keys, type } = query;

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
    else {
      this.onScaleChordFormShow(query);
    }
  }

  onToolboxEvent(event: any) {
    console.log('Recieved from ToolboxCommand event: ', event);
  }

  /** Called when the user selects a chord degree from the ChordDegreeSelector. */
  // onChordDegreeSelected(degree: ChordDegreeSelection): void {
  //   if (!degree.chordName || !degree.rootNote) {
  //     // Clear chord relation
  //     this.fretboardOrchestrationService.clearRelation();
  //     this.patternBuilder.relatedChord = null;
  //     return;
  //   }

  //   // Re-display the scale with the selected chord
  //   const sc = this.guitarNeckService.scaleChordState;
  //   if (!sc?.scale.name || !sc?.scale.rootNote) {
  //     return;
  //   }

  //   this.fretboardOrchestrationService.displayScaleWithChord(
  //     sc.scale.name,
  //     sc.scale.rootNote,
  //     degree.chordName,
  //     degree.rootNote,
  //   ).subscribe();

  //   // Build chord pattern info for display
  //   this.patternBuilder.setRelatedChord(degree.chordName, degree.rootNote);
  // }

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
    // Set up scale-only state in scaleChordState
    this.guitarNeckService.scaleChordState = {
      scale: {
        type: 'scale',
        name,
        rootNote: root,
      },
      chord: null,
    };
    return new DisplayScaleCommand(this.fretboardOrchestrationService, name, root);
  }
}
