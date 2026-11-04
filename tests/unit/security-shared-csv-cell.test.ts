import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spreadsheetCsvCell } from "@/security/csv-cell";
import { neutralizePeopleCsv } from "@/modules/people/college-people-export-model";
import { buildSuperAdminPeopleCsv } from "@/modules/people/admin-users-export-model";
import { csvSafeCell, mentorBoardExportCsv } from "@/modules/projects/mentor-board-review-model";
import { tenantDirectoryCsvCell } from "@/modules/colleges/admin-tenant-export-model";
import { escapeRoleDirectoryCsvCell } from "@/modules/people/college-role-directory-export";
import { safeCollegeCsvCell } from "@/modules/placements/college-directory-csv";
import { verificationCsv } from "@/modules/verification/queue-export";
import { serializeTpoRegistrationEventHistoryCsv } from "@/modules/placements/tpo-registration-event-history-csv-model";
import { superAdminCompanyCsv } from "@/modules/placements/admin-company-directory-export-model";

const dangerous = [
  "=1+2",
  "+1+2",
  "-SUM(1,2)",
  "@SUM(1,2)",
  " \t\r\n=1+2",
  "\u200B=1+2", // zero-width space
  "\u2060+1+2", // word joiner
  "\uFEFF@cmd", // leading BOM
  "\u202E=1+2", // direction override
  "\u0301-SUM(1,2)", // nonspacing combining mark
  "\u034F\t=2+2", // combining grapheme joiner
  "\u0903=1+2", // spacing combining mark (Mc)
  "\u001F@cmd", // control prefix
];

describe("SEC-12/SEC-10: Unicode-aware CSV formula protection", () => {
  it.each(dangerous)("neutralizes a spreadsheet formula at the first visible character: %j", raw => {
    const escaped = spreadsheetCsvCell(raw);
    expect(escaped.startsWith("\"'")).toBe(true);
    expect(escaped.endsWith("\"")).toBe(true);
    expect(escaped.slice(2, -1).replaceAll('""', '"')).toBe(raw);
  });

  it.each(["Name", "42Learn", "Within - project", "hello@example.test", "'=already-escaped", "", "2026-11-04"])(
    "preserves ordinary cell content: %j", raw => {
      expect(spreadsheetCsvCell(raw)).toBe('"' + raw + '"');
    },
  );

  it("quotes commas, CRLF and quotes without allowing new CSV columns", () => {
    expect(spreadsheetCsvCell('Alpha,"Beta"\r\nGamma'))
      .toBe('"Alpha,""Beta""\r\nGamma"');
    expect(spreadsheetCsvCell('=HYPERLINK("https://example.invalid","x")'))
      .toBe('"\'=HYPERLINK(""https://example.invalid"",""x"")"');
  });

  it("retains numeric/null behavior and college's historic NUL/Date normalization", () => {
    expect(spreadsheetCsvCell(null)).toBe('""');
    expect(spreadsheetCsvCell(42)).toBe('"42"');
    expect(safeCollegeCsvCell(new Date("2026-11-04T00:00:00.000Z")))
      .toBe('"2026-11-04T00:00:00.000Z"');
    expect(safeCollegeCsvCell("\u0000=3+4")).toBe('"\'=3+4"');
  });

  it("keeps public CSV wrappers consistent with the same rule", () => {
    for (const encode of [
      neutralizePeopleCsv, csvSafeCell, tenantDirectoryCsvCell, escapeRoleDirectoryCsvCell,
    ]) {
      expect(encode("\u200B=1+2")).toBe('"\'\u200B=1+2"');
      expect(encode("Learner A")).toBe('"Learner A"');
    }
  });

  it("protects actual verification and TPO registration CSV output", () => {
    const verification = verificationCsv([{
      learnerName: "\u2060=2+2", section: "A", status: "PENDING",
      submittedAt: "", reviewedAt: "", reviewedBy: "",
    }]);
    expect(verification.csv).toContain('"\'\u2060=2+2"');
    const events = serializeTpoRegistrationEventHistoryCsv([{
      previousChoice: null,
      nextChoice: "\u200B=1+2",
      source: "\u0903@cmd",
      occurredAt: new Date("2026-11-04T00:00:00Z"),
    }]);
    expect(events).toContain('"\'\u200B=1+2"');
    expect(events).toContain('"\'\u0903@cmd"');
  });

  it("protects actual Mentor board and admin company CSV output", () => {
    const board = mentorBoardExportCsv([{
      id: "task-1", title: "\u200B=1+2", status: "TODO",
      priority: "HIGH", sprintTitle: "Sprint 1",
    }], 0);
    expect(board).toContain('"\'\u200B=1+2"');

    const companies = superAdminCompanyCsv([{
      companyId: "company-1", name: "\u2060=1+2", primaryDomain: null,
      collegeName: "College A", companyStatus: "ACTIVE",
      relationshipStatus: "ACTIVE", trusted: false,
      website: null, companyCollegeCount: 1, driveCount: 0, lastActiveAt: null,
    }] as unknown as Parameters<typeof superAdminCompanyCsv>[0]);
    expect(companies).toContain('"\'\u2060=1+2"');
  });

  it("protects the real super-admin people serializer", () => {
    const output = buildSuperAdminPeopleCsv([{
      membershipId: "member-1", displayName: "\u0903=5+5",
      collegeName: "College A", platformStatus: "ACTIVE",
      membershipStatus: "ACTIVE", roles: ["LEARNER"],
      updatedAt: new Date("2026-11-04T00:00:00Z"),
    }], false);
    expect(output).toContain('"\'\u0903=5+5"');
  });

  it("all selected export producers use the shared encoder", () => {
    const consumers = [
      "src/modules/people/college-people-export-model.ts",
      "src/modules/people/admin-users-export-model.ts",
      "src/modules/admin-ui/super-admin-scoped-csv-model.ts",
      "src/modules/placements/tpo-audit-csv-model.ts",
      "src/modules/verification/queue-export.ts",
      "src/modules/placements/tpo-registration-event-history-csv-model.ts",
      "src/modules/projects/mentor-board-review-model.ts",
      "src/modules/people/college-role-directory-export.ts",
      "src/modules/colleges/admin-tenant-export-model.ts",
      "src/modules/placements/admin-company-directory-export-model.ts",
      "src/modules/placements/college-directory-csv.ts",
      "src/app/api/placements/tpo/audit/export/route.ts",
    ];
    for (const file of consumers) {
      const src = readFileSync(file, "utf8");
      expect(src, file).toContain('from "@/security/csv-cell"');
      expect(src, file).toContain("spreadsheetCsvCell");
    }
  });
});
