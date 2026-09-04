import { Component, EventEmitter, Output, ChangeDetectionStrategy, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { neckConfig } from 'guitar-neck-shared';

// TODO: separate file maybe
interface Preset {
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-range-toolbar',
  imports: [FormsModule],
  templateUrl: './range-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./range-toolbar.component.scss']
})
export class RangeToolbarComponent {
  rangeChange = output<{ minFret: number, maxFret: number }>();
  neckConfig = neckConfig;
  readonly presets: Preset[] = [
    { label: 'Open', min: 0, max: 4 },
    { label: '5th Pos.', min: 5, max: 9 },
    { label: '9th Pos.', min: 9, max: 13 },
    { label: '12th Pos.', min: 12, max: 16 },
    { label: 'Full Neck', min: 0, max: neckConfig.numberOfFrets },
    { label: 'Custom', min: 0, max: neckConfig.numberOfFrets }
  ];

  activePreset: Preset | null = this.presets[4];
  isCustom = false;

  customMin = 0;
  customMax = neckConfig.numberOfFrets;

  selectPreset(preset: Preset): void {
    if (preset.label === 'Custom') {
      this.isCustom = true;
      this.activePreset = null;
      return;
    }
    this.activePreset = preset;
    this.isCustom = false;
    // Reset custom inputs to the selected preset so re-entering Custom shows matching values
    this.customMin = preset.min;
    this.customMax = preset.max;
    this.emitRange(preset.min, preset.max);
  }

  applyCustom(): void {
    const min = Math.max(0, Math.min(this.customMin, this.customMax));
    const max = Math.min(neckConfig.numberOfFrets, Math.max(this.customMin, this.customMax));
    this.customMin = min;
    this.customMax = max;
    this.isCustom = false;
    this.activePreset = null;
    this.emitRange(min, max);
  }

  private emitRange(min: number, max: number): void {
    this.rangeChange.emit({ minFret: min, maxFret: max });
  }
}
