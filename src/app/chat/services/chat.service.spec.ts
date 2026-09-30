import { TestBed } from "@angular/core/testing";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ChatService } from "./chat.service";
import { DomainService } from "../../domain/domain.service";
import { ChatApiService } from "../../services/chat-api.service";

/**
 * Helper: create an async iterable from an array.
 */
async function* asyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

/**
 * Helper: create an async iterable of text tokens from a string.
 */
async function* textStream(text: string): AsyncIterable<string> {
  for (const char of text) {
    yield char;
  }
}

/**
 * Minimal localStorage mock for test environments where it's unavailable.
 */
function ensureLocalStorage(): void {
  if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      get length() { return store.size; },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  }
}

describe("ChatService", () => {
  let service: ChatService;
  let mockDomainService: { execute: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn>; currentState: ReturnType<typeof vi.fn> };
  let mockAgentApi: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDomainService = {
      execute: vi.fn().mockReturnValue({ success: true, action: "test", message: "ok" }),
      query: vi.fn().mockReturnValue({ success: true, data: {} }),
      currentState: vi.fn().mockReturnValue({
        mode: 'scale',
        aiModeEnabled: false,
        displayMode: null,
        rootNote: 'C',
        patternName: 'major',
        fretRange: { min: 0, max: 12 },
        enabledStrings: [true, true, true, true, true, true],
        markerDisplayMode: 'interval-colors',
        exerciseMode: false,
      }),
    };
    mockAgentApi = {
      send: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: DomainService, useValue: mockDomainService },
        { provide: ChatApiService, useValue: mockAgentApi },
      ],
    });

    service = TestBed.inject(ChatService);
  });

  describe("reset", () => {
    it("should clear messages and generate a new threadId", () => {
      const oldThreadId = (service as any)._threadId;
      service.messages.set([{ role: "user", text: "hello" }]);

      service.reset();

      expect(service.messages()).toEqual([]);
      expect((service as any)._threadId).not.toBe(oldThreadId);
    });
  });

  describe("resetAgent", () => {
    it("should reset thread and lesson mode", () => {
      (service as any)._lessonMode = true;
      (service as any)._waitingForUser = true;
      const oldThreadId = (service as any)._threadId;

      service.resetAgent();

      expect((service as any)._lessonMode).toBe(false);
      expect((service as any)._waitingForUser).toBe(false);
      expect((service as any)._threadId).not.toBe(oldThreadId);
    });
  });

  describe("send (normal chat)", () => {
    it("should set loading to true at start and false at end", async () => {
      mockAgentApi.send.mockImplementation(async (_body: any, onEvent: any) => {
        onEvent({ type: "done" });
      });

      const sendPromise = service.send("hello");

      expect(service.loading()).toBe(true);

      await sendPromise;

      expect(service.loading()).toBe(false);
    });

    it("should add user message and assistant response on success", async () => {
      const responseText = "C-dur to skala: C, D, E, F, G, A, B.";
      mockAgentApi.send.mockImplementation(async (_body: any, onEvent: any) => {
        onEvent({ type: "token", text: responseText });
        onEvent({ type: "done" });
      });

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({
        role: "assistant",
        text: responseText,
      });
    });

    it("should show error message in chat when agentApi.send throws", async () => {
      mockAgentApi.send.mockRejectedValue(new Error("Ollama not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({ role: "assistant", streaming: false });
      expect(service.messages()[1].text).toContain("❌");
      expect(service.messages()[1].text).toContain("Ollama not available");
      expect(service.loading()).toBe(false);
    });

    it("should show error and preserve existing messages", async () => {
      service.messages.set([{ role: "assistant", text: "Witaj!" }]);
      mockAgentApi.send.mockRejectedValue(new Error("Ollama not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(3);
      expect(service.messages()[0]).toMatchObject({ role: "assistant", text: "Witaj!" });
      expect(service.messages()[1]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[2]).toMatchObject({ role: "assistant", streaming: false });
      expect(service.messages()[2].text).toContain("❌");
      expect(service.loading()).toBe(false);
    });
  });

  describe("send (resume after waiting for user)", () => {
    it("should resume the agent when _waitingForUser is true", async () => {
      (service as any)._waitingForUser = true;
      mockAgentApi.send.mockImplementation(async (_body: any, onEvent: any) => {
        onEvent({ type: "done" });
      });

      await service.send("dalej");

      expect(service.messages().length).toBeGreaterThanOrEqual(1);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "dalej" });
      expect(mockAgentApi.send).toHaveBeenCalled();
    });

    it("should not resume when _waitingForUser is false", async () => {
      (service as any)._waitingForUser = false;
      mockAgentApi.send.mockImplementation(async (_body: any, onEvent: any) => {
        onEvent({ type: "done" });
      });

      await service.send("hello");
      expect(mockAgentApi.send).toHaveBeenCalled();
    });
  });

  describe("startLesson", () => {
    it("should set _lessonMode to true", async () => {
      // Mock fetch to return lesson content
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test lesson content"),
      });

      // Mock lesson registry to return a lesson
      const mockRegistry = {
        getLesson: vi.fn().mockReturnValue({ id: 'test', title: 'Test', description: '', level: 'podstawowy' }),
      };
      (service as any).lessonRegistry = mockRegistry;

      mockAgentApi.send.mockImplementation(async (_body: any, onEvent: any) => {
        onEvent({ type: "done" });
      });

      await service.startLesson('test');

      expect((service as any)._lessonMode).toBe(true);
    });
  });
});

/**
 * Integration test: real StateGraph + interrupt + Command({ resume }).
 * This test builds a minimal LangGraph with the new architecture:
 *   action → waitForHuman → finish
 * interrupt() lives ONLY in waitForHuman, NOT in action.
 * This proves side effects execute exactly once before the pause.
 */
describe("StateGraph interrupt/resume integration", () => {
  it("should pause on interrupt and resume with Command — side effect executes once", async () => {
    const { StateGraph, Annotation, Command, interrupt, messagesStateReducer } = await import("@langchain/langgraph");
    const { MemorySaver } = await import("@langchain/langgraph-checkpoint");

    const callLog: string[] = [];

    const TestState = Annotation.Root({
      messages: Annotation<any[]>({
        reducer: messagesStateReducer,
        default: () => [],
      }),
      pendingPause: Annotation<{ type: string; toolName: string } | null>({
        reducer: (_, next) => next,
        default: () => null,
      }),
    });

    const actionNode = async (state: typeof TestState.State) => {
      callLog.push('action');
      return {
        messages: [],
        pendingPause: { type: 'lesson_step', toolName: 'test_tool' },
      };
    };

    const waitNode = async (state: typeof TestState.State) => {
      const answer = interrupt(state.pendingPause);
      callLog.push(`resume:${answer}`);
      return {
        messages: [new HumanMessage(String(answer))],
        pendingPause: null,
      };
    };

    const finishNode = async (state: typeof TestState.State) => {
      callLog.push('finish');
      return { messages: [] };
    };

    const graph = new StateGraph(TestState)
      .addNode("action", actionNode)
      .addNode("waitForHuman", waitNode)
      .addNode("finish", finishNode)
      .addEdge("__start__", "action")
      .addConditionalEdges("action", (s: any) => s.pendingPause ? "waitForHuman" : "finish", {
        waitForHuman: "waitForHuman",
        finish: "finish",
      })
      .addEdge("waitForHuman", "finish")
      .compile({ checkpointer: new MemorySaver() });

    const threadConfig = { configurable: { thread_id: "test-integration-2" } };

    // ── First invocation ──
    const stream1 = await graph.streamEvents(
      { messages: [] },
      { ...threadConfig, version: "v3" },
    );

    for await (const _ of stream1) {
      // consume events
    }

    expect(stream1.interrupted).toBe(true);
    // 'action' must appear exactly ONCE — side effect does NOT re-execute
    expect(callLog).toEqual(['action']);

    // ── Resume ──
    const stream2 = await graph.streamEvents(
      new Command({ resume: 'dalej' }),
      { ...threadConfig, version: "v3" },
    );

    for await (const _ of stream2) {
      // consume events
    }

    expect(stream2.interrupted).toBe(false);

    expect(callLog).toEqual([
      'action',
      'resume:dalej',
      'finish',
    ]);
  });
});

/**
 * Integration test: simulate a real lesson scenario with two tool calls.
 * The graph should execute only ONE didactic tool, skip the second,
 * set pendingPause, and pause. After resume, the skipped tool should
 * NOT execute either.
 */
describe("Lesson graph didactic tool limiting", () => {
  it("should execute only one didactic tool per turn and skip the rest", async () => {
    const { StateGraph, Annotation, Command, interrupt, messagesStateReducer } = await import("@langchain/langgraph");
    const { MemorySaver } = await import("@langchain/langgraph-checkpoint");
    const { AIMessage, ToolMessage } = await import("@langchain/core/messages");

    const executeLog: string[] = [];
    let agentInvocationCount = 0;

    const LessonState = Annotation.Root({
      messages: Annotation<any[]>({
        reducer: messagesStateReducer,
        default: () => [],
      }),
      pendingPause: Annotation<{ type: string; toolName: string; payload?: unknown } | null>({
        reducer: (_, next) => next,
        default: () => null,
      }),
    });

    const LESSON_PAUSE_TOOLS = new Set(['show_interval', 'show_pattern']);

    // Simulate an agent that produces two tool calls on first invocation,
    // then no tool calls after resume (lesson step complete)
    const agentNode = async (state: typeof LessonState.State) => {
      agentInvocationCount++;
      if (agentInvocationCount === 1) {
        return {
          messages: [new AIMessage({
            content: '',
            tool_calls: [
              { name: 'show_interval', args: { rootNote: 'C', interval: '3' }, id: 'call_1' },
              { name: 'show_pattern', args: { patternType: 'scale', patternName: 'major', rootNote: 'C' }, id: 'call_2' },
            ],
          })],
        };
      }
      // After resume, agent produces no tool calls (lesson step complete)
      return {
        messages: [new AIMessage({ content: 'Dobra robota!' })],
      };
    };

    const toolsNode = async (state: typeof LessonState.State) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (!lastMsg?.tool_calls?.length) return { pendingPause: null };

      const results: any[] = [];
      let didacticExecuted = false;
      let pauseToolName: string | null = null;
      let pausePayload: unknown = null;

      for (const tc of lastMsg.tool_calls) {
        const isDidactic = LESSON_PAUSE_TOOLS.has(tc.name);

        if (isDidactic && didacticExecuted) {
          // Skip — create placeholder ToolMessage
          results.push(new ToolMessage({
            content: JSON.stringify({
              success: false,
              skipped: true,
              reason: 'Lesson paused after first didactic action.',
            }),
            tool_call_id: tc.id,
          }));
          continue;
        }

        // Execute
        executeLog.push(tc.name);
        results.push(new ToolMessage({
          content: JSON.stringify({ success: true, action: tc.name }),
          tool_call_id: tc.id,
        }));

        if (isDidactic) {
          didacticExecuted = true;
          pauseToolName = tc.name;
          pausePayload = tc.args;
        }
      }

      return {
        messages: results,
        pendingPause: pauseToolName
          ? { type: 'lesson_step', toolName: pauseToolName, payload: pausePayload }
          : null,
      };
    };

    const waitForHumanNode = async (state: typeof LessonState.State) => {
      const response = interrupt(state.pendingPause);
      return {
        messages: [new HumanMessage(String(response))],
        pendingPause: null,
      };
    };

    const graph = new StateGraph(LessonState)
      .addNode("agent", agentNode)
      .addNode("tools", toolsNode)
      .addNode("waitForHuman", waitForHumanNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", (s: any) => {
        const last = s.messages[s.messages.length - 1];
        return last?.tool_calls?.length ? "tools" : "__end__";
      }, { tools: "tools", __end__: "__end__" })
      .addConditionalEdges("tools", (s: any) => s.pendingPause ? "waitForHuman" : "agent", {
        waitForHuman: "waitForHuman",
        agent: "agent",
      })
      .addEdge("waitForHuman", "agent")
      .compile({ checkpointer: new MemorySaver() });

    const threadConfig = { configurable: { thread_id: "test-didactic-limit-1" } };

    // ── First run: should execute show_interval, skip show_pattern, pause ──
    const stream1 = await graph.streamEvents(
      { messages: [] },
      { ...threadConfig, version: "v3" },
    );

    for await (const _ of stream1) {
      // consume
    }

    expect(stream1.interrupted).toBe(true);
    // Only show_interval should have executed
    expect(executeLog).toEqual(['show_interval']);

    // ── Resume with user response ──
    const stream2 = await graph.streamEvents(
      new Command({ resume: 'dlaczego?' }),
      { ...threadConfig, version: "v3" },
    );

    for await (const _ of stream2) {
      // consume
    }

    // After resume, show_interval should still have executed only once
    expect(executeLog).toEqual(['show_interval']);
    // The graph should have continued to agent node (which now produces no tool calls,
    // so the graph ends without interruption)
    expect(stream2.interrupted).toBe(false);
  });
});