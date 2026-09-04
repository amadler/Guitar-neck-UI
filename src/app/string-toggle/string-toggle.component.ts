import { Component, EventEmitter, Output, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-string-toggle',
  template: `
    <label class="string-toggle" [attr.title]="stringName() + ' string'">
      <input type="checkbox"
             [checked]="active()"
             [disabled]="disabled()"
             (change)="onToggle($event)"
             [attr.aria-label]="'Show notes on ' + stringName() + ' string'">
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly stringName = input.required<string>();
  readonly stringIndex = input.required<number>();
  readonly active = input(true);
  readonly disabled = input(false);

  readonly stringToggled = output<{ stringIndex: number; active: boolean }>();
  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.stringToggled.emit({ stringIndex: this.stringIndex(), active: checked });
  }
}
