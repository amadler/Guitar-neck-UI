import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FretboardStateService } from '../services/guitar-neck.service';
import { PRACTICE_PROMPTS } from '../shared/practice-prompts.data';

@Component({
  selector: 'app-pattern-display',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './pattern-display.component.html',
  styleUrl: './pattern-display.component.scss'
})
export class PatternDisplayComponent {
  constructor(protected guitarNeckService: FretboardStateService) {}

  getPromptsForType(type: 'scale' | 'chord'): string[] {
    return PRACTICE_PROMPTS[type] ?? PRACTICE_PROMPTS.chord;
  }
}
