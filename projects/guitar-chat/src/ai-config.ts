import { environment } from './environments/environment';

export interface AIConfig {
  apiKey: string;
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export const aiConfig: AIConfig = {
  apiKey: environment.geminiApiKey,
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 500  // Zwiększamy limit tokenów
};
