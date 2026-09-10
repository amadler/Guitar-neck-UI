import { Injectable, inject, signal } from "@angular/core";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { HumanMessage } from '@langchain/core/messages';
import { createDomainTools } from "../tools/domain-tools";
import { DomainService } from "../../domain/domain.service";
import { ChatOpenRouter } from '@langchain/openrouter';
import { ChatMessage } from "../models";

@Injectable({ providedIn: "root" })
export class ChatService {
  private domainService = inject(DomainService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);

  private config = { configurable: { thread_id: crypto.randomUUID() } };

  private _agent: ReturnType<typeof createAgent> | null = null;

  private getOrCreateAgent(): ReturnType<typeof createAgent> {
    if (!this._agent) {

      const apiKey = localStorage.getItem('modelApiKey') || window.prompt('Podaj klucz API do modelu AI deepseek-v4-flash');
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
    this.messages.update(m => [...m, { role: 'user', text: userMessage }]);
    this.messages.update(m => [...m, { role: 'assistant', text: '', streaming: true }]);

    const stream = await this.getOrCreateAgent().streamEvents(
      {
        messages: [
          new HumanMessage(userMessage),
        ],
      },
      { ...this.config, version: "v3" },
    );

    await Promise.all([
      (async () => {
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
        for await (const call of stream.toolCalls) {
          this.messages.update(m => {
            const msgs = [...m];
            const last = msgs[msgs.length - 1];
            if (last?.streaming) {
              msgs[msgs.length - 1] = { ...last, text: `🔧 Używam narzędzia: ${call.name}...` };
            }
            return msgs;
          });
          const result = await call.output;
          this.loading.set(false);
        }
      })(),
    ]);

    this.messages.update(m => {
      const msgs = [...m];
      const last = msgs[msgs.length - 1];
      if (last?.streaming) {
        msgs[msgs.length - 1] = { ...last, streaming: false };
      }
      this.loading.set(false);
      return msgs;
    });
  }
}
