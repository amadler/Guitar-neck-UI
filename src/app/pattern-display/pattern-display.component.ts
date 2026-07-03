import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FretboardStateService } from '../services/guitar-neck.service';

@Component({
  selector: 'app-pattern-display',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './pattern-display.component.html',
  styleUrl: './pattern-display.component.scss'
})
export class PatternDisplayComponent {
  constructor(protected guitarNeckService: FretboardStateService) {}
}
