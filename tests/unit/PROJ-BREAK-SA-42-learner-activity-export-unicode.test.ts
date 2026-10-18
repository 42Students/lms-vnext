import { describe, expect, it } from "vitest";
import {
  learnerProjectActivityCsv,
} from "@/modules/projects/learner-project-activity-csv-model";

const occurredAt = new Date("2026-10-19T07:00:00.000Z");

describe("PROJ-BREAK-SA-42 IIT Dharwad learner activity CSV formula and cap safety", () => {
  it("prefixes disguised formulas behind combining, enclosing and C0 marks in every untrusted text column", () => {
    const originalActor = "\u034f=HYPERLINK(1)";
    const originalSubject = "\u20dd+SUM(1,2)";
    const originalSummary = "\u0000@EXTERNAL(1)";
    const result = learnerProjectActivityCsv([{
      occurredAt, actorDisplayName: originalActor,
      subjectLabel: originalSubject, summary: originalSummary,
    }]);
    expect(result.truncated).toBe(false);
    expect(result.content.startsWith("UTC time,Actor,Subject,Summary\r\n")).toBe(true);
    expect(result.content).toContain('"\'\u034f=HYPERLINK(1)"');
    expect(result.content).toContain('"\'\u20dd+SUM(1,2)"');
    expect(result.content).toContain('"\'\u0000@EXTERNAL(1)"');
    expect(result.content).toContain('"2026-10-19T07:00:00.000Z"');
  });

  it("does not make a false truncated claim for exactly 100 and excludes the 101st row", () => {
    const rows = Array.from({ length: 101 }, (_, index) => ({
      occurredAt, actorDisplayName: "Author " + index,
      subjectLabel: "Project " + index, summary: "Event " + index,
    }));
    expect(learnerProjectActivityCsv(rows.slice(0, 100)).truncated).toBe(false);
    const over = learnerProjectActivityCsv(rows);
    expect(over.truncated).toBe(true);
    expect(over.content).toContain('"Event 99"');
    expect(over.content).not.toContain('"Event 100"');
    expect(over.content.split("\r\n").filter(Boolean)).toHaveLength(101);
  });

  it("caps untrusted long summaries without damaging CSV quote escaping", () => {
    const result = learnerProjectActivityCsv([{
      occurredAt, actorDisplayName: "Member",
      subjectLabel: 'Project "A"',
      summary: "x".repeat(400),
    }]);
    expect(result.content).toContain('"Project ""A"""');
    expect(result.content).toContain('"' + "x".repeat(240) + '"');
    expect(result.content).not.toContain("x".repeat(241));
  });
});
