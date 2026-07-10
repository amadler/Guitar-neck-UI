import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { neckConfig } from 'guitar-neck-shared';
import { MusicPatternApiService } from '../services/scales-and-triads.service';

export interface ScaleChordRelation {
  scaleName: string;
  scaleRoot: string;
  chordName: string;
  chordRoot: string;
}

@Component({
  selector: 'app-scale-chord-form',
  standalone: true,
  imports: [NgFor, FormsModule],
  templateUrl: './scale-chord-form.component.html',
  styleUrl: './scale-chord-form.component.scss',
})
export class ScaleChordFormComponent implements OnInit {
  /** Emitted when the user clicks Show relationship. */
  @Output() showRelation = new EventEmitter<ScaleChordRelation>();

  scales: string[] = [];
  chords: string[] = [];
  keys: string[] = neckConfig.chromaticNotes;

  selectedScale = '';
  selectedScaleKey = 'C';
  selectedChord = '';
  selectedChordKey = 'C';

  constructor(private patternApi: MusicPatternApiService) {}

  ngOnInit(): void {
    this.patternApi.getAvailableScales().subscribe({
      next: (scales) => {
        this.scales = scales;
        if (scales.length > 0) this.selectedScale = scales[0];
      },
      error: (err) => console.error('[ScaleChordForm] Failed to load scales:', err),
    });

    this.patternApi.getAvailableTriads().subscribe({
      next: (chords) => {
        this.chords = chords;
        if (chords.length > 0) this.selectedChord = chords[0];
      },
      error: (err) => console.error('[ScaleChordForm] Failed to load chords:', err),
    });
  }

  onShow(): void {
    if (!this.selectedScale || !this.selectedScaleKey || !this.selectedChord || !this.selectedChordKey) return;
    this.showRelation.emit({
      scaleName: this.selectedScale,
      scaleRoot: this.selectedScaleKey,
      chordName: this.selectedChord,
      chordRoot: this.selectedChordKey,
    });
  }
}
