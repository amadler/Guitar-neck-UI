# Dokumentacja Ekosystemu Guitar Neck App — Wytyczne

> **Cel:** Ujednolicenie struktury, formatu i procesu prowadzenia dokumentacji we
> wszystkich repozytoriach ekosystemu Guitar Neck App.
> **Dotyczy:** `guitar-neck-ui` (to repo), `music-theory-api`, `guitar-toolbox`,
> `guitar-neck-shared`.

---

## Spis treści

- [1. Struktura dokumentacji w repozytorium](#1-struktura-dokumentacji-w-repozytorium)
- [2. Obowiązkowe dokumenty](#2-obowiązkowe-dokumenty)
- [3. Język dokumentacji](#3-język-dokumentacji)
- [4. Szablony dokumentów](#4-szablony-dokumentów)
- [5. Lista spójności cross-repo](#5-lista-spójności-cross-repo)
- [6. Proces aktualizacji](#6-proces-aktualizacji)

---

## 1. Struktura dokumentacji w repozytorium

Każde repozytorium trzyma dokumentację w katalogu głównym. Plany i propozycje
lądują w `plans/`.

```
<repo-root>/
├── README.md                  # Wprowadzenie (obowiązkowy)
├── AGENTS.md                  # Instrukcje dla agentów AI (obowiązkowy)
├── BACKLOG.md                 # Rejestr zadań (obowiązkowy)
├── CHANGELOG.md               # Historia zmian (obowiązkowy)
├── API.md                     # Endpointy (jeśli repo ma API)
├── ARCHITECTURE.md            # Architektura (jeśli repo > 1 komponent)
├── PRODUCT_OVERVIEW.md        # Opis produktu (opcjonalny)
├── DEVELOPMENT.md             # Setup dev (opcjonalny)
├── TODO_DEPLOY.md             # Kroki deploy (opcjonalny)
└── plans/                     # Propozycje, refactoringi
    └── *.md
```

---

## 2. Obowiązkowe dokumenty

Każde repozytorium **MUSI** zawierać:

| Dokument | Wymagany | `guitar-neck-ui` | `music-theory-api` | `guitar-toolbox` | `guitar-neck-shared` |
|---|---|---|---|---|---|
| `README.md` | ✅ tak | ✅ | ✅ | ✅ | ✅ |
| `AGENTS.md` | ✅ tak | ✅ | ✅ | ✅ | ❌ **do dodania** |
| `BACKLOG.md` | ✅ tak | ✅ | ✅ | ✅ | ❌ **do dodania** |
| `CHANGELOG.md` | ✅ tak | ✅ | ✅ | ❌ **do dodania** | ❌ **do dodania** |
| `API.md` | jeśli ma API | ✅ (`API_DOCUMENTATION.md`) | ✅ | ❌ N/A | ❌ N/A |
| `ARCHITECTURE.md` | jeśli >1 komponent | ✅ | ❌ **do dodania** | ⚠️ (w `plans/`) | ❌ N/A |

Legenda: ✅ — jest, ❌ — brak, ⚠️ — jest ale w złym miejscu

---

## 3. Język dokumentacji

| Dokument | Język | Uzasadnienie |
|---|---|---|
| `README.md` | angielski | Widoczny na GitHub, pierwsze wrażenie |
| `CHANGELOG.md` | angielski | Standard Keep a Changelog, widoczny dla konsumentów |
| `API.md` | angielski | Konsumenci API mogą być zewnętrzni |
| `AGENTS.md` | angielski | AI agenty działają lepiej po angielsku |
| `BACKLOG.md` | polski | Dokument wewnętrzny zespołu |
| `ARCHITECTURE.md` | polski | Wewnętrzna dokumentacja techniczna |
| `PRODUCT_OVERVIEW.md` | polski | Wewnętrzna dokumentacja produktowa |
| `DEVELOPMENT.md` | polski | Wewnętrzny setup deweloperski |
| `plans/*.md` | polski | Wewnętrzne plany i propozycje |

**Zasada ogólna:** dokumenty widoczne dla osób z zewnątrz (README, CHANGELOG,
API) — po angielsku. Dokumenty wewnętrzne zespołu — po polsku.

Kod źródłowy w blokach \`\`\` (zmienne, typy, interfejsy) — pozostaje
w oryginalnym języku (angielski). Nazwy własne (endpointy, zmienne
środowiskowe, klasy) — angielskie, opis w języku dokumentu.

---

## 4. Szablony dokumentów

### 4.1 README.md

```markdown
# [Nazwa Projektu]

[1-2 zdania opisu]

## Stack technologiczny

- **Runtime:** ...
- **Framework:** ...
- **Testy:** ...

## Szybki start

\`\`\`bash
\`\`\`

## Dokumentacja

- [Architektura](ARCHITECTURE.md)
- [API](API.md)
- [Backlog](BACKLOG.md)
- [Instrukcje dla agentów](AGENTS.md)
```

### 4.2 BACKLOG.md

Każdy wpis MUSI mieć dokładnie 6 sekcji w tej kolejności:

```markdown
# [Tytuł zadania]

## Motivation

Dlaczego to robimy? Jaki problem rozwiązuje?

## Solution

Jak to zrobimy — opis techniczny.

## MVP

Minimalny zakres — lista kroków do wykonania.

## Done when

Kryteria akceptacji.

## Status

OPEN | FIXED | POSTPONED | WON'T DO
```

**Reguły:**
- Statusy: tylko `OPEN`, `FIXED`, `POSTPONED`, `WON'T DO`
- Wpisy oddzielone `---`
- Żadnych dodatkowych tagów priorytetu — status wystarczy

### 4.3 CHANGELOG.md

Format oparty na [Keep a Changelog](https://keepachangelog.com/).
Projekt stosuje [Semantic Versioning](https://semver.org/).

```markdown
# Changelog

Wszystkie znaczące zmiany w tym projekcie są dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/),
a projekt stosuje [Semantic Versioning](https://semver.org/).

---

## [wersja] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

**Reguły:**
- Daty w formacie ISO: `YYYY-MM-DD`
- Linki do plików z numerami linii gdzie to możliwe

### 4.4 AGENTS.md

Wymagane sekcje:
1. **Tech stack** — runtime, framework, testy
2. **Key commands** — uruchamianie, testy, build
3. **Architecture / Project Map** — gdzie co leży
4. **Conventions** — nazewnictwo, wzorce
5. **Git workflow** — branch naming, merge policy
6. **Documentation Consistency Validation** — checklista dla tego repo

Przykład sekcji walidacji:
```markdown
## Documentation Consistency Validation

Przed commitem zmian w dokumentacji sprawdź:

- [ ] Nazwy serwisów/klas są takie same we wszystkich .md
- [ ] apiUrl (http://localhost:3000) jest spójny we wszystkich plikach
- [ ] BACKLOG.md statusy są zgodne z resztą dokumentów
- [ ] Ścieżki do plików faktycznie istnieją w repozytorium
- [ ] Endpointy backend API są spójne między dokumentami
- [ ] Żaden .md nie zawiera starych/nieaktualnych nazw
```

Checklistę należy dostosować do konkretnego repozytorium.

### 4.5 API.md

```markdown
# [Nazwa Projektu] — API

## Bazowy URL

```
http://localhost:3000
```

## Endpointy

### [Nazwa endpointu]

```
METODA /sciezka/:param
```

Parametry:
- `param`: opis

Przykład:
```
METODA /sciezka/wartosc
```

Odpowiedź:
```json
{
  "klucz": "wartosc"
}
```

## Obsługa błędów

...
```

### 4.6 ARCHITECTURE.md

Wymagane sekcje:
1. **Przegląd architektury** — warstwy, wzorce, diagram
2. **Główne komponenty** — tabelka
3. **Serwisy** — tabelka
4. **Przepływ danych** — diagram
5. **Wzorce projektowe**
6. **Zależności zewnętrzne**
7. **Konfiguracja środowiska**

---

## 5. Lista spójności cross-repo

Przed mergem zmiany dokumentacji w **dowolnym** repozytorium należy zweryfikować:

### 5.1 Nazwy serwisów i klas

| Encja | Źródło definicji | Występuje w |
|---|---|---|
| `FretboardOrchestrationService` | `guitar-neck-ui` | docs we wszystkich repo |
| `FretboardStateService` | `guitar-neck-ui` | docs we wszystkich repo |
| `DisplayScaleCommand` | `guitar-neck-ui` + `guitar-toolbox` | docs |
| `ToolboxSearchQuery` | `guitar-toolbox` (kod) | docs w `guitar-neck-ui` |
| `SCALE_PATTERNS` / `CHORD_PATTERNS` | `guitar-neck-shared` | docs we wszystkich repo |

### 5.2 Endpointy

| Endpoint | `API_DOCUMENTATION.md` | `music-theory-api/API.md` |
|---|---|---|
| `GET /api/scales` | ✅ | ✅ |
| `GET /api/scales/:name/:root` | ✅ | ✅ |
| `GET /api/chords` | ✅ | ✅ |
| `GET /api/chords/:name/:root` | ✅ | ✅ |
| `GET /api/find-compatible-scales/:name/:root` | do sprawdzenia | ✅ |
| `GET /api/health` | do sprawdzenia | ✅ |

### 5.3 Konfiguracja

| Element | Wartość | Gdzie występuje |
|---|---|---|
| `apiUrl` | `http://localhost:3000` | `environment.ts`, wszystkie `.md` |
| `chatEnabled` | `false` | `environment.ts`, `BACKLOG.md` |
| `API_BASE_URL` | domyślnie `http://localhost:3000/api` | `guitar-toolbox` InjectionToken |

### 5.4 Cross-repo checklista

```markdown
Cross-repo consistency checklist:
- [ ] Nazwy serwisów (FretboardOrchestrationService, itd.) są takie same
      we wszystkich .md we wszystkich repo
- [ ] apiUrl (http://localhost:3000) jest spójny we wszystkich plikach
- [ ] BACKLOG.md statusy są zgodne między repo (gdzie dotyczy)
- [ ] Ścieżki do plików faktycznie istnieją
- [ ] Endpointy backend API są spójne między API_DOCUMENTATION.md
      a music-theory-api/API.md
- [ ] AI Chat oznaczony jako POSTPONED wszędzie gdzie występuje
- [ ] Żaden .md nie zawiera starych nazw (MusicTheoryFacadeService, itp.)
- [ ] Wersje zależności (guitar-neck-shared, guitar-toolbox-lib) są aktualne
      we wszystkich package.json w ekosystemie
```

---

## 6. Proces aktualizacji

```
1. Konieczna zmiana w dokumentacji
2. Jeśli zmiana dotyczy wielu repo → zidentyfikuj wszystkie
3. Dla każdego repo:
   a. Utwórz branch feat/docs-* lub fix/docs-*
   b. Aktualizuj pliki .md
   c. Przejdź checklistę cross-repo
   d. Jeśli nie przechodzi → popraw
4. Commit + push
5. Zgłoś do merga
6. Squash-merge do mastera
```

**Zasady:**
- Nigdy nie commituj do `master` bezpośrednio
- Branch naming: `feat/docs-<opis>` lub `fix/docs-<opis>`
- Przed mergem przejdź checklistę z AGENTS.md i checklistę cross-repo
- Squash-merge preferred

---

*Ostatnia aktualizacja: 2026-07-08*
*Wersja: 1.0.0*
