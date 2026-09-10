# ADR 0006: Rozdzielenie trybu AI od DomainState.mode

**Status**: accepted

## Context

Obecnie tryb AI jest reprezentowany jako wartość `'ai'` w polu `mode` typu `DomainState.mode`:

```typescript
// state.ts (przed zmianą)
mode: 'scale' | 'chord' | 'scale-chord' | 'custom' | 'positions' | 'ai';
```

Gdy AI wykonuje komendę `show-pattern` (lub inną), handler [`handleShowPattern`](src/app/domain/domain.service.ts:116) zmienia `mode` z `'ai'` na `'scale'` (lub `'chord'`). To powoduje dwa problemy:

1. **Chat znika** — [`HomePageComponent.aiMode`](src/app/home-page/home-page.component.ts:41) to `computed(() => domainService.currentState().mode === 'ai')`. Gdy `mode` zmienia się na `'scale'`, `aiMode()` staje się `false`, a szablon ukrywa chat.
2. **Legenda nie pokazuje się** — AI woła `DomainService.execute()` bezpośrednio, omijając [`HomePageComponent.onToolboxEvent()`](src/app/home-page/home-page.component.ts:76), który ustawiał `displayMode`. W efekcie `displayMode` pozostawał `null`.

**Przyczyna fundamentalna:** `DomainState.mode` służy dwóm celom jednocześnie:
- Określa **co jest wyświetlane** na gryfie (scale, chord, scale-chord, custom, positions)
- Służy jako **flaga trybu AI**

To są ortogonalne koncepcje — tryb AI mówi o *sposobie interakcji*, a `mode` mówi o *typie wyświetlanego patternu*.

## Decyzje

### 1. Dodanie `aiModeEnabled` do `DomainState`

Wprowadzamy osobne pole `aiModeEnabled: boolean` do canonical state:

```typescript
interface DomainState {
  mode: 'scale' | 'chord' | 'scale-chord' | 'custom' | 'positions';  // bez 'ai'
  aiModeEnabled: boolean;  // nowe pole
  displayMode: 'legend' | 'relationship' | null;  // przeniesione z HomePageComponent
  // ... reszta pól bez zmian
}
```

`'ai'` zostaje usunięte z union type `mode`.

### 2. `displayMode` przeniesiony do `DomainState`

`displayMode` (kontrolujący legendę/relationship strip) zostaje przeniesiony z `HomePageComponent` (gdzie był `signal<DisplayMode>`) do `DomainState`. Teraz każdy handler w `DomainService` ustawia `displayMode` razem z `mode`:

| Handler | `mode` | `displayMode` |
|---------|--------|---------------|
| `handleShowPattern` | `'scale'` / `'chord'` | `'legend'` |
| `handleShowInterval` | `'custom'` | `'legend'` |
| `handleComparePatterns` | `'scale-chord'` | `'relationship'` |
| `handleResolveShape` | `'positions'` | `'legend'` |
| `handleClearView` | `'scale'` (default) | `null` |

Dzięki temu zarówno Toolbox (przez `onToolboxEvent`) jak i AI (przez bezpośrednie `DomainService.execute()`) ustawiają `displayMode` w ten sam sposób.

### 3. `handleSetAiMode` zmienia tylko `aiModeEnabled`

Handler [`handleSetAiMode`](src/app/domain/domain.service.ts:265) przestaje zmieniać `mode`:

```typescript
private handleSetAiMode(command: SetAiModeCommand): DomainResult<DomainState> {
  return this.emitState({
    ...this.currentState(),
    aiModeEnabled: command.enabled,
  });
}
```

Usuwamy pole `previousMode` i logikę zapisywania/przywracania trybu.

### 4. Wszystkie handlery propagują `aiModeEnabled`

Każdy handler zachowuje bieżącą wartość `aiModeEnabled` przez `...this.currentState()`. `clear-view` jawnie zachowuje `aiModeEnabled`:

```typescript
private handleClearView(): DomainResult<DomainState> {
  return this.emitState({
    ...DEFAULT_DOMAIN_STATE,
    enabledStrings: this.currentState().enabledStrings,
    aiModeEnabled: this.currentState().aiModeEnabled,  // nie resetuje trybu AI
  });
}
```

### 5. `HomePageComponent` czyta `displayMode` z `DomainState`

`displayMode` w `HomePageComponent` to prosty computed:

```typescript
displayMode = computed<DisplayMode>(() => this.domainService.currentState().displayMode);
```

`onToolboxEvent` deleguje tylko do `DomainService.execute()`:

```typescript
onToolboxEvent(command: DomainCommand): void {
  this.domainService.execute(command);
}
```

### 6. `rangeDisabled` pozostaje computed z `mode`

```typescript
rangeDisabled = computed(() => this.domainService.currentState().mode === 'positions');
```

## Alternatywy rozważone

- **Zostawienie `'ai'` w `mode` i ignorowanie zmiany w handlerach**: niemożliwe — handler show-pattern musi zmienić `mode` na `'scale'`/`'chord'` żeby fretboard wiedział co wyświetlić
- **Osobna flaga `aiMode` poza `DomainState`** (np. w `HomePageComponent`): odrzucone — AI może być włączane/wyłączane przez narzędzia AI (`set_ai_mode`), więc stan musi być w `DomainService`
- **Nasłuchiwanie na zmiany `mode` w `HomePageComponent` i przywracanie `aiMode`**: odrzucone — kruche, race condition z async AI
- **`displayMode` jako computed z `mode`**: odrzucone — na starcie `mode='scale'` dawałoby `displayMode='legend'`, co pokazywałoby legendę bez żadnej akcji użytkownika

## Konsekwencje

- `DomainState.mode` zostaje uproszczone (bez `'ai'`)
- `DomainState` zyskuje `aiModeEnabled: boolean` i `displayMode: 'legend' | 'relationship' | null`
- `DomainService` traci `previousMode` — prostsza logika
- `HomePageComponent` ma mniej stanu — `displayMode` i `rangeDisabled` są computed, nie signal
- Legenda działa poprawnie dla obu klientów (Toolbox i AI)
- Chat pozostaje widoczny po wykonaniu komendy przez AI
- `clear-view` nie wyłącza trybu AI
- Wymaga aktualizacji testów w `home-page.component.spec.ts`
- Wymaga aktualizacji `docs/glossary.md` — zmiana opisu `mode` i dodanie `aiModeEnabled` / `displayMode`

## Pliki zmienione

| Plik | Zmiana |
|------|--------|
| [`src/app/domain/state.ts`](src/app/domain/state.ts) | Dodanie `aiModeEnabled`, `displayMode`; usunięcie `'ai'` z `mode`; aktualizacja `DEFAULT_DOMAIN_STATE` |
| [`src/app/domain/domain.service.ts`](src/app/domain/domain.service.ts) | `handleSetAiMode` zmienia tylko `aiModeEnabled`; wszystkie handlery ustawiają `displayMode`; usunięcie `previousMode`; `clear-view` zachowuje `aiModeEnabled` |
| [`src/app/home-page/home-page.component.ts`](src/app/home-page/home-page.component.ts) | `aiMode` → computed z `aiModeEnabled`; `displayMode` → computed z `DomainState.displayMode`; `rangeDisabled` → computed; `onToolboxEvent` uproszczone |
| [`src/app/home-page/home-page.component.spec.ts`](src/app/home-page/home-page.component.spec.ts) | Aktualizacja testów dla computed `displayMode` i delegacji |
| [`docs/glossary.md`](docs/glossary.md) | Aktualizacja opisu `mode`, dodanie `aiModeEnabled` i `displayMode` |