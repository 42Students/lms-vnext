import { describe, expect, it } from "vitest";
import { buildFacultyReportPdf } from "@/modules/courses/faculty-report-pdf";

const base = {
  kind: "assignment" as const,
  title: "Week 2 (Java) \\ Homework",
  subtitle: "Course A · Section One",
  summary: ["Submitted: 2/3", "Average: 75%"],
  sections: [{ title: "Learner scores", rows: ["Asha: 18/20", "Ravi: 12/20"] }],
  generatedAt: new Date("2026-10-13T00:00:00Z"),
};

describe("Faculty PDF reports", () => {
  it("generates a real PDF with valid object offsets and escaped sensitive text", () => {
    const pdf = buildFacultyReportPdf(base);
    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf.endsWith("%%EOF\n")).toBe(true);
    expect(pdf).toContain("(Week 2 \\(Java\\) \\\\\\\\ Homework)");
    expect(pdf).toContain("(Submitted: 2/3)");
    const start = Number(pdf.match(/startxref\n(\d+)\n/)?.[1]);
    expect(pdf.slice(start, start + 5)).toBe("xref\n");
    const lines = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)];
    expect(lines.length).toBeGreaterThan(4);
    lines.forEach((line, index) => {
      const offset = Number(line[1]);
      expect(pdf.slice(offset)).toMatch(new RegExp("^" + (index + 1) + " 0 obj\\n"));
    });
  });

  it("paginates long reports and includes the final learner row", () => {
    const pdf = buildFacultyReportPdf({
      ...base,
      kind: "quiz",
      sections: [{ title: "Attempts", rows: Array.from({ length: 240 }, (_, index) => "Learner " + index + ": 8/10") }],
    });
    const pages = pdf.match(/\/Type \/Page \/Parent/g) ?? [];
    expect(pages.length).toBeGreaterThan(1);
    expect(pdf).toContain("Learner 239: 8/10");
    expect(pdf).toContain("Page 1 of " + pages.length);
  });

  it("normalizes non-ASCII text to PDF-safe printable content", () => {
    const pdf = buildFacultyReportPdf({ ...base, title: "École – Report" });
    expect(pdf).toContain("(Ecole ? Report)");
    expect([...pdf].every((character) => character.charCodeAt(0) <= 127)).toBe(true);
  });
});
