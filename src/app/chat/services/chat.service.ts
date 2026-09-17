import { Injectable, inject, signal } from "@angular/core";
import { DomainService } from "../../domain/domain.service";
import { LessonRegistryService } from "../../services/lesson-registry.service";
import { ChatMessage } from "../models";
import { addMessage, showError, updateLastAssistant } from "./helpers";
import { AgentApiService } from "./agent-api.service";

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);
  private lessonRegistry = inject(LessonRegistryService);
  private agentApi = inject(AgentApiService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private _threadId = crypto.randomUUID();
  private _lessonMode = false;
  private _waitingForUser = false;

  /** Clear the cached thread so the next send() starts fresh. */
  resetAgent(): void {
    this._threadId = crypto.randomUUID();
    this._lessonMode = false;
    this._waitingForUser = false;
  }

  /**
   * Start a lesson session.
   * Resets the thread (fresh context, no history), loads the lesson content,
   * and sends it as the first message.
   */
  async startLesson(lessonId: string): Promise<void> {
    this.resetAgent();
    this.messages.set([]);

    const lesson = this.lessonRegistry.getLesson(lessonId);
    if (!lesson) {
      this.messages.set([{ role: 'assistant', text: `❌ Nie znaleziono lekcji: "${lessonId}".` }]);
      return;
    }

    this._lessonMode = true;

    // Load lesson content from markdown file in assets
    try {
      const response = await fetch(`/assets/lessons/${lessonId}.md`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();

      // Send lesson content as the first message
      await this.sendRaw(
        `Rozpoczynam lekcję: ${lesson.title}\n\n---\n${content}\n---\n\nProwadź mnie krok po kroku przez tę lekcję. Zadawaj pytania i czekaj na moje odpowiedzi.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      this.messages.set([{ role: 'assistant', text: `❌ Nie udało się załadować lekcji "${lesson.title}": ${msg}` }]);
    }
  }

  /**
   * Send a message to the remote Node agent via HTTP.
   * The DomainState snapshot is sent with every request (request-scoped).
   */
  private async processStream(
    userMessage: string,
    options: { showUserInput: boolean; showAssistantOutput: boolean },
    type: 'message' | 'resume' = 'message',
  ): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);

    if (options.showUserInput) {
      addMessage(this.messages, { role: 'user', text: userMessage });
    }
    if (options.showAssistantOutput) {
      addMessage(this.messages, { role: 'assistant', text: '', streaming: true });
    }

    try {
      // Capture DomainState snapshot (request-scoped, not stored in checkpoint)
      const domainState = this.domainService.currentState();

      await this.agentApi.sendMessage(
        this._threadId,
        userMessage,
        domainState,
        {
          onToken: (text) => {
            if (options.showAssistantOutput) {
              updateLastAssistant(this.messages, { text });
            }
          },
          onDomainCommand: () => {
            // Command already executed by AgentApiService via DomainService.execute()
            if (options.showAssistantOutput) {
              updateLastAssistant(this.messages, { text: '✅ Wykonano komendę na gryfie.' });
            }
          },
          onInterrupt: () => {
            this._waitingForUser = true;
          },
          onError: (message) => {
            if (options.showAssistantOutput) {
              showError(this.messages, message);
            }
          },
          onDone: () => {
            if (options.showAssistantOutput) {
              updateLastAssistant(this.messages, { streaming: false });
            }
          },
        },
        type,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      if (options.showAssistantOutput) {
        showError(this.messages, errorMsg);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async send(userMessage: string): Promise<void> {
    if (!userMessage.trim()) return;

    await this.processStream(userMessage, {
      showUserInput: true,
      showAssistantOutput: true,
    }, this._waitingForUser ? 'resume' : 'message');
  }

  /**
   * Send a message to the agent without showing the user's input in chat.
   * The assistant's response IS shown in chat.
   * Used internally by startLesson() and notifyExerciseSubmitted().
   */
  private async sendRaw(message: string): Promise<void> {
    await this.processStream(message, {
      showUserInput: false,
      showAssistantOutput: true,
    });
  }

  /**
   * Notify the agent that the user has submitted an exercise.
   * The agent should call get_exercise_result to read the result and comment.
   */
  async notifyExerciseSubmitted(): Promise<void> {
    const message =
      "Użytkownik kliknął Sprawdź. Ćwiczenie zostało zweryfikowane. " +
      "Użyj narzędzia get_exercise_result aby zobaczyć wynik i skomentuj odpowiedź użytkownika.";

    await this.processStream(message, {
      showUserInput: false,
      showAssistantOutput: true,
    }, this._waitingForUser ? 'resume' : 'message');
  }

  reset(): void {
    this.messages.set([]);
    this._threadId = crypto.randomUUID();
    this._lessonMode = false;
    this._waitingForUser = false;
  }
}