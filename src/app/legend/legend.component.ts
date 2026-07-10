import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FretboardStateService } from '../services/guitar-neck.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';

export interface IntervalDef {
  cssClass: string;
  label: string;
}

@Component({
  selector: 'app-legend',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss'
})
export class LegendComponent {

  readonly allIntervals: IntervalDef[] = [
    { cssClass: 'root', label: 'Root' },
    { cssClass: 'minor-2nd', label: '♭2' },
    { cssClass: 'major-2nd', label: '2' },
    { cssClass: 'minor-3rd', label: '♭3' },
    { cssClass: 'major-3rd', label: '3' },
    { cssClass: 'perfect-4th', label: '4' },
    { cssClass: 'diminished-5th', label: '♭5' },
    { cssClass: 'perfect-5th', label: '5' },
    { cssClass: 'minor-6th', label: '♭6' },
    { cssClass: 'major-6th', label: '6' },
    { cssClass: 'minor-7th', label: '♭7' },
    { cssClass: 'major-7th', label: '7' },
  ];

  constructor(
    private guitarNeckService: FretboardStateService,
    private displayService: FretboardDisplayService
  ) {}

  // -- Delegating properties: shield template from direct service access --

  get markerDisplayMode(): string {
    return this.guitarNeckService.markerDisplayMode;
  }

  set markerDisplayMode(value: string) {
    this.guitarNeckService.markerDisplayMode = value as any;
  }

  get hasActiveResult(): boolean {
    return this.guitarNeckService.hasActiveResult;
  }

  get hasRelation(): boolean {
    return this.displayService.hasRelation;
  }

  get activeIntervals(): string[] {
    return this.displayService.getActiveIntervals();
  }

  isActive(cssClass: string): boolean {
    return this.activeIntervals.includes(cssClass);
  }
}
