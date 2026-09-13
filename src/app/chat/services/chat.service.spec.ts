import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatService } from "./chat.service";
import { DomainService } from "../../domain/domain.service";
import { ExerciseResult } from "../../domain/state";

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
  let mockDomainService: { execute: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> };
  let mockAgent: { streamEvents: ReturnType<typeof vi.fn> };
  let mockLessonGraph: { streamEvents: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ensureLocalStorage();
    globalThis.localStorage.setItem('modelApiKey', 'sk-test-key');
    globalThis.localStorage.setItem('modelName', 'deepseek/deepseek-v4-flash');

    mockDomainService = {
      execute: vi.fn().mockReturnValue({ success: true, action: "test", message: "ok" }),
      query: vi.fn().mockReturnValue({ success: true, data: {} }),
    };
    mockAgent = {
      streamEvents: vi.fn(),
    };
    mockLessonGraph = {
      streamEvents: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: DomainService, useValue: mockDomainService },
      ],
    });

    service = TestBed.inject(ChatService);
    // Override the private agent field with a mock to avoid real LLM calls
    (service as any)._agent = mockAgent;
    (service as any)._lessonGraph = mockLessonGraph;
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  describe("reset", () => {
    it("should clear messages, graph, and generate a new threadId", () => {
      const initialConfig = { ...(service as any).config };
      service.messages.set([{ role: "user", text: "hello" }]);
      (service as any)._lessonGraph = mockLessonGraph;
      (service as any)._graphStatus = 'interrupted';

      service.reset();

      expect(service.messages()).toEqual([]);
      expect((service as any)._lessonGraph).toBeNull();
      expect((service as any)._graphStatus).toBe('idle');
      expect((service as any).config.configurable.thread_id).not.toBe(initialConfig.configurable.thread_id);
    });
  });

  describe("resetAgent", () => {
    it("should clear cached agent, lesson graph, and reset thread", () => {
      (service as any)._agent = mockAgent;
      (service as any)._lessonGraph = mockLessonGraph;
      (service as any)._graphStatus = 'interrupted';
      const oldConfig = { ...(service as any).config };

      service.resetAgent();

      expect((service as any)._agent).toBeNull();
      expect((service as any)._lessonGraph).toBeNull();
      expect((service as any)._graphStatus).toBe('idle');
      expect((service as any).config.configurable.thread_id).not.toBe(oldConfig.configurable.thread_id);
    });
  });

  describe("send (normal chat)", () => {
    it("should set loading to true at start and false at end", async () => {
      mockAgent.streamEvents.mockResolvedValue({
        messages: asyncIterable([]),
        toolCalls: asyncIterable([]),
      });

      const sendPromise = service.send("hello");

      expect(service.loading()).toBe(true);

      await sendPromise;

      expect(service.loading()).toBe(false);
    });

    it("should add user message and assistant response on success", async () => {
      const responseText = "C-dur to skala: C, D, E, F, G, A, B.";
      mockAgent.streamEvents.mockResolvedValue({
        messages: asyncIterable([
          { text: textStream(responseText) },
        ]),
        toolCalls: asyncIterable([]),
      });

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({
        role: "assistant",
        text: responseText,
      });
    });

    it("should show error message in chat when agent.streamEvents throws", async () => {
      mockAgent.streamEvents.mockRejectedValue(new Error("Ollama not available"));

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
      mockAgent.streamEvents.mockRejectedValue(new Error("Ollama not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(3);
      expect(service.messages()[0]).toMatchObject({ role: "assistant", text: "Witaj!" });
      expect(service.messages()[1]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[2]).toMatchObject({ role: "assistant", streaming: false });
      expect(service.messages()[2].text).toContain("❌");
      expect(service.loading()).toBe(false);
    });
  
    describe("missing API key", () => {
      it("should show error in chat when no API key is available", async () => {
        (service as any)._agent = null;
        globalThis.localStorage.removeItem('modelApiKey');

        await service.send("hello");

        expect(service.messages()).toHaveLength(2);
        expect(service.messages()[1].text).toContain("❌");
        expect(service.messages()[1].text).toContain("Brak klucza API");
        expect(service.loading()).toBe(false);
      });
    });
  });

  describe("send (lesson mode with interrupted graph)", () => {
    it("should resume the lesson graph when _graphStatus is interrupted", async () => {
      (service as any)._lessonMode = true;
      (service as any)._graphStatus = 'interrupted';
      mockLessonGraph.streamEvents.mockResolvedValue(asyncIterable([]));

      await service.send("dalej");

      // Should have added user message and called lesson graph streamEvents
      expect(service.messages().length).toBeGreaterThanOrEqual(1);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "dalej" });
      expect(mockLessonGraph.streamEvents).toHaveBeenCalled();
    });

    it("should not resume when lesson mode is off even if graph is interrupted", async () => {
      (service as any)._lessonMode = false;
      (service as any)._graphStatus = 'interrupted';
      mockAgent.streamEvents.mockResolvedValue({
        messages: asyncIterable([]),
        toolCalls: asyncIterable([]),
      });

      // Should use normal agent, not lesson graph
      await service.send("hello");
      expect(mockAgent.streamEvents).toHaveBeenCalled();
      expect(mockLessonGraph.streamEvents).not.toHaveBeenCalled();
    });
  });

  describe("resumeWithExerciseResult", () => {
    it("should do nothing when graph is not interrupted", async () => {
      (service as any)._graphStatus = 'idle';
      const exerciseResult: ExerciseResult = {
        correct: [true, false],
        selectedNotes: [{ note: 'C', string: 1, fret: 0 }],
        correctCount: 1,
        incorrectCount: 1,
      };

      await service.resumeWithExerciseResult(exerciseResult);

      // Should not have called streamEvents on lesson graph
      expect(mockLessonGraph.streamEvents).not.toHaveBeenCalled();
      expect(service.loading()).toBe(false);
    });

    it("should resume the lesson graph when graph is interrupted", async () => {
      (service as any)._graphStatus = 'interrupted';
      mockLessonGraph.streamEvents.mockResolvedValue(asyncIterable([]));
      const exerciseResult: ExerciseResult = {
        correct: [true, false],
        selectedNotes: [{ note: 'C', string: 1, fret: 0 }],
        correctCount: 1,
        incorrectCount: 1,
      };

      await service.resumeWithExerciseResult(exerciseResult);

      expect(mockLessonGraph.streamEvents).toHaveBeenCalled();
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

      // Mock the lesson graph streamEvents to return empty (avoid real LLM)
      mockLessonGraph.streamEvents.mockResolvedValue(asyncIterable([]));

      await service.startLesson('test');

      expect((service as any)._lessonMode).toBe(true);
    });
  });
});