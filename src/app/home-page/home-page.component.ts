import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FretboardStateService } from '../services/guitar-neck.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { FretboardOrchestrationService } from '../services/music-theory-facade.service';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { environment } from '../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { LegendComponent } from '../legend/legend.component';
import { PatternDisplayComponent } from '../pattern-display/pattern-display.component';
import { MetronomeComponent } from '../metronome/metronome.component';
import { RelationshipStripComponent } from '../relationship-strip/relationship-strip.component';
import { FormsWrapperComponent } from 'guitar-toolbox-lib';
import { FretboardCommand, intervalsToNoteNames } from 'guitar-toolbox-lib';
import { ChatComponent } from '../../../projects/guitar-chat/src/lib/components/chat/chat.component';

export type DisplayMode = 'legend' | 'relationship' | null;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    NgIf,
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

  /** Controls which overlay is shown: legend (for Show) or relationship strip (for Compare). */
  displayMode = signal<DisplayMode>(null);

  constructor(
    private guitarNeckService: FretboardStateService,
    private fretboardOrchestrationService: FretboardOrchestrationService,
    private patternBuilder: PatternBuilderService,
  ) {}

  onToolboxEvent(command: FretboardCommand): void {
    this.guitarNeckService.clearFretboard();
    this.patternBuilder.clearCurrentPattern();

    switch (command.kind) {
      case 'scale':
        this.handleShowScale(command);
        break;
      case 'chord':
        this.handleShowChord(command);
        break;
      case 'intervalPattern':
        this.handleShowIntervalPattern(command);
        break;
      case 'scaleChordRelation':
        this.handleCompare(command);
        break;
    }
  }

  private handleShowScale(command: FretboardCommand & { kind: 'scale' }): void {
    const { key, scaleType } = command;
    if (!key || !scaleType) return;

    this.fretboardOrchestrationService.displayScale(scaleType, key);
    this.patternBuilder.setCurrentPattern(scaleType, key, 'scale');
    this.guitarNeckService.scaleChordState = {
      scale: { type: 'scale', name: scaleType, rootNote: key },
      chord: null,
    };
    this.displayMode.set('legend');
  }

  private handleShowChord(command: FretboardCommand & { kind: 'chord' }): void {
    const { key, chordType } = command;
    if (!key || !chordType) return;

    this.fretboardOrchestrationService.displayChord(chordType, key);
    this.patternBuilder.setCurrentPattern(chordType, key, 'chord');
    this.displayMode.set('legend');
  }

  private handleShowIntervalPattern(command: FretboardCommand & { kind: 'intervalPattern' }): void {
    const { key, intervals } = command;
    if (!key || !intervals) return;

    const notes = intervalsToNoteNames(key, intervals);
    this.fretboardOrchestrationService.displayCustomPattern(notes, key);
    this.displayMode.set('legend');
  }

  private handleCompare(command: FretboardCommand & { kind: 'scaleChordRelation' }): void {
    const { scaleKey, scaleType, chordKey, chordType } = command;

    this.fretboardOrchestrationService.displayScaleWithChord(
      scaleType, scaleKey, chordType, chordKey,
    );

    this.patternBuilder.setCurrentPattern(scaleType, scaleKey, 'scale');
    this.patternBuilder.setRelatedChord(chordType, chordKey);
    this.displayMode.set('relationship');
  }
}