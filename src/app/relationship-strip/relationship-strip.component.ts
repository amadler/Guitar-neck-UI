import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { neckConfig, CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { FretboardStateService } from '../services/guitar-neck.service';
import { MarkerRoleService, MarkerRole } from '../services/marker-role.service';
import { noteToChroma } from '../shared/note-utils';

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

/** Resolve chroma values for a chord pattern. */
function resolveChordChromas(chordName: string, rootNote: string): Set<number> {
  const pattern = CHORD_PATTERNS.find(p => p.name === chordName);
  if (!pattern) return new Set();
  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) return new Set();
  const chromas = new Set<number>([noteToChroma(rootNote)]);
  let cumulative = 0;
  for (const step of pattern.intervals) {
    cumulative += step;
    chromas.add(noteToChroma(chromatic[(rootIndex + cumulative) % 12]));
  }
  return chromas;
}

/** Resolve chroma values for a scale pattern. */
function resolveScaleChromas(scaleName: string, rootNote: string): Set<number> {
  const pattern = SCALE_PATTERNS.find(p => p.name === scaleName);
  if (!pattern) return new Set();
  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) return new Set();
  const chromas = new Set<number>([noteToChroma(rootNote)]);
  let cumulative = 0;
  for (const step of pattern.intervals) {
    cumulative += step;
    chromas.add(noteToChroma(chromatic[(rootIndex + cumulative) % 12]));
  }
  return chromas;
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
    const chordChromas = resolveChordChromas(this.chordName, this.chordRoot);
    const scaleChromas = resolveScaleChromas(this.scaleName, this.scaleRoot);
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return [...chordChromas]
      .filter(c => scaleChromas.has(c))
      .map(c => sharpNames[c])
      .sort();
  }

  get chordTonesOutsideScale(): string[] {
    if (!this.hasRelation) return [];
    const chordChromas = resolveChordChromas(this.chordName, this.chordRoot);
    const scaleChromas = resolveScaleChromas(this.scaleName, this.scaleRoot);
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return [...chordChromas]
      .filter(c => !scaleChromas.has(c))
      .map(c => sharpNames[c])
      .sort();
  }
}
