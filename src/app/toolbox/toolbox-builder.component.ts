import { Component, Output, EventEmitter, ChangeDetectionStrategy, signal, output } from '@angular/core';

import { neckConfig, SCALE_PATTERNS, CHORD_PATTERNS } from 'guitar-neck-shared';
import { DomainCommand, ShowPatternCommand, ComparePatternsCommand, ResolveShapeCommand } from '../domain/commands';
import { DropdownComponent } from './dropdown.component';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';
import { ShowKind, ToolboxIntent, ShapeCategory } from './model';
import { getShapesByCategory } from '../shared/model/guitar-shapes';

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
// TODO MusicKey - zbierzność nazw z model.ts
export type MusicKey = string;

@Component({
  selector: 'app-toolbox-builder',
  imports: [DropdownComponent],
  templateUrl: './toolbox-builder.component.html',
  styleUrl: './toolbox-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolboxBuilderComponent {
  toolboxEvent = output<DomainCommand>();
  // --- Data sources ---
  musicKeys: MusicKey[] = neckConfig.chromaticNotes;
  scalePatternNames = SCALE_PATTERNS.map(s => s.name);
  chordPatternNames = CHORD_PATTERNS.map(c => c.name);
  intervalOptions = INTERVAL_OPTIONS;

  // Shape data
  cowboyShapes = getShapesByCategory('cowboy');
  barreShapes = getShapesByCategory('barre');
  triadShapes = getShapesByCategory('triad-inversion');

  // --- Display functions for dropdowns ---
  keyDisplayFn = (key: MusicKey) => key;
  stringDisplayFn = (value: string) => value;
  intervalDisplayFn = (opt: IntervalOption) => opt.label;
  intervalTrackByFn = (_index: number, opt: IntervalOption) => opt.symbol;
  shapeDisplayFn = (shape: { id: string; name: string }) => shape.name;
  shapeTrackByFn = (_index: number, shape: { id: string }) => shape.id;

  // --- State signals ---
  intent = signal<ToolboxIntent>('show');
  showKind = signal<ShowKind>('scale');
  shapeCategory = signal<ShapeCategory>('cowboy');

  selectedKey = signal<MusicKey>('C');
  selectedScaleType = signal<string>(DEFAULT_SCALE_TYPE);
  selectedChordType = signal<string>(DEFAULT_CHORD_TYPE);
  selectedInterval = signal<IntervalOption>(INTERVAL_OPTIONS[4]); // major 3

  compareScaleKey = signal<MusicKey>('C');
  compareScaleType = signal<string>(DEFAULT_SCALE_TYPE);
  compareChordKey = signal<MusicKey>('C');
  compareChordType = signal<string>(DEFAULT_CHORD_TYPE);

  // Shape state
  selectedShape = signal<{ id: string; name: string } | null>(null);
  shapeRootKey = signal<MusicKey>('C');

  // --- Template helpers ---
  setShowKind(kind: ShowKind): void {
    this.showKind.set(kind);
  }

  setIntent(intent: ToolboxIntent): void {
    this.intent.set(intent);
  }

  setShapeCategory(category: ShapeCategory): void {
    this.shapeCategory.set(category);
    // Reset selected shape when category changes
    this.selectedShape.set(null);
  }

  get currentShapes(): Array<{ id: string; name: string; category: string }> {
    switch (this.shapeCategory()) {
      case 'cowboy': return this.cowboyShapes;
      case 'barre': return this.barreShapes;
      case 'triad-inversion': return this.triadShapes;
      default: return [];
    }
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
    } else if (this.intent() === 'compare') {
      const command: ComparePatternsCommand = {
        type: 'compare-patterns',
        primary: { patternType: 'scale', patternName: this.compareScaleType(), rootNote: this.compareScaleKey() },
        secondary: { patternType: 'chord', patternName: this.compareChordType(), rootNote: this.compareChordKey() },
      };
      this.toolboxEvent.emit(command);
    } else if (this.intent() === 'shape') {
      const shape = this.selectedShape();
      if (!shape) return;

      const isMovable = this.shapeCategory() === 'barre' || this.shapeCategory() === 'triad-inversion';
      const command: ResolveShapeCommand = {
        type: 'resolve-shape',
        shapeId: shape.id,
        rootNote: isMovable ? this.shapeRootKey() : undefined,
        position: isMovable ? 0 : undefined,
      };
      this.toolboxEvent.emit(command);
    }
  }
}