import { Injectable, inject, signal } from "@angular/core";
import { createDeepAgent } from "deepagents";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { Command } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createDomainTools } from "../tools/domain-tools";
import { DomainService } from "../../domain/domain.service";
import { ChatOpenRouter } from '@langchain/openrouter';
import { ChatMessage } from "../models";
import { LessonRegistryService } from "../../services/lesson-registry.service";
import { StorageService } from "../../../utils/Storage.util";

const BASE_SYSTEM_PROMPT =
  "Jesteś pomocnym asystentem gitarzysty. Mów po polsku, krótko i rzeczowo. " +
  "Gdy użytkownik poprosi o pokazanie skali lub akordu na gryfie, użyj narzędzia show_pattern. " +
  "Gdy zapyta o interwał, użyj show_interval. " +
  "Gdy poprosi o wyczyszczenie widoku, użyj clear_view. " +
  "Gdy poprosi o porównanie skali z akordem (np. 'pokaż C-dur z Am'), użyj compare_patterns. " +
  "Gdy poprosi o zmianę widoku (zakres progów, tryb wyświetlania), użyj set_view. " +
  "Gdy poprosi o podświetlenie konkretnych interwałów, użyj set_emphasis. " +
  "Gdy zapyta o chwyty gitarowe (cowboy chords, barre), użyj resolve_shape. " +
  "Gdy poprosi o włączenie/wyłączenie trybu AI, użyj set_ai_mode. " +
  "Po wykonaniu narzędzia powiedz użytkownikowi co zostało pokazane.";

const LESSON_SYSTEM_PROMPT =
  "Jesteś nauczycielem gitary prowadzącym lekcję krok po kroku. " +
  "Masz przed sobą pełny tekst lekcji. Trzymaj się ściśle jej treści — nie odchodź od tematu. " +
  "Wykonuj jeden krok dydaktyczny na raz. " +
  "Po pokazaniu interwału, skali, akordu lub innego przykładu użyj narzędzia wait_for_user i poczekaj na reakcję użytkownika. " +
  "Nie przechodź do następnego kroku przed odpowiedzią użytkownika. " +
  "Gdy chcesz zadać ćwiczenie, użyj narzędzia start_exercise. " +
  "Podaj question (pytanie do użytkownika), rootNote, expectedIntervals (czego szukać). " +
  "Po rozpoczęciu ćwiczenia użyj wait_for_user. " +
  "Po otrzymaniu wyniku ćwiczenia (submit_exercise), skomentuj odpowiedź użytkownika. " +
  "Jeśli odpowiedź jest dobra — pochwal. Jeśli nie — podpowiedz. " +
  "Nie zadawaj kolejnego pytania, dopóki nie dostaniesz wyniku poprzedniego. " +
  "Gdy użytkownik zada pytanie spoza lekcji, odpowiedz krótko i wróć do lekcji.";


@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);
  private lessonRegistry = inject(LessonRegistryService);
  private storageService = inject(StorageService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private config = { configurable: { thread_id: crypto.randomUUID() } };

  private _agent: ReturnType<typeof createDeepAgent> | null = null;

  /** Whether a lesson is currently active. */
  private _lessonMode = false;

  private _waitingForUser = false;

  /** Clear the cached agent so the next send() rebuilds it with fresh config. */
  resetAgent(): void {
    this._agent = null;
    this.config = { configurable: { thread_id: crypto.randomUUID() } };
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

  private getOrCreateAgent() {
    return this._agent ??= this.createAgentFor(
      this._lessonMode ? LESSON_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT
    );
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
      this.addMessage({ role: 'user', text: userMessage });
    }
    if (options.showAssistantOutput) {
      this.addMessage({ role: 'assistant', text: '', streaming: true });
    }

    try {
      const agent = this.getOrCreateAgent();
      const stream = await agent.streamEvents(
        { messages: [new HumanMessage(userMessage)] },
        { ...this.config, version: "v3" },
      );

      await this.consumeStream(stream, options.showAssistantOutput);

      this._waitingForUser = Boolean(stream.interrupted);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      if (options.showAssistantOutput) {
        this.showError(errorMsg);
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async resume(
    userMessage: string,
    showUserInput = true,
  ): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);

    if (showUserInput) {
      this.addMessage({ role: 'user', text: userMessage });
    }

    this.addMessage({ role: 'assistant', text: '', streaming: true });

    try {
      const agent = this.getOrCreateAgent();

      const stream = await agent.streamEvents(
        new Command({
          resume: {
            decisions: [
              {
                type: "respond",
                message: userMessage,
              },
            ],
          } as any,
        }),
        { ...this.config, version: "v3" },
      );

      await this.consumeStream(stream, true);

      this._waitingForUser = Boolean(stream.interrupted);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      this.showError(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  private async consumeStream(
    stream: any,
    showAssistantOutput: boolean,
  ): Promise<void> {
    await Promise.all([
      (async () => {
        if (!showAssistantOutput) return;
        for await (const message of stream.messages) {
          let accumulated = '';
          for await (const token of message.text) {
            accumulated += token;
            this.updateLastAssistant({ text: accumulated });
          }
        }
      })(),
      (async () => {
        if (!showAssistantOutput) return;
        for await (const call of stream.toolCalls) {
          this.updateLastAssistant({ text: `🔧 Używam narzędzia: ${call.name}...` });
          await call.output;
        }
      })(),
    ]);

    if (showAssistantOutput) {
      this.updateLastAssistant({ streaming: false });
    }
  }

  async send(userMessage: string): Promise<void> {
    if (!userMessage.trim()) return;

    if (this._waitingForUser) {
      await this.resume(userMessage);
      return;
    }

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

    if (this._waitingForUser) {
      await this.resume(message, false);
      return;
    }

    await this.sendRaw(message);
  }

  reset(): void {
    this.messages.set([]);
    this.config = { configurable: { thread_id: crypto.randomUUID() } };
    this._agent = null;
    this._lessonMode = false;
    this._waitingForUser = false;
  }

  private createAgentFor(prompt: string) {
    const apiKey = this.storageService.apiKey();
    const modelName = this.storageService.selectedModel();
    const domainTools = createDomainTools(this.domainService);

    return createDeepAgent({
      model: new ChatOpenRouter({ model: modelName, apiKey }),
      tools: this._lessonMode ? [...domainTools] : domainTools,
      checkpointer: new MemorySaver(),
      systemPrompt: prompt,
      ...(this._lessonMode
        ? {
          interruptOn: {
            wait_for_user: true,
          },
        }
        : {}),
    });
  }

  private addMessage(message: ChatMessage): void {
    this.messages.update(messages => [...messages, message]);
  }

  private updateLastAssistant(patch: Partial<ChatMessage>): void {
    this.messages.update(messages => {
      const next = [...messages];
      const last = next.at(-1);

      if (last?.role === 'assistant') {
        next[next.length - 1] = { ...last, ...patch };
      }

      return next;
    });
  }

  private showError(errorMsg: string): void {
    this.messages.update(messages => {
      const next = [...messages];
      const last = next.at(-1);

      if (last?.streaming) {
        next[next.length - 1] = {
          ...last,
          text: `❌ ${errorMsg}`,
          streaming: false,
        };
      } else {
        next.push({
          role: 'assistant',
          text: `❌ ${errorMsg}`,
        });
      }

      return next;
    });
  }
}
