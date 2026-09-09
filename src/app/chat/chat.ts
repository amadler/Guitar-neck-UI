import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChatService } from "./services/chat.service";

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat">
      <div class="messages">
        @for (msg of chatService.messages(); track msg) {
          <div class="msg" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'" [class.streaming]="msg.streaming">
            <p>{{ msg.text }}@if (msg.streaming) {<span class="cursor">|</span>}</p>
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
    .cursor { animation: blink 0.8s step-end infinite; font-weight: bold; margin-left: 2px; }
    @keyframes blink { 50% { opacity: 0; } }
    form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #ddd; }
    input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 8px 16px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ChatComponent {
  chatService = inject(ChatService);
  query = "";

  async send() {
    if (!this.query.trim()) return;
    const q = this.query;
    this.query = "";
    await this.chatService.send(q);
  }
}