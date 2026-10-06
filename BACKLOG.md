# P12: FretboardStateService — Mutable state leak → Immutable FretboardSnapshot

**Źródło:** Architecture Review Candidate 1 (Mutable state leak) — [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)
**Plan implementacji:** [`plans/fretboard-state-immutable-refactor.md`](plans/fretboard-state-immutable-refactor.md)

## Motivation

Despite ADR 0005 mandating immutable state, `FretboardStateService` still holds a mutable `GuitarNote[]` array. Methods like `applyHighlightedNotes()`, `hideAllNotes()`, and `clearSelection()` mutate `note.visible`, `note.selected`, and `note.interval` **in-place**. The `GuitarNote` class itself has public mutable fields with no encapsulation.

**Deletion test:** If you deleted `FretboardStateService`, the complexity would *not* concentrate — it would scatter into `FretboardOrchestrationService` (which would need its own note state) and `FretboardDisplayService` (which would need its own derived state cache). The module is **shallow**: its interface (6 public methods) is nearly as complex as its implementation.

## Solution

Replace the mutable `GuitarNote[]` with an **immutable snapshot** pattern. Create a `FretboardSnapshot` value object that captures the complete rendering state (which notes are visible, selected, their intervals) at a point in time. `FretboardStateService` becomes a snapshot store — `currentSnapshot: signal<FretboardSnapshot>` — updated atomically. `GuitarNote` becomes an immutable data class (or interface). The orchestration pipeline produces a new snapshot instead of mutating existing objects.

### Kluczowe różnice względem poprzedniego planu (signal-based)

| Aspekt | Stary plan (signal) | Nowy plan (snapshot) |
|--------|---------------------|----------------------|
| Stan | `signal<GuitarNote[]>` + osobne signaly | `signal<FretboardSnapshot \| null>` — wszystko w jednym |
| `hasActiveResult` | Osobny signal | Część snapshotu |
| `notesMap` | Przebudowywana przy każdej zmianie | Zastąpiona przez `.find()` na snapshot.notes (~150 items) |
| Testowanie | Trzeba mockować signal + sprawdzać efekty uboczne | Asercja na równość snapshotów — czystsze |
| `markIntervals()` | Mutuje przez serwis | Zwraca `Map<string, string>` — czysta funkcja |

### Pliki do zmiany (~16)

| Plik | Zmiana |
|------|--------|
| `src/app/shared/model/fretboard-snapshot.ts` | **NOWY** — `FretboardSnapshot` + `FretboardNote` interfejsy |
| `src/app/shared/model/guitarNote.ts` | Klasa → immutable interface + `createGuitarNote()` factory |
| `src/app/services/fretboard-state.service.ts` | `notes: GuitarNote[]` → `currentSnapshot: signal<FretboardSnapshot \| null>` |
| `src/app/services/fretboard-orchestration.service.ts` | `markIntervals()` → `computeIntervals()` zwraca `Map`; `display*()` produkują snapshot |
| `src/app/services/fretboard-display.service.ts` | Czyta z `currentSnapshot()` zamiast `notes` |
| `src/app/services/fretboard-note-query.service.ts` | Czyta z `currentSnapshot()` zamiast `notes` |
| `src/app/services/marker-role.service.ts` | `notes: GuitarNote[]` → `readonly GuitarNote[]` |
| `src/app/services/note.service.ts` | `new GuitarNote()` → `createGuitarNote()` |
| `src/app/guitar-neck/guitar-neck.component.ts` | `service.notes = ...` → `service.initialize()` |
| `src/app/guitar-neck/guitar-neck.component.html` | Usunąć `[notes]` binding |
| `src/app/freatboard/freatboard.component.ts` | `notes` input → getter z `currentSnapshot()` |
| `src/app/freatboard/freatboard.component.html` | `notes()` → `notes` |
| `src/app/legend/legend.component.ts` | `hasActiveResult()` → `currentSnapshot()?.hasActiveResult` |
| Wszystkie `*.spec.ts` dla powyższych | Aktualizacja mocków i asercji |

## Kolejność implementacji

1. Stworzyć `FretboardSnapshot` type (nowy plik)
2. `GuitarNote` → immutable interface + factory
3. `FretboardStateService` → snapshot signal
4. `FretboardOrchestrationService` → produkuje snapshoty
5. `FretboardDisplayService` → czyta z snapshotu
6. `FretboardNoteQueryService` → czyta z snapshotu
7. `MarkerRoleService` → typ parametru
8. Komponenty → usunięcie bezpośrednich przypisań
9. Testy → aktualizacja

## MVP

- Wszystkie zmiany z powyższej tabeli wdrożone
- `npm run build` succeeds
- `npm test` succeeds (wszystkie testy związane z FretboardStateService przechodzą)
- Żaden kod poza `FretboardStateService` nie mutuje `GuitarNote` properties bezpośrednio
- `GuitarNote` jest immutable interface

## Done when

- `npm run build` succeeds
- `npm test` succeeds
- `FretboardStateService.currentSnapshot` jest `signal<FretboardSnapshot | null>()`
- `applyHighlightedNotes()` przyjmuje opcjonalny `intervalMap` i produkuje snapshot
- `computeIntervals()` w `FretboardOrchestrationService` jest czystą funkcją zwracającą `Map`
- Wszystkie komponenty czytają stan z `currentSnapshot()` zamiast `notes`
- Testy w `fretboard-state.service.spec.ts` używają snapshot API

## Status

DONE — zaimplementowane na branchu `refactor`, w pełni wdrożone w codebase.

---

# P13: FretboardOrchestrationService — Pipeline with no seam

**Źródło:** Architecture Review Candidate 2 — [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)

## Motivation

`FretboardOrchestrationService` is a 148-line module whose 5 public `display*()` methods are each a fixed pipeline of 4-5 service calls. The interface (`displayScale()`, `displayChord()`, `displayCustomPattern()`, `displayPositions()`, `displayScaleWithChord()`) is nearly as complex as the implementation — each method is a unique composition of the same underlying steps.

**Deletion test:** Deleting this module would force `DomainService` to call `TonalFacadeService`, `FretboardNotePositionService`, `FretboardStateService`, and `MarkerRoleService` directly — the complexity would just *move* into `DomainService`, not concentrate. The module is **shallow**.

There is also no **seam** for testing the pipeline in isolation. Tests must mock all 4 injected services, making them brittle and coupled to the implementation.

## Solution

Introduce a **pipeline abstraction** that separates the "what to display" from the "how to display it". Define a `DisplayIntent` value object that captures the musical concept (pattern + root + optional compare target) and a `FretboardRenderer` interface that turns an intent into a `FretboardSnapshot`. The orchestration service becomes a thin coordinator that selects the right renderer. This creates a **seam** at the renderer boundary — tests can provide a fake renderer and assert on the snapshot.

## Files involved

- `src/app/services/fretboard-orchestration.service.ts`
- `src/app/domain/domain.service.ts`
- `src/app/services/fretboard-display.service.ts`

## Status

OPEN

---

# P14: PatternBuilderService — Duplicated pattern resolution

**Źródło:** Architecture Review Candidate 3 — [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)

## Motivation

When `DomainService.handleShowPattern()` runs, it calls **both** `FretboardOrchestrationService.displayScale()` (which resolves the pattern via `TonalFacadeService.resolvePattern()`) **and** `PatternBuilderService.setCurrentPattern()` (which re-resolves the same pattern from `SCALE_PATTERNS`/`CHORD_PATTERNS` intervals). The same musical concept is resolved twice — once for rendering, once for metadata.

**Deletion test:** Deleting `PatternBuilderService` would concentrate its `currentPattern` and `relatedChord` signals into `DomainService` or `FretboardStateService`. The complexity would concentrate — a good sign. But the `PatternInfo` construction logic (intervals, semitones, steps) would need a home.

This is a **locality violation**: understanding "what happens when a user selects a scale" requires reading two separate call chains that do overlapping work.

## Solution

Have `TonalFacadeService.resolvePattern()` return a richer result that includes both the simplified notes *and* the interval metadata (`PatternInfo`). Then `PatternBuilderService` becomes a thin wrapper that extracts the `PatternInfo` from the resolution result and exposes it as signals. The double resolution is eliminated — one call to `TonalFacadeService` produces both the rendering data and the metadata.

## Files involved

- `src/app/services/pattern-builder.service.ts`
- `src/app/services/tonal-facade.service.ts`
- `src/app/domain/domain.service.ts`

## Status

OPEN

---

# P15: DomainService — Growing command handler surface

**Źródło:** Architecture Review Candidate 4 — [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)

## Motivation

`DomainService` has grown to 387 lines with 8 command handlers and 8 query handlers. It injects 5 services directly. The registry pattern keeps dispatch clean, but the handlers themselves are growing in complexity — `handleShowPattern` calls orchestration, pattern builder, and emits state; `handleResolveShape` calls shape resolver, note service, orchestration, and computes fret ranges.

**Deletion test:** Deleting `DomainService` would force all its handlers into callers (`HomePageComponent`, AI tools). The complexity would *scatter* — a bad sign. But the module is becoming **shallow** in the sense that its interface (the set of command/query types) is growing faster than the implementation complexity per handler.

The real friction: adding a new command requires modifying `DomainService` in 3 places (type registration, handler method, imports). This violates the **open/closed principle** at the module level.

## Solution

Extract each handler into its own **handler module** — a separate class per command/query type that implements a common `CommandHandler` or `QueryHandler` interface. `DomainService` becomes a pure registry that discovers and wires handlers. This is a natural evolution of the existing registry pattern — the registry currently maps strings to lambdas; the next step is mapping strings to injectable handler classes.

## Files involved

- `src/app/domain/domain.service.ts`
- `src/app/domain/commands.ts`
- `src/app/domain/queries.ts`

## Status

OPEN

---

# P16: FretboardDisplayService — Derived state from two sources

**Źródło:** Architecture Review Candidate 5 — [`plans/architecture-review-2026-09-10.md`](plans/architecture-review-2026-09-10.md)

## Motivation

Per ADR 0005, `FretboardDisplayService` is the "single source of derived state". But it reads from **two** sources: `DomainService.currentState()` (immutable signal) for `markerDisplayMode` and `emphasis`, and `FretboardStateService.notes` (mutable array) + `scaleChordState()` (signal) for note positions and roles.

The `getMarkerCssClass()` and `getRoleCssClass()` methods are called from Angular templates during change detection. They read mutable state at arbitrary times, creating a **timing dependency** — the mutable state must be updated *before* change detection runs, or the display will be inconsistent.

**Deletion test:** Deleting this module would force its logic into templates or component classes — the complexity would *scatter*. The module itself is not shallow, but its dependency on two state sources makes it fragile.

## Solution

This candidate is **speculative** because it depends on Candidate 1 (mutable state → immutable snapshot). Once `FretboardStateService` produces an immutable `FretboardSnapshot`, `FretboardDisplayService` can derive all its CSS classes from a single source: the snapshot + `DomainState`. The timing dependency disappears because the snapshot is updated atomically before change detection.

## Files involved

- `src/app/services/fretboard-display.service.ts`
- `src/app/services/fretboard-state.service.ts`
- `src/app/domain/domain.service.ts`

## Status

OPEN

---

# P17: Frontend Integration — Auth, Credentials, Progress, Settings

**Źródło:** Backend architecture plan — [`C:\code\Guitar-neck-app\guitar-neck-agent\plans\backend-architecture.md`](file:///C:/code/Guitar-neck-app/guitar-neck-agent/plans/backend-architecture.md)
**Backend tickets:** [`C:\code\Guitar-neck-app\guitar-neck-agent\tickets.md`](file:///C:/code/Guitar-neck-app/guitar-neck-agent/tickets.md)
**BE integration instructions:** [`C:\code\Guitar-neck-app\guitar-neck-agent\plans\frontend-integration-instructions.md`](file:///C:/code/Guitar-neck-app/guitar-neck-agent/plans/frontend-integration-instructions.md)
**BE branch:** `persistant-be` (wypchnięte, wszystkie endpointy gotowe)

## Motivation

Backend (guitar-neck-agent) został rozbudowany o PostgreSQL + Drizzle ORM, auth (register/login/logout z HTTP-only cookie session), szyfrowane credentials OpenRouter per user (AES-GCM), lesson progress + exercise results, oraz persistent LangGraph checkpoints.

Frontend (Angular) musi się zintegrować z nowymi endpointami. Obecnie `AgentApiService` ma hardcoded `http://localhost:3001/api/chat`, brak auth, brak UI do zarządzania kluczem OpenRouter, brak zapisu progresu lekcji.

## Solution

Dodać warstwę konta użytkownika do Angulara: auth flow, settings z kluczem OpenRouter, progress tracking. Wszystkie requesty do backendu z `credentials: 'include'`.

## Pliki do zmiany / utworzenia

### F1 — Konfiguracja globalna

| Plik | Zmiana |
|------|--------|
| `src/environments/environment.ts` | Dodać `apiUrl: 'http://localhost:3001'` |
| `src/environments/environment.prod.ts` | Dodać `apiUrl` (produkcyjny URL) |
| `src/app/app.config.ts` | Dodać `withCredentials()` do `provideHttpClient` |
| `src/app/app.routes.ts` | Dodać route dla login, register, settings |

### F2 — Auth service + komponenty

| Plik | Zmiana |
|------|--------|
| `src/app/auth/auth.service.ts` | **NOWY** — `login()`, `register()`, `logout()`, `getMe()`, `isLoggedIn` signal |
| `src/app/auth/login/login.component.ts` | **NOWY** — formularz logowania |
| `src/app/auth/login/login.component.html` | **NOWY** — email + password + submit |
| `src/app/auth/register/register.component.ts` | **NOWY** — formularz rejestracji |
| `src/app/auth/register/register.component.html` | **NOWY** — email + password + confirm + submit |

### F3 — Settings / Credentials

| Plik | Zmiana |
|------|--------|
| `src/app/settings/settings.component.ts` | **NOWY** — strona ustawień |
| `src/app/settings/settings.component.html` | **NOWY** — formularz klucza OpenRouter + status |
| `src/app/settings/credentials.service.ts` | **NOWY** — `saveKey()`, `getStatus()`, `deleteKey()` |

### F4 — Progress tracking

| Plik | Zmiana |
|------|--------|
| `src/app/services/progress.service.ts` | **NOWY** — `getProgress()`, `getLessonProgress()`, `updateLessonProgress()`, `saveExerciseResult()`, `getExerciseHistory()` |

### F5 — AgentApiService refactor

| Plik | Zmiana |
|------|--------|
| `src/app/services/agent-api.service.ts` | URL z `environment.apiUrl`, `credentials: 'include'`, dodać metody auth + credentials + progress |

### F6 — Chat service update

| Plik | Zmiana |
|------|--------|
| `src/app/chat/services/chat.service.ts` | `domainState` optional w body, `credentials: 'include'` |

### F7 — Header / Navigation

| Plik | Zmiana |
|------|--------|
| `src/app/header/header.component.ts` | Dodać user menu (login/logout/email/settings link) |
| `src/app/header/header.component.html` | Dodać przyciski auth + settings |

### F8 — Landing page update

| Plik | Zmiana |
|------|--------|
| `src/app/landing-page/landing-page.component.ts` | Dodać login/register CTA |
| `src/app/landing-page/landing-page.component.html` | Dodać linki do auth |

## Kolejność implementacji

1. **F1** — Konfiguracja: `environment.ts`, `app.config.ts`, `app.routes.ts`
2. **F5** — `AgentApiService` refactor: URL z environment, `credentials: 'include'`
3. **F6** — `ChatService` update: `domainState` optional
4. **F2** — Auth: `auth.service.ts` + login/register komponenty
5. **F7** — Header: user menu z login/logout
6. **F8** — Landing page: auth CTA
7. **F3** — Settings: `settings.component.ts` + `credentials.service.ts`
8. **F4** — Progress: `progress.service.ts`

## API Reference (z backendu)

### Auth

| Metoda | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/auth/register` | `{ email, password }` | `{ user: { id, email } }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user: { id, email } }` |
| `POST` | `/api/auth/logout` | — | `{ ok: true }` |
| `GET` | `/api/me` | — | `{ user: { id, email } }` |

### Credentials

| Metoda | Endpoint | Body | Response |
|--------|----------|------|----------|
| `PUT` | `/api/credentials/openrouter` | `{ apiKey: string }` | `{ ok: true }` |
| `GET` | `/api/credentials/openrouter/status` | — | `{ configured: boolean }` |
| `DELETE` | `/api/credentials/openrouter` | — | `{ ok: true }` |

### Progress

| Metoda | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/api/progress` | — | `{ progress: LessonProgress[] }` |
| `GET` | `/api/progress/:lessonId` | — | `{ progress: LessonProgress }` |
| `PUT` | `/api/progress/:lessonId` | `{ status?, currentStep?, data? }` | `{ ok: true }` |
| `POST` | `/api/progress/exercises/result` | `{ lessonId, exerciseId, result }` | `{ ok: true }` |
| `GET` | `/api/progress/exercises/history` | `?limit=50` | `{ history: ExerciseResult[] }` |

### Chat

| Metoda | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/chat` | `{ type, threadId, text, domainState?, lessonMode }` | NDJSON stream |

## Zasady

1. **Wszystkie requesty** z `credentials: 'include'` (HTTP-only cookie auth)
2. **Agent nie zapisuje do DB** — to Angular wysyła progress po `DomainCommand`
3. **`domainState` optional** w chat body — backend używa domyślnego jeśli nie podany
4. **`threadId` walidowany** — 403 jeśli thread innego usera
5. **Klucz OpenRouter** nie jest zwracany z backendu — tylko `{ configured: boolean }`

## MVP

- User może się zarejestrować i zalogować
- User może dodać klucz OpenRouter w settings
- Chat działa z kluczem usera (nie globalnym)
- `npm run build` succeeds
- `npm test` succeeds

## Done when

- `AgentApiService` używa `environment.apiUrl` i `credentials: 'include'`
- Login/register działają z backendem
- Settings page pozwala zapisać/usunąć klucz OpenRouter
- Chat działa po zalogowaniu z własnym kluczem
- Header pokazuje email usera + logout
- Progress jest wysyłany po każdej zmianie lekcji

## Status

DONE — w pełni zaimplementowane. Auth, login/register, settings z kluczem OpenRouter, progress tracking, header z user menu, landing page z CTA — wszystko działa z backendem przez `credentials: 'include'`.

---

# P18: DomainService — Registry→switch + ExerciseService split

**Źródło:** [`plans/domain-service-refactor-plan.md`](plans/domain-service-refactor-plan.md)

## Motivation

`DomainService` używał `Map<string, Handler>` z `registerCommandHandlers()`/`registerQueryHandlers()`, co wymuszało ręczne rzutowanie typów i generowało boilerplate. Dodatkowo logika exercise (start/submit/select/deselect) była w tym samym 550-linijkowym serwisie co widok gryfu.

## Rozwiązanie

1. **Registry → switch** (WDROŻONE) — `Map` + `register*Handlers()` zastąpione `switch (command.type)` w `execute()` i `query()`. TypeScript automatycznie zawęża typ w każdym case.
2. **Split ExerciseService** (WDROŻONE) — logika exercise wydzielona do osobnego `ExerciseService`. DomainService tylko deleguje.
3. **Testy ExerciseService** (DO ZROBIENIA) — brak testów jednostkowych dla `ExerciseService.startExercise()`, `submitExercise()`, `selectNote()`, `deselectNote()`.

## Pliki

- `src/app/domain/domain.service.ts` — switch + delegacja
- `src/app/domain/exercise.service.ts` — NOWY, logika exercise
- `src/app/domain/exercise.service.spec.ts` — NOWY, testy (do zrobienia)

## Status

PARTIALLY DONE — kroki 1-2 wdrożone, krok 3 (testy) do zrobienia.

---

# P19: Vitest import cleanup — remove explicit imports from spec files

**Źródło:** [`plans/fix-vitest-jasmine-inconsistency.md`](plans/fix-vitest-jasmine-inconsistency.md)

## Motivation

`tsconfig.spec.json` konfiguruje `vitest/globals`, co udostępnia `expect`, `describe`, `it`, `beforeEach`, `vi` globalnie bez importów. Mimo to 18 plików spec jawnie importuje te nazwy z `"vitest"`, a 7 plików używa `MockedObject<T>` zamiast `vi.Mocked<T>`.

## Rozwiązanie

1. **Usunięcie `@types/jasmine` i `jasmine-core`** (WDROŻONE) — usunięte z `package.json`
2. **Usunięcie vitest importów z 18 plików spec** (DO ZROBIENIA) — każdy plik ma `import { beforeEach, describe, expect, it, vi } from "vitest"` do usunięcia
3. **Zamiana `MockedObject<T>` na `vi.Mocked<T>`** (DO ZROBIENIA) — w 7 plikach
4. **Aktualizacja AGENTS.md** (DO ZROBIENIA) — doprecyzowanie reguły o globals

## Pliki do zmiany

- 18 plików `*.spec.ts` — usuń import z vitest
- 7 plików `*.spec.ts` — `MockedObject<T>` → `vi.Mocked<T>`
- `AGENTS.md` — aktualizacja reguły

## Status

PARTIALLY DONE — tylko cleanup package.json zrobiony.

---

# P20: enabledStrings — brak walidacji w selectNote i UI

**Źródło:** [`plans/ai-teacher-e2e-report.md`](plans/ai-teacher-e2e-report.md) — Issues 4 i 5
**Plan implementacji:** [`plans/fix-enabledstrings-bugs.md`](plans/fix-enabledstrings-bugs.md)

## Motivation

Raport E2E wykazał dwie nieprawidłowości związane z `enabledStrings`:

1. **Brak walidacji w `ExerciseService.selectNote()`** — domena akceptuje `select-note` dla wyłączonych strun. `selectNote()` sprawdza pozycję (string 1-6, fret 0-24) ale NIE sprawdza `currentState.enabledStrings[string-1]`. Konsola pokazuje `select-note` dla stringów 1-6 mimo że tylko string 6 był wizualnie aktywny.

2. **Brak checka `enabledStrings` w `isPhysicalPositionInRange()`** — w trybie exercise template używa `isPhysicalPositionInRange()` do renderowania klikalnych przycisków. Ta metoda sprawdza zakres stringa i progu, ale NIE sprawdza `enabledStrings[stringIndex]`. Przez to nuty na wyłączonych strunach są renderowane jako klikalne.

3. **Nieprecyzyjne opisy w AI tool schemas** — `enabledStrings` w `setViewSchema` i `startExerciseSchema` nie wyjaśnia mapowania indeksów tablicy na numery strun gitarowych. Agent AI może konstruować tablicę z błędnym mapowaniem (indeks 4 = struna 5 A, indeks 5 = struna 6 E).

## Rozwiązanie

1. **`ExerciseService.selectNote()`** — dodać walidację: jeśli `!currentState.enabledStrings[string - 1]`, zwrócić błąd `INVALID_POSITION`.
2. **`FreatboardComponent.isPhysicalPositionInRange()`** — dodać check: jeśli `!domainService.currentState().enabledStrings[stringIndex]`, zwrócić `false`.
3. **`domain-tools.ts`** — zaktualizować opisy Zod: "Indeksy: 0=struna 1 (cienkie E), 1=struna 2 (B), 2=struna 3 (G), 3=struna 4 (D), 4=struna 5 (A), 5=struna 6 (grube E)".

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/domain/exercise.service.ts` | Dodać `enabledStrings` check w `selectNote()` |
| `src/app/freatboard/freatboard.component.ts` | Dodać `enabledStrings` check w `isPhysicalPositionInRange()` |
| `src/app/chat/tools/domain-tools.ts` | Poprawić opisy `enabledStrings` w schematach Zod |

## Status

OPEN

---

# P21: Renderowanie Markdown w wiadomościach AI

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 2

## Motivation

Wiadomości AI w lekcji i wyniku ćwiczenia wyświetlają surowy Markdown: `**` dla pogrubienia, backticki dla kodu inline, listy jako `- ` na początku linii. Treść wygląda jak uszkodzona, utrudnia skanowanie instrukcji i obniża zaufanie do nauczyciela. Szczególnie dotyka początkujących, dla których treść zawiera nowe terminy.

## Solution

Dodać renderowanie Markdown po stronie frontendu (Angular) przed wyświetleniem wiadomości. Użyć lekkiego parsera (regex/własny) zamiast pełnej biblioteki — obsługiwane elementy: `**bold**`, `` `code` ``, listy `- ` / `1. `, nagłówki `## `, akapity. Backend nie wymaga zmian — wysyła Markdown jak dotychczas, frontend renderuje.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/chat/chat.component.ts` | Dodać `renderMarkdown()` pipe w template — zamiana `msg.text` na renderowany HTML zamiast surowego tekstu |
| `src/app/chat/chat.component.ts` | Dodać klasę CSS dla wyrenderowanych treści (`.markdown-content`) |
| `src/app/chat/chat.component.scss` | Style dla wyrenderowanego Markdown: bold, code, listy, akapity |
| `src/app/chat/models/chat-message.ts` | Opcjonalnie: dodać `renderedText?: string` jeśli cachowanie potrzebne |
| `src/app/chat/services/helpers.ts` | Dodać czystą funkcję `renderMarkdown(text: string): string` |

## Kolejność implementacji

1. Dodać `renderMarkdown()` w `helpers.ts` — regex dla bold, code inline, list, nagłówków, akapitów
2. Zastosować w `chat.component.ts` template — `@if` / metoda zamieniająca tekst przed wyświetleniem
3. Dodać style CSS dla `.markdown-content`
4. Testy: `helpers.spec.ts` — przypadki dla każdego elementu Markdown, w tym zagnieżdżenia i krawędzie

## MVP

- `**bold**` → `<strong>bold</strong>`
- `` `code` `` → `<code>code</code>`
- `- lista` → `<ul><li>lista</li></ul>`
- `## Nagłówek` → `<h3>Nagłówek</h3>` (zwiększony margines)
- Bezpieczne renderowanie — brak XSS (escapowanie HTML w treści)
- `npm test` succeeds

## Done when

- Wiadomości AI w lekcji i wyniku ćwiczenia nie pokazują surowych znaczników Markdown
- Bold, code inline, listy i nagłówki są renderowane semantycznie
- Długie linie są łamane (word-break)
- Testy pokrywają wszystkie obsługiwane elementy

## Status

OPEN

---

# P22: Wynik ćwiczenia na gryfie

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 3
**Plan implementacji:** [`plans/exercise-result-on-fretboard.md`](plans/exercise-result-on-fretboard.md)

## Motivation

Po kliknięciu „Sprawdź" odpowiedź podaje trafienia i brakujące pozycje wyłącznie jako tekst w czacie. Gryf wraca do widoku bez wyraźnego oznaczenia poprawnych i pominiętych nut. Użytkownik musi pamiętać wynik słowny i sam mapować go z powrotem na gryf. W edukacyjnym zadaniu o lokalizacji dźwięków to właśnie gryf powinien pokazywać korektę.

## Solution

Utrzymać stan odpowiedzi na gryfie po sprawdzeniu: odróżnić poprawne wybory, pominięcia i błędne kliknięcia kolorami/kształtami markerów. Obok pokazać zwięzłe podsumowanie (np. „7 znalezionych, 5 pominiętych") oraz następny krok. Dłuższe wyjaśnienie zostawić nauczycielowi w czacie.

Szczegółowy plan: [`plans/exercise-result-on-fretboard.md`](plans/exercise-result-on-fretboard.md)

## Status

OPEN

---

# P23: Bezpośrednie wejście do gryfu ze strony głównej

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 4

## Motivation

Pierwszy ekran na wszystkich rozmiarach eksponuje hero, opis produktu i logowanie/rejestrację; gryf jest poza widokiem. Karty funkcji są klikalne i przekierowują do `/app?action=...`, ale żadna nie jest jednoznacznym przyciskiem „Otwórz gryf / Wypróbuj bez rejestracji". Nowy użytkownik nie widzi od razu kluczowego narzędzia i może odczytać konto jako warunek rozpoczęcia nauki.

## Solution

Dodać wyraźny, bezrejestracyjny punkt wejścia do gryfu na stronie głównej. Dodać mały, rzeczywisty podgląd gryfu (lub statyczną grafikę) już na hero. Zachować istniejące karty funkcji i lekcje.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/landing-page/landing-page.component.html` | Dodać przycisk „Wypróbuj gryf" (bez rejestracji) w hero; dodać miniaturę gryfu |
| `src/app/landing-page/landing-page.component.ts` | Dodać `goToApp()` dla niezalogowanych (bez przekierowania do auth) |
| `src/app/landing-page/landing-page.component.scss` | Style dla nowego CTA i miniatury |
| `src/app/app-page/app-page.component.ts` | Upewnić się że `?action=show-pattern` działa bez auth |

## Kolejność implementacji

1. Dodać `goToApp()` w landing-page.component.ts — nawigacja do `/app` bez auth
2. Dodać przycisk „Wypróbuj gryf" w hero, nad `Create Account` / `Sign In`
3. Dodać miniaturę gryfu (SVG lub screenshot) obok/poniżej CTA
4. Style: wyróżnić nowy CTA kolorem akcentu

## MVP

- Niezalogowany użytkownik może kliknąć „Wypróbuj gryf" i wejść do `/app`
- Gryf jest widoczny (pusty, z neutralnymi markerami)
- Auth CTA pozostają dostępne, ale nie blokują dostępu

## Done when

- Przycisk „Wypróbuj gryf" prowadzi do `/app` bez auth
- Strona główna pokazuje miniaturę gryfu
- `npm test` succeeds

## Status

OPEN

---

# P24: Ujednolicenie języka interfejsu na polski

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 6

## Motivation

Na `/app` dominują angielskie etykiety: „I want to", „Show", „Range", „Custom", „Intervals Legend", „Markers", podczas gdy ćwiczenie i szczegóły są po polsku. Strona główna ma angielskie opisy, karty lekcji są polskie. Początkujący musi przełączać język w ramach jednego zadania.

## Solution

Ujednolicić język interfejsu na polski. Nazwać komendy operacyjnie: „Pokaż na gryfie" / „Porównaj skalę i akord". Termin angielski zachować pomocniczo tam, gdzie należy do słownika gitarowego (np. „bend", „slide").

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/toolbox/toolbox-builder.component.html` | „I want to" → „Pokaż", „Show" → „Pokaż", „Compare" → „Porównaj" |
| `src/app/range-toolbar/range-toolbar.component.html` | „Range" → „Zakres", „Custom" → „Własny" |
| `src/app/legend/legend.component.html` | „Intervals Legend" → „Legenda interwałów", „Markers" → „Markery", opcje select |
| `src/app/landing-page/landing-page.component.html` | Opisy kart, hero tagline, nagłówki sekcji |
| `src/app/header/header.component.html` | Ewentualne angielskie etykiety |
| `src/app/string-toggle/string-toggle.component.ts` | Etykiety/aria-label |

## Kolejność implementacji

1. Przetłumaczyć toolbox (najbardziej widoczny)
2. Przetłumaczyć legendę i range-toolbar
3. Przetłumaczyć landing page
4. Sprawdzić spójność — wszystkie widoki `/app` po polsku

## MVP

- Wszystkie kontrolki na `/app` są po polsku
- Landing page jest po polsku
- Terminy gitarowe (bend, slide, fret) pozostają angielskie

## Done when

- `I want to` → `Pokaż` / `Porównaj`
- `Show` → `Pokaż`
- `Range` → `Zakres`
- `Intervals Legend` → `Legenda interwałów`
- Landing page hero i karty po polsku
- `npm test` succeeds

## Status

OPEN

---

# P25: Czytelność markerów i dostępność legendy

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 5

## Motivation

Puste markery w początkowym `/app` są ciemnoszare na ciemnym gryfie i słabo widoczne. Po aktywacji kolorowe kropki mają litery nut, podczas gdy legenda opisuje stopnie interwałowe. Legenda jest długa i na mobile ucieka poza ekran. Kolor bez stale dostępnego klucza nie wyjaśnia funkcji, a sama barwa nie jest niezawodnym rozróżnieniem dla osób z zaburzeniami widzenia barw.

## Solution

Podnieść kontrast neutralnych kropek. Dodać redundantne cechy markerów (kształt, obwódka, tooltip). Utrzymać legendę blisko gryfu i w obrębie viewportu. Pokazać wybrany wzór/root w nagłówku widoku.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/guitar-neck/guitar-neck.component.scss` | Podnieść kontrast/kolor neutralnych kropek (`.neutral-dot`) |
| `src/app/guitar-neck/guitar-neck.component.html` | Dodać `title`/tooltip do markerów z nazwą nuty i interwału |
| `src/app/legend/legend.component.html` | Użyć `position: sticky` lub inny mechanizm by legenda była w viewporcie |
| `src/app/legend/legend.component.scss` | Style dla sticky legendy, zawijanie na mobile |
| `src/app/services/marker-role.service.ts` | Dodać kształt/obwódkę jako redundantne kodowanie (oprócz koloru) |
| `src/app/freatboard/freatboard.component.html` | Tooltip na klikalnych pozycjach |

## Kolejność implementacji

1. Poprawić kontrast neutralnych kropek
2. Dodać tooltip z nazwą nuty i interwału do markerów
3. Dodać redundantne kodowanie (kształt/obwódka) w `MarkerRoleService`
4. Ustawić legendę jako sticky w obrębie viewportu

## MVP

- Neutralne kropki są widoczne na ciemnym gryfie
- Każdy marker ma tooltip z nazwą nuty i interwału
- Legenda jest widoczna bez przewijania (sticky)
- Markery mają redundantne kodowanie (nie tylko kolor)

## Done when

- Kontrast neutralnych kropek poprawiony
- Tooltip działa na hover dla wszystkich markerów
- Legenda pozostaje w viewporcie podczas przewijania
- `npm test` succeeds

## Status

OPEN

---

# P26: Lekcja jako sekwencja — wydzielenie zadania od historii rozmowy

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 9
**Plan implementacji:** [`plans/lesson-sequence-redesign.md`](plans/lesson-sequence-redesign.md)

## Motivation

Odpowiedź nauczyciela, prośba użytkownika i aktywne zadanie występują jako kolejne długie dymki w czacie. Prompt pozostaje na dole, a akcja „Sprawdź" przenosi się nad gryf. Uczący się nie zawsze wie, czy ma czytać, klikać nuty, czy już odpowiadać w czacie. Instrukcja ćwiczenia ginie w historii wiadomości.

## Solution

Wizualnie wydzielić bieżące zadanie (krótkie polecenie i status), zostawiając historię wyjaśnień w czacie. Dodać jasny postęp lekcji oraz jeden kontekstowy następny krok. Wymaga zmian zarówno we frontendzie (UI lekcji) jak i backendzie (struktura odpowiedzi AI).

Szczegółowy plan: [`plans/lesson-sequence-redesign.md`](plans/lesson-sequence-redesign.md)

## Status

OPEN

---

# P27: Spójność wizualna formularzy auth

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 8

## Motivation

Logowanie i rejestracja mają ciemnogranatowe karty, niebieskie przyciski i linki na prawie białym tle, podczas gdy narzędzie jest jasne z zielonym akcentem. Zmiana motywu między wejściem na stronę i kontem osłabia spójność produktu.

## Solution

Przenieść typografię, kolory akcentu, stany fokusu i przyciski do tych samych tokenów CSS co reszta aplikacji. Zachować prosty, skoncentrowany układ formularzy. Sprawdzić kontrast linków i CTA.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/auth/login/login.component.scss` | Użyć zmiennych CSS z `styles.scss` zamiast hardcoded kolorów |
| `src/app/auth/login/login.component.html` | Użyć klas `.btn--primary` zamiast inline style |
| `src/app/auth/register/register.component.scss` | J.w. — dopasować do palety aplikacji |
| `src/app/auth/register/register.component.html` | Użyć klas `.btn--primary` |
| `src/styles.scss` | Dodać brakujące tokeny (jeśli potrzeba) dla formularzy |

## Kolejność implementacji

1. Zidentyfikować tokeny CSS używane w głównej aplikacji (kolory, fonty, spacing)
2. Zastosować je w login.component.scss
3. Zastosować je w register.component.scss
4. Sprawdzić kontrast linków i CTA

## MVP

- Formularze auth używają tych samych kolorów akcentu co reszta aplikacji
- Przyciski używają tych samych klas co główne CTA
- Linki mają dobry kontrast

## Done when

- Login i register nie mają ciemnogranatowych kart
- Przyciski są w kolorze akcentu aplikacji (zielony)
- Typografia jest spójna z resztą
- `npm test` succeeds

## Status

OPEN

---

# P28: Wykorzystanie powierzchni czatu na desktopie

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 7

## Motivation

W stanie AI Chat panel jest podzielony na pustą lewą kolumnę i czat po prawej. Obszar rozmowy zaczyna się od pustej historii. Na desktopie (1440×900) lewa kolumna marnuje połowę dostępnej powierzchni. Nie wiadomo, czy lewa część ma zawierać gryf, czy aplikacja nie załadowała treści.

## Solution

Jeśli lewa kolumna ma być gryfem, umieścić tam rzeczywisty kontekst i krótki opis aktualnego stanu. Jeśli nie, wykorzystać szerokość na rozmowę i przykłady promptów, zamiast utrzymywać pusty panel.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/app-page/app-page.component.html` | Layout AI Chat: jedna kolumna (full-width) lub gryf + wąski czat |
| `src/app/app-page/app-page.component.scss` | Responsywny podział na kolumny |
| `src/app/chat/chat.component.scss` | Szerokość czatu, max-width |

## Kolejność implementacji

1. Zdecydować: jedna kolumna (full-width czat) czy dwie (gryf + czat)
2. Zaimplementować wybrany layout
3. Testy wizualne na 1440×900 i 1366×768

## MVP

- AI Chat nie ma pustej lewej kolumny
- Czat wykorzystuje dostępną szerokość ekranu
- Responsywność: na wąskich ekranach czat jest pełną szerokością

## Done when

- Pusta lewa kolumna nie występuje
- Czat ma rozsądną szerokość (min 600px na desktopie)
- `npm test` succeeds

## Status

OPEN

---

# P29: Porządkowanie typografii i hierarchii

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 10

## Motivation

Strona główna łączy duże szeryfowe nagłówki z sans-serifowymi kartami. Główne narzędzie ma drobne etykiety nad gryfem, a auth używa innej skali fontu i odcieni. Część ważnych informacji (stopnie i legenda) ma podobny ciężar do drugorzędnych elementów.

## Solution

Ustalić niewielką skalę typograficzną dla tytułu trybu, etykiet kontrolnych, danych muzycznych i pomocy. Nie zmieniać gryfu w dekoracyjny hero. Priorytetem pozostaje czytelny odczyt markerów.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/styles.scss` | Zdefiniować zmienne CSS dla font-size: `--fs-title`, `--fs-label`, `--fs-data`, `--fs-legend` |
| `src/app/landing-page/landing-page.component.scss` | Użyć zmiennych typograficznych |
| `src/app/header/header.component.scss` | Użyć zmiennych typograficznych |
| `src/app/legend/legend.component.scss` | Użyć zmiennych typograficznych |
| `src/app/auth/login/login.component.scss` | Użyć zmiennych typograficznych |
| `src/app/auth/register/register.component.scss` | Użyć zmiennych typograficznych |

## Kolejność implementacji

1. Zdefiniować zmienne CSS w `styles.scss`
2. Zastosować w landing page
3. Zastosować w header i legend
4. Zastosować w auth

## MVP

- Wszystkie widoki używają wspólnej skali typograficznej
- Legenda i dane muzyczne mają odpowiedni ciężar wizualny

## Done when

- Zmienne CSS dla font-size zdefiniowane w `styles.scss`
- Landing page, header, legenda, auth używają tych samych zmiennych
- `npm test` succeeds

## Status

OPEN

---

# P31: Angular NG0955 — duplikaty kluczy w `track` wyrażeniach `@for`

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — B1

## Motivation

Angular emituje `NG0955` warnings ponieważ `@for` loops w template używają `track` wyrażeń produkujących duplikaty kluczy. Dwa przypadki:
1. Numery interwałów (1–7 + oktawa 1): `[1, 2, 3, 4, 5, 6, 7, 1]` — klucz `"1"` pojawia się dwa razy
2. Litery kroków (W, W, H, W, W, W, H): klucze `"W"` i `"H"` są zduplikowane

Angular fallbackuje do `track by identity`, co powoduje pełną rekreację DOM przy każdej zmianie — problem wydajnościowy i potencjalny flicker UI.

## Solution

Zastąpić `track` wyrażenia unikalnymi kluczami — użyć `track $index` lub kompozytowych kluczy tam, gdzie wartości się powtarzają.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/pattern-display/pattern-display.component.html` | `track interval` → `track $index` (lub kompozytowy klucz) dla listy interwałów |
| `src/app/pattern-display/pattern-display.component.html` | `track step` → `track $index` dla listy kroków |

## Kolejność implementacji

1. Zidentyfikować wszystkie `@for` z `track` na wartościach które mogą się powtarzać
2. Zmienić na `track $index` tam gdzie kolejność jest stabilna
3. Sprawdzić konsolę — brak `NG0955`

## MVP

- Brak `NG0955` w konsoli przy każdej zmianie widoku
- `npm test` succeeds

## Done when

- `@for` loops w pattern-display używają unikalnych kluczy `track`
- Brak warningów `NG0955` w konsoli
- `npm test` succeeds

## Status

OPEN

---

# P32: Angular NG0956 — nieefektywne `track by identity` w lekcji

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — B2

## Motivation

W trybie lekcji Angular emituje `NG0956` warning — `track by identity` powoduje rekreację całej kolekcji (rozmiar 1) przy każdej zmianie. To niepotrzebna operacja DOM.

## Solution

Dodać `track` wyrażenie z unikalnym kluczem do `@for` w template lekcji. Użyć `track $index` lub `track msg` (jeśli ChatMessage ma unikalne ID).

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/chat/chat.component.html` | Dodać `track $index` do `@for` loop wiadomości |
| Ewentualnie inne template z `@for` na kolekcjach rozmiaru 1 |

## Kolejność implementacji

1. Dodać `track $index` do `@for (msg of chatService.messages(); track msg)`
2. Sprawdzić konsolę — brak `NG0956`

## MVP

- Brak `NG0956` w konsoli przy zmianie kroku lekcji
- `npm test` succeeds

## Done when

- `@for` w chat.component.html ma unikalny `track`
- Brak warningów `NG0956` w konsoli
- `npm test` succeeds

## Status

OPEN

---

# P33: Brakujące favicon.ico (404)

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — B3

## Motivation

Aplikacja zwraca HTTP 404 dla `/favicon.ico`. Plik `public/favicon.ico` istnieje w projekcie, ale nie jest serwowany przez dev server.

## Solution

Sprawdzić konfigurację `angular.json` — upewnić się że `public/favicon.ico` jest kopiowane do outputu. Dodać referencję w `index.html` jeśli brak.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `angular.json` | Sprawdzić `assets` config — dodać `public/favicon.ico` jeśli brak |
| `src/index.html` | Dodać `<link rel="icon" type="image/x-icon" href="/favicon.ico">` jeśli brak |

## Kolejność implementacji

1. Sprawdzić `angular.json` — czy `public/` jest w `assets`
2. Sprawdzić `src/index.html` — czy jest link do favicon
3. Dodać brakujące konfiguracje

## MVP

- Brak 404 dla `/favicon.ico`
- Favicon widoczny w karcie przeglądarki

## Done when

- `GET /favicon.ico` zwraca 200
- `npm test` succeeds

## Status

OPEN

---

# P34: Niejednoznaczne etykiety strun E (niskie E vs wysokie E)

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — UX1

## Motivation

Zarówno niskie E (6. struna, E2) jak i wysokie E (1. struna, E4) są oznaczone jako "E string" w string toggle. Aria-label to `"Show notes on E string"` dla obu. Użytkownik nie może rozróżnić którą strunę przełącza bez liczenia strun z układu wizualnego.

## Solution

Dodać rozróżnienie w etykietach: "E (niskie)" / "E (wysokie)" lub "E2" / "E4". Zaktualizować zarówno widoczne etykiety jak i aria-label.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/string-toggle/string-toggle.component.ts` | Dodać mapowanie stringIndex → etykieta: `['E (wysokie)', 'B', 'G', 'D', 'A', 'E (niskie)']` |
| `src/app/string-toggle/string-toggle.component.html` | Użyć zmapowanych etykiet zamiast generycznych |

## Kolejność implementacji

1. Dodać tablicę etykiet w `string-toggle.component.ts`
2. Użyć w template zamiast generycznej "E string"
3. Zaktualizować testy jeśli sprawdzają etykiety

## MVP

- Struny E mają rozróżnialne etykiety
- Aria-label również rozróżnia

## Done when

- String toggle pokazuje "E (wysokie)" dla struny 1 i "E (niskie)" dla struny 6
- Aria-label jest unikalny dla każdej struny
- `npm test` succeeds

## Status

OPEN

---

# P35: Przycisk "Wyślij" wyłączony przy starcie lekcji

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — UX2

## Motivation

Po załadowaniu lekcji przycisk "Wyślij" w czacie jest disabled. Staje się enabled dopiero po kliknięciu przycisku ćwiczenia. Może to dezorientować użytkowników którzy chcą zadać pytanie przed rozpoczęciem ćwiczenia.

## Solution

Przycisk "Wyślij" powinien być enabled od początku lekcji, lub powinien być jasny komunikat dlaczego jest disabled.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/chat/chat.component.html` | Sprawdzić warunek `[disabled]="chatService.loading()"` — czy loading jest `true` na starcie lekcji |
| `src/app/chat/services/chat.service.ts` | Upewnić się że `loading` signal jest `false` po załadowaniu lekcji (przed pierwszym ćwiczeniem) |

## Kolejność implementacji

1. Sprawdzić stan `loading()` po `startLesson()` — czy pozostaje `true`?
2. Jeśli tak, zresetować `loading` do `false` po załadowaniu treści lekcji
3. Jeśli nie, dodać warunek w template: disabled tylko gdy loading lub brak wiadomości

## MVP

- Przycisk "Wyślij" jest enabled od początku lekcji
- Lub: jasny komunikat dlaczego jest disabled

## Done when

- "Wyślij" jest enabled po załadowaniu lekcji
- `npm test` succeeds

## Status

OPEN

---

# P36: Brak wizualnego feedbacku przy klikaniu nut w trybie show

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — UX3

## Motivation

W domyślnym trybie "show" (nie exercise mode) kliknięcie na gryfie nie daje żadnego feedbacku — brak highlightu, tooltipa, dźwięku. Kropki mają `cursor: pointer` i `(click)` handler, ale kliknięcie nie zmienia stanu.

## Solution

Usunąć `cursor: pointer` i `(click)` handler w trybie show (gdy `!exerciseMode`), albo dodać feedback: tooltip z nazwą nuty i interwału.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/freatboard/freatboard.component.html` | Dodać warunek: `(click)` tylko gdy `exerciseMode`; tooltip zawsze |
| `src/app/freatboard/freatboard.component.ts` | Dodać tooltip/logikę: pokaż nazwę nuty i interwał na hover/click |

## Kolejność implementacji

1. Dodać tooltip z nazwą nuty i interwału do wszystkich markerów (nie tylko exercise mode)
2. Usunąć `cursor: pointer` gdy `!exerciseMode` (lub zostawić jeśli tooltip jest wystarczającym feedbackiem)

## MVP

- Kliknięcie nuty w trybie show pokazuje tooltip z nazwą nuty i interwału
- Lub: kursor nie wskazuje że element jest klikalny

## Done when

- Tooltip działa na wszystkich markerach (show i exercise mode)
- `npm test` succeeds

## Status

OPEN

---

# P37: AI Chat button — niezgodność text content z accessible name

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — P1

## Motivation

Przycisk "AI Chat" nie może być znaleziony przez `textContent().trim() === 'AI Chat'` ale działa przez `getByRole('button', { name: 'AI Chat' })`. Sugeruje to że text content zawiera dodatkowe białe znaki, znaki zerowej szerokości, lub accessible name jest ustawione przez aria-label.

## Solution

Ujednolicić text content z accessible name. Usunąć zbędne białe znaki lub dodać jawny text content.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/header/header.component.html` | Sprawdzić text content przycisku AI Chat — usunąć zbędne spacje/znaki |

## Kolejność implementacji

1. Sprawdzić text content przycisku AI Chat w header.component.html
2. Usunąć zbędne białe znaki
3. Sprawdzić czy aria-label jest spójny z text content

## MVP

- `textContent().trim() === 'AI Chat'` zwraca true
- `getByRole('button', { name: 'AI Chat' })` nadal działa

## Done when

- Text content przycisku jest "AI Chat" (bez zbędnych znaków)
- `npm test` succeeds

## Status

DONE — dodano `<span class="ai-toggle__label">AI Chat</span>` obok SVG w przycisku, usunięto fixed width/height z `.ai-toggle` w SCSS, dodano style dla etykiety. Text content przycisku to teraz "AI Chat" — zgodny z `aria-label`.

---

# P38: Nieobserwowalne requesty sieciowe podczas AI Chat

**Źródło:** [`test-results/qa-crash-test-report.md`](test-results/qa-crash-test-report.md) — P2

## Motivation

Podczas interakcji z AI Chat, standardowe monitorowanie network requests nie wykazuje żadnych zapytań. Chat używa NDJSON streamingu, który nie jest przechwytywany przez standardowe narzędzia. Utrudnia to debugowanie API, weryfikację obsługi błędów i monitorowanie postępu streamingu.

## Solution

Dodać jawny logging requestów/responseów po stronie frontendu (Angular `HttpClient` interceptor) lub dodać dedykowany endpoint health-check dla czatu. Backend już wysyła eventy NDJSON — frontend powinien logować rozpoczęcie/zakończenie streamingu.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/app/chat/services/chat.service.ts` | Dodać logging: `console.debug` przy starcie/końcu streamingu, błędach |
| `src/app/services/chat-api.service.ts` | Dodać interceptable logging przez `HttpClient` |

## Kolejność implementacji

1. Dodać logging w `ChatService.send()` — start streamingu, pierwszy token, błąd, koniec
2. Dodać logging w `ChatApiService` — URL, status, czas trwania
3. Opcjonalnie: dodać endpoint `GET /api/chat/health` w backendzie

## MVP

- Network requests są widoczne w logach konsoli
- Można zweryfikować czy API zostało wywołane

## Done when

- `ChatService` loguje start/koniec streamingu
- `ChatApiService` loguje URL i status odpowiedzi
- `npm test` succeeds

## Status

OPEN

---

# P30: Mobile redesign — responsywny układ gryfu i paneli

**Źródło:** [`plans/ux-ui-audit-2026-10-05.md`](plans/ux-ui-audit-2026-10-05.md) — Problem 1
**Plan implementacji:** [`plans/mobile-redesign.md`](plans/mobile-redesign.md)

## Motivation

Na 390 px szerokości pasek wyboru skali/akordu nie mieści się w widoku, gryf pokazuje tylko część progów, a użytkownik musi jednocześnie przewijać stronę pionowo i elementy poziomo. Przy relacji dochodzą ucięta legenda i obok siebie dwie kolumny szczegółów, z których druga wypada poza ekran. Nauka wymaga widzieć nuty i ich relacje przestrzenne — niewidoczny fragment gryfu utrudnia ćwiczenie.

## Solution

Na wąskim ekranie składać wybór w krótkie, zawijane sekcje lub kompaktowy pasek. Pokazywać jawny zakres widocznych progów i proste sterowanie przesuwaniem gryfu. Szczegóły porównania układać w pionie, legendę zawijać albo udostępniać jako czytelny panel dostępny przy gryfie. Nie zmniejszać gryfu do nieczytelnych markerów.

Szczegółowy plan: [`plans/mobile-redesign.md`](plans/mobile-redesign.md)

## Status

OPEN