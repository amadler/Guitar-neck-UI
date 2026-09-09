import { Injectable, inject, signal } from "@angular/core";
import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage } from "@langchain/core/messages";
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
      temperature: 0.1,
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

    // Placeholder for the streaming assistant response
    this.messages.update((m) => [...m, { role: "assistant", text: "", streaming: true }]);

    try {
      const stream = await this.agent.stream(
        { messages: [new HumanMessage(userMessage)] },
        { configurable: { thread_id: this.threadId } }
      );

      for await (const event of stream) {
        // LangGraph stream events: on_chat_model_stream yields token chunks
        // Use bracket access for index-signature typed events
        const ev = event as Record<string, unknown>;
        if (ev['event'] === 'on_chat_model_stream') {
          const data = ev['data'] as Record<string, unknown> | undefined;
          const chunk = data?.['chunk'] as { content?: string } | undefined;
          if (chunk?.content) {
            const token = chunk.content;
            if (token) {
              this.messages.update((m) => {
                const msgs = [...m];
                const last = msgs[msgs.length - 1];
                if (last?.streaming) {
                  msgs[msgs.length - 1] = { ...last, text: last.text + token };
                }
                return msgs;
              });
            }
          }
        }
      }

      // Mark streaming as complete
      this.messages.update((m) => {
        const msgs = [...m];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, streaming: false };
        }
        return msgs;
      });
    } catch (err) {
      // Remove streaming placeholder, add error message
      this.messages.update((m) => {
        const withoutStreaming = m.filter(msg => !msg.streaming);
        return [...withoutStreaming, { role: "assistant", text: "Przepraszam, wystąpił błąd. Spróbuj ponownie." }];
      });
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