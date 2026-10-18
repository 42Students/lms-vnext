import { describe, expect, it } from "vitest";
import {
  placementReportCsv,
  placementReportCsvCell,
} from "@/modules/placements/report-model";

describe("chat-13 Super Admin placement analytics export: hostile CSV values", () => {
  it("SA-REPORT-CSV-UNICODE-06 neutralizes Unicode-disguised spreadsheet formulas without losing original data", () => {
    const hiddenPrefixes = [
      "\u200b", "\u200e", "\u202e", "\ufeff", "\u034f",
      "\u0000", "\u20dd", " \u200d", "\t\u200f",
    ];
    for (const prefix of hiddenPrefixes) {
      for (const operator of ["=", "+", "-", "@"]) {
        const attackerValue = prefix + operator + 'HYPERLINK("https://evil.example","Open")';
        const encoded = placementReportCsvCell(attackerValue);
        expect(encoded, JSON.stringify(attackerValue)).toBe(
          '"' + "'" + attackerValue.replaceAll('"', '""') + '"',
        );
      }
    }
    expect(placementReportCsvCell("=1+2")).toBe('"\'=1+2"');
    expect(placementReportCsvCell("-12")).toBe('"\'-12"');
    expect(placementReportCsvCell("Safe company")).toBe('"Safe company"');
    expect(placementReportCsvCell("123")).toBe('"123"');
    expect(placementReportCsvCell('North, "quoted" branch')).toBe(
      '"North, ""quoted"" branch"',
    );
  });

  it("SA-REPORT-CSV-UNICODE-07 protects season, employer and branch names in entire exported CSV", () => {
    const rows = [
      ["Overall", "2027 season", "\u200b=HYPERLINK(1)", 3],
      ["Company", "\u202e@evil.example", "Ordinary department", 2],
      ["Branch", "Safe employer", "\u034f+SUM(1,2)", 1],
    ] as const;
    const csv = placementReportCsv(["Section", "Company", "Branch", "Total"], rows);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('"\'\u200b=HYPERLINK(1)"');
    expect(lines[2]).toContain('"\'\u202e@evil.example"');
    expect(lines[3]).toContain('"\'\u034f+SUM(1,2)"');
    expect(lines[1]).toContain('"2027 season"');
    expect(lines[1]).toContain('"3"');
  });
});
