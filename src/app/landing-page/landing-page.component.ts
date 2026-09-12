import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-landing-page',
  imports: [FormsModule],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private router = inject(Router);

  readonly models = MODEL_OPTIONS;

  apiKey = signal(localStorage.getItem(API_KEY_STORAGE_KEY) ?? '');
  selectedModel = signal(localStorage.getItem(MODEL_STORAGE_KEY) ?? MODEL_OPTIONS[0].id);
  saved = signal(!!localStorage.getItem(API_KEY_STORAGE_KEY));

  saveAndGo(): void {
    const key = this.apiKey().trim();
    const model = this.selectedModel();

    if (!key) return;

    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
    this.saved.set(true);

    this.router.navigate(['/app']);
  }

  skipSetup(): void {
    this.router.navigate(['/app']);
  }
}