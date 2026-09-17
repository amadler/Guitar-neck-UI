import { Injectable, inject } from "@angular/core";
import { DomainService } from "../../domain/domain.service";
import type { DomainCommand } from "../../domain/commands";

/**
 * Event types received from the Node agent via NDJSON streaming.
 */
export interface AgentStreamEvent {
  type: 'token' | 'domain-command' | 'interrupt' | 'error' | 'done';
  text?: string;
  command?: DomainCommand;
  waitingForUser?: boolean;
  message?: string;
}

/**
 * Callbacks for processing stream events.
 */
export interface StreamCallbacks {
  onToken?: (text: string) => void;
  onDomainCommand?: (command: DomainCommand) => void;
  onInterrupt?: () => void;
  onError?: (message: string) => void;
  onDone?: () => void;
}

/**
 * AgentApiService — handles HTTP communication with the guitar-neck-agent Node backend.
 *
 * Sends messages via POST /api/chat and reads the NDJSON stream response.
 * DomainCommand events are executed locally via DomainService.
 */
@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private domainService = inject(DomainService);

  /**
   * The base URL of the agent API.
   * Configured via environment or defaults to localhost:3001 for development.
   */
  private get apiBaseUrl(): string {
    return (window as any).__AGENT_API_URL__ ?? 'http://localhost:3001';
  }

  /**
   * Send a message to the agent and process the streaming response.
   *
   * @param threadId - The conversation thread ID.
   * @param text - The message text.
   * @param domainState - Current DomainState snapshot (request-scoped).
   * @param callbacks - Event callbacks for the stream.
   * @param type - 'message' for new messages, 'resume' for resuming after interrupt.
   */
  async sendMessage(
    threadId: string,
    text: string,
    domainState: unknown,
    callbacks: StreamCallbacks,
    type: 'message' | 'resume' = 'message',
  ): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        threadId,
        text,
        domainState,
      }),
    });

    if (!response.ok) {
      callbacks.onError?.(`HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          let event: AgentStreamEvent;
          try {
            event = JSON.parse(line);
          } catch {
            // Skip malformed lines
            continue;
          }

          switch (event.type) {
            case 'token':
              callbacks.onToken?.(event.text ?? '');
              break;

            case 'domain-command':
              if (event.command) {
                // Execute the command locally via DomainService
                this.domainService.execute(event.command);
                callbacks.onDomainCommand?.(event.command);
              }
              break;

            case 'interrupt':
              if (event.waitingForUser) {
                callbacks.onInterrupt?.();
              }
              break;

            case 'error':
              callbacks.onError?.(event.message ?? 'Unknown error');
              break;

            case 'done':
              callbacks.onDone?.();
              break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}