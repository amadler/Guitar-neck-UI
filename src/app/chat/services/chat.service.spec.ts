import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatService } from "./chat.service";
import { DomainService } from "../../domain/domain.service";

/**
 * Helper: create an async iterable from an array.
 * Used to mock the streamEvents return value.
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

describe("ChatService", () => {
  let service: ChatService;
  let mockDomainService: { execute: ReturnType<typeof vi.fn> };
  let mockAgent: { streamEvents: ReturnType<typeof vi.fn> };

  beforeEach(() => {
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

  describe("reset", () => {
    it("should clear messages and generate a new threadId", () => {
      const initialConfig = { ...(service as any).config };
      service.messages.set([{ role: "user", text: "hello" }]);

      service.reset();

      expect(service.messages()).toEqual([]);
      expect((service as any).config.configurable.thread_id).not.toBe(initialConfig.configurable.thread_id);
    });
  });

  describe("send", () => {
    it("should set loading to true at start and false at end", async () => {
      // Mock streamEvents to return empty streams (no messages, no tool calls)
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

    it("should propagate error when agent.streamEvents throws", async () => {
      mockAgent.streamEvents.mockRejectedValue(new Error("Ollama not available"));

      await expect(service.send("hello")).rejects.toThrow("Ollama not available");

      // Messages should still be added before the error
      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({ role: "assistant", text: "", streaming: true });
    });

    it("should propagate error and preserve existing messages", async () => {
      // Seed some existing messages
      service.messages.set([{ role: "assistant", text: "Witaj!" }]);
      mockAgent.streamEvents.mockRejectedValue(new Error("Ollama not available"));

      await expect(service.send("hello")).rejects.toThrow("Ollama not available");

      // Existing messages preserved, new ones added before error
      expect(service.messages()).toHaveLength(3);
      expect(service.messages()[0]).toMatchObject({ role: "assistant", text: "Witaj!" });
      expect(service.messages()[1]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[2]).toMatchObject({ role: "assistant", text: "", streaming: true });
    });
  
    describe("missing API key", () => {
      it("should propagate error when no API key is available", async () => {
        // Clear any pre-set _agent so getOrCreateAgent() runs from scratch
        (service as any)._agent = null;
        // Mock localStorage to return null (no key) — Vitest Node env may not have localStorage
        const getItemSpy = vi.spyOn(globalThis, 'localStorage' as any, 'get').mockReturnValue({
          getItem: vi.fn().mockReturnValue(null),
        });
  
        await expect(service.send("hello")).rejects.toThrow("Brak klucza API");
  
        getItemSpy.mockRestore();
      });
    });
  });
});