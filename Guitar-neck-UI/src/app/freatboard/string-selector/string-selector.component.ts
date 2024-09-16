import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {  FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-string-selector',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  templateUrl: './string-selector.component.html',
  styleUrl: './string-selector.component.scss'
})
export class StringSelectorComponent {
  @Input() strings!: string[]; // strings to display
  @Output() stringSelected$: EventEmitter< Record<number, boolean>> = new EventEmitter< Record<number, boolean>>();

  formGroup: FormGroup = new FormGroup({});
    constructor(
      private formBuilder: FormBuilder
    ) {
      this.formGroup = this.formBuilder.group({
        0: true,
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
      });

    }

    protected selectString(): void {
      this.stringSelected$.emit(this.formGroup.value);
    }

}
