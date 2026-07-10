import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { PRACTICE_PROMPTS } from '../shared/practice-prompts.data';

@Component({
  selector: 'app-pattern-display',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './pattern-display.component.html',
  styleUrl: './pattern-display.component.scss'
})
export class PatternDisplayComponent {
  constructor(
    private patternBuilder: PatternBuilderService,
  ) {}

  // -- Delegating properties: shield template from direct service access --

  get currentPattern() {
    return this.patternBuilder.currentPattern;
  }

  get relatedChord() {
    return this.patternBuilder.relatedChord;
  }

  getPromptsForType(type: 'scale' | 'chord'): string[] {
    return PRACTICE_PROMPTS[type] ?? PRACTICE_PROMPTS.chord;
  }
}
