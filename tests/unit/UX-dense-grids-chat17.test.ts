import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source=(relativePath:string)=>readFileSync(join(process.cwd(),relativePath),"utf8");

/** Intentional dense grids: replacing these with row-card DataTable would
 * remove date-by-date editing or per-column spreadsheet behavior. This test
 * protects actual mobile keyboard alternatives until a dedicated grid API
 * supports the same behavior; it is not a blanket raw-table exception.
 */
describe("UX-UNOWNED-DENSE-GRID-05 semantic grid exceptions",()=>{
  it("TPO spreadsheet has semantic desktop table AND mobile row disclosure with same selection actions",()=>{
    const text=source("src/components/tpo/tpo-spreadsheet-grid.tsx");
    expect(text.startsWith('"use client";')).toBe(true);
    expect(text).toContain('<ScrollCue axis="x" label="TPO spreadsheet columns"');
    expect(text).toContain('className="hidden rounded border border-border md:block"');
    expect(text).toContain('<caption className="sr-only">Current page TPO spreadsheet records</caption>');
    expect(text).toContain('<ul aria-label="Current page TPO spreadsheet records" className="space-y-2 md:hidden">');
    expect(text).toContain('Select all filtered students');
    expect(text).toContain("More student details");
    expect(text).toContain("mobilePrimaryKeys");
    expect(text).toContain("rowActions(row)");
    expect(text).toContain("min-h-11");
    expect(text).toContain("window.localStorage.setItem");
  });

  it("college attendance month grid retains each scheduled-day column and per-learner correction controls",()=>{
    const text=source("src/components/attendance/admin-attendance-workspace.tsx");
    expect(text).toContain('<ScrollCue axis="x" label="College attendance monthly grid"');
    expect(text).toContain("<caption");
    expect(text).toContain("sessionDays.map");
    expect(text).toContain('className="sticky left-0 z-10 bg-surface px-4 py-3"');
    expect(text).toContain('aria-label="No class scheduled"');
    expect(text).toContain("Multiple sessions on a day open a session chooser");
    expect(text).toContain("<Drawer");
    expect(text).toContain("College Admin may correct sessions");
  });
});
