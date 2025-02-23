import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AIResponse, MusicalSuggestion } from '../shared/model/ai-response.model';
import { MusicTheoryFacadeService } from './music-theory-facade.service';

@Injectable({ providedIn: 'root' })
export class AISuggestionService {
  private currentResponseSubject = new BehaviorSubject<AIResponse | null>(null);
  currentResponse$ = this.currentResponseSubject.asObservable();

  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  setResponse(response: AIResponse) {
    this.currentResponseSubject.next(response);
  }

  applySuggestion(suggestion: MusicalSuggestion) {
    if (suggestion.notes && suggestion.notes.length > 0) {
      // Najpierw wyczyść gryf
      this.musicTheoryFacade.clearFretboard();
      // Następnie zaznacz nową skalę
      this.musicTheoryFacade.selectScale(suggestion.displayName, suggestion.notes[0]);
    }
  }
}
