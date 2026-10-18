import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectAdminCsv,
  projectAdminCsvCell,
} from "@/modules/projects/project-admin-csv-model";
import {projectWorkspacePageCsv} from "@/modules/projects/admin-workspace-page-export-model";

describe("IIT Dharwad Projects admin exports: spreadsheet injection resilience", () => {
  it("PROJ-BREAK-exports-10 neutralizes formulas after Unicode isolates, bidi controls and invisible prefixes", () => {
    for (const prefix of ["", " ", "\t", "\r\n", "\u200B", "\u200F", "\u2060", "\u2066", "\u2069", "\u202E", "\uFEFF", "\u034F", "\u061C", "\u180E", "\u0301", " \u2067\u200B"]) {
      for (const op of ["=", "+", "-", "@"]) {
        const payload = prefix + op + "HYPERLINK(1)";
        expect(projectAdminCsvCell(payload), JSON.stringify(payload))
          .toBe('"\'' + payload + '"');
      }
    }
    expect(projectAdminCsvCell("Visible title")).toBe('"Visible title"');
    expect(projectAdminCsvCell(" Normal note")).toBe('" Normal note"');
    expect(projectAdminCsvCell(null)).toBe('""');
    expect(projectAdminCsvCell(0)).toBe('"0"');
  });

  it("PROJ-BREAK-exports-16 strips control-code formula concealment without erasing legitimate multiline text", () => {
    for (const payload of [
      "\u0000=1+1", "\u0007\u200D@HYPERLINK(1)", "\u0001 \u0301+SUM(1)", "\u007F\u2066-HYPERLINK(1)",
    ]) {
      const csvCell = projectAdminCsvCell(payload);
      expect(csvCell.startsWith('"\''), payload).toBe(true);
      expect(csvCell).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/);
    }
    expect(projectAdminCsvCell("Line one\nLine two")).toBe('"Line one\nLine two"');
    expect(projectAdminCsvCell("ordinary value")).toBe('"ordinary value"');
  });

  it("PROJ-BREAK-exports-11 escapes multiline, quotes and comma fields without adding columns", () => {
    const data = projectAdminCsv([
      ["Workspace", "Summary"],
      ['Team, "Alpha"\nSecond line', "Approved"],
    ]);
    expect(data).toBe(
      '\uFEFF"Workspace","Summary"\r\n"Team, ""Alpha""\nSecond line","Approved"\r\n',
    );
    expect(data.match(/\uFEFF/g)).toHaveLength(1);
    expect(data).not.toContain("\u0000");
  });

  it("PROJ-BREAK-exports-12/13/14/15 all six client exports use the tested sanitizer", () => {
    for (const file of [
      "project-audit-page-export.tsx",
      "project-submissions-page-export.tsx",
      "project-at-risk-page-export.tsx",
      "super-admin-template-page-export.tsx",
      "project-workspace-page-export.tsx",
    ]) {
      const source = readFileSync("src/components/projects/" + file, "utf8");
      expect(source.startsWith('"use client";'), file).toBe(true);
      expect(source, file).toContain('from "@/modules/projects/project-admin-csv-model"');
      expect(source, file).toContain("projectAdminCsv([");
      expect(source, file).not.toContain("function csvField(");
      expect(source, file).not.toContain("function escape(");
    }
    const client = readFileSync("src/components/projects/project-admin-workspace-page-export.tsx", "utf8");
    const model = readFileSync("src/modules/projects/admin-workspace-page-export-model.ts", "utf8");
    expect(client).toContain("projectWorkspacePageCsv(items)");
    expect(model).toContain("projectAdminCsv([headings,...rows])");
    expect(model).toContain("projectAdminCsvCell(value)");
    const protectedCsv = projectWorkspacePageCsv([{
      title: "\u2066=HYPERLINK(1)",
      mentorName: null,
      status: "ACTIVE",
      progressPercent: 10,
      memberCount: 1,
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    }]);
    expect(protectedCsv).toContain('"\'\u2066=HYPERLINK(1)"');
    expect(protectedCsv).toContain('"In progress"');
  });
});
