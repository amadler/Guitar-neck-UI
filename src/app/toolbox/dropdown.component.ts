import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener } from '@angular/core';


@Component({
    selector: 'app-dropdown',
    imports: [],
    template: `
    <div class="dropdown-wrapper">
      <button
        class="dropdown-chip"
        (click)="toggle()"
      >
        {{ displayFn(selectedValue) }}
        <span class="dropdown-arrow">▼</span>
      </button>

      @if (isOpen()) {
        <div class="dropdown-panel">
          @if (showFilter) {
            <input
              #filterInput
              class="dropdown-filter"
              type="text"
              placeholder="filter..."
              [value]="filterText()"
              (input)="onFilterInput($event)"
              (keydown)="$event.stopPropagation()"
            />
          }
          @for (item of filteredOptions(); track trackByFn($index, item)) {
            <button
              class="dropdown-option"
              [class.dropdown-option--selected]="item === selectedValue"
              (click)="select(item)"
            >
              {{ displayFn(item) }}
            </button>
          }
        </div>
      }
    </div>
  `,
    // TODO: przenieść style
    styles: [`
    .dropdown-wrapper { position: relative; display: inline-flex; }
    .dropdown-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; padding-right: 6px;
      border: 1px solid var(--toolbox-border-color, var(--toolbox-border, #ccc));
      border-radius: var(--toolbox-radius-sm, 12px);
      background: var(--toolbox-chip-bg, #f5f5f5);
      color: var(--toolbox-text, inherit);
      font-family: inherit; font-size: 14px; cursor: pointer;
      white-space: nowrap; transition: background 0.15s, border-color 0.15s;
    }
    .dropdown-chip:hover {
      background: var(--toolbox-chip-hover-bg, #e8e8e8);
      border-color: var(--toolbox-accent, currentColor);
    }
    .dropdown-arrow { font-size: 10px; opacity: 0.6; }
    .dropdown-panel {
      position: absolute; top: 100%; left: 0; z-index: 100;
      min-width: 140px; max-height: 240px; overflow-y: auto;
      background: var(--toolbox-bg, #fff);
      border: 1px solid var(--toolbox-border-color, #ccc);
      border-radius: var(--toolbox-radius-sm, 6px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      margin-top: 4px;
    }
    .dropdown-filter {
      width: 100%; padding: 6px 8px; border: none;
      border-bottom: 1px solid var(--toolbox-border-color, #eee);
      background: var(--toolbox-bg, transparent);
      color: var(--toolbox-text, inherit);
      font-family: inherit; font-size: 13px; outline: none;
      box-sizing: border-box;
    }
    .dropdown-filter:focus { border-bottom-color: var(--toolbox-accent, currentColor); }
    .dropdown-option {
      display: block; width: 100%; padding: 6px 12px;
      border: none; background: transparent;
      color: var(--toolbox-text, inherit);
      font-family: inherit; font-size: 14px; text-align: left;
      cursor: pointer;
    }
    .dropdown-option:hover { background: var(--toolbox-chip-hover-bg, #e8e8e8); }
    .dropdown-option--selected {
      background: var(--toolbox-accent, #005a2b);
      color: var(--toolbox-accent-text, #fff);
    }
  `]
})
export class DropdownComponent<T> {
  @Input() options: T[] = [];
  @Input() displayFn: (item: T) => string = (item: T) => String(item);
  @Input() selectedValue!: T;
  @Input() showFilter = false;
  @Input() trackByFn: (index: number, item: T) => unknown = (_i, item) => item;

  @Output() valueChange = new EventEmitter<T>();

  isOpen = signal(false);
  filterText = signal('');

  constructor(private elementRef: ElementRef) { }

  toggle(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.filterText.set('');
    }
  }

  select(value: T): void {
    this.valueChange.emit(value);
    this.isOpen.set(false);
    this.filterText.set('');
  }

  onFilterInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterText.set(input.value);
  }

  filteredOptions(): T[] {
    if (!this.showFilter || !this.filterText()) {
      return this.options;
    }
    const query = this.filterText().toLowerCase();
    return this.options.filter(item =>
      this.displayFn(item).toLowerCase().includes(query)
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.filterText.set('');
    }
  }
}