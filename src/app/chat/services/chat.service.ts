import { Injectable, inject, signal } from "@angular/core";
import { DomainService } from "../../domain/domain.service";
import { ChatMessage } from "../models";
import { LessonRegistryService } from "../../services/lesson-registry.service";
import { ProgressService } from "../../services/progress.service";
import { addMessage, showError, updateLastAssistant, getCommandLabel } from "./helpers";
import { ChatApiService } from "../../services/chat-api.service";


@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);
  private lessonRegistry = inject(LessonRegistryService);
  private agentApi = inject(ChatApiService);
  private progressService = inject(ProgressService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  private _threadId = crypto.randomUUID();

  /** Whether a lesson is currently active. */
  private _lessonMode = false;

  /** Id of the active lesson (set by startLesson), used for progress reporting. */
  private _lessonId: string | null = null;

  /** Id of the currently-running exercise (derived from the start-exercise command). */
  private _exerciseId: string | null = null;

  private _waitingForUser = false;

  /** Clear the cached agent so the next send() rebuilds it with fresh config. */
  resetAgent(): void {
    this._threadId = crypto.randomUUID();
    this._lessonMode = false;
    this._lessonId = null;
    this._exerciseId = null;
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
    this._lessonId = lessonId;

    // Report lesson start to the backend (fire-and-forget — must not block the lesson).
    void this.progressService
      .updateProgress(lessonId, { status: 'in_progress' })
      .catch(() => {
        // Progress persistence is best-effort — ignore backend failures.
      });

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
      let accumulatedText = '';
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
              accumulatedText += event.text;

              if (options.showAssistantOutput) {
                updateLastAssistant(this.messages, {
                  text: accumulatedText,
                });
              }
              break;

            case 'domain-command': {
              if (event.command.type === 'start-exercise') {
                // Track the exercise id for progress reporting when the user submits.
                this._exerciseId = event.command.question;
              }
              this.domainService.execute(event.command);
              // Add to last assistant message as clickable history
              if (options.showAssistantOutput) {
                const label = getCommandLabel(event.command);
                if (label) {
                  updateLastAssistant(this.messages, {
                    domainCommands: [
                      ...(this.messages().at(-1)?.domainCommands ?? []),
                      { command: event.command, label },
                    ],
                  });
                }
              }
              break;
            }

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
    if (!userMessage.trim()) return;
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
   * Also reports the exercise result to the backend (progress tracking).
   */
  async notifyExerciseSubmitted(): Promise<void> {
    this.reportExerciseResult();

    const message =
      "Użytkownik kliknął Sprawdź. Ćwiczenie zostało zweryfikowane. " +
      "Użyj narzędzia get_exercise_result aby zobaczyć wynik i skomentuj odpowiedź użytkownika.";

    await this.processStream(message, {
      showUserInput: false,
      showAssistantOutput: true,
    });
  }

  /**
   * Persist the last exercise result to the backend (fire-and-forget).
   * Only sent when a lesson and an exercise are active (exercise results belong to a lesson).
   */
  private reportExerciseResult(): void {
    const state = this.domainService.currentState();
    if (!this._lessonId || !this._exerciseId || !state.lastExerciseResult) return;

    const result = { ...state.lastExerciseResult };
    void this.progressService
      .saveExerciseResult(this._lessonId, this._exerciseId, result)
      .catch(() => {
        // Progress persistence is best-effort — ignore backend failures.
      });
  }

  reset(): void {
    this.messages.set([]);
    this._threadId = crypto.randomUUID();
    this._lessonMode = false;
    this._lessonId = null;
    this._exerciseId = null;
    this._waitingForUser = false;
  }

}
