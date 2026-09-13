import { Injectable, inject, signal } from "@angular/core";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage } from '@langchain/core/messages';
import { createDomainTools } from "../tools/domain-tools";
import { DomainService } from "../../domain/domain.service";
import { ChatOpenRouter } from '@langchain/openrouter';
import { ChatMessage } from "../models";
import { LessonRegistryService } from "../../services/lesson-registry.service";

const API_KEY_STORAGE_KEY = 'modelApiKey';
const MODEL_STORAGE_KEY = 'modelName';
const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

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
  "Gdy chcesz zadać ćwiczenie, użyj narzędzia start_exercise. " +
  "Podaj question (pytanie do użytkownika), rootNote, expectedIntervals (czego szukać). " +
  "Po otrzymaniu wyniku ćwiczenia (submit_exercise), skomentuj odpowiedź użytkownika. " +
  "Jeśli odpowiedź jest dobra — pochwal. Jeśli nie — podpowiedz. " +
  "Nie zadawaj kolejnego pytania, dopóki nie dostaniesz wyniku poprzedniego. " +
  "Gdy użytkownik zada pytanie spoza lekcji, odpowiedz krótko i wróć do lekcji.";

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);
  private lessonRegistry = inject(LessonRegistryService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private config = { configurable: { thread_id: crypto.randomUUID() } };

  private _agent: ReturnType<typeof createAgent> | null = null;

  /** Whether a lesson is currently active. */
  private _lessonMode = false;

  /** Clear the cached agent so the next send() rebuilds it with fresh config. */
  resetAgent(): void {
    this._agent = null;
    this.config = { configurable: { thread_id: crypto.randomUUID() } };
    this._lessonMode = false;
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

    // Load lesson content from markdown file
    try {
      const response = await fetch(`/lessons/${lessonId}.md`);
      const content = await response.text();

      // Send lesson content as the first message
      await this.sendRaw(
        `Rozpoczynam lekcję: ${lesson.title}\n\n---\n${content}\n---\n\nProwadź mnie krok po kroku przez tę lekcję. Zadawaj pytania i czekaj na moje odpowiedzi.`
      );
    } catch {
      this.messages.set([{ role: 'assistant', text: `❌ Nie udało się załadować lekcji "${lesson.title}".` }]);
    }
  }

  private getOrCreateAgent(): ReturnType<typeof createAgent> {
    if (!this._agent) {
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (!apiKey) {
        throw new Error(
          "Brak klucza API. Skonfiguruj go na stronie głównej lub w localStorage pod kluczem 'modelApiKey'."
        );
      }

      const modelName = localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;

      this._agent = createAgent({
        model: new ChatOpenRouter({ model: modelName, apiKey }),
        tools: createDomainTools(this.domainService),
        checkpointer: new MemorySaver(),
        systemPrompt: this._lessonMode ? LESSON_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT,
      });
    }
    return this._agent;
  }

  async send(userMessage: string): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.messages.update(m => [...m, { role: 'user', text: userMessage }]);
    this.messages.update(m => [...m, { role: 'assistant', text: '', streaming: true }]);

    try {
      const agent = this.getOrCreateAgent();
      const stream = await agent.streamEvents(
        {
          messages: [
            new HumanMessage(userMessage),
          ],
        },
        { ...this.config, version: "v3" },
      );

      await Promise.all([
        (async () => {
          for await (const message of stream.messages) {
            let accumulated = '';
            for await (const token of message.text) {
              accumulated += token;
              this.messages.update(m => {
                const msgs = [...m];
                const last = msgs[msgs.length - 1];
                if (last?.streaming) {
                  msgs[msgs.length - 1] = { ...last, text: accumulated };
                }
                return msgs;
              });
            }
          }
        })(),
        (async () => {
          for await (const call of stream.toolCalls) {
            this.messages.update(m => {
              const msgs = [...m];
              const last = msgs[msgs.length - 1];
              if (last?.streaming) {
                msgs[msgs.length - 1] = { ...last, text: `🔧 Używam narzędzia: ${call.name}...` };
              }
              return msgs;
            });
            await call.output;
          }
        })(),
      ]);

      this.messages.update(m => {
        const msgs = [...m];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, streaming: false };
        }
        return msgs;
      });
    } catch (err) {
      // Gracefully handle missing key or agent creation errors
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      this.messages.update(m => {
        const msgs = [...m];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, text: `❌ ${errorMsg}`, streaming: false };
        } else {
          msgs.push({ role: 'assistant', text: `❌ ${errorMsg}` });
        }
        return msgs;
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Send a message directly to the agent without adding it to the visible chat history.
   * Used internally by startLesson() to inject lesson content.
   */
  private async sendRaw(message: string): Promise<void> {
    try {
      const agent = this.getOrCreateAgent();
      const stream = await agent.streamEvents(
        {
          messages: [new HumanMessage(message)],
        },
        { ...this.config, version: "v3" },
      );

      // Consume the stream — we don't display raw messages in chat
      for await (const _event of stream) {
        // Just consume
      }
    } catch {
      // Silently fail for raw messages
    }
  }

  /**
   * Notify the agent that the user has submitted an exercise.
   * The agent should call get_exercise_result to read the result and comment.
   */
  async notifyExerciseSubmitted(): Promise<void> {
    await this.sendRaw(
      "Użytkownik kliknął Sprawdź. Ćwiczenie zostało zweryfikowane. " +
      "Użyj narzędzia get_exercise_result aby zobaczyć wynik i skomentuj odpowiedź użytkownika."
    );
  }

  reset(): void {
    this.messages.set([]);
    this.config = { configurable: { thread_id: crypto.randomUUID() } };
  }
}