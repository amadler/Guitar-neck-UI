import { Component, inject, effect, ElementRef, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChatService } from "./services/chat.service";
import { DomainService } from "../domain/domain.service";
import { DomainCommand } from "../domain/commands";
import { parseActionTags, ActionTag, isValidAction } from "./models/action-tag";
import { renderMarkdown } from "./services/helpers";

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
                  <span class="markdown-content" [innerHTML]="renderText(segment.text)"></span>
                } @else {
                  <button class="action-tag" (click)="handleAction(segment.action)">{{ segment.action.label }}</button>
                }
              }
              @if (msg.streaming) {<span class="cursor">|</span>}
            </p>
            @if (msg.domainCommands?.length) {
              <div class="msg-history">
                @for (dc of msg.domainCommands; track $index) {
                  <button class="history-chip" (click)="restoreHistory(dc.command)">{{ dc.label }}</button>
                }
              </div>
            }
          </div>
        }
        <div #scrollAnchor></div>
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
    .msg-history {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    .history-chip {
      display: inline-block;
      padding: 2px 8px;
      background: #37474f;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      line-height: 1.5;
    }
    .history-chip:hover { background: #2c3a40; }
    form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #ddd; }
    input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 8px 16px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .markdown-content { line-height: 1.6; word-break: break-word; }
    .markdown-content strong { font-weight: 600; }
    .markdown-content code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; font-family: 'Consolas', 'Courier New', monospace; }
    .markdown-content ul { margin: 4px 0; padding-left: 20px; }
    .markdown-content li { margin: 2px 0; }
    .markdown-content h3 { font-size: 1.1em; margin: 8px 0 4px; font-weight: 600; }
    .markdown-content p { margin: 4px 0; }
  `],
})
export class ChatComponent {
  chatService = inject(ChatService);
  domainService = inject(DomainService);
  query = "";

  @ViewChild('scrollAnchor', { read: ElementRef }) scrollAnchor!: ElementRef;

  /** Exposed to template for parsing action tags from message text. */
  parseActionTags = parseActionTags;

  /** Exposed to template for rendering Markdown in message text. */
  renderText = renderMarkdown;

  constructor() {
    // Auto-scroll to bottom when messages change
    effect(() => {
      this.chatService.messages();
      setTimeout(() => this.scrollToBottom());
    });
  }

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
          type: 'show-intervals',
          rootNote: action.params['root'],
          intervals: [action.params['interval']],
        };
        this.domainService.execute(command);
        break;
      }
    }
  }

  /** Restore a fretboard state by re-executing a domain command. */
  restoreHistory(command: DomainCommand): void {
    this.domainService.execute(command);
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // Ignore if view child not yet available
    }
  }
}