import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { neckConfig } from 'shared';
import { ToolboxSearchQuery } from '../shared/model/musicElements';

@Component({
  selector: 'app-custom-pattern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-pattern.component.html',
  styleUrls: ['./custom-pattern.component.scss']
})
export class CustomPatternComponent {
  @Output() onCustomPatternSubmit = new EventEmitter<ToolboxSearchQuery>();

  customPatternForm: FormGroup;
  keys = neckConfig.chromaticNotes;

  constructor(private fb: FormBuilder) {
    this.customPatternForm = this.fb.group({
      intervals: ['', [Validators.required, Validators.pattern(/^\d+(,\s*\d+)*$/)]],
      rootNote: [this.keys[0], Validators.required]
    });
  }

  onSubmit() {
    if (this.customPatternForm.valid) {
      const formValue = this.customPatternForm.value;
      // Konwertujemy string interwałów na tablicę liczb
      const intervals = formValue.intervals.split(',').map((i: string) => parseInt(i.trim()));

      const query: ToolboxSearchQuery = {
        type: 'custom',
        musicElements: intervals, // przekazujemy tablicę interwałów
        keys: formValue.rootNote
      };
      this.onCustomPatternSubmit.emit(query);
    }
  }
}
