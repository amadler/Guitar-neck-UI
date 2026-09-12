import { Component, computed, ChangeDetectionStrategy, inject } from '@angular/core';

import { DomainService } from '../domain/domain.service';
import { DomainCommand } from '../domain/commands';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { RangeToolbarComponent } from '../range-toolbar/range-toolbar.component';
import { FooterComponent } from '../footer/footer.component';
import { LegendComponent } from '../legend/legend.component';
import { PatternDisplayComponent } from '../pattern-display/pattern-display.component';
import { MetronomeComponent } from '../metronome/metronome.component';
import { RelationshipStripComponent } from '../relationship-strip/relationship-strip.component';
import { ToolboxBuilderComponent } from '../toolbox/toolbox-builder.component';
import { ChatComponent } from '../chat/chat.component';

export type DisplayMode = 'legend' | 'relationship' | null;

@Component({
  selector: 'app-app-page',
  imports: [
    GuitarNeckComponent,
    RangeToolbarComponent,
    FooterComponent,
    LegendComponent,
    PatternDisplayComponent,
    MetronomeComponent,
    RelationshipStripComponent,
    ToolboxBuilderComponent,
    ChatComponent,
  ],
  templateUrl: './app-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app-page.component.scss'
})
export class AppPageComponent {
  private domainService = inject(DomainService);

  /** Whether AI chat mode is active — metronome hides, chat gets fixed width. */
  aiMode = computed(() => this.domainService.currentState().aiModeEnabled);

  /**
   * Controls which overlay is shown: legend (for Show) or relationship strip (for Compare).
   * Read from DomainState.displayMode — set by DomainService handlers for both Toolbox and AI paths.
   */
  displayMode = computed<DisplayMode>(() => this.domainService.currentState().displayMode);

  /** Whether the Range toolbar should be disabled (e.g. in Shape/positions mode). */
  rangeDisabled = computed(() => this.domainService.currentState().mode === 'positions');

  onRangeChange(range: { minFret: number; maxFret: number }): void {
    this.domainService.execute({ type: 'set-view', fretRange: { min: range.minFret, max: range.maxFret } });
  }

  /**
   * Handle DomainCommand from Toolbox (or any client).
   * Delegates to DomainService — displayMode and rangeDisabled are now computed from state.
   */
  onToolboxEvent(command: DomainCommand): void {
    this.domainService.execute(command);
  }
}