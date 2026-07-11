import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { neckConfig, CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { FretboardStateService } from '../services/guitar-neck.service';
import { MarkerRoleService, MarkerRole } from '../services/marker-role.service';

interface RoleLegendItem {
  role: MarkerRole;
  label: string;
  cssClass: string;
}

const ROLE_LEGEND: RoleLegendItem[] = [
  { role: 'scale-tone',               label: 'scale note',          cssClass: 'rel-legend__dot--scale-tone' },
  { role: 'scale-root',               label: 'scale root',          cssClass: 'rel-legend__dot--scale-root' },
  { role: 'chord-tone',               label: 'chord tone in scale', cssClass: 'rel-legend__dot--chord-tone' },
  { role: 'chord-root',               label: 'chord root',          cssClass: 'rel-legend__dot--chord-root' },
  { role: 'chord-tone-outside-scale', label: 'chord outside scale', cssClass: 'rel-legend__dot--outside' },
];

/** Resolve note names for a chord pattern. */
function resolveChordNoteNames(chordName: string, rootNote: string): Set<string> {
  const pattern = CHORD_PATTERNS.find(p => p.name === chordName);
  if (!pattern) return new Set();
  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) return new Set();
  const notes = new Set<string>([rootNote]);
  let cumulative = 0;
  for (const step of pattern.intervals) {
    cumulative += step;
    notes.add(chromatic[(rootIndex + cumulative) % 12]);
  }
  return notes;
}

/** Resolve note names for a scale pattern. */
function resolveScaleNoteNames(scaleName: string, rootNote: string): Set<string> {
  const pattern = SCALE_PATTERNS.find(p => p.name === scaleName);
  if (!pattern) return new Set();
  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) return new Set();
  const notes = new Set<string>([rootNote]);
  let cumulative = 0;
  for (const step of pattern.intervals) {
    cumulative += step;
    notes.add(chromatic[(rootIndex + cumulative) % 12]);
  }
  return notes;
}

@Component({
  selector: 'app-relationship-strip',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './relationship-strip.component.html',
  styleUrl: './relationship-strip.component.scss',
})
export class RelationshipStripComponent {
  legendItems = ROLE_LEGEND;

  constructor(
    private fretboardState: FretboardStateService,
    public markerRole: MarkerRoleService,
  ) {}

  get hasRelation(): boolean {
    return this.fretboardState.scaleChordState?.chord != null;
  }

  get scaleName(): string {
    return this.fretboardState.scaleChordState?.scale.name ?? '';
  }

  get scaleRoot(): string {
    return this.fretboardState.scaleChordState?.scale.rootNote ?? '';
  }

  get chordName(): string {
    return this.fretboardState.scaleChordState?.chord?.name ?? '';
  }

  get chordRoot(): string {
    return this.fretboardState.scaleChordState?.chord?.rootNote ?? '';
  }

  get chordTonesInScale(): string[] {
    if (!this.hasRelation) return [];
    const chordNotes = resolveChordNoteNames(this.chordName, this.chordRoot);
    const scaleNotes = resolveScaleNoteNames(this.scaleName, this.scaleRoot);
    return [...chordNotes].filter(n => scaleNotes.has(n)).sort();
  }

  get chordTonesOutsideScale(): string[] {
    if (!this.hasRelation) return [];
    const chordNotes = resolveChordNoteNames(this.chordName, this.chordRoot);
    const scaleNotes = resolveScaleNoteNames(this.scaleName, this.scaleRoot);
    return [...chordNotes].filter(n => !scaleNotes.has(n)).sort();
  }
}
