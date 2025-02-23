import { NgFor } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SCALE_PATTERNS } from '../shared/model/scaleTypes';
import { ToolboxSearchQuery } from '../shared/model/musicElements';
import { TRIAD_PATTERNS } from '../shared/model/triadTypes';
import { EXTENDED_CHORD_PATTERNS } from '../shared/model/extendedChordTypes';

@Component({
  selector: 'app-toolbox-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  templateUrl: './toolbox-form.component.html',
  styleUrls: ['./toolbox-form.component.scss']
})
export class ToolboxFormComponent {
  @Output() onSubmit$: EventEmitter<ToolboxSearchQuery> = new EventEmitter<ToolboxSearchQuery>();
  guitarForm!: FormGroup;

  keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  elementTypes = [
    { id: 'basic', name: 'Basic' },
    { id: 'scale', name: 'Scale' },
    { id: 'triad', name: 'Chord' },
    { id: 'extended', name: 'Extended Chord' }
  ];

  patterns: { [key: string]: string[] } = {
    basic: ['Single note', 'All notes'],
    scale: SCALE_PATTERNS.map(scale => scale.name),
    triad: TRIAD_PATTERNS.map(triad => triad.name),
    extended: EXTENDED_CHORD_PATTERNS.map(chord => chord.name)
  };

  availablePatterns: string[] = this.patterns['basic'];  // Fixed: using bracket notation

  constructor(private fb: FormBuilder) {
    this.guitarForm = this.fb.group({
      elementType: ['basic'],
      pattern: ['Single note'],
      key: ['A']
    });

    // React to element type changes
    this.guitarForm.get('elementType')?.valueChanges.subscribe(type => {
      this.availablePatterns = this.patterns[type];
      this.guitarForm.patchValue({ pattern: this.availablePatterns[0] });
    });
  }

  onSubmit() {
    if (this.guitarForm.valid) {
      const formValue = this.guitarForm.value;
      const query: ToolboxSearchQuery = {
        musicElements: formValue.pattern,
        keys: formValue.key
      };
      this.onSubmit$.emit(query);
    }
  }
}
