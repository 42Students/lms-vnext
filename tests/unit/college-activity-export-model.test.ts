import { describe, expect, it } from "vitest";
import {
  buildCollegeActivityCsv, COLLEGE_ACTIVITY_EXPORT_CAP,
  collegeActivityExportQuerySchema, escapeActivityCsvCell,
  readCollegeActivityExportParams,
} from "@/modules/activity/college-activity-export-model";

describe("College Activity CSV export", () => {
  it("uses the Activity Center filters but rejects caller-owned college and cursors", () => {
    const query = { module: "COURSES", importance: "HIGH",
      actorUserId: "10000000-0000-4000-8000-000000000001",
      from: "2026-10-01", to: "2026-10-14" };
    expect(collegeActivityExportQuerySchema.parse({...query,subjectId:"A-record"}))
      .toEqual({...query,subjectId:"A-record"});
    for (const invalid of [
      { collegeId: "foreign" },
      { beforeId: "10000000-0000-4000-8000-000000000001" },
      { module: "UNEXPECTED" },
      { actorUserId: "not-uuid" },
      { subjectId: "x".repeat(501) },
      { eventType: "x".repeat(121) },
    ]) expect(collegeActivityExportQuerySchema.safeParse(invalid).success).toBe(false);
    expect(readCollegeActivityExportParams(
      new URLSearchParams("module=COURSES&module=ACADEMICS"))).toBeNull();
  });
  it("neutralizes spreadsheet formulas and escapes untrusted quoted text", () => {
    for (const prefix of ["=", "+", "-", "@", "\t=", "  ="]) {
      expect(escapeActivityCsvCell(prefix + "payload")).toMatch(/^"'/);
    }
    expect(escapeActivityCsvCell('A "quoted" item')).toBe('"A ""quoted"" item"');
  });
  it("includes an explicit footer on truncated exports while preserving column count", () => {
    const event = {
      id: "1", occurredAt: new Date("2026-10-14T00:00:00.000Z"),
      module: "ACADEMICS", importance: "NORMAL", eventType: "event.updated",
      subjectType: "student", subjectId: "123", subjectLabel: "@HACK",
      summary: '=HYPERLINK("x")', actorName: "+INJECT", actorEmail: null,
    };
    const csv = buildCollegeActivityCsv([event], true);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("latest " + COLLEGE_ACTIVITY_EXPORT_CAP);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+INJECT");
    expect(buildCollegeActivityCsv([], false)).not.toContain("TRUNCATED");
  });
});
