import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FretRangeSelectorComponent } from '../fret-range-selector/fret-range-selector.component';
import { neckConfig } from 'guitar-neck-shared';

interface Preset {
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-range-toolbar',
  standalone: true,
  imports: [CommonModule, FretRangeSelectorComponent],
  templateUrl: './range-toolbar.component.html',
  styleUrls: ['./range-toolbar.component.scss']
})
export class RangeToolbarComponent {
  @Output() rangeChange = new EventEmitter<{minFret: number, maxFret: number}>();

  readonly presets: Preset[] = [
    { label: 'Open', min: 0, max: 4 },
    { label: '5th', min: 5, max: 8 },
    { label: '9th', min: 9, max: 12 },
    { label: '12th', min: 12, max: 15 },
    { label: 'Full', min: 0, max: neckConfig.numberOfFrets }
  ];

  activePreset: Preset | null = this.presets[4]; // Full active by default
  isCustom = false;

  selectPreset(preset: Preset): void {
    this.activePreset = preset;
    this.isCustom = false;
    this.emitRange(preset.min, preset.max);
  }

  onSliderChange(range: {minFret: number, maxFret: number}): void {
    this.isCustom = !this.presets.some(p => p.min === range.minFret && p.max === range.maxFret);
    if (!this.isCustom) {
      this.activePreset = this.presets.find(p => p.min === range.minFret && p.max === range.maxFret) || null;
    } else {
      this.activePreset = null;
    }
    this.emitRange(range.minFret, range.maxFret);
  }

  private emitRange(min: number, max: number): void {
    this.rangeChange.emit({ minFret: min, maxFret: max });
  }
}
