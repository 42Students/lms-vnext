import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  projectAdminCsv,
  projectAdminCsvCell,
} from "@/modules/projects/project-admin-csv-model";

describe("IIT Dharwad Projects admin exports: spreadsheet injection resilience", () => {
  it("PROJ-BREAK-exports-10 neutralizes formulas after Unicode isolates, bidi controls and invisible prefixes", () => {
    for (const prefix of ["", " ", "\t", "\r\n", "\u200B", "\u200F", "\u2060", "\u2066", "\u2069", "\u202E", "\uFEFF", " \u2067\u200B"]) {
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

  it("PROJ-BREAK-exports-12/13/14/15 all five client exports use the tested sanitizer", () => {
    for (const file of [
      "project-audit-page-export.tsx",
      "project-submissions-page-export.tsx",
      "project-admin-workspace-page-export.tsx",
      "project-at-risk-page-export.tsx",
      "super-admin-template-page-export.tsx",
    ]) {
      const source = readFileSync("src/components/projects/" + file, "utf8");
      expect(source.startsWith('"use client";'), file).toBe(true);
      expect(source, file).toContain('from "@/modules/projects/project-admin-csv-model"');
      expect(source, file).toContain("projectAdminCsv([");
      expect(source, file).not.toContain("function csvField(");
      expect(source, file).not.toContain("function escape(");
    }
  });
});
