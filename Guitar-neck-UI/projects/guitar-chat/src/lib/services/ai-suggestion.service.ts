import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AIResponse, MusicalSuggestion } from '../models/ai-response.model';

@Injectable({
  providedIn: 'root'
})
export class AISuggestionService {
  private currentResponseSubject = new BehaviorSubject<AIResponse | null>(null);
  currentResponse$ = this.currentResponseSubject.asObservable();

  private suggestionsSubject = new BehaviorSubject<MusicalSuggestion[]>([]);
  suggestions$ = this.suggestionsSubject.asObservable();

  setResponse(response: AIResponse): void {
    this.currentResponseSubject.next(response);
    this.updateSuggestions(response.suggestions);
  }

  updateSuggestions(suggestions: MusicalSuggestion[]): void {
    this.suggestionsSubject.next(suggestions);
  }

  clearSuggestions(): void {
    this.suggestionsSubject.next([]);
    this.currentResponseSubject.next(null);
  }
}
