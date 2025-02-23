import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AISuggestionService } from '../services/ai-suggestion.service';
import { AIService } from '../services/ai.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages"
             [class]="'message ' + (message.isUser ? 'user-message' : 'ai-message')">
          <p>{{ message.text }}</p>
          <div *ngIf="message.suggestions" class="message-suggestions">
            <button *ngFor="let suggestion of message.suggestions"
                    (click)="applySuggestion(suggestion)"
                    class="suggestion-link">
              {{ suggestion.displayName }}
            </button>
          </div>
        </div>
      </div>
      <div class="chat-input">
        <input #messageInput
               type="text"
               [(ngModel)]="currentMessage"
               (keyup.enter)="sendMessage()"
               placeholder="Ask about music theory...">
        <button (click)="sendMessage()">Send</button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      height: 400px;
      display: flex;
      flex-direction: column;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

    .chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .message {
      margin: 8px 0;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 80%;
    }

    .user-message {
      background-color: #e3f2fd;
      margin-left: auto;
    }

    .ai-message {
      background-color: #f5f5f5;
      margin-right: auto;
    }

    .message-suggestions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .suggestion-link {
      background: none;
      border: none;
      color: #004400;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
      font: inherit;
    }

    .chat-input {
      display: flex;
      padding: 16px;
      border-top: 1px solid #ccc;
      gap: 8px;
    }

    input {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    button {
      padding: 8px 16px;
      background-color: #004400;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class ChatComponent {
  messages: Array<{
    text: string;
    isUser: boolean;
    suggestions?: Array<{displayName: string, notes: string[]}>
  }> = [];
  currentMessage = '';
  isLoading = false;

  constructor(
    private aiSuggestionService: AISuggestionService,
    private aiService: AIService
  ) {}

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage = this.currentMessage;
    this.messages.push({ text: userMessage, isUser: true });
    this.currentMessage = '';
    this.isLoading = true;

    this.aiService.generateResponse(userMessage)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.messages.push({
            text: response.textResponse,
            isUser: false,
            suggestions: response.suggestions
          });
          this.aiSuggestionService.setResponse(response);
        },
        error: (error) => {
          this.messages.push({
            text: "Sorry, I couldn't process your request. Please try again.",
            isUser: false
          });
          console.error('AI Service error:', error);
        }
      });
  }

  applySuggestion(suggestion: {displayName: string, notes: string[]}) {
    this.aiSuggestionService.applySuggestion(suggestion);
  }
}
