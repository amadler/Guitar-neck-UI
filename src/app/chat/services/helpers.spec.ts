import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./helpers";

describe("renderMarkdown", () => {
  it("should convert bold text", () => {
    const result = renderMarkdown("**text**");
    expect(result).toContain("<strong>text</strong>");
  });

  it("should convert multiple bold occurrences", () => {
    const result = renderMarkdown("**text** i **text2**");
    expect(result).toContain("<strong>text</strong>");
    expect(result).toContain("<strong>text2</strong>");
  });

  it("should convert inline code", () => {
    const result = renderMarkdown("`code`");
    expect(result).toContain("<code>code</code>");
  });

  it("should convert headers", () => {
    const result = renderMarkdown("## Header");
    expect(result).toContain("<h3>Header</h3>");
  });

  it("should convert lists", () => {
    const result = renderMarkdown("- item1\n- item2");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>item1</li>");
    expect(result).toContain("<li>item2</li>");
    expect(result).toContain("</ul>");
  });

  it("should convert paragraphs separated by double newline", () => {
    const result = renderMarkdown("a\n\nb");
    expect(result).toBe("<p>a</p><p>b</p>");
  });

  it("should handle mixed bold and code", () => {
    const result = renderMarkdown("**bold** i `code`");
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<code>code</code>");
  });

  it("should escape HTML to prevent XSS", () => {
    const result = renderMarkdown("<script>alert(1)</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("should return empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("should return empty string for null", () => {
    expect(renderMarkdown(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(renderMarkdown(undefined)).toBe("");
  });

  it("should wrap plain text in paragraph", () => {
    expect(renderMarkdown("zwykły tekst")).toBe("<p>zwykły tekst</p>");
  });
});