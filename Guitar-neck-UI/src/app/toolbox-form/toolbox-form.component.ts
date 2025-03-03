import { NgFor } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SCALE_PATTERNS } from '../shared/model/scaleTypes';
import { QueryTypes, ToolboxSearchQuery } from '../shared/model/musicElements';
import { CHORD_PATTERNS } from '../shared/model/chordTypes';
import { neckConfig } from '../shared/model/neckConfig';

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

  keys = neckConfig.chromaticNotes;

  elementTypes = [
    { id: 'basic', name: 'Basic' },
    { id: 'scale', name: 'Scale' },
    { id: 'chord', name: 'Chord' },
  ];

  patterns: { [key: string]: string[] } = {
    basic: ['Single note', 'All notes'],
    scale: SCALE_PATTERNS.map(scale => scale.name),
    chord: CHORD_PATTERNS.map(chord => chord.name),
  };

  availablePatterns: string[] = this.patterns['basic'];  // Fixed: using bracket notation
  selectedElementType: QueryTypes = 'basic';

  constructor(private fb: FormBuilder) {
    this.guitarForm = this.fb.group({
      elementType: ['basic'],
      pattern: ['Single note'],
      key: this.keys[0] || 'C'
    });

    // React to element type changes
    this.guitarForm.get('elementType')?.valueChanges.subscribe(type => {
      this.availablePatterns = this.patterns[type];
      this.selectedElementType = type;
      this.guitarForm.patchValue({ pattern: this.availablePatterns[0] });
    });
  }

  onSubmit() {
    if (this.guitarForm.valid) {
      const formValue = this.guitarForm.value;
      const query: ToolboxSearchQuery = {
        musicElements: formValue.pattern,
        keys: formValue.key,
        type: this.selectedElementType
      };
      this.onSubmit$.emit(query);
    }
  }
}
