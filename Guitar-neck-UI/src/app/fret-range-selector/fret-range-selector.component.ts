import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fret-range-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fret-range-controls">
      <div class="range-inputs">
        <div class="input-group">
          <label for="minFret">Od progu:</label>
          <input
            type="number"
            id="minFret"
            [min]="0"
            [max]="maxFret"
            [(ngModel)]="selectedMinFret"
            (ngModelChange)="onRangeChange()"
          >
        </div>
        <div class="input-group">
          <label for="maxFret">Do progu:</label>
          <input
            type="number"
            id="maxFret"
            [min]="selectedMinFret"
            [max]="24"
            [(ngModel)]="selectedMaxFret"
            (ngModelChange)="onRangeChange()"
          >
        </div>
      </div>
      <div class="position-buttons">
        <button
          *ngFor="let position of commonPositions"
          (click)="selectPosition(position)"
          [class.active]="isPositionActive(position)"
        >
          Pozycja {{position}}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .fret-range-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background-color: var(--guitar-neck-bg-color);
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .range-inputs {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    input[type="number"] {
      width: 60px;
      padding: 0.25rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .position-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:hover {
      background: #f0f0f0;
    }

    button.active {
      background: #007bff;
      color: white;
      border-color: #0056b3;
    }
  `]
})
export class FretRangeSelectorComponent {
  @Output() rangeChange = new EventEmitter<{minFret: number, maxFret: number}>();

  selectedMinFret = 0;
  selectedMaxFret = 24;
  maxFret = 24;
  commonPositions = [1, 3, 5, 7, 9, 12]; // Typowe pozycje na gryfie

  selectPosition(position: number) {
    this.selectedMinFret = position;
    this.selectedMaxFret = position + 4; // Standardowo 4 progi na pozycję
    this.onRangeChange();
  }

  isPositionActive(position: number): boolean {
    return this.selectedMinFret === position && this.selectedMaxFret === position + 4;
  }

  onRangeChange() {
    this.rangeChange.emit({
      minFret: this.selectedMinFret,
      maxFret: this.selectedMaxFret
    });
  }
}
