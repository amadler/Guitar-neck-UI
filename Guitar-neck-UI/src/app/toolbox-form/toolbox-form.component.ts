import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-toolbox-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  templateUrl: './toolbox-form.component.html',
  styleUrl: './toolbox-form.component.scss'
})
export class ToolboxFormComponent{
  guitarForm: FormGroup;
  musicElements = ['Major Triad', 'Minor Triad', 'Major 7th', 'Minor 7th', 'Dominant 7th', 'Diminished 7th', 'Augmented 7th'];
  keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  constructor(private fb: FormBuilder) {
    this.guitarForm = this.fb.group(
        {
          musicElements:this.musicElements[0],
          keys: this.keys[0]
        }
      );
  }

  onSubmit(): void {
    console.log(this.guitarForm.value);
  }
}
