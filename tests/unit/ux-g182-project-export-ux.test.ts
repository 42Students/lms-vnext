import { describe, expect, it } from "vitest";
import { exportClassTeamsCsv } from "@/modules/projects/class-team-csv-export";
import { learnerProjectActivityCsv } from "@/modules/projects/learner-project-activity-csv-model";
import { mentorCalendarCsv } from "@/modules/projects/mentor-calendar-export-model";
import { mentorPortfolioActivityCsv } from "@/modules/projects/mentor-portfolio-activity-export-model";
import { mentorActivityCsv } from "@/modules/projects/mentor-project-activity-export-model";
import { mentorReviewExportCsv } from "@/modules/projects/mentor-review-export-model";
import { mentorReviewedTasksCsv } from "@/modules/projects/mentor-task-review-export-model";

const when = new Date("2026-11-07T13:00:00Z");

describe("UX-G182 — safe, legible scoped project exports", () => {
  it("preserves non-Latin names and defuses formula-prefixed roll labels in class teams", () => {
    const csv = exportClassTeamsCsv(
      [{ name: "తెలుగు Team", membershipIds: ["m-1"] }],
      new Map([["m-1", "\u2060=HYPERLINK(1)"]]),
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("తెలుగు Team");
    expect(csv).toContain("'\u2060=HYPERLINK(1)");
    expect(csv).toContain("\r\n");
  });

  it("truncates learner cells on Unicode code-point boundaries and retains scoped row cap", () => {
    const summary = "a".repeat(239) + "😀" + "tail";
    const row = { occurredAt: when, actorDisplayName: "\u202E+BAD", subjectLabel: null, summary };
    const report = learnerProjectActivityCsv([row]);
    expect(report.content.startsWith("\uFEFF")).toBe(true);
    expect(report.content).toContain("a".repeat(239) + "😀");
    expect(report.content).not.toContain("tail");
    expect(report.content).toContain("'\u202E+BAD");
    const many = learnerProjectActivityCsv(Array.from({length:101},()=>row));
    expect(many.truncated).toBe(true);
    expect(many.content.split("\r\n").filter(Boolean)).toHaveLength(101);
  });

  it("caps project activity CSV at 200 even when its caller sends more rows", () => {
    const row = { id:"event-1", label:"=FORMULA", importance:"HIGH", occurredAt:when };
    const csv = mentorActivityCsv(Array.from({length:201},()=>row),2);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(202);
    expect(csv).toContain("3 additional recorded events");
    expect(csv).toContain("'=FORMULA");
    expect(mentorActivityCsv([],Number.NaN)).not.toContain("Export truncated");
    expect(mentorActivityCsv([],-4)).not.toContain("Export truncated");
  });

  it("puts calendar truncation guidance under a clear notice cell", () => {
    const csv = mentorCalendarCsv([],3);
    expect(csv).toContain('"Truncated export","","3 additional matching meetings"');
    expect(csv).not.toContain("joinUrl");
  });

  it("puts portfolio activity truncation guidance under a clear notice cell", () => {
    const csv = mentorPortfolioActivityCsv([],2);
    expect(csv).toContain('"Truncated export","","2 additional matching events"');
    expect(csv).not.toContain("actorEmail");
  });

  it("keeps review-needed CSV capped with visible omitted count", () => {
    const csv = mentorReviewExportCsv([],4);
    expect(csv).toContain('"Export capped","","4 more matching deliveries"');
    expect(csv).not.toContain("reviewNotes");
  });

  it("keeps task review CSV capped with visible omitted count", () => {
    const csv = mentorReviewedTasksCsv([],5);
    expect(csv).toContain('"Truncated export","","5 additional reviewed versions"');
    expect(csv).not.toContain("learner_email");
  });
});
