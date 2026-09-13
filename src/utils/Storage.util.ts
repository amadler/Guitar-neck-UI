import { Injectable, signal } from "@angular/core";

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  public MODEL_STORAGE_KEY = 'modelName';
  public API_KEY_STORAGE_KEY = 'modelApiKey';
  public MODEL_OPTIONS: ModelOption[] = [
    { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', provider: 'OpenRouter' },
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenRouter' },
    { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', provider: 'OpenRouter' },
    { id: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'OpenRouter' },
  ];

  getStorageItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setStorageItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage may not be available (SSR, test environment)
    }
  }
  saveConfig(apiKey: string, model: string): void {
    this.setStorageItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.setStorageItem(this.MODEL_STORAGE_KEY, model);
    this.apiKey.set(apiKey);
    this.selectedModel.set(model);
    this.saved.set(true);
  }

  readonly apiKey = signal(this.getStorageItem(this.API_KEY_STORAGE_KEY) ?? '');
  readonly selectedModel = signal(this.getStorageItem(this.MODEL_STORAGE_KEY) ?? this.MODEL_OPTIONS[0].id);
  readonly saved = signal(false);

  readonly models = this.MODEL_OPTIONS;
}
