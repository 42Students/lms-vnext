import { describe, expect, it } from "vitest";
import {
  importedJobImportantDates,
  legacyJobImportantDateProjectionPair,
  projectLegacyJobImportantDate,
} from "@/modules/placements/job-important-date-adapter";

describe("legacy job important date DTO primary/fallback projection", () => {
  const identity = { title: "Graduate Analyst", companyName: "Example Company" };
  const details = {
    importantDates: [
      { label: "Recruiter briefing", date: "2026-12-10T09:00:00Z", type: "ASSESSMENT" },
      { label: "Interview schedule", at: "2026-12-12T11:30:00Z", dateType: "ROUND" },
      { label: "Application deadline", at: "2026-12-15", type: "APPLICATION_DEADLINE" },
    ],
  };

  it("preserves authored type and alias identically in primary DTO and fallback JSON", () => {
    const { primary, fallback } = legacyJobImportantDateProjectionPair(
      "job-1", details, identity,
    );
    expect(primary).toHaveLength(3);
    expect(primary.map(({ source, ...row }) => row))
      .toEqual(fallback.map(({ source, ...row }) => row));
    expect(primary.map(row => row.type))
      .toEqual(["ASSESSMENT", "ROUND", "APPLICATION_DEADLINE"]);
    expect(primary.every(row => row.eventType === "JOB_IMPORTANT_DATE")).toBe(true);
    expect(primary[0]).toMatchObject({
      jobId: "job-1", jobTitle: "Graduate Analyst", companyName: "Example Company",
      label: "Recruiter briefing", sourceIndex: 0,
    });
  });

  it("keeps an unknown authored type null rather than deriving it from the label", () => {
    const [source] = importedJobImportantDates("job-2", {
      importantDates: [{ label: "Interview", at: "2026-12-16" }],
    });
    expect(source).toBeDefined();
    if (!source) throw new Error("Expected fixture date");
    expect(projectLegacyJobImportantDate(source, identity, "PRIMARY").type).toBeNull();
  });

  it("discards malformed dates without inventing calendar events", () => {
    const pair = legacyJobImportantDateProjectionPair(
      "job-3", { importantDates: [{ label: "Test", date: "not-a-date" }] }, identity,
    );
    expect(pair).toEqual({ primary: [], fallback: [] });
  });
});
