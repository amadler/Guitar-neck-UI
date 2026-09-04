import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AIService } from './ai.service';
import { AISuggestionService } from './ai-suggestion.service';
import { AIResponse } from '../models/ai-response.model';

@Injectable({
  providedIn: 'root'
})
export class AIFacadeService {
  private aiService = inject(AIService);
  private suggestionService = inject(AISuggestionService);


  generateResponse(input: string): Observable<AIResponse> {
    return this.aiService.generateResponse(input).pipe(
      tap(response => {
        if (response.suggestions) {
          this.suggestionService.updateSuggestions(response.suggestions);
        }
      })
    );
  }
}