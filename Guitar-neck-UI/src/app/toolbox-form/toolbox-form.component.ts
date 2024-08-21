import { NgFor } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SCALE_PATTERNS, TRIAD_PATTERNS } from '../shared/model/scales';

@Component({
  selector: 'app-toolbox-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  templateUrl: './toolbox-form.component.html',
  styleUrl: './toolbox-form.component.scss'
})
export class ToolboxFormComponent {
  @Output() onSubmit$: EventEmitter<any> = new EventEmitter<any>();
  guitarForm: FormGroup;
  musicElements = [
    'Single note',
    'All notes',
    ...SCALE_PATTERNS.map((scale) => scale.name),
    ...TRIAD_PATTERNS.map((triad) => triad.name)
  ];
  keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  constructor(private fb: FormBuilder) {
    this.guitarForm = this.fb.group(
      {
        musicElements: this.musicElements[0],
        keys: this.keys[0]
      }
    );
  }

  onSubmit(): void {
    this.onSubmit$.emit(this.guitarForm.value);
  }
}
