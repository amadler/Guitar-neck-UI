import { Injectable, inject, signal } from "@angular/core";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage, BaseMessage, ToolMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph, Annotation, Command, interrupt, messagesStateReducer } from "@langchain/langgraph";
import { createDomainTools } from "../tools/domain-tools";
import { DomainService } from "../../domain/domain.service";
import { ChatOpenRouter } from '@langchain/openrouter';
import { ChatMessage } from "../models";
import { LessonRegistryService } from "../../services/lesson-registry.service";
import { ExerciseResult } from "../../domain/state";
import type { GraphRunStream } from "@langchain/langgraph";

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
  "Wykonuj JEDNĄ akcję dydaktyczną na raz. " +
  "Po pokazaniu interwału, skali, akordu lub rozpoczęciu ćwiczenia — zatrzymaj się i daj użytkownikowi czas na reakcję. " +
  "Nie wykonuj kilku prezentacji pod rząd. Nie czyść i nie pokazuj następnego przykładu bez odpowiedzi użytkownika. " +
  "Gdy chcesz zadać ćwiczenie, użyj narzędzia start_exercise. " +
  "Podaj question (pytanie do użytkownika), rootNote, expectedIntervals (czego szukać). " +
  "Po otrzymaniu wyniku ćwiczenia, skomentuj odpowiedź użytkownika. " +
  "Jeśli odpowiedź jest dobra — pochwal. Jeśli nie — podpowiedz. " +
  "Gdy użytkownik zada pytanie spoza lekcji, odpowiedz krótko i wróć do lekcji.";

/**
 * Status of the lesson LangGraph.
 * - idle: no active graph or graph completed normally
 * - running: graph is currently processing
 * - interrupted: graph paused by interrupt(), waiting for user input
 */
type GraphStatus = 'idle' | 'running' | 'interrupted';

/**
 * State schema for the lesson LangGraph.
 * Uses the standard messages reducer for conversation history,
 * plus pendingPause for orchestration state (not domain state).
 */
const LessonState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  pendingPause: Annotation<{
    type: 'lesson_step' | 'exercise';
    toolName: string;
    payload?: unknown;
  } | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

/**
 * Didactic tools that trigger a pause for human interaction.
 * Only ONE of these is executed per turn; subsequent didactic
 * tool calls are skipped with a placeholder ToolMessage.
 */
const LESSON_PAUSE_TOOLS = new Set([
  'show_pattern',
  'show_interval',
  'compare_patterns',
  'resolve_shape',
  'start_exercise',
]);

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);
  private lessonRegistry = inject(LessonRegistryService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private config = { configurable: { thread_id: crypto.randomUUID() } };

  /** Agent for normal (non-lesson) chat — created via createAgent(). */
  private _agent: ReturnType<typeof createAgent> | null = null;

  /** Lesson LangGraph — manually built with StateGraph for interrupt support. */
  private _lessonGraph: ReturnType<typeof buildLessonGraph> | null = null;

  /** Whether a lesson is currently active. */
  private _lessonMode = false;

  /** Current status of the lesson graph. */
  private _graphStatus: GraphStatus = 'idle';

  /** Clear the cached agent so the next send() rebuilds it with fresh config. */
  resetAgent(): void {
    this._agent = null;
    this._lessonGraph = null;
    this.config = { configurable: { thread_id: crypto.randomUUID() } };
    this._lessonMode = false;
    this._graphStatus = 'idle';
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
      await this.runLessonGraph({
        messages: [new HumanMessage(
          `Rozpoczynam lekcję: ${lesson.title}\n\n---\n${content}\n---\n\nProwadź mnie krok po kroku przez tę lekcję. Zadawaj pytania i czekaj na moje odpowiedzi.`
        )],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      this.messages.set([{ role: 'assistant', text: `❌ Nie udało się załadować lekcji "${lesson.title}": ${msg}` }]);
    }
  }

  // ─── Normal (non-lesson) chat ──────────────────────────────────────────

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
        systemPrompt: BASE_SYSTEM_PROMPT,
      });
    }
    return this._agent;
  }

  /**
   * Shared pipeline for sending messages to the agent and processing the response.
   * Used ONLY for normal (non-lesson) chat.
   */
  private async processStream(
    userMessage: string,
    options: { showUserInput: boolean; showAssistantOutput: boolean },
  ): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);

    if (options.showUserInput) {
      this.messages.update(m => [...m, { role: 'user', text: userMessage }]);
    }
    if (options.showAssistantOutput) {
      this.messages.update(m => [...m, { role: 'assistant', text: '', streaming: true }]);
    }

    try {
      const agent = this.getOrCreateAgent();
      const stream = await agent.streamEvents(
        { messages: [new HumanMessage(userMessage)] },
        { ...this.config, version: "v3" },
      );

      await Promise.all([
        (async () => {
          if (!options.showAssistantOutput) return;
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
          if (!options.showAssistantOutput) return;
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

      if (options.showAssistantOutput) {
        this.messages.update(m => {
          const msgs = [...m];
          const last = msgs[msgs.length - 1];
          if (last?.streaming) {
            msgs[msgs.length - 1] = { ...last, streaming: false };
          }
          return msgs;
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      if (options.showAssistantOutput) {
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
      }
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Lesson graph ──────────────────────────────────────────────────────

  private getOrCreateLessonGraph(): ReturnType<typeof buildLessonGraph> {
    if (!this._lessonGraph) {
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (!apiKey) {
        throw new Error(
          "Brak klucza API. Skonfiguruj go na stronie głównej lub w localStorage pod kluczem 'modelApiKey'."
        );
      }

      const modelName = localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
      const model = new ChatOpenRouter({ model: modelName, apiKey });
      const tools = createDomainTools(this.domainService);

      this._lessonGraph = buildLessonGraph(model, tools, LESSON_SYSTEM_PROMPT, new MemorySaver());
    }
    return this._lessonGraph;
  }

  /**
   * Run the lesson graph with the given input (either initial messages or a Command for resume).
   * Uses v3 streamEvents API and checks stream.interrupted after consumption.
   */
  private async runLessonGraph(
    input: { messages: BaseMessage[] } | Command,
  ): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this._graphStatus = 'running';

    this.messages.update(m => [...m, { role: 'assistant', text: '', streaming: true }]);

    try {
      const graph = this.getOrCreateLessonGraph();
      const stream = await (graph.streamEvents(
        input as any,
        { ...this.config, version: 'v3' },
      ) as Promise<GraphRunStream>);

      let accumulatedText = '';

      // Consume the stream using the typed v3 projection API
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
        accumulatedText = accumulated;
      }

      // Also consume raw events to detect tool starts for UI feedback
      for await (const event of stream) {
        if (
          (event as any).method === 'tools' &&
          (event as any).params?.data?.event === 'tool-started'
        ) {
          this.messages.update(m => {
            const msgs = [...m];
            const last = msgs[msgs.length - 1];
            if (last?.streaming) {
              msgs[msgs.length - 1] = { ...last, text: `🔧 Używam narzędzia...` };
            }
            return msgs;
          });
        }
      }

      // Finalize the assistant message
      this.messages.update(m => {
        const msgs = [...m];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, streaming: false };
        }
        return msgs;
      });

      // Check interrupt status per LangGraph HITL API
      if (stream.interrupted) {
        this._graphStatus = 'interrupted';
      } else {
        this._graphStatus = 'idle';
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      this.messages.update(m => [...m, { role: 'assistant', text: `❌ ${errorMsg}` }]);
      this._graphStatus = 'idle';
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────

  async send(userMessage: string): Promise<void> {
    if (!userMessage.trim()) return;

    if (this._lessonMode) {
      // Every message in lesson mode goes through the lesson graph
      this.messages.update(m => [...m, { role: 'user', text: userMessage }]);
      if (this._graphStatus === 'interrupted') {
        await this.runLessonGraph(new Command({ resume: userMessage }));
      } else {
        await this.runLessonGraph({
          messages: [new HumanMessage(userMessage)],
        });
      }
      return;
    }

    await this.processStream(userMessage, {
      showUserInput: true,
      showAssistantOutput: true,
    });
  }

  /**
   * Resume the lesson graph with an exercise result.
   * Called by GuitarNeckComponent after the user submits an exercise.
   */
  async resumeWithExerciseResult(result: ExerciseResult): Promise<void> {
    if (this._graphStatus !== 'interrupted') return;
    await this.runLessonGraph(new Command({ resume: result }));
  }

  reset(): void {
    this.messages.set([]);
    this.config = { configurable: { thread_id: crypto.randomUUID() } };
    this._agent = null;
    this._lessonGraph = null;
    this._lessonMode = false;
    this._graphStatus = 'idle';
  }
}

// ─── Graph builder (standalone function) ──────────────────────────────────

/**
 * Build a LangGraph StateGraph for lesson mode.
 *
 * Structure:
 *   __start__ → agent → tools → waitForHuman → agent → ...
 *              ↕ (no pause)  ↕ (no didactic tool)
 *
 * interrupt() lives ONLY in waitForHuman node, never inside tools.
 * This ensures side effects execute exactly once before the pause.
 *
 * Flow:
 * 1. agent produces tool_calls
 * 2. toolsNode executes tools. If a didactic tool (LESSON_PAUSE_TOOLS) is
 *    found, it executes ONLY that one and sets pendingPause. Subsequent
 *    didactic tool calls get a skipped ToolMessage.
 * 3. If pendingPause is set → waitForHuman (interrupt)
 * 4. If no pendingPause → agent (continue)
 * 5. waitForHuman resumes → adds user response as HumanMessage → agent
 */
function buildLessonGraph(
  model: ChatOpenRouter,
  tools: any[],
  systemPrompt: string,
  checkpointer: MemorySaver,
) {
  const agentNode = async (state: typeof LessonState.State) => {
    const llm = model.bindTools(tools);
    const systemMessage = new SystemMessage(systemPrompt);
    const result = await llm.invoke([systemMessage, ...state.messages]);
    return { messages: [result] };
  };

  const toolsNode = async (state: typeof LessonState.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!(lastMessage instanceof AIMessage) || !lastMessage.tool_calls?.length) {
      return { pendingPause: null };
    }

    const results: ToolMessage[] = [];
    let didacticExecuted = false;
    let pauseToolName: string | null = null;
    let pausePayload: unknown = null;

    for (const tc of lastMessage.tool_calls) {
      const tool = tools.find((t: any) => t.name === tc.name);
      if (!tool) continue;

      const isDidactic = LESSON_PAUSE_TOOLS.has(tc.name);

      // If we already executed a didactic tool, skip remaining didactic ones
      if (isDidactic && didacticExecuted) {
        results.push(new ToolMessage({
          content: JSON.stringify({
            success: false,
            skipped: true,
            reason: 'Lesson paused after first didactic action.',
          }),
          tool_call_id: tc.id as string,
        }));
        continue;
      }

      // Execute the tool
      const result = await tool.invoke(tc.args);
      results.push(new ToolMessage({
        content: typeof result === 'string' ? result : JSON.stringify(result),
        tool_call_id: tc.id as string,
      }));

      // If this is a didactic tool, mark it as executed and record pause info
      if (isDidactic) {
        didacticExecuted = true;
        pauseToolName = tc.name;
        pausePayload = tc.args;
      }
    }

    return {
      messages: results,
      pendingPause: pauseToolName
        ? {
            type: pauseToolName === 'start_exercise' ? 'exercise' : 'lesson_step',
            toolName: pauseToolName,
            payload: pausePayload,
          }
        : null,
    };
  };

  const waitForHumanNode = async (state: typeof LessonState.State) => {
    const response = interrupt(state.pendingPause);

    return {
      messages: [
        new HumanMessage(
          typeof response === 'string'
            ? response
            : JSON.stringify(response),
        ),
      ],
      pendingPause: null,
    };
  };

  const shouldContinue = (state: typeof LessonState.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
      return "tools";
    }
    return "__end__";
  };

  const afterTools = (state: typeof LessonState.State) => {
    if (state.pendingPause) {
      return "waitForHuman";
    }
    return "agent";
  };

  return new StateGraph(LessonState)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addNode("waitForHuman", waitForHumanNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      __end__: "__end__",
    })
    .addConditionalEdges("tools", afterTools, {
      waitForHuman: "waitForHuman",
      agent: "agent",
    })
    .addEdge("waitForHuman", "agent")
    .compile({ checkpointer });
}