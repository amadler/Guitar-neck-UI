export {};

declare global {
  interface Window {
    /** API key for the AI chat model. Set via devtools console: window.modelApiKey = 'your-key' */
    modelApiKey?: string;
  }
}