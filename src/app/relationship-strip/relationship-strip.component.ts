import { Component, ChangeDetectionStrategy } from '@angular/core';

import { FretboardStateService } from '../services/fretboard-state.service';
import { MarkerRoleService, MarkerRole } from '../services/marker-role.service';
import { TonalFacadeService } from '../services/tonal-facade.service';

interface RoleLegendItem {
  role: MarkerRole;
  label: string;
  cssClass: string;
}

const ROLE_LEGEND: RoleLegendItem[] = [
  { role: 'scale-tone', label: 'scale note', cssClass: 'rel-legend__dot--scale-tone' },
  { role: 'scale-root', label: 'scale root', cssClass: 'rel-legend__dot--scale-root' },
  { role: 'chord-tone', label: 'chord tone in scale', cssClass: 'rel-legend__dot--chord-tone' },
  { role: 'chord-root', label: 'chord root', cssClass: 'rel-legend__dot--chord-root' },
  { role: 'chord-tone-outside-scale', label: 'chord outside scale', cssClass: 'rel-legend__dot--outside' },
];

/** Resolve chroma values for a chord pattern via TonalFacadeService. */
function resolveChordChromas(chordName: string, rootNote: string, tonal: TonalFacadeService): Set<number> {
  const { simplified } = tonal.resolvePattern(chordName, rootNote, 'chord');
  return new Set(simplified.map(n => tonal.chroma(n)));
}

/** Resolve chroma values for a scale pattern via TonalFacadeService. */
function resolveScaleChromas(scaleName: string, rootNote: string, tonal: TonalFacadeService): Set<number> {
  const { simplified } = tonal.resolvePattern(scaleName, rootNote, 'scale');
  return new Set(simplified.map(n => tonal.chroma(n)));
}

@Component({
  selector: 'app-relationship-strip',
  imports: [],
  templateUrl: './relationship-strip.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './relationship-strip.component.scss'
})
export class RelationshipStripComponent {
  legendItems = ROLE_LEGEND;

  constructor(
    private fretboardState: FretboardStateService,
    public markerRole: MarkerRoleService,
    private tonal: TonalFacadeService,
  ) { }

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
    const chordChromas = resolveChordChromas(this.chordName, this.chordRoot, this.tonal);
    const scaleChromas = resolveScaleChromas(this.scaleName, this.scaleRoot, this.tonal);
    // TODO: hardcoded - add neckConfig
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return [...chordChromas]
      .filter(c => scaleChromas.has(c))
      .map(c => sharpNames[c])
      .sort();
  }

  get chordTonesOutsideScale(): string[] {
    if (!this.hasRelation) return [];
    const chordChromas = resolveChordChromas(this.chordName, this.chordRoot, this.tonal);
    const scaleChromas = resolveScaleChromas(this.scaleName, this.scaleRoot, this.tonal);
    // TODO: hardcoded - add neckConfig
    const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return [...chordChromas]
      .filter(c => !scaleChromas.has(c))
      .map(c => sharpNames[c])
      .sort();
  }
}
