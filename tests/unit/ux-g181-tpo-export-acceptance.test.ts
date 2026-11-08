import { describe, expect, it } from "vitest";
import { serializeTpoEligibilityPreviewCsv } from "@/modules/placements/tpo-eligibility-preview-csv-model";
import { serializeTpoLiveDriveDayCsv } from "@/modules/placements/tpo-live-drive-day-csv-model";
import { recruiterCsvCell, recruiterLeadsCsv, recruiterTableExportCsv, recruiterTableExportGrid, recruiterTableExportTsv } from "@/modules/placements/tpo-recruiter-export-model";
import { toTpoRequestsPageCsv } from "@/modules/placements/tpo-requests-page-csv-model";
import { roundApplyPreviewCsv, roundApplyReportCsv } from "@/modules/placements/tpo-round-apply-csv-model";
import { tpoRoundFailureCsv } from "@/modules/placements/tpo-round-failure-csv-model";
import { tpoUnplacedFilteredCsv } from "@/modules/placements/tpo-unplaced-filtered-export-model";

const dangerous = "\u093E=SUM(1)";
const date = new Date("2026-11-08T00:00:00Z");
const lead = { name: dangerous, companyName: "Example", stage: "NEW", ownerName: null,
  emailNorm: null, phoneNorm: null, source: null, inviteStatus: "NOT_SENT",
  lastActivityAt: null, nextFollowupAt: null, createdAt: date.toISOString() };

describe("UX-G181 consistent spreadsheet-safe placement exports", () => {
  it("guards invisible prefixes across eligibility, drive day and requests", () => {
    const exports = [
      serializeTpoEligibilityPreviewCsv(
        [{ studentCode: dangerous, decision: "ELIGIBLE", reason: "" }],
        [{ index: 0, status: "matched", reason: null, membershipId: null, expectedVersion: null }]),
      serializeTpoLiveDriveDayCsv([{
        id: "round-1", companyName: dangerous, jobTitle: "Engineer", name: "Interview",
        scheduledAt: null, durationMinutes: null,
        counts: { total: 2, checkedIn: 1, noShow: 0, pending: 1, unknown: 0 },
      }]),
      toTpoRequestsPageCsv([{
        id: "request-1", studentName: dangerous, requestType: "REVIEW", status: "PENDING",
        jobTitle: "Engineer", companyName: "Example", requestedAt: date,
      }]),
    ];
    for (const csv of exports) {
      expect(csv).toContain("'" + dangerous);
      expect(csv.endsWith("\r\n")).toBe(true);
    }
    expect(exports[0]).toContain('"Skip reason"');
    expect(exports[1]).toContain('"Checked in"');
    expect(exports[2]).toContain('"Requested at (UTC)"');
  });

  it("guards round decisions, failure and unplaced learner reports", () => {
    const exports = [
      roundApplyPreviewCsv([{student: dangerous, outcome: "PASS", destination: "Next", status: "APPLIED"}]),
      roundApplyReportCsv([{student: dangerous, outcome: "PASS", status: "APPLIED", reason: ""}]),
      tpoRoundFailureCsv([{roundName: dangerous, branchName: "CS", failed: 1, decisions: 2, shareOfRoundPercent: 50}]),
      tpoUnplacedFilteredCsv([{ displayName: dangerous, rollNumber: "R1", batch: "2026",
        branch: "CS", applications: 2, stillInDrive: false, lastApplied: null,
        lowestRecordedPercent: "70", undergraduatePercent: "70", marksVerified: "Yes" }]),
    ];
    for (const csv of exports) {
      expect(csv).toContain("'" + dangerous);
      expect(csv.endsWith("\r\n")).toBe(true);
    }
    expect(exports[0]).toContain('"Current result status"');
    expect(exports[1]).toContain('"Reason"');
    expect(exports[2]).toContain('"Failed decisions"');
    expect(exports[3]).toContain('"Still in a drive"');
  });

  it("keeps recruiter export headers, quotes and Unicode-safe clipboard text", () => {
    expect(recruiterCsvCell("\u20DD+FORMULA")).toBe("\"'\u20DD+FORMULA\"");
    expect(recruiterCsvCell('A, "B"')).toBe('"A, ""B"""');
    expect(recruiterCsvCell(null)).toBe('""');
    const csv = recruiterLeadsCsv([lead]);
    const selected = recruiterTableExportCsv([{...lead, designation: dangerous}], ["Contact", "Designation"]);
    const tsv = recruiterTableExportTsv([lead], ["Contact"]);
    expect(csv).toContain('"Contact","Company","Stage"');
    expect(csv.startsWith("\uFEFF")).toBe(true);
    for (const value of [csv, selected, tsv]) expect(value).toContain("'" + dangerous);
    expect(selected).toContain('"Contact","Designation"');
  });

  it("renders invalid imported recruiter dates as blank rather than throwing", () => {
    const grid = recruiterTableExportGrid([{ ...lead, createdAt: "invalid-date" }]);
    expect(grid.values[0]?.[12]).toBe("");
  });
});
