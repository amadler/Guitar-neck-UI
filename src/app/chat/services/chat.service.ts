import { Injectable, inject, signal } from "@angular/core";
import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createDomainTools } from "../tools/domain-tools";
import { DomainService } from "../../domain/domain.service";
import { ChatMessage } from "../models";

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private threadId = crypto.randomUUID();

  private agent = createAgent({
    model: new ChatOllama({
      model: "qwen3:8b",
      temperature: 0.7,
    }),
    tools: createDomainTools(this.domainService),
    checkpointer: new MemorySaver(),
    systemPrompt:
      "Jesteś pomocnym asystentem gitarzysty. Mów po polsku, krótko i rzeczowo. " +
      "Gdy użytkownik poprosi o pokazanie skali lub akordu na gryfie, użyj narzędzia show_pattern. " +
      "Gdy zapyta o interwał, użyj show_interval. " +
      "Gdy poprosi o wyczyszczenie widoku, użyj clear_view. " +
      "Po wykonaniu narzędzia powiedz użytkownikowi co zostało pokazane.",
  });

  async send(userMessage: string): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);

    this.messages.update((m) => [...m, { role: "user", text: userMessage }]);

    try {
      const result = await this.agent.invoke(
        { messages: [new HumanMessage(userMessage)] },
        { configurable: { thread_id: this.threadId } }
      );

      const lastAssistantMessage = [...result.messages]
        .reverse()
        .find((m) => m instanceof AIMessage && m.content);
      if (lastAssistantMessage) {
        this.messages.update((m) => [
          ...m,
          { role: "assistant", text: lastAssistantMessage.content as string },
        ]);
      }
    } catch (err) {
      this.messages.update((m) => [
        ...m,
        { role: "assistant", text: "Przepraszam, wystąpił błąd. Spróbuj ponownie." },
      ]);
      console.error("ChatService error:", err);
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.threadId = crypto.randomUUID();
    this.messages.set([]);
  }
}