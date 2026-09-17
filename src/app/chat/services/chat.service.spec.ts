import { TestBed } from "@angular/core/testing";
import { ChatService } from "./chat.service";
import { DomainService } from "../../domain/domain.service";
import { AgentApiService } from "./agent-api.service";
import { DEFAULT_DOMAIN_STATE } from "../../domain/state";

describe("ChatService (remote agent mode)", () => {
  let service: ChatService;
  let mockDomainService: { execute: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn>; currentState: ReturnType<typeof vi.fn> };
  let mockAgentApi: { sendMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDomainService = {
      execute: vi.fn().mockReturnValue({ success: true, action: "test", message: "ok" }),
      query: vi.fn().mockReturnValue({ success: true, data: {} }),
      currentState: vi.fn().mockReturnValue(DEFAULT_DOMAIN_STATE),
    };
    mockAgentApi = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: DomainService, useValue: mockDomainService },
        { provide: AgentApiService, useValue: mockAgentApi },
      ],
    });

    service = TestBed.inject(ChatService);
  });

  describe("reset", () => {
    it("should clear messages and generate a new threadId", () => {
      const initialThreadId = (service as any)._threadId;
      service.messages.set([{ role: "user", text: "hello" }]);

      service.reset();

      expect(service.messages()).toEqual([]);
      expect((service as any)._threadId).not.toBe(initialThreadId);
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

  describe("send", () => {
    it("should set loading to true at start and false at end", async () => {
      const sendPromise = service.send("hello");

      expect(service.loading()).toBe(true);

      await sendPromise;

      expect(service.loading()).toBe(false);
    });

    it("should add user message and assistant response on success", async () => {
      mockAgentApi.sendMessage.mockImplementation(
        (_threadId: string, _text: string, _state: any, callbacks: any) => {
          callbacks.onToken?.("C");
          callbacks.onToken?.("-dur");
          callbacks.onDone?.();
        }
      );

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({
        role: "assistant",
        text: "C-dur",
        streaming: false,
      });
    });

    it("should send DomainState snapshot with the request", async () => {
      await service.send("hello");

      expect(mockAgentApi.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        "hello",
        DEFAULT_DOMAIN_STATE,
        expect.any(Object),
        "message",
      );
    });

    it("should show error message in chat when agentApi throws", async () => {
      mockAgentApi.sendMessage.mockRejectedValue(new Error("Agent not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(2);
      expect(service.messages()[0]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[1]).toMatchObject({ role: "assistant", streaming: false });
      expect(service.messages()[1].text).toContain("❌");
      expect(service.messages()[1].text).toContain("Agent not available");
      expect(service.loading()).toBe(false);
    });

    it("should show error and preserve existing messages", async () => {
      service.messages.set([{ role: "assistant", text: "Witaj!" }]);
      mockAgentApi.sendMessage.mockRejectedValue(new Error("Agent not available"));

      await service.send("hello");

      expect(service.messages()).toHaveLength(3);
      expect(service.messages()[0]).toMatchObject({ role: "assistant", text: "Witaj!" });
      expect(service.messages()[1]).toMatchObject({ role: "user", text: "hello" });
      expect(service.messages()[2]).toMatchObject({ role: "assistant", streaming: false });
      expect(service.messages()[2].text).toContain("❌");
      expect(service.loading()).toBe(false);
    });

    it("should use resume type when _waitingForUser is true", async () => {
      (service as any)._waitingForUser = true;
      mockAgentApi.sendMessage.mockImplementation(
        (_threadId: string, _text: string, _state: any, callbacks: any, type: string) => {
          expect(type).toBe("resume");
          callbacks.onDone?.();
        }
      );

      await service.send("dalej");

      expect(service.messages()[0]).toMatchObject({ role: "user", text: "dalej" });
    });

    it("should use message type when _waitingForUser is false", async () => {
      (service as any)._waitingForUser = false;
      mockAgentApi.sendMessage.mockImplementation(
        (_threadId: string, _text: string, _state: any, callbacks: any, type: string) => {
          expect(type).toBe("message");
          callbacks.onDone?.();
        }
      );

      await service.send("hello");
    });
  });

  describe("startLesson", () => {
    it("should set _lessonMode to true", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test lesson content"),
      });

      const mockRegistry = {
        getLesson: vi.fn().mockReturnValue({ id: 'test', title: 'Test', description: '', level: 'podstawowy' }),
      };
      (service as any).lessonRegistry = mockRegistry;

      mockAgentApi.sendMessage.mockResolvedValue(undefined);

      await service.startLesson('test');

      expect((service as any)._lessonMode).toBe(true);
    });
  });

  describe("notifyExerciseSubmitted", () => {
    it("should send exercise notification to agent", async () => {
      await service.notifyExerciseSubmitted();

      expect(mockAgentApi.sendMessage).toHaveBeenCalled();
      const callArgs = mockAgentApi.sendMessage.mock.calls[0];
      expect(callArgs[1]).toContain("Sprawdź");
    });
  });
});