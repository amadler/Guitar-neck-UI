import { Component, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { FretboardCommand, MusicKey, ShowKind, ToolboxIntent, Interval } from './model';
import { DropdownComponent } from './dropdown.component';

export interface IntervalOption {
  symbol: Interval;
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

@Component({
  selector: 'app-toolbox-builder',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './toolbox-builder.component.html',
  styleUrl: './toolbox-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolboxBuilderComponent {
  @Output() toolboxEvent: EventEmitter<FretboardCommand> = new EventEmitter<FretboardCommand>();

  // --- Data sources ---
  /** @todo Move to guitar-neck-shared alongside intervalDefinitions. */
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

      let command: FretboardCommand;
      switch (kind) {
        case 'scale':
          command = { kind: 'scale', key, scaleType: this.selectedScaleType() };
          break;
        case 'chord':
          command = { kind: 'chord', key, chordType: this.selectedChordType() };
          break;
        case 'interval':
          command = { kind: 'interval', key, interval: this.selectedInterval().symbol };
          break;
      }
      this.toolboxEvent.emit(command);
    } else {
      const command: FretboardCommand = {
        kind: 'scaleChordRelation',
        scaleKey: this.compareScaleKey(),
        scaleType: this.compareScaleType(),
        chordKey: this.compareChordKey(),
        chordType: this.compareChordType(),
      };
      this.toolboxEvent.emit(command);
    }
  }
}