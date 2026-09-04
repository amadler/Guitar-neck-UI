import { Component, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';

import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand, ShowPatternCommand, ComparePatternsCommand } from '../domain/commands';
import { DropdownComponent } from './dropdown.component';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';

export interface IntervalOption {
  symbol: string;
  label: string;
}

/** Derived from INTERVAL_CONFIG — single source of truth. */
const INTERVAL_OPTIONS: IntervalOption[] = INTERVAL_CONFIG.map(i => ({
  symbol: i.symbol,
  label: i.label,
}));

const DEFAULT_SCALE_TYPE = 'major';
const DEFAULT_CHORD_TYPE = 'major';

export type ToolboxIntent = 'show' | 'compare';
export type ShowKind = 'chord' | 'scale' | 'interval';
export type MusicKey = string;

@Component({
    selector: 'app-toolbox-builder',
    imports: [DropdownComponent],
    templateUrl: './toolbox-builder.component.html',
    styleUrl: './toolbox-builder.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolboxBuilderComponent {
  @Output() toolboxEvent: EventEmitter<DomainCommand> = new EventEmitter<DomainCommand>();

  // --- Data sources ---
  musicKeys: MusicKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  scalePatternNames = SCALE_PATTERNS.map(s => s.name);
  chordPatternNames = CHORD_PATTERNS.map(c => c.name);
  intervalOptions = INTERVAL_OPTIONS;

  // --- Display functions for dropdowns ---
  keyDisplayFn = (key: MusicKey) => key;
  stringDisplayFn = (value: string) => value;
  intervalDisplayFn = (opt: IntervalOption) => opt.label;
  intervalTrackByFn = (_index: number, opt: IntervalOption) => opt.symbol;

  // --- State signals ---
  intent = signal<ToolboxIntent>('show');
  showKind = signal<ShowKind>('scale');

  selectedKey = signal<MusicKey>('C');
  selectedScaleType = signal<string>(DEFAULT_SCALE_TYPE);
  selectedChordType = signal<string>(DEFAULT_CHORD_TYPE);
  selectedInterval = signal<IntervalOption>(INTERVAL_OPTIONS[4]); // major 3

  compareScaleKey = signal<MusicKey>('C');
  compareScaleType = signal<string>(DEFAULT_SCALE_TYPE);
  compareChordKey = signal<MusicKey>('C');
  compareChordType = signal<string>(DEFAULT_CHORD_TYPE);

  // --- Template helpers ---
  setShowKind(kind: ShowKind): void {
    this.showKind.set(kind);
  }

  setIntent(intent: ToolboxIntent): void {
    this.intent.set(intent);
  }

  // --- Submit ---
  submit(): void {
    if (this.intent() === 'show') {
      const kind = this.showKind();
      const key = this.selectedKey();

      let command: DomainCommand;
      switch (kind) {
        case 'scale':
          command = { type: 'show-pattern', patternType: 'scale', patternName: this.selectedScaleType(), rootNote: key } as ShowPatternCommand;
          break;
        case 'chord':
          command = { type: 'show-pattern', patternType: 'chord', patternName: this.selectedChordType(), rootNote: key } as ShowPatternCommand;
          break;
        case 'interval':
          command = { type: 'show-interval', rootNote: key, interval: this.selectedInterval().symbol };
          break;
      }
      this.toolboxEvent.emit(command);
    } else {
      const command: ComparePatternsCommand = {
        type: 'compare-patterns',
        primary: { patternType: 'scale', patternName: this.compareScaleType(), rootNote: this.compareScaleKey() },
        secondary: { patternType: 'chord', patternName: this.compareChordType(), rootNote: this.compareChordKey() },
      };
      this.toolboxEvent.emit(command);
    }
  }
}