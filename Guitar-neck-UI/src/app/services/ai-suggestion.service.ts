import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AIResponse, MusicalSuggestion } from '../shared/model/ai-response.model';
import { MusicTheoryFacadeService } from './music-theory-facade.service';
import { SCALE_PATTERNS, ScalePattern } from '../shared/model/scaleTypes';

@Injectable({ providedIn: 'root' })
export class AISuggestionService {
  private currentResponseSubject = new BehaviorSubject<AIResponse | null>(null);
  currentResponse$ = this.currentResponseSubject.asObservable();

  constructor(private musicTheoryFacade: MusicTheoryFacadeService) {}

  setResponse(response: AIResponse) {
    this.currentResponseSubject.next(response);
  }

  applySuggestion(suggestion: MusicalSuggestion) {
    if (!suggestion.notes || suggestion.notes.length === 0) {
      return;
    }

    this.musicTheoryFacade.resetFretboard();

    setTimeout(() => {
      const isScale = SCALE_PATTERNS.some((pattern: ScalePattern) => pattern.name === suggestion.displayName);

      if (isScale) {
        this.musicTheoryFacade.selectScale(suggestion.displayName, suggestion.notes[0])
          .subscribe(notes => console.log('Scale applied:', notes));
      } else {
        this.musicTheoryFacade.selectTriad(suggestion.displayName, suggestion.notes[0])
          .subscribe(notes => console.log('Chord applied:', notes));
      }
    }, 50);
  }
}
