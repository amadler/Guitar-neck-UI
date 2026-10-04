import { DomainCommand } from "../../domain/commands";

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  /** True while the assistant response is still being streamed. */
  streaming?: boolean;
  /** Model's internal reasoning (chain-of-thought), shown as a separate block. */
  reasoning?: string;
  /** Domain commands executed as part of this message — clickable history chips. */
  domainCommands?: Array<{ command: DomainCommand; label: string }>;
}