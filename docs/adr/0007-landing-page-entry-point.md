# ADR 0007: Landing Page as Application Entry Point

## Status

Accepted

## Context

The application currently loads directly into the main fretboard UI at route `/`. The API key for AI chat is collected via `window.prompt()` inside `ChatService` when the user first tries to use the AI feature. This creates a poor first-time experience:

1. No explanation of what the application does before showing the full UI
2. API key collection is intrusive (window.prompt) and happens at an unexpected moment
3. No way to select which AI model/provider to use
4. No way to change the API key without clearing localStorage or using devtools

We need a proper entry point that:
- Introduces the application with a hero section
- Provides a form to configure API key and select AI model/provider
- Redirects returning users directly to the app
- Does not require a database

## Decision

We will introduce a **Landing Page** at route `/` and move the main application to route `/app`.

### Architecture

```
/          → LandingPageComponent  (hero + setup form)
/app       → AppPageComponent      (main fretboard UI, renamed from HomePageComponent)
```

### Key Design Decisions

1. **Separate routes, not a guard**: The landing page is a real route, not just a guard that redirects. This allows the user to return to `/` (e.g., via logo click) to change their configuration.

2. **localStorage, not a database**: API key and model selection are stored in `localStorage` under keys `modelApiKey` and `modelName`. No backend or database is needed at this stage.

3. **Header at AppComponent level**: The header (`app-header`) is moved from `AppPageComponent` to `AppComponent`, above `<router-outlet>`. This makes it visible on both the landing page and the app page. The logo becomes a link to `/`.

4. **Conditional header content**: On the landing page, the header shows only the brand logo (no AI toggle, no help button). On the app page, all header actions are visible.

5. **Adapter selection**: Four AI providers are offered: OpenRouter (DeepSeek V4 Flash), OpenAI (GPT-4o Mini), Anthropic (Claude Haiku), Google (Gemini Flash). The selection is stored as a string key and used by `ChatService` to instantiate the correct LangChain model class.

6. **Simple switch in ChatService**: The model selection logic in `ChatService.getOrCreateAgent()` uses a switch statement on the stored `modelName`. This can be refactored to a strategy pattern later.

### Consequences

**Positive:**
- Clear first-time user experience with explanation and guided setup
- API key collection happens at a predictable, intentional moment
- Users can change their key/model by clicking the logo to return to landing
- No backend dependency
- Returning users skip the landing page entirely

**Negative:**
- Additional route complexity (two routes instead of one)
- Header must be conditionally rendered (different actions on landing vs app)
- `HomePageComponent` must be renamed to `AppPageComponent`, affecting imports and tests
- `ChatService` needs to be updated to handle multiple model providers

**Risks:**
- If localStorage is cleared, the user is sent back to the landing page — this is acceptable behavior
- The model switch in ChatService is a temporary solution; if more providers are added, a strategy pattern will be needed

## Alternatives Considered

1. **Guard-based redirect**: A route guard that checks localStorage and redirects to a setup page. Rejected because it prevents returning to settings via logo click.

2. **Modal on first visit**: Keep the current flow but improve the popup. Rejected because it doesn't provide a proper introduction to the application.

3. **Query parameters**: Pass key and model via URL query params. Rejected because it's less secure (URL logging) and doesn't persist across sessions.

4. **Backend with database**: Store user config on a server. Rejected because it adds infrastructure complexity that is not yet justified.

## Related

- ADR 0005: Domain Contract Toolbox AI — established the command/query pattern that the AI chat uses
- ADR 0006: AI Mode Separate from Domain State — established aiModeEnabled as orthogonal to mode