import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AISuggestionService } from '../../services/ai-suggestion.service';
import { AIResponse, MusicalSuggestion } from '../../models/ai-response.model';

@Component({
  selector: 'app-ai-suggestions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-suggestions" *ngIf="currentResponse">
      <div class="suggestion-buttons">
        <button *ngFor="let suggestion of currentResponse.suggestions"
                class="suggestion-btn"
                (click)="applySuggestion(suggestion)">
          {{ suggestion.displayName }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ai-suggestions {
      margin-top: 16px;
    }
    .suggestion-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .suggestion-btn {
      padding: 8px 16px;
      background-color: #004400;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .suggestion-btn:hover {
      background-color: #003300;
    }
  `]
})
export class AISuggestionsComponent implements OnDestroy {
  currentResponse: AIResponse | null = null;
  private subscription: Subscription;

  constructor(private aiSuggestionService: AISuggestionService) {
    this.subscription = this.aiSuggestionService.currentResponse$
      .subscribe((response: AIResponse | null) => {
        this.currentResponse = response;
      });
  }

  applySuggestion(suggestion: MusicalSuggestion) {
    this.aiSuggestionService.updateSuggestions([suggestion]);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
