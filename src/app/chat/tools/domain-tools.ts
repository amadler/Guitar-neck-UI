import { tool } from "langchain/tools";
import { z } from "zod";
import { DomainService } from "../../domain/domain.service";
import { DomainCommand } from "../../domain/commands";

const showPatternSchema = z.object({
  patternType: z.enum(["scale", "chord"]).describe("Typ patternu: 'scale' dla skali, 'chord' dla akordu"),
  patternName: z.string().describe("Nazwa patternu, np. 'major', 'minor', 'pentatonic major'"),
  rootNote: z.string().describe("Nuta podstawowa, np. 'C', 'A', 'G', 'D'"),
  fretRange: z.object({
    min: z.number().min(0).max(24),
    max: z.number().min(0).max(24),
  }).optional().describe("Opcjonalny zakres progów"),
});
type ShowPatternInput = z.infer<typeof showPatternSchema>;

const showIntervalSchema = z.object({
  rootNote: z.string().describe("Nuta podstawowa"),
  interval: z.string().describe("Nazwa interwału, np. b3, 3, 5, b7"),
});
type ShowIntervalInput = z.infer<typeof showIntervalSchema>;

export function createDomainTools(domainService: DomainService) {
  return [
    tool(
      async (input: ShowPatternInput) => {
        const command: DomainCommand = {
          type: "show-pattern",
          patternType: input.patternType,
          patternName: input.patternName,
          rootNote: input.rootNote,
          fretRange: input.fretRange,
        };
        const result = domainService.execute(command);
        return {
          success: result.success,
          action: "show-pattern",
          patternType: input.patternType,
          patternName: input.patternName,
          rootNote: input.rootNote,
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
        return {
          success: result.success,
          action: "show-interval",
          rootNote: input.rootNote,
          interval: input.interval,
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
  ];
}