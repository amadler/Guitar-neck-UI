import { AsyncPipe } from '@angular/common';
import { Component, ViewChild, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { FreatboardComponent } from '../freatboard/freatboard.component';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardNotePositionService } from '../services/note.service';
import { FretboardStateService } from '../services/fretboard-state.service';
import { DomainService } from '../domain/domain.service';
import { ChatService } from '../chat/services/chat.service';

@Component({
  selector: 'app-guitar-neck',
  imports: [FreatboardComponent, AsyncPipe],
  templateUrl: './guitar-neck.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guitar-neck.component.scss'
})
export class GuitarNeckComponent {
  private noteService = inject(FretboardNotePositionService);
  private guitarNeckService = inject(FretboardStateService);
  private domainService = inject(DomainService);
  private chatService = inject(ChatService);

  neckConfig = neckConfig;
  @ViewChild(FreatboardComponent) freatboardComponent!: FreatboardComponent;

  /** Whether the fretboard is in exercise selection mode. */
  exerciseMode = computed(() => this.domainService.currentState().exerciseMode);

  /** The current exercise task question. */
  exerciseQuestion = computed(() => this.domainService.currentState().exerciseTask?.question ?? '');

  constructor() {
    const allPositions = this.noteService.getAllPositions();
    this.guitarNeckService.initialize(allPositions);
    // Set an empty snapshot so the fretboard renders (hasSnapshot=true) but shows no highlighted notes.
    this.guitarNeckService.setSnapshot(this.guitarNeckService.hideAllNotes());
  }

  onNoteClicked(note: GuitarNote): void {
    console.log('onNoteClicked$', note);
  }

  /** Submit the current exercise for validation and notify the agent. */
  submitExercise(): void {
    this.domainService.execute({ type: 'submit-exercise' });
    this.chatService.notifyExerciseSubmitted();
  }
}