import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { AppStateService } from '../app-state.service';

@Component({
  selector: 'app-mode-selector',
  standalone: true,
  imports: [NgIf],
  templateUrl: './mode-selector.component.html',
  styleUrl: './mode-selector.component.scss',
})
export class ModeSelectorComponent {
  constructor(private appState: AppStateService) {}

  selectScale(): void {
    this.appState.setMode('scale');
  }

  selectScaleChord(): void {
    this.appState.setMode('scale-chord');
  }
}
