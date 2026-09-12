import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../chat/services/chat.service';

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'OpenRouter' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenRouter' },
  { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', provider: 'OpenRouter' },
  { id: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'OpenRouter' },
];

const API_KEY_STORAGE_KEY = 'modelApiKey';
const MODEL_STORAGE_KEY = 'modelName';

function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may not be available (SSR, test environment)
  }
}

@Component({
  selector: 'app-landing-page',
  imports: [FormsModule],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private router = inject(Router);
  private chatService = inject(ChatService);

  readonly models = MODEL_OPTIONS;

  apiKey = signal(getStorageItem(API_KEY_STORAGE_KEY) ?? '');
  selectedModel = signal(getStorageItem(MODEL_STORAGE_KEY) ?? MODEL_OPTIONS[0].id);
  saved = signal(!!getStorageItem(API_KEY_STORAGE_KEY));

  saveAndGo(): void {
    const key = this.apiKey().trim();
    const model = this.selectedModel();

    if (!key) return;

    setStorageItem(API_KEY_STORAGE_KEY, key);
    setStorageItem(MODEL_STORAGE_KEY, model);
    this.saved.set(true);

    // Clear cached agent so next chat uses the new key/model
    this.chatService.resetAgent();

    this.router.navigate(['/app']);
  }

  skipSetup(): void {
    this.router.navigate(['/app']);
  }
}