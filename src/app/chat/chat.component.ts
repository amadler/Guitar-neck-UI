import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChatService } from "./services/chat.service";
import { DomainService } from "../domain/domain.service";
import { DomainCommand } from "../domain/commands";
import { parseActionTags, ActionTag, isValidAction } from "./models/action-tag";

@Component({
  selector: "app-chat",
  imports: [FormsModule],
  template: `
    <div class="chat">
      <div class="messages">
        @for (msg of chatService.messages(); track msg) {
          <div class="msg" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'" [class.streaming]="msg.streaming">
            @if (msg.reasoning) {
              <div class="reasoning">{{ msg.reasoning }}</div>
            }
            <p>
              @for (segment of parseActionTags(msg.text); track $index) {
                @if (segment.type === 'text') {
                  <span>{{ segment.text }}</span>
                } @else {
                  <button class="action-tag" (click)="handleAction(segment.action)">{{ segment.action.label }}</button>
                }
              }
              @if (msg.streaming) {<span class="cursor">|</span>}
            </p>
          </div>
        }
      </div>
      <form #f="ngForm" (ngSubmit)="send()">
        <input name="q" [(ngModel)]="query" placeholder="Np. pokaż C-dur" />
        <button type="submit" [disabled]="chatService.loading()">Wyślij</button>
      </form>
    </div>
  `,
  styles: [`
    .chat { height: 400px; display: flex; flex-direction: column; border: 1px solid #ccc; border-radius: 8px; }
    .messages { flex: 1; overflow-y: auto; padding: 12px; }
    .msg { margin: 8px 0; padding: 8px 12px; border-radius: 8px; max-width: 80%; }
    .user { background: #1976d2; color: #fff; margin-left: auto; }
    .assistant { background: #e0e0e0; color: #333; margin-right: auto; }
    .reasoning { font-size: 12px; font-style: italic; color: #888; margin-bottom: 6px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px; white-space: pre-wrap; }
    .cursor { animation: blink 0.8s step-end infinite; font-weight: bold; margin-left: 2px; }
    @keyframes blink { 50% { opacity: 0; } }
    .action-tag {
      display: inline-block;
      padding: 2px 8px;
      margin: 2px 4px;
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      line-height: 1.5;
    }
    .action-tag:hover { background: #1565c0; }
    form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #ddd; }
    input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 8px 16px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ChatComponent {
  chatService = inject(ChatService);
  domainService = inject(DomainService);
  query = "";

  /** Exposed to template for parsing action tags from message text. */
  parseActionTags = parseActionTags;

  async send() {
    if (!this.query.trim()) return;
    const q = this.query;
    this.query = "";
    await this.chatService.send(q);
  }

  handleAction(action: ActionTag): void {
    if (!isValidAction(action)) return;

    switch (action.action) {
      case 'show-pattern': {
        const command: DomainCommand = {
          type: 'show-pattern',
          patternType: action.params['type'] as 'scale' | 'chord',
          patternName: action.params['name'],
          rootNote: action.params['root'],
        };
        this.domainService.execute(command);
        break;
      }
      case 'show-interval': {
        const command: DomainCommand = {
          type: 'show-interval',
          rootNote: action.params['root'],
          interval: action.params['interval'],
        };
        this.domainService.execute(command);
        break;
      }
    }
  }
}
