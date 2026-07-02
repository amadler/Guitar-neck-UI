import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-string-toggle',
  standalone: true,
  imports: [],
  template: `
    <label class="string-toggle" [attr.title]="stringName + ' string'">
      <input type="checkbox"
             [checked]="active"
             [disabled]="disabled"
             (change)="onToggle($event)"
             [attr.aria-label]="'Show notes on ' + stringName + ' string'">
    </label>
  `,
  styles: [`
    .string-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 22px;
    }
    .string-toggle input {
      margin: 0;
      cursor: pointer;
      accent-color: var(--guitar-neck-dot-color, #555);
    }
    .string-toggle input:disabled {
      cursor: default;
      opacity: 0.3;
    }
  `]
})
export class StringToggleComponent {
  @Input({ required: true }) stringName = '';
  @Input({ required: true }) stringIndex = 0;
  @Input() active = true;
  @Input() disabled = false;

  @Output() stringToggled = new EventEmitter<{ stringIndex: number; active: boolean }>();

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.stringToggled.emit({ stringIndex: this.stringIndex, active: checked });
  }
}
