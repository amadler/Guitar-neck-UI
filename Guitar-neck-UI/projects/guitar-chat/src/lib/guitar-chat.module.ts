import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './components/chat/chat.component';
import { AISuggestionsComponent } from './components/ai-suggestions/ai-suggestions.component';
import { AIService } from './services/ai.service';
import { AISuggestionService } from './services/ai-suggestion.service';
import { AIFacadeService } from './services/ai-facade.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ChatComponent,
    AISuggestionsComponent
  ],
  exports: [
    ChatComponent,
    AISuggestionsComponent
  ],
  providers: [
    AIService,
    AISuggestionService,
    AIFacadeService
  ]
})
export class GuitarChatModule { }





