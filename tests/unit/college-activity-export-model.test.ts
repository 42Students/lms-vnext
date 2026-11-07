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
    // Leading zero-width, bidi, combining and C0 control characters are
    // ignored by some spreadsheet applications when interpreting formulas.
    for (const prefix of ["\u200b=", "\u2067+", "\u0301@", "\u0001-"]) {
      expect(escapeActivityCsvCell(prefix + "payload")).toBe("\"'" + prefix + "payload\"");
    }
    expect(escapeActivityCsvCell("\u200bNormal")).toBe('"\u200bNormal"');
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
    const excessive = buildCollegeActivityCsv(
      Array.from({ length: COLLEGE_ACTIVITY_EXPORT_CAP + 1 }, () => event), false,
    );
    expect(excessive.split("\r\n")).toHaveLength(COLLEGE_ACTIVITY_EXPORT_CAP + 2);
    expect(excessive).toContain("EXPORT TRUNCATED");
  });
});
