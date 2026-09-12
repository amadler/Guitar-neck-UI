# ADR 0007: Landing Page as Application Entry Point

## Status

Accepted

## Context

The application previously loaded directly into the main fretboard UI at route `/`. The API key for AI chat was collected via `window.prompt()` inside `ChatService` when the user first tried to use the AI feature. This created a poor first-time experience:

1. No explanation of what the application does before showing the full UI
2. API key collection is intrusive (window.prompt) and happens at an unexpected moment
3. No way to select which AI model to use
4. No way to change the API key without clearing localStorage or using devtools

We need a proper entry point that:
- Introduces the application with a hero section
- Provides a form to configure API key and select AI model
- Allows returning users to change their configuration via the logo link
- Does not require a database

## Decision

We will introduce a **Landing Page** at route `/` and move the main application to route `/app`.

### Architecture

```
/          → LandingPageComponent  (hero + setup form)
/app       → AppPageComponent      (main fretboard UI, renamed from HomePageComponent)
```

### Key Design Decisions

1. **Separate routes, not a guard**: The landing page is a real route, not a guard that redirects. This allows the user to return to `/` (e.g., via logo click) to change their configuration. There is **no auto-redirect** — the landing page is a settings page, not a one-time setup wizard.

2. **localStorage, not a database**: API key and model selection are stored in `localStorage` under keys `modelApiKey` and `modelName`. No backend or database is needed at this stage.

3. **Header at AppComponent level**: The header (`app-header`) is moved from `AppPageComponent` to `AppComponent`, above `<router-outlet>`. This makes it visible on both the landing page and the app page. The logo becomes a link to `/`.

4. **Conditional header content**: On the landing page, the header shows only the brand logo (no AI toggle, no help button). On the app page, all header actions are visible. The help modal only opens automatically on the app page, not on landing.

5. **Single provider (OpenRouter)**: All four model options (DeepSeek V4 Flash, GPT-4o Mini, Claude 3 Haiku, Gemini 2.0 Flash) are served through OpenRouter's API. `ChatService` uses `ChatOpenRouter` for all models, passing the model name as a parameter. This avoids adding separate LangChain provider packages (ChatOpenAI, ChatAnthropic, ChatGoogleGenerativeAI) at this stage.

6. **Agent rebuild on config change**: When the user saves new configuration on the landing page, `ChatService.resetAgent()` is called to clear the cached LangChain agent. The next `send()` call rebuilds the agent with the new key/model. This ensures configuration changes take effect immediately.

7. **Graceful error handling**: `ChatService.send()` wraps agent creation and streaming in a try/catch/finally block. If the API key is missing or the agent fails to initialize, an error message is shown in the chat and `loading` is reset to `false`.

### Consequences

**Positive:**
- Clear first-time user experience with explanation and guided setup
- API key collection happens at a predictable, intentional moment
- Users can change their key/model by clicking the logo to return to landing
- No backend dependency
- Configuration changes take effect immediately via `resetAgent()`
- Chat errors are handled gracefully without leaving the UI in a broken state

**Negative:**
- Additional route complexity (two routes instead of one)
- Header must be conditionally rendered (different actions on landing vs app)
- `HomePageComponent` must be renamed to `AppPageComponent`, affecting imports and tests
- All models go through OpenRouter — native provider SDKs are not used

**Risks:**
- If localStorage is cleared, the user sees the landing page on next visit to `/` — there is no automatic redirect from `/app`
- OpenRouter-only approach means all models depend on OpenRouter availability; if OpenRouter is down, no models work
- If more providers are needed later, `ChatService` will need to support multiple LangChain model classes

## Alternatives Considered

1. **Guard-based redirect**: A route guard that checks localStorage and redirects to a setup page. Rejected because it prevents returning to settings via logo click.

2. **Auto-redirect on landing**: Redirect returning users from `/` to `/app` automatically. Rejected because it conflicts with the logo-as-settings-link pattern — the logo would lead to a page that immediately redirects away.

3. **Modal on first visit**: Keep the current flow but improve the popup. Rejected because it doesn't provide a proper introduction to the application.

4. **Query parameters**: Pass key and model via URL query params. Rejected because it's less secure (URL logging) and doesn't persist across sessions.

5. **Backend with database**: Store user config on a server. Rejected because it adds infrastructure complexity that is not yet justified.

6. **Multiple provider SDKs**: Use separate LangChain packages for each provider (ChatOpenAI, ChatAnthropic, etc.). Rejected for now to keep dependencies minimal — all models are available through OpenRouter.

## Related

- ADR 0005: Domain Contract Toolbox AI — established the command/query pattern that the AI chat uses
- ADR 0006: AI Mode Separate from Domain State — established aiModeEnabled as orthogonal to mode