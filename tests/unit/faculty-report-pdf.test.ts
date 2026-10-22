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
    expect(pdf).toContain("(Week 2 \\(Java\\) \\\\ Homework)");
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

  it("keeps a section heading with its first row across a page boundary", () => {
    const pdf = buildFacultyReportPdf({
      ...base,
      summary: Array.from({ length: 49 }, (_, index) => "Summary " + index),
      sections: [{ title: "Learner results", rows: ["Student A: 9/10"] }],
    });
    const streams = [...pdf.matchAll(/stream\n([\s\S]*?)endstream/g)].map(match => match[1]);
    expect(streams.length).toBe(2);
    expect(streams[0]).not.toContain("(Learner results)");
    expect(streams[1]).toContain("(Learner results)");
    expect(streams[1]).toContain("(Student A: 9/10)");
  });

  it("normalizes non-ASCII text to PDF-safe printable content", () => {
    const pdf = buildFacultyReportPdf({ ...base, title: "École – Report" });
    expect(pdf).toContain("(\\311cole \\226 Report)");
    expect([...pdf].every((character) => character.charCodeAt(0) <= 127)).toBe(true);
  });
});


describe("Faculty monthly Attendance PDF", () => {
  it("exports the current Section's marked and unknown outcomes as a valid PDF", () => {
    const pdf = buildFacultyReportPdf({
      kind: "attendance", title: "October class health",
      subtitle: "Course A · Section One",
      summary: ["Absent: 1", "Unmarked: 3 excluded from percentage"],
      sections: [{ title: "Student attendance", rows: ["Learner A | P 2 | A 1 | 67%"] }],
      generatedAt: new Date("2026-10-14T00:00:00Z"),
    });
    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf).toContain("FACULTY ATTENDANCE REPORT");
    expect(pdf).toContain("Unmarked: 3 excluded from");
    expect(pdf).toContain("(percentage)");
    expect(pdf).toContain("Learner A | P 2 | A 1 | 67%");
  });
});
