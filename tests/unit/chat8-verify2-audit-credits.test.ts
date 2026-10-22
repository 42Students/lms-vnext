import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseTermCourseCreditsDraft } from "@/modules/academics/college-term-mapping-model";

const source = (path: string) => readFileSync(path, "utf8");

describe("lane-8 verify2: semester credits and audit stale recovery", () => {
  it("distinguishes blank credits from valid zero-credit legacy mappings", () => {
    for (const value of ["", "  ", "unknown", "-1", "31", "1.5", "0x10", "1e1"]) {
      expect(parseTermCourseCreditsDraft(value).success).toBe(false);
    }
    expect(parseTermCourseCreditsDraft("0")).toMatchObject({ success: true, data: 0 });
    expect(parseTermCourseCreditsDraft("30")).toMatchObject({ success: true, data: 30 });
    const manager = source("src/components/academics/college-term-mapping-manager.tsx");
    expect(manager).toContain("parseTermCourseCreditsDraft(creditsValue)");
    expect(manager).toContain('creditsValue?.trim() ? "Enter credits from 0 to 30" : "Enter credits"');
  });
  it("preserves scoped audit rows on failed refresh, with warning dismissal and retry", () => {
    const grid = source("src/components/tpo/tpo-audit-grid.tsx");
    expect(grid).toContain("setSnapshotRows(payload.items as TpoAuditRow[])");
    expect(grid).toContain("setStale(true)");
    expect(grid).toContain("setStaleDismissed(false)");
    expect(grid).toContain("stale && !staleDismissed");
    expect(grid).toContain('role="alert"');
    expect(grid).toContain('aria-label="Dismiss stale audit warning"');
    expect(grid).toContain("onClick={()=>setStaleDismissed(true)}");
    expect(grid).toContain("Retry audit refresh");
    expect(grid).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });
});
