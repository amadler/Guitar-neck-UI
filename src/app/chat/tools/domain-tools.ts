import { tool } from "langchain/tools";
import { z } from "zod";
import { interrupt } from "@langchain/langgraph";
import { DomainService } from "../../domain/domain.service";
import { DomainCommand } from "../../domain/commands";
import { DomainQuery } from "../../domain/queries";
import { DomainState } from '../../domain/state';

const showPatternSchema = z.object({
  patternType: z.enum(["scale", "chord"]).describe("Typ patternu: 'scale' dla skali, 'chord' dla akordu"),
  patternName: z.string().describe("Nazwa patternu, np. 'major', 'minor', 'pentatonic major'"),
  rootNote: z.string().describe("Nuta podstawowa, np. 'C', 'A', 'G', 'D'"),
  fretRange: z.object({
    min: z.number().min(0).max(24),
    max: z.number().min(0).max(24),
  }).optional().describe("Opcjonalny zakres progów"),
  emphasis: z.object({
    intervals: z.array(z.string()).optional().describe("Interwały do podświetlenia, np. ['1', '3', '5']"),
    roles: z.array(z.string()).optional().describe("Role do podświetlenia, np. ['root', 'third']"),
  }).optional().describe("Opcjonalne podświetlenie konkretnych interwałów"),
});
type ShowPatternInput = z.infer<typeof showPatternSchema>;

const showIntervalSchema = z.object({
  rootNote: z.string().describe("Nuta podstawowa"),
  interval: z.string().describe("Nazwa interwału, np. b3, 3, 5, b7"),
});
type ShowIntervalInput = z.infer<typeof showIntervalSchema>;

const comparePatternsSchema = z.object({
  primary: z.object({
    patternType: z.enum(["scale", "chord"]).describe("Typ pierwszego patternu"),
    patternName: z.string().describe("Nazwa pierwszego patternu, np. 'major', 'minor'"),
    rootNote: z.string().describe("Nuta podstawowa pierwszego patternu, np. 'C', 'A'"),
  }),
  secondary: z.object({
    patternType: z.enum(["scale", "chord"]).describe("Typ drugiego patternu"),
    patternName: z.string().describe("Nazwa drugiego patternu, np. 'major', 'minor'"),
    rootNote: z.string().describe("Nuta podstawowa drugiego patternu, np. 'C', 'A'"),
  }),
});
type ComparePatternsInput = z.infer<typeof comparePatternsSchema>;

const setViewSchema = z.object({
  fretRange: z.object({
    min: z.number().min(0).max(24),
    max: z.number().min(0).max(24),
  }).optional().describe("Opcjonalny zakres progów"),
  enabledStrings: z.array(z.boolean()).length(6).optional().describe("Opcjonalnie które struny są aktywne (6 elementów)"),
  markerDisplayMode: z.enum(["interval-colors", "note-names", "neutral-dots"]).optional().describe("Tryb wyświetlania markerów"),
});
type SetViewInput = z.infer<typeof setViewSchema>;

const setEmphasisSchema = z.object({
  emphasis: z.object({
    intervals: z.array(z.string()).optional().describe("Interwały do podświetlenia, np. ['1', '3', '5']"),
    roles: z.array(z.string()).optional().describe("Role do podświetlenia, np. ['root', 'third']"),
  }),
});
type SetEmphasisInput = z.infer<typeof setEmphasisSchema>;

const resolveShapeSchema = z.object({
  shapeId: z.string().describe("ID kształtu, np. 'cowboy-C', 'barre-E-form'"),
  rootNote: z.string().optional().describe("Root note dla movable shapes (barre), np. 'F'"),
});
type ResolveShapeInput = z.infer<typeof resolveShapeSchema>;

const setAiModeSchema = z.object({
  enabled: z.boolean().describe("true = włącz tryb AI, false = wyłącz"),
});
type SetAiModeInput = z.infer<typeof setAiModeSchema>;

const startExerciseSchema = z.object({
  question: z.string().describe("Pytanie do użytkownika, np. 'Znajdź wszystkie kwinty względem A'"),
  rootNote: z.string().describe("Nuta podstawowa, np. 'A', 'C'"),
  expectedIntervals: z.array(z.string()).describe("Oczekiwane interwały, np. ['5'], ['1', 'b3']"),
  fretRange: z.object({
    min: z.number().min(0).max(24),
    max: z.number().min(0).max(24),
  }).optional().describe("Opcjonalny zakres progów do wyświetlenia"),
  enabledStrings: z.array(z.boolean()).length(6).optional().describe("Opcjonalnie które struny mają być aktywne"),
});
type StartExerciseInput = z.infer<typeof startExerciseSchema>;

/**
 * Context passed to tools for lesson-mode awareness.
 * Tools use isLessonMode() to decide whether to call interrupt().
 * getPendingExerciseKey / setPendingExerciseKey track whether
 * start_exercise is being resumed (same key) or called for the
 * first time (different/null key). Must use a getter function
 * so the tool reads the live value, not a snapshot from creation.
 */
export interface LessonToolContext {
  isLessonMode: () => boolean;
  getPendingExerciseKey: () => string | null;
  setPendingExerciseKey: (key: string | null) => void;
}

export function createDomainTools(
  domainService: DomainService,
  context?: LessonToolContext,
) {
  return [
    tool(
      async (input: ShowPatternInput) => {
        const command: DomainCommand = {
          type: "show-pattern",
          patternType: input.patternType,
          patternName: input.patternName,
          rootNote: input.rootNote,
          fretRange: input.fretRange,
          emphasis: input.emphasis,
        };
        const result = domainService.execute(command);

        // Interrupt in lesson mode — user needs time to see the pattern.
        // On resume, interrupt() returns the user's response so the LLM
        // can see it in the tool output.
        let userResponse: unknown = undefined;
        if (context?.isLessonMode()) {
          userResponse = interrupt({
            type: 'lesson_step',
            action: 'show_pattern',
            patternType: input.patternType,
            patternName: input.patternName,
            rootNote: input.rootNote,
          });
        }

        return {
          success: result.success,
          action: "show-pattern",
          patternType: input.patternType,
          patternName: input.patternName,
          rootNote: input.rootNote,
          userResponse,
          message: result.success
            ? `Pokazano ${input.patternType} ${input.patternName} (${input.rootNote})`
            : result.message,
        };
      },
      {
        name: "show_pattern",
        description: "Wyświetla skalę lub akord na gryfie gitary. Użyj gdy użytkownik poprosi o pokazanie skali (np. C-dur, A-moll) lub akordu (np. C-dur, Am).",
        schema: showPatternSchema,
      }
    ),
    tool(
      async (input: ShowIntervalInput) => {
        const command: DomainCommand = { type: "show-interval", rootNote: input.rootNote, interval: input.interval };
        const result = domainService.execute(command);

        // Interrupt in lesson mode — user needs time to see the interval.
        // On resume, interrupt() returns the user's response so the LLM
        // can see it in the tool output.
        let userResponse: unknown = undefined;
        if (context?.isLessonMode()) {
          userResponse = interrupt({
            type: 'lesson_step',
            action: 'show_interval',
            rootNote: input.rootNote,
            interval: input.interval,
          });
        }

        return {
          success: result.success,
          action: "show-interval",
          rootNote: input.rootNote,
          interval: input.interval,
          userResponse,
          message: result.success
            ? `Pokazano interwał ${input.interval} od ${input.rootNote}`
            : result.message,
        };
      },
      {
        name: "show_interval",
        description: "Wyświetla pojedynczy interwał od root note na gryfie",
        schema: showIntervalSchema,
      }
    ),
    tool(
      async () => {
        const result = domainService.execute({ type: "clear-view" });
        return {
          success: result.success,
          action: "clear-view",
          message: result.success ? "Widok wyczyszczony" : result.message,
        };
      },
      {
        name: "clear_view",
        description: "Czyści gryf i resetuje widok do domyślnego stanu",
        schema: z.object({}),
      }
    ),

    tool(
      async () => {
        const query: DomainQuery = { type: "get-current-view" };
        const result = domainService.query<DomainState>(query);
        if (!result.success) {
          return { success: false, action: "get-current-view", message: result.message };
        }
        return {
          success: true,
          action: "get-current-view",
          mode: result.data.mode,
          rootNote: result.data.rootNote,
          patternName: result.data.patternName,
          message: `Aktualny widok: ${result.data.mode} ${result.data.patternName} (${result.data.rootNote})`,
        };
      },
      {
        name: "get_current_view",
        description: "Pobiera aktualny stan widoku gryfu",
        schema: z.object({}),
      }
    ),
    //compare-patterns
    tool(
      async (input: ComparePatternsInput) => {
        const command: DomainCommand = {
          type: "compare-patterns",
          primary: input.primary,
          secondary: input.secondary,
        };
        const result = domainService.execute(command);

        // Interrupt in lesson mode — user needs time to see the comparison.
        // On resume, interrupt() returns the user's response so the LLM
        // can see it in the tool output.
        let userResponse: unknown = undefined;
        if (context?.isLessonMode()) {
          userResponse = interrupt({
            type: 'lesson_step',
            action: 'compare_patterns',
            primary: input.primary,
            secondary: input.secondary,
          });
        }

        return {
          success: result.success,
          action: "compare-patterns",
          primary: input.primary,
          secondary: input.secondary,
          userResponse,
          message: result.success
            ? `Porównano ${input.primary.patternName} (${input.primary.rootNote}) z ${input.secondary.patternName} (${input.secondary.rootNote})`
            : result.message,
        };
      },
      {
        name: "compare_patterns",
        description: "Porównuje dwa patterny (skalę z akordem) na gryfie. Użyj gdy użytkownik chce zobaczyć jak skala nakłada się na akord (np. 'pokaż C-dur z Am', 'porównaj skalę z akordem').",
        schema: comparePatternsSchema,
      }
    ),
    //set-view
    tool(
      async (input: SetViewInput) => {
        const command: DomainCommand = {
          type: "set-view",
          fretRange: input.fretRange,
          enabledStrings: input.enabledStrings,
          markerDisplayMode: input.markerDisplayMode,
        };
        const result = domainService.execute(command);
        return {
          success: result.success,
          action: "set-view",
          message: result.success ? "Widok zaktualizowany" : result.message,
        };
      },
      {
        name: "set_view",
        description: "Zmienia konfigurację widoku gryfu (zakres progów, aktywne struny, tryb wyświetlania markerów) bez zmiany patternu.",
        schema: setViewSchema,
      }
    ),
    //set-emphasis
    tool(
      async (input: SetEmphasisInput) => {
        const command: DomainCommand = {
          type: "set-emphasis",
          emphasis: input.emphasis,
        };
        const result = domainService.execute(command);
        return {
          success: result.success,
          action: "set-emphasis",
          emphasis: input.emphasis,
          message: result.success
            ? `Ustawiono emphasis: ${JSON.stringify(input.emphasis)}`
            : result.message,
        };
      },
      {
        name: "set_emphasis",
        description: "Podświetla konkretne interwały lub role na bieżącym patternie. Użyj gdy użytkownik chce wyróżnić np. tylko tercje i kwinty.",
        schema: setEmphasisSchema,
      }
    ),
    //resolve-shape
    tool(
      async (input: ResolveShapeInput) => {
        const command: DomainCommand = {
          type: "resolve-shape",
          shapeId: input.shapeId,
          rootNote: input.rootNote,
        };
        const result = domainService.execute(command);

        // Interrupt in lesson mode — user needs time to see the shape.
        // On resume, interrupt() returns the user's response so the LLM
        // can see it in the tool output.
        let userResponse: unknown = undefined;
        if (context?.isLessonMode()) {
          userResponse = interrupt({
            type: 'lesson_step',
            action: 'resolve_shape',
            shapeId: input.shapeId,
            rootNote: input.rootNote,
          });
        }

        return {
          success: result.success,
          action: "resolve-shape",
          shapeId: input.shapeId,
          rootNote: input.rootNote,
          userResponse,
          message: result.success
            ? `Pokazano kształt ${input.shapeId}${input.rootNote ? ` (${input.rootNote})` : ''}`
            : result.message,
        };
      },
      {
        name: "resolve_shape",
        description: "Wyświetla nazwany kształt (cowboy chord, barre) na gryfie. Użyj gdy użytkownik zapyta o chwyty gitarowe, np. 'pokaż chwyt C-dur', 'pokaż barre F'.",
        schema: resolveShapeSchema,
      }
    ),
    //set-ai-mode
    tool(
      async (input: SetAiModeInput) => {
        const command: DomainCommand = {
          type: "set-ai-mode",
          enabled: input.enabled,
        };
        const result = domainService.execute(command);
        return {
          success: result.success,
          action: "set-ai-mode",
          enabled: input.enabled,
          message: result.success
            ? (input.enabled ? "Tryb AI włączony" : "Tryb AI wyłączony")
            : result.message,
        };
      },
      {
        name: "set_ai_mode",
        description: "Włącza lub wyłącza tryb AI. Gdy włączony, metronom chowa się a czat zajmuje stałą szerokość.",
        schema: setAiModeSchema,
      }
    ),
    //start-exercise
    tool(
      async (input: StartExerciseInput) => {
        // Build a stable key from exercise parameters to distinguish
        // "resume of the same exercise" from "start of a new exercise".
        const key = JSON.stringify({
          question: input.question,
          rootNote: input.rootNote,
          expectedIntervals: input.expectedIntervals,
          fretRange: input.fretRange,
          enabledStrings: input.enabledStrings,
        });

        // First call (not resume): execute start-exercise and record the key
        // Uses getter function so the live value is read, not a creation-time snapshot.
        if (context && context.getPendingExerciseKey() !== key) {
          const command: DomainCommand = {
            type: "start-exercise",
            question: input.question,
            rootNote: input.rootNote,
            expectedIntervals: input.expectedIntervals,
            fretRange: input.fretRange,
            enabledStrings: input.enabledStrings,
          };
          domainService.execute(command);
          context.setPendingExerciseKey(key);
        }

        // Interrupt in lesson mode — user needs to click notes on the fretboard.
        // On resume, interrupt() returns the resume value (ExerciseResult from
        // resumeWithExerciseResult, or user message if resumed via send()).
        const resumeValue = context?.isLessonMode()
          ? interrupt({
              type: 'exercise',
              question: input.question,
              rootNote: input.rootNote,
              expectedIntervals: input.expectedIntervals,
            })
          : undefined;

        // After resume: clear the pending key and read the exercise result
        context?.setPendingExerciseKey(null);
        const state = domainService.query<DomainState>({ type: "get-current-view" });
        const exerciseResult = state.success ? state.data.lastExerciseResult : undefined;

        return {
          success: true,
          action: "start-exercise",
          question: input.question,
          rootNote: input.rootNote,
          expectedIntervals: input.expectedIntervals,
          exerciseResult,
          message: exerciseResult
            ? `Ćwiczenie zakończone. Poprawne: ${exerciseResult.correctCount}, błędne: ${exerciseResult.incorrectCount}`
            : `Rozpoczęto ćwiczenie: ${input.question}`,
        };
      },
      {
        name: "start_exercise",
        description: "Rozpoczyna ćwiczenie w trybie lekcji. Aktywuje klikalny tryb na gryfie — użytkownik może zaznaczać nuty. Gdy skończy, kliknie Sprawdź. Użyj gdy prowadzisz lekcję i chcesz zadać pytanie typu 'znajdź wszystkie kwinty względem A'.",
        schema: startExerciseSchema,
      }
    ),
    //submit-exercise
    tool(
      async () => {
        const result = domainService.execute({ type: "submit-exercise" });
        if (!result.success) {
          return { success: false, action: "submit-exercise", message: result.message };
        }
        // Read the exercise result from state
        const state = domainService.query<DomainState>({ type: "get-current-view" });
        const exerciseResult = state.success ? state.data.lastExerciseResult : undefined;
        return {
          success: true,
          action: "submit-exercise",
          exerciseResult,
          message: exerciseResult
            ? `Ćwiczenie sprawdzone. Poprawne: ${exerciseResult.correctCount}, błędne: ${exerciseResult.incorrectCount}`
            : "Ćwiczenie sprawdzone.",
        };
      },
      {
        name: "submit_exercise",
        description: "Zatwierdza aktualne ćwiczenie do sprawdzenia. Aplikacja weryfikuje zaznaczone nuty i zwraca wynik. Użyj po tym jak użytkownik zaznaczy nuty i kliknie Sprawdź.",
        schema: z.object({}),
      }
    ),
    //get-exercise-result
    tool(
      async () => {
        const state = domainService.query<DomainState>({ type: "get-current-view" });
        if (!state.success) {
          return { success: false, action: "get-exercise-result", message: state.message };
        }
        return {
          success: true,
          action: "get-exercise-result",
          exerciseMode: state.data.exerciseMode,
          exerciseTask: state.data.exerciseTask,
          selectedNotes: state.data.selectedNotes,
          lastExerciseResult: state.data.lastExerciseResult,
        };
      },
      {
        name: "get_exercise_result",
        description: "Pobiera wynik ostatniego ćwiczenia oraz aktualny stan trybu ćwiczeń. Użyj gdy chcesz sprawdzić co użytkownik zaznaczył lub jaki był wynik walidacji.",
        schema: z.object({}),
      }
    ),
  ];
}