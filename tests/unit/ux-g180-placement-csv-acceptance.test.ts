import { describe, expect, it } from "vitest";
import { learnerSafeCsvCell } from "@/modules/placements/learner-csv-safe-cell-model";
import { serializeTpoCohortHistoryCsv } from "@/modules/placements/tpo-batch-history-csv-model";
import { serializeTpoBatchStudentViewCsv } from "@/modules/placements/tpo-batch-student-filtered-export-model";
import { companyDriveCsv } from "@/modules/placements/tpo-company-drive-export-model";
import { companyEngagementCsv } from "@/modules/placements/tpo-company-engagement-csv-model";

const unsafe = "\u093E=HYPERLINK(1)";
const day = new Date("2026-11-08T00:00:00Z");
describe("UX-G180 placement CSV usability and safe text", () => {
  it("keeps learner CSV control cleanup and stops combining-mark formula prefixes", () => {
    expect(learnerSafeCsvCell(unsafe)).toBe("\"'" + unsafe + "\"");
    expect(learnerSafeCsvCell(" \u200B=1")).toContain("' =1");
    expect(learnerSafeCsvCell('A, "B"')).toBe('"A, ""B"""');
  });
  it("guards free-text cohort history, filtered learner and company engagement exports", () => {
    const exports = [
      serializeTpoCohortHistoryCsv([{id:"id",kind:"DECISION",before:null,after:unsafe,
        actionId:"a1",reversesActionId:null,occurredAt:day}]),
      serializeTpoBatchStudentViewCsv([{membershipId:"id",name:unsafe,
        decision:"ELIGIBLE",ambiguous:false,source:"COHORT",registration:{choice:null}}]),
      companyEngagementCsv([{companyName:unsafe,contacts:2,invited:1,joined:1,drives:1,placed:0}]),
    ];
    for(const csv of exports){
      expect(csv).toContain("'" + unsafe);
      expect(csv.endsWith("\r\n")).toBe(true);
    }
    expect(exports[1]).not.toContain("Private note");
    expect(exports[2]).toContain('"Recorded drives (selected scope)"');
  });
  it("does not crash company drive export on invalid imported dates", () => {
    const csv = companyDriveCsv([{jobTitle:unsafe,status:"LIVE",
      createdAt:"not-a-date",applied:null,offers:null}]);
    expect(csv).toContain("'" + unsafe);
    expect(csv).toContain('"Not recorded"');
    expect(csv).not.toContain("Invalid Date");
    expect(csv).toContain('"Unavailable"');
  });
});
