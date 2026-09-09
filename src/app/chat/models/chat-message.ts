export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  /** True while the assistant response is still being streamed. */
  streaming?: boolean;
  /** Model's internal reasoning (chain-of-thought), shown as a separate block. */
  reasoning?: string;
}