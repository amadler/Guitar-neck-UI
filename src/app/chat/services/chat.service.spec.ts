import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatService } from "./chat.service";
import { DomainService } from "../../domain/domain.service";

describe("ChatService", () => {
  let service: ChatService;
  let mockDomainService: { execute: ReturnType<typeof vi.fn> };
  let mockAgent: { invoke: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDomainService = {
      execute: vi.fn().mockReturnValue({ success: true, action: "test", message: "ok" }),
    };
    mockAgent = {
      invoke: vi.fn(),
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
      const initialThreadId = (service as any).threadId;
      service.messages.set([{ role: "user", text: "hello" }]);

      service.reset();

      expect(service.messages()).toEqual([]);
      expect((service as any).threadId).not.toBe(initialThreadId);
    });
  });

  describe("send", () => {
    it("should set loading to true at start and false at end", async () => {
      mockAgent.invoke.mockResolvedValue({
        messages: [new HumanMessage("hello"), new AIMessage("Hello! I can help.")],
      });

      const sendPromise = service.send("hello");

      expect(service.loading()).toBe(true);

      await sendPromise;

      expect(service.loading()).toBe(false);
    });

    it("should add user message and assistant response on success", async () => {
      mockAgent.invoke.mockResolvedValue({
        messages: [new HumanMessage("hello"), new AIMessage("C-dur to skala: C, D, E, F, G, A, B.")],
      });

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({
        role: "assistant",
        text: "C-dur to skala: C, D, E, F, G, A, B.",
      });
    });

    it("should add error message when agent.invoke throws", async () => {
      mockAgent.invoke.mockRejectedValue(new Error("Ollama not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({
        role: "assistant",
        text: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
      });
    });

    it("should preserve existing messages when error occurs", async () => {
      // Seed some existing messages
      service.messages.set([{ role: "assistant", text: "Witaj!" }]);
      mockAgent.invoke.mockRejectedValue(new Error("Ollama not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(3);
      expect(service.messages()[0]).toMatchObject({ role: "assistant", text: "Witaj!" });
      expect(service.messages()[1]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[2]).toMatchObject({
        role: "assistant",
        text: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
      });
    });
  
    describe("missing API key", () => {
      it("should show error when window.modelApiKey is not set", async () => {
        // Clear any pre-set _agent so getOrCreateAgent() runs from scratch
        (service as any)._agent = null;
        // Ensure no key is on the window
        const originalKey = window.modelApiKey;
        (window as any).modelApiKey = undefined;
  
        await service.send("hello");
  
        expect(service.messages()).toHaveLength(2);
        expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
        expect(service.messages()[1]).toMatchObject({
          role: "assistant",
          text: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
        });
  
        // Restore
        (window as any).modelApiKey = originalKey;
      });
    });
  });
});