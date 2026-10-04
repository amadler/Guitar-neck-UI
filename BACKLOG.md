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