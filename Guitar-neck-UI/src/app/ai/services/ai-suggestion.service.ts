import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MusicalSuggestion } from '../models/ai-response.model';

@Injectable({
  providedIn: 'root'
})
export class AISuggestionService {
  private suggestionsSubject = new BehaviorSubject<MusicalSuggestion[]>([]);
  suggestions$ = this.suggestionsSubject.asObservable();

  updateSuggestions(suggestions: MusicalSuggestion[]): void {
    this.suggestionsSubject.next(suggestions);
  }

  clearSuggestions(): void {
    this.suggestionsSubject.next([]);
  }
}