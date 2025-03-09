import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { neckConfig } from 'shared';

@Component({
  selector: 'app-fret-range-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fret-range-selector.component.html',
  styleUrls: ['./fret-range-selector.component.scss']
})
export class FretRangeSelectorComponent {
  @Output() rangeChange = new EventEmitter<{minFret: number, maxFret: number}>();
  neckConfig = neckConfig;

  selectedMinFret = 0;
  selectedMaxFret = neckConfig.numberOfFrets;
  maxFret = neckConfig.numberOfFrets;
  commonPositions = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21].filter(pos => pos <= this.neckConfig.numberOfFrets);

  selectPosition(position: number) {
    this.selectedMinFret = position;
    this.selectedMaxFret = position + 4;
    if (this.selectedMaxFret > this.maxFret) {
      this.selectedMaxFret = this.maxFret;
    }
    this.onRangeChange();
  }

  showAll() {
    this.selectedMinFret = 0;
    this.selectedMaxFret = this.maxFret;
    this.onRangeChange();
  }

  onRangeChange() {
    this.rangeChange.emit({
      minFret: this.selectedMinFret,
      maxFret: this.selectedMaxFret
    });
  }

  isPositionActive(position: number): boolean {
    return this.selectedMinFret === position;
  }
}
