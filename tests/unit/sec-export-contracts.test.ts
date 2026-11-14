import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { spreadsheetCsvCell } from "@/security/csv-cell";
import { importIssuesCsv } from "@/lib/import-preview";

/**
 * Exports are where one scope or formula mistake leaks or attacks a whole college. Two contracts:
 *  1. the one central cell function neutralises every way of smuggling a spreadsheet formula, including invisible prefixes;
 *  2. no NEW hand-written CSV quoting appears: every export builder must call that function. Existing copies are listed here and
 *     may only shrink (they are migrated in the export pipeline step); a new file with its own quoting fails this test.
 */
const root = process.cwd();
const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
};
const rel = (file: string) => path.relative(root, file).split(path.sep).join("/");

const NEUTRAL = (value: string) => spreadsheetCsvCell(value).slice(1, -1);
const hostile = [
  "=1+1", "+1+1", "-1+1", "@SUM(A1)", "=cmd|' /C calc'!A0",
  "\t=1+1", " =1+1", "\r=1+1", "\n=1+1",
  "​=1+1", "‎=1+1", "⁠=1+1", "﻿=1+1", "­=1+1", "́=1+1", "‮=1+1",
  "  ​ \t@x",
];

describe("the central spreadsheet cell function", () => {
  it("prefixes an apostrophe to every formula, however it is hidden", () => {
    for (const value of hostile) {
      expect(NEUTRAL(value), JSON.stringify(value)).toBe("'" + value);
    }
  });

  it("leaves ordinary text alone and doubles quotes", () => {
    expect(spreadsheetCsvCell("Asha Rao")).toBe('"Asha Rao"');
    expect(spreadsheetCsvCell('He said "hi"')).toBe('"He said ""hi"""');
    expect(spreadsheetCsvCell(42)).toBe('"42"');
    expect(spreadsheetCsvCell(null)).toBe('""');
    expect(spreadsheetCsvCell(undefined)).toBe('""');
    expect(spreadsheetCsvCell("a=b")).toBe('"a=b"');
    expect(spreadsheetCsvCell("100-200")).toBe('"100-200"');
  });
});

describe("the import issues download", () => {
  it("cannot turn an uploaded cell into a live formula", () => {
    const csv = importIssuesCsv([
      { row: 2, field: "email", message: "=HYPERLINK(\"http://evil.example\",\"x\")" },
      { row: 3, field: "​=1+1", message: "-2+3" },
    ] as never);
    const body = csv.split("\r\n").slice(1).join("\n");
    expect(body).not.toMatch(/(^|,)"=/m);
    expect(body).not.toMatch(/(^|,)"-/m);
    expect(body).toContain("\"'=HYPERLINK(");
  });
});

describe("hand-written CSV quoting", () => {
  /** Files that still carry their own quoting. Migrating one means deleting its line; adding one is refused. */
  const KNOWN_COPIES = new Set<string>([
    "src/app/(authenticated)/activity/page.tsx",
    "src/app/api/courses/college/learner-progress/export/route.ts",
    "src/app/api/placements/tpo/reports/after-college/route.ts",
    "src/components/admin/lecture-hall-manager.tsx",
    "src/components/admin/super-admin-global-company-catalogue.tsx",
    "src/components/placements/college-interview-appointments.tsx",
    "src/components/placements/report-interactive-table-export-model.ts",
    "src/components/placements/tpo-bulk-round-result-recorder.tsx",
    "src/components/placements/tpo-round-apply-control.tsx",
    "src/components/verification/VerificationWorkspace.tsx",
    "src/modules/admin-ui/program-directory.ts",
    "src/modules/admin-ui/super-admin-placement-interviews-service.ts",
    "src/modules/attendance/admin-grid-model.ts",
    "src/modules/courses/faculty-followup-export.ts",
    "src/modules/courses/faculty-gradebook-model.ts",
    "src/modules/courses/faculty-quiz-question-csv.ts",
    "src/modules/courses/faculty-report-csv.ts",
    "src/modules/courses/faculty-results-export.ts",
    "src/modules/courses/faculty-roster-export.ts",
    "src/modules/courses/faculty-video-management-model.ts",
    "src/modules/groups/college-group-csv-preview-model.ts",
    "src/modules/messaging/receipt-history-export-model.ts",
    "src/modules/module-access/admin-college-rule-history-export.ts",
    "src/modules/module-access/admin-feature-export.ts",
    "src/modules/module-access/admin-student-rule-history-export.ts",
    "src/modules/people/college-faculty-csv-service.ts",
    "src/modules/people/college-student-csv-model.ts",
    "src/modules/placements/recruiter-selection-csv-model.ts",
    "src/modules/placements/report-model.ts",
    "src/modules/placements/tpo-grid-model.ts",
    "src/modules/placements/tpo-lead-xlsx-import-model.ts",
    "src/modules/placements/tpo-students-csv.ts",
    "src/modules/projects/class-team-csv-export.ts",
    "src/modules/projects/learner-project-activity-csv-model.ts",
    "src/modules/projects/project-admin-csv-model.ts",
    "src/modules/projects/readiness-overrides-export-model.ts",
    "src/modules/shared/metadata-export-csv-cell.ts",
  ]);
  // Doubling a double quote is the signature of hand-written CSV quoting.
  const QUOTING = /replaceAll\(\s*['"]"['"]\s*,\s*['"]""['"]\s*\)|\.replace\(\s*\/"\/g\s*,\s*['"]""['"]\s*\)/;

  it("no new file writes its own CSV quoting, and the central helper is the only exception", () => {
    const own = walk(path.join(root, "src"))
      .map(rel)
      .filter((file) => file !== "src/security/csv-cell.ts")
      .filter((file) => QUOTING.test(readFileSync(path.join(root, file), "utf8")));
    const added = own.filter((file) => !KNOWN_COPIES.has(file));
    expect(added, "use spreadsheetCsvCell from @/security/csv-cell instead of quoting by hand").toEqual([]);
    // The list may only shrink: a file that no longer quotes by hand must be removed from it.
    const stale = [...KNOWN_COPIES].filter((file) => !own.includes(file));
    expect(stale, "these were migrated: delete them from KNOWN_COPIES").toEqual([]);
  }, 60_000);
});
