import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { DomainService } from '../domain/domain.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { PRACTICE_PROMPTS, PromptType } from '../shared/practice-prompts.data';

@Component({
    selector: 'app-pattern-display',
    imports: [NgIf, NgFor],
    templateUrl: './pattern-display.component.html',
    styleUrl: './pattern-display.component.scss'
})
export class PatternDisplayComponent {
  constructor(
    private domainService: DomainService,
    private patternBuilder: PatternBuilderService,
  ) {}

  // -- Delegating properties: shield template from direct service access --

  get currentPattern() {
    return this.patternBuilder.currentPattern;
  }

  get relatedChord() {
    return this.patternBuilder.relatedChord;
  }

  get isScaleChordMode(): boolean {
    return this.domainService.currentState.mode === 'scale-chord';
  }

  getPromptsForType(type: PromptType): string[] {
    return PRACTICE_PROMPTS[type] ?? PRACTICE_PROMPTS.chord;
  }

}
