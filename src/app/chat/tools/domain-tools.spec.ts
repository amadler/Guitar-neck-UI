import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDomainTools } from "./domain-tools";
import { DomainService } from "../../domain/domain.service";

describe("createDomainTools", () => {
  let mockDomainService: { execute: ReturnType<typeof vi.fn> };
  let tools: any[];

  beforeEach(() => {
    mockDomainService = {
      execute: vi.fn().mockReturnValue({ success: true, action: "test", message: "ok" }),
    };
    tools = createDomainTools(mockDomainService as unknown as DomainService);
  });

  describe("show_pattern tool", () => {
    it("should call DomainService.execute() with show-pattern command", async () => {
      const showPatternTool = tools[0];

      const result = await showPatternTool.invoke({
        patternType: "scale",
        patternName: "major",
        rootNote: "C",
      });

      expect(mockDomainService.execute).toHaveBeenCalledWith({
        type: "show-pattern",
        patternType: "scale",
        patternName: "major",
        rootNote: "C",
        fretRange: undefined,
      });
      expect(result).toMatchObject({
        success: true,
        action: "show-pattern",
        patternType: "scale",
        patternName: "major",
        rootNote: "C",
      });
    });

    it("should include fretRange when provided", async () => {
      const showPatternTool = tools[0];

      await showPatternTool.invoke({
        patternType: "chord",
        patternName: "major",
        rootNote: "C",
        fretRange: { min: 0, max: 5 },
      });

      expect(mockDomainService.execute).toHaveBeenCalledWith({
        type: "show-pattern",
        patternType: "chord",
        patternName: "major",
        rootNote: "C",
        fretRange: { min: 0, max: 5 },
      });
    });
  });

  describe("show_interval tool", () => {
    it("should call DomainService.execute() with show-interval command", async () => {
      const showIntervalTool = tools[1];

      const result = await showIntervalTool.invoke({
        rootNote: "C",
        interval: "3",
      });

      expect(mockDomainService.execute).toHaveBeenCalledWith({
        type: "show-interval",
        rootNote: "C",
        interval: "3",
      });
      expect(result).toMatchObject({
        success: true,
        action: "show-interval",
        rootNote: "C",
        interval: "3",
      });
    });
  });

  describe("clear_view tool", () => {
    it("should call DomainService.execute() with clear-view command", async () => {
      const clearViewTool = tools[2];

      const result = await clearViewTool.invoke({});

      expect(mockDomainService.execute).toHaveBeenCalledWith({
        type: "clear-view",
      });
      expect(result).toMatchObject({
        success: true,
        action: "clear-view",
      });
    });
  });
});