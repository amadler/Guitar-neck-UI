import { Injectable } from '@angular/core';
import { DomainCommand } from '../domain/commands';
import { DomainState } from '../domain/state';


export type AgentEvent =
  | { type: 'token'; text: string }
  | { type: 'domain-command'; command: DomainCommand }
  | { type: 'interrupt'; waitingForUser: boolean }
  | { type: 'error'; message: string }
  | { type: 'done' };

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  async send(
    body: {
      type: 'message' | 'resume';
      threadId: string;
      text: string;
      domainState: DomainState;
      lessonMode: boolean;
    },
    onEvent: (event: AgentEvent) => void,
  ): Promise<void> {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
