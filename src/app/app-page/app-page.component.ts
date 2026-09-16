import { Component, computed, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
import { HeaderComponent } from '../header/header.component';
import { ChatService } from '../chat/services/chat.service';
import { LessonRegistryService } from '../services/lesson-registry.service';

export type DisplayMode = 'legend' | 'relationship' | null;

@Component({
  selector: 'app-app-page',
  imports: [
    GuitarNeckComponent,
    RangeToolbarComponent,
    HeaderComponent,
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
export class AppPageComponent implements OnInit {
  private domainService = inject(DomainService);
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private lessonRegistry = inject(LessonRegistryService);

  /** Whether AI chat mode is active — metronome hides, chat gets fixed width. */
  aiMode = computed(() => this.domainService.currentState().aiModeEnabled);

  /**
   * Controls which overlay is shown: legend (for Show) or relationship strip (for Compare).
   * Read from DomainState.displayMode — set by DomainService handlers for both Toolbox and AI paths.
   */
  displayMode = computed<DisplayMode>(() => this.domainService.currentState().displayMode);

  /** Whether the Range toolbar should be disabled (e.g. in Shape/positions mode or during exercise). */
  rangeDisabled = computed(() =>
    this.domainService.currentState().mode === 'positions' ||
    this.domainService.currentState().exerciseMode
  );

  /** Whether the fretboard is in exercise selection mode. */
  exerciseMode = computed(() => this.domainService.currentState().exerciseMode);

  ngOnInit(): void {
    const lessonId = this.route.snapshot.queryParamMap.get('lesson');
    if (lessonId) {
      const lesson = this.lessonRegistry.getLesson(lessonId);
      if (lesson) {
        // Enable AI mode and start the lesson
        this.domainService.execute({ type: 'set-ai-mode', enabled: true });
        this.chatService.startLesson(lessonId);
      }
    }
  }

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
