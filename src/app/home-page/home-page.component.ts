import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { DomainService } from '../domain/domain.service';
import { DomainCommand } from '../domain/commands';
import { GuitarNeckComponent } from '../guitar-neck/guitar-neck.component';
import { RangeToolbarComponent } from '../range-toolbar/range-toolbar.component';
import { environment } from '../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { LegendComponent } from '../legend/legend.component';
import { PatternDisplayComponent } from '../pattern-display/pattern-display.component';
import { MetronomeComponent } from '../metronome/metronome.component';
import { RelationshipStripComponent } from '../relationship-strip/relationship-strip.component';
import { ToolboxBuilderComponent } from '../toolbox/toolbox-builder.component';
import { ChatComponent } from '../../../projects/guitar-chat/src/lib/components/chat/chat.component';

// TODO: Czy displayMode nie powinno być z DomainState.mode zsynchronizowane?
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
    private domainService: DomainService,
  ) {
    // Expose DomainService for console testing in dev mode
    (window as any).__ds = domainService;
  }

  onRangeChange(range: { minFret: number; maxFret: number }): void {
    this.domainService.execute({ type: 'set-view', fretRange: { min: range.minFret, max: range.maxFret } });
  }

  /**
   * Handle DomainCommand from Toolbox (or any client).
   * Delegates to DomainService for standard commands,
   * handles interval show as a special case.
   */
  onToolboxEvent(command: DomainCommand): void {
    switch (command.type) {
      case 'show-pattern':
      case 'show-interval':
        this.domainService.execute(command);
        this.displayMode.set('legend');
        break;

      case 'compare-patterns':
        this.domainService.execute(command);
        this.displayMode.set('relationship');
        break;

      case 'set-view':
        this.domainService.execute(command);
        break;

      case 'set-emphasis':
        this.domainService.execute(command);
        break;

      case 'clear-view':
        this.domainService.execute(command);
        this.displayMode.set(null);
        break;
    }
  }
}
