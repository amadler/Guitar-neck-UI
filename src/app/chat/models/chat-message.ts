export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  /** True while the assistant response is still being streamed. */
  streaming?: boolean;
}