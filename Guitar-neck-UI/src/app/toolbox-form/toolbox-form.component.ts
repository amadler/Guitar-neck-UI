import { NgFor } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
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
export class ToolboxFormComponent implements OnInit {
  @Output() onSubmit$: EventEmitter<ToolboxSearchQuery> = new EventEmitter<ToolboxSearchQuery>();
  guitarForm: FormGroup;

  keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  musicElements = [
    'Single note',
    'All notes',
    ...SCALE_PATTERNS.map((scale) => scale.name),
    ...TRIAD_PATTERNS.map((triad) => triad.name),
    ...EXTENDED_CHORD_PATTERNS.map((chord) => chord.name)
  ];

  constructor(private fb: FormBuilder) {
    this.guitarForm = this.fb.group({
      musicElements: ['Single note'],
      keys: ['A']
    });
  }

  ngOnInit() {
    // Additional initialization if needed
  }

  onSubmit() {
    if (this.guitarForm.valid) {
      this.onSubmit$.emit(this.guitarForm.value);
    }
  }
}
