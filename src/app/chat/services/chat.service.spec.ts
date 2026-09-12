import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatService } from "./chat.service";
import { DomainService } from "../../domain/domain.service";

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
  let mockDomainService: { execute: ReturnType<typeof vi.fn> };
  let mockAgent: { streamEvents: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ensureLocalStorage();
    globalThis.localStorage.setItem('modelApiKey', 'sk-test-key');
    globalThis.localStorage.setItem('modelName', 'deepseek/deepseek-v4-flash');

    mockDomainService = {
      execute: vi.fn().mockReturnValue({ success: true, action: "test", message: "ok" }),
    };
    mockAgent = {
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
  });

  afterEach(() => {
    globalThis.localStorage.clear();
  });

  describe("reset", () => {
    it("should clear messages and generate a new threadId", () => {
      const initialConfig = { ...(service as any).config };
      service.messages.set([{ role: "user", text: "hello" }]);

      service.reset();

      expect(service.messages()).toEqual([]);
      expect((service as any).config.configurable.thread_id).not.toBe(initialConfig.configurable.thread_id);
    });
  });

  describe("resetAgent", () => {
    it("should clear cached agent and reset thread", () => {
      (service as any)._agent = mockAgent;
      const oldConfig = { ...(service as any).config };

      service.resetAgent();

      expect((service as any)._agent).toBeNull();
      expect((service as any).config.configurable.thread_id).not.toBe(oldConfig.configurable.thread_id);
    });
  });

  describe("send", () => {
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
});