import { Injectable, inject, signal } from "@angular/core";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage } from "@langchain/core/messages";
import { createDomainTools } from "../tools/domain-tools";
import { DomainService } from "../../domain/domain.service";
import { ChatMessage } from "../models";
import { ChatOpenRouter } from '@langchain/openrouter';

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private threadId = crypto.randomUUID();

  private _agent: ReturnType<typeof createAgent> | null = null;

  private getOrCreateAgent(): ReturnType<typeof createAgent> {
    if (!this._agent) {

      const apiKey = sessionStorage.getItem('modelApiKey') || window.prompt('Podaj klucz API do modelu AI deepseek-v4-flash');
      if (!apiKey) {
        throw new Error(
          "Brak klucza API. Ustaw go w konsoli devtools: window.modelApiKey = 'twój-klucz'"
        );
      }
      this._agent = createAgent({
        model: new ChatOpenRouter({ model: "deepseek/deepseek-v4-flash", apiKey }),
        tools: createDomainTools(this.domainService),
        checkpointer: new MemorySaver(),
        systemPrompt:
          "Jesteś pomocnym asystentem gitarzysty. Mów po polsku, krótko i rzeczowo. " +
          "Gdy użytkownik poprosi o pokazanie skali lub akordu na gryfie, użyj narzędzia show_pattern. " +
          "Gdy zapyta o interwał, użyj show_interval. " +
          "Gdy poprosi o wyczyszczenie widoku, użyj clear_view. " +
          "Po wykonaniu narzędzia powiedz użytkownikowi co zostało pokazane.",
      });
    }
    return this._agent;
  }


  async send(userMessage: string): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);

    this.messages.update((m) => [...m, { role: "user", text: userMessage }]);

    // Placeholder for the streaming assistant response
    this.messages.update((m) => [...m, { role: "assistant", text: "", streaming: true }]);

    try {
      const stream = await this.getOrCreateAgent().stream(
        { messages: [new HumanMessage(userMessage)] },
        { configurable: { thread_id: this.threadId } }
      );

      let hasTokens = false;

      for await (const event of stream) {
        const ev = event as Record<string, unknown>;
        const keys = Object.keys(ev);
        console.log('[ChatService] stream event keys:', keys);

        for (const key of keys) {
          const nodeOutput = ev[key] as Record<string, unknown> | undefined;
          if (!nodeOutput) continue;

          const messages = nodeOutput['messages'] as Array<Record<string, unknown>> | undefined;
          if (!messages || messages.length === 0) continue;

          for (const msg of messages) {
            // Message structure (from logs): { content, additional_kwargs, type: 'ai', ... }
            // content and additional_kwargs are directly on the object, NOT inside kwargs
            const content = msg['content'] as string | undefined;
            const additionalKwargs = msg['additional_kwargs'] as Record<string, unknown> | undefined;
            const reasoningContent = additionalKwargs?.['reasoning_content'] as string | undefined;

            if (typeof content === 'string' && content) {
              hasTokens = true;
              this.messages.update((m) => {
                const msgs = [...m];
                const last = msgs[msgs.length - 1];
                if (last?.streaming) {
                  msgs[msgs.length - 1] = {
                    ...last,
                    text: content,
                    reasoning: reasoningContent || last.reasoning,
                    streaming: false,
                  };
                }
                return msgs;
              });
            }
          }
        }
      }

      // If no tokens were streamed, try to extract final message from agent state
      if (!hasTokens) {
        console.log('[ChatService] no tokens streamed, trying fallback extraction');
        const state = await (this.getOrCreateAgent() as any).getState({ configurable: { thread_id: this.threadId } });
        console.log('[ChatService] agent state:', state);
        const messages = (state as any)?.values?.messages as Array<Record<string, unknown>> | undefined;
        if (messages) {
          // Find last AI message — messages are LangChain objects with type: 'ai'
          const lastAi = [...messages].reverse().find((m: any) => m.type === 'ai' || m._type === 'ai');
          if (lastAi) {
            const content = (lastAi as any)['content'] as string | undefined;
            const additionalKwargs = (lastAi as any)['additional_kwargs'] as Record<string, unknown> | undefined;
            const reasoningContent = additionalKwargs?.['reasoning_content'] as string | undefined;
            if (typeof content === 'string' && content) {
              this.messages.update((m) => {
                const msgs = [...m];
                const last = msgs[msgs.length - 1];
                if (last?.streaming) {
                  msgs[msgs.length - 1] = {
                    ...last,
                    text: content,
                    reasoning: reasoningContent || last.reasoning,
                    streaming: false,
                  };
                }
                return msgs;
              });
            }
          }
        }
      }

      // Mark streaming as complete (if still streaming)
      this.messages.update((m) => {
        const msgs = [...m];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, streaming: false };
        }
        return msgs;
      });
    } catch (err) {
      console.error('[ChatService] error:', err);
      // Remove streaming placeholder, add error message
      this.messages.update((m) => {
        const withoutStreaming = m.filter(msg => !msg.streaming);
        return [...withoutStreaming, { role: "assistant", text: "Przepraszam, wystąpił błąd. Spróbuj ponownie." }];
      });
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.threadId = crypto.randomUUID();
    this.messages.set([]);
  }
}
