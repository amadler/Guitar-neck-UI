import { Component, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand, ShowPatternCommand, ComparePatternsCommand } from '../domain/commands';
import { DropdownComponent } from './dropdown.component';

export interface IntervalOption {
  symbol: string;
  label: string;
}

const INTERVAL_OPTIONS: IntervalOption[] = [
  { symbol: '1', label: 'unison' },
  { symbol: 'b2', label: 'minor 2' },
  { symbol: '2', label: 'major 2' },
  { symbol: 'b3', label: 'minor 3' },
  { symbol: '3', label: 'major 3' },
  { symbol: '4', label: 'perfect 4' },
  { symbol: 'b5', label: 'tritone' },
  { symbol: '5', label: 'perfect 5' },
  { symbol: 'b6', label: 'minor 6' },
  { symbol: '6', label: 'major 6' },
  { symbol: 'b7', label: 'minor 7' },
  { symbol: '7', label: 'major 7' },
];

const DEFAULT_SCALE_TYPE = 'major';
const DEFAULT_CHORD_TYPE = 'major';

export type ToolboxIntent = 'show' | 'compare';
export type ShowKind = 'chord' | 'scale' | 'interval';
export type MusicKey =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

@Component({
  selector: 'app-toolbox-builder',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './toolbox-builder.component.html',
  styleUrl: './toolbox-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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