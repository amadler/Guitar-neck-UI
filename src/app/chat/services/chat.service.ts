import { Injectable, inject, signal } from "@angular/core";
import { DomainService } from "../../domain/domain.service";
import { ChatMessage } from "../models";
import { LessonRegistryService } from "../../services/lesson-registry.service";
import { StorageService } from "../../../utils/Storage.util";
import { addMessage, showError, updateLastAssistant } from "./helpers";
import { tool } from "langchain";
import { z } from 'zod';
import { AgentApiService } from "../../services/agent-api.service";

const waitForUserTool = tool(
  async ({ prompt }) => prompt,
  {
    name: "wait_for_user",
    description: "Zatrzymuje lekcję po jednym kroku dydaktycznym i czeka na odpowiedź użytkownika.",
    schema: z.object({
      prompt: z.string(),
    }),
  },
)

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);
  private lessonRegistry = inject(LessonRegistryService);
  private storageService = inject(StorageService);
  private agentApi = inject(AgentApiService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  private _threadId = crypto.randomUUID();

  /** Whether a lesson is currently active. */
  private _lessonMode = false;

  private _waitingForUser = false;

  /** Clear the cached agent so the next send() rebuilds it with fresh config. */
  resetAgent(): void {
    this._threadId = crypto.randomUUID();
    this._lessonMode = false;
    this._waitingForUser = false;
  }

  /**
   * Start a lesson session.
   * Resets the agent (fresh context, no history), loads the lesson content,
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
   * Shared pipeline for sending messages to the agent and processing the response.
   *
   * @param userMessage - The message to send to the agent.
   * @param options.showUserInput - If true, the user message is added to the chat history.
   * @param options.showAssistantOutput - If true, the assistant response is streamed to the chat.
   */
  private async processStream(
    userMessage: string,
    options: { showUserInput: boolean; showAssistantOutput: boolean },
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
      await this.agentApi.send(
        {
          type: this._waitingForUser ? 'resume' : 'message',
          threadId: this._threadId,
          text: userMessage,
          domainState: this.domainService.currentState(),
          lessonMode: this._lessonMode,
        },
        (event) => {
          switch (event.type) {
            case 'token':
              if (options.showAssistantOutput) {
                updateLastAssistant(this.messages, {
                  text: event.text,
                });
              }
              break;

            case 'domain-command':
              this.domainService.execute(event.command);
              break;

            case 'interrupt':
              this._waitingForUser = event.waitingForUser;
              break;

            case 'error':
              if (options.showAssistantOutput) {
                showError(this.messages, event.message);
              }
              break;

            case 'done':
              if (options.showAssistantOutput) {
                updateLastAssistant(this.messages, {
                  streaming: false,
                });
              }
              break;
          }
        },
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
    await this.processStream(userMessage, {
      showUserInput: true,
      showAssistantOutput: true,
    });
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
    });
  }

  reset(): void {
    this.messages.set([]);
    this._threadId = crypto.randomUUID();
    this._lessonMode = false;
    this._waitingForUser = false;
  }

}
