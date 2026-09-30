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

export interface UserResponse {
  user: { id: string; email: string };
}

export interface CredentialsStatus {
  configured: boolean;
}

export interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  startedAt?: string;
  completedAt?: string;
  data?: Record<string, unknown>;
}

export interface ExerciseResult {
  lessonId: string;
  exerciseId: string;
  result: Record<string, unknown>;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private baseUrl = environment.apiUrl;

  // ─── Chat ────────────────────────────────────────────────────────────

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

  // ─── Auth ────────────────────────────────────────────────────────────

  async register(email: string, password: string): Promise<UserResponse> {
    const res = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async login(email: string, password: string): Promise<UserResponse> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  async getMe(): Promise<UserResponse | null> {
    const res = await fetch(`${this.baseUrl}/api/me`, {
      credentials: 'include',
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // ─── Credentials ─────────────────────────────────────────────────────

  async saveOpenRouterKey(apiKey: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/credentials/openrouter`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async getOpenRouterStatus(): Promise<CredentialsStatus> {
    const res = await fetch(`${this.baseUrl}/api/credentials/openrouter/status`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async deleteOpenRouterKey(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/credentials/openrouter`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
  }

  // ─── Progress ────────────────────────────────────────────────────────

  async getProgress(): Promise<{ progress: LessonProgress[] }> {
    const res = await fetch(`${this.baseUrl}/api/progress`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async getLessonProgress(lessonId: string): Promise<{ progress: LessonProgress }> {
    const res = await fetch(`${this.baseUrl}/api/progress/${lessonId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async updateLessonProgress(
    lessonId: string,
    data: { status?: string; currentStep?: number; data?: Record<string, unknown> },
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/progress/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async saveExerciseResult(
    lessonId: string,
    exerciseId: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/progress/exercises/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ lessonId, exerciseId, result }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async getExerciseHistory(limit = 50): Promise<{ history: ExerciseResult[] }> {
    const res = await fetch(`${this.baseUrl}/api/progress/exercises/history?limit=${limit}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}