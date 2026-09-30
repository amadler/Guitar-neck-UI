import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { DomainCommand } from '../domain/commands';
import { DomainState } from '../domain/state';

export type AgentEvent =
  | { type: 'token'; text: string }
  | { type: 'domain-command'; command: DomainCommand }
  | { type: 'interrupt'; waitingForUser: boolean }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface ChatBody {
  type: 'message' | 'resume';
  threadId: string;
  text: string;
  domainState?: DomainState;
  lessonMode: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private baseUrl = environment.apiUrl;

  async send(
    body: ChatBody,
    onEvent: (event: AgentEvent) => void,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        onEvent(JSON.parse(line) as AgentEvent);
      }
    }
  }
}