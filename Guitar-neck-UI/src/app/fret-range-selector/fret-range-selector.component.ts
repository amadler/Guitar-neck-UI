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
          <label for="minFret">From:</label>
          <input
            type="number"
            id="minFret"
            [(ngModel)]="selectedMinFret"
            min="0"
            [max]="maxFret"
            (ngModelChange)="onRangeChange()"
          >
        </div>
        <div class="input-group">
          <label for="maxFret">To:</label>
          <input
            type="number"
            id="maxFret"
            [(ngModel)]="selectedMaxFret"
            [min]="selectedMinFret"
            [max]="maxFret"
            (ngModelChange)="onRangeChange()"
          >
        </div>
        <button class="show-all-btn" (click)="showAll()">Show All</button>
      </div>
      <div class="position-buttons">
        <button
          *ngFor="let position of commonPositions"
          (click)="selectPosition(position)"
          [class.active]="isPositionActive(position)"
        >
          Position {{position}}
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
      width: 100%; // Dodane dla lepszego dopasowania szerokości
    }

    .range-inputs {
      display: flex;
      justify-content: center; // Wycentrowanie inputów
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
      justify-content: center; // Wycentrowanie przycisków
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

    button.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    button:hover {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .show-all-btn {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .show-all-btn:hover {
      background-color: var(--primary-color-dark);
    }
  `]
})
export class FretRangeSelectorComponent {
  @Output() rangeChange = new EventEmitter<{minFret: number, maxFret: number}>();

  selectedMinFret = 0;
  selectedMaxFret = 24;
  maxFret = 24;
  commonPositions = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]; // Dodane pozycje do końca gryfu

  selectPosition(position: number) {
    this.selectedMinFret = position;
    this.selectedMaxFret = position + 4; // Standardowo 4 progi na pozycję
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
