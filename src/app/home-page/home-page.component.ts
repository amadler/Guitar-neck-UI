import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FretboardStateService } from '../services/fretboard-state.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { RangeToolbarComponent } from '../range-toolbar/range-toolbar.component';
import { environment } from '../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { LegendComponent } from '../legend/legend.component';
import { PatternDisplayComponent } from '../pattern-display/pattern-display.component';
import { MetronomeComponent } from '../metronome/metronome.component';
import { RelationshipStripComponent } from '../relationship-strip/relationship-strip.component';
import { FretboardCommand } from 'guitar-toolbox-lib';
import { ToolboxBuilderComponent } from 'guitar-toolbox-lib';
import { ChatComponent } from '../../../projects/guitar-chat/src/lib/components/chat/chat.component';
import { spellNote } from '../shared/note-utils';

export type DisplayMode = 'legend' | 'relationship' | null;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    NgIf,
    GuitarNeckComponent,
    RangeToolbarComponent,
    HeaderComponent,
    FooterComponent,
    LegendComponent,
    PatternDisplayComponent,
    MetronomeComponent,
    RelationshipStripComponent,
    ToolboxBuilderComponent,
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
  ) { }

  onRangeChange(range: { minFret: number; maxFret: number }): void {
    this.guitarNeckService.fretRange = range;
  }

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
      case 'interval':
        this.handleShowInterval(command);
        break;
      case 'scaleChordRelation':
        this.handleCompare(command);
        break;
    }
  }

  private handleShowScale(command: FretboardCommand & { kind: 'scale' }): void {
    const { key, scaleType } = command;
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

    this.fretboardOrchestrationService.displayChord(chordType, key);
    this.patternBuilder.setCurrentPattern(chordType, key, 'chord');
    this.displayMode.set('legend');
  }

  private handleShowInterval(command: FretboardCommand & { kind: 'interval' }): void {
    const { key, interval } = command;
    if (!key || !interval) return;

    const semitoneMap: Record<string, number> = {
      '1': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4,
      '4': 5, 'b5': 6, '5': 7, 'b6': 8, '6': 9,
      'b7': 10, '7': 11,
    };
    const semitone = semitoneMap[interval];
    if (semitone === undefined) return;

    // Use spellNote() to get the correct enharmonic spelling:
    // minor intervals (b2, b3, b5, b6, b7) → flat spellings (Db, Eb, Gb, Ab, Bb)
    // major/perfect intervals → sharp spellings
    // This ensures Tonal's distance() returns the expected interval name.
    const note = spellNote(key, semitone, interval);
    const notes = [key, note];
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
