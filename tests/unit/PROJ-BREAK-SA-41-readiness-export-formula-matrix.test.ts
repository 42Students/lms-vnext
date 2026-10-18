import { describe, expect, it } from "vitest";
import {
  projectReadinessOverrideCsvCell,
} from "@/modules/projects/readiness-overrides-export-model";
import { projectAdminCsvCell } from "@/modules/projects/project-admin-csv-model";

describe("PROJ-BREAK-SA-41 IIT Dharwad project readiness export spreadsheet safety", () => {
  it("rejects all spreadsheet formula operators behind C0, combining, enclosing, bidi and whitespace prefixes", () => {
    for (const prefix of [
      "\u0000", "\u001f", "\u034f", "\u20dd", "\u202e",
      "\u2060", "\u200b", "\t\u034f", " \u20dd",
    ]) {
      for (const operator of ["=", "+", "@", "-"]) {
        const original = prefix + operator + 'HYPERLINK("https://evil.example")';
        const escaped = original.replaceAll('"', '""');
        expect(
          projectReadinessOverrideCsvCell(original),
          JSON.stringify(original),
        ).toBe('"' + "'" + escaped + '"');
      }
    }
  });

  it("does not unnecessarily prepend apostrophes to plain readiness reasons", () => {
    const plain = [
      "Mentor reviewed workspace",
      "Blocked by missing deliverable",
      'The "Ready" milestone',
      "A, B, and C",
    ];
    for (const value of plain) {
      expect(projectReadinessOverrideCsvCell(value))
        .toBe(projectAdminCsvCell(value));
    }
    expect(projectReadinessOverrideCsvCell('The "Ready" milestone'))
      .toBe('"The ""Ready"" milestone"');
  });
});
