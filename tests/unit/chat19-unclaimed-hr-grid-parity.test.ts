import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/** These four HR grid adapters are not listed in chat-15/chat-18 work queues.
 * They intentionally delegate the entire visual and responsive stack to
 * the shared AG Grid component; no page header or nested canvas belongs here.
 * Source guards are not a substitute for runtime/visual testing.
 */
const grids = [
  "hr-company-reports-grid.tsx",
  "hr-job-offers-grid.tsx",
  "hr-job-selection-grid.tsx",
  "hr-round-results-grid.tsx",
] as const;

describe("chat-19 four unclaimed HR grid adapters", () => {
  for (const file of grids) {
    it(file + " uses shared spreadsheet semantics and has no local style forks", () => {
      const text = readFileSync("src/components/hr/" + file, "utf8");
      expect(text).toContain('import { TpoGrid } from "@/components/tpo/grid/tpo-grid"');
      expect(text).toContain("<TpoGrid");
      expect(text).toContain("mobilePrimaryKeys=");
      expect(text).toContain("storageKey=");
      expect(text).toContain("rowKey=");
      expect(text).toContain("columns={columns}");
      expect(text).not.toMatch(/<(?:h1|button|input|select|textarea|table)(?=[\s>])/);
      expect(text).not.toMatch(/#[\da-f]{3,8}\b/i);
      expect(text).not.toMatch(/rounded-(?:full|lg|xl)|border-b-2|aria-pressed=/);
      expect(text).not.toContain("PageHeader");
      expect(text).not.toContain("Card");
    });
  }
  it("keeps all employer records authorized by the caller, not client fetching", () => {
    for (const file of grids) {
      const text = readFileSync("src/components/hr/" + file, "utf8");
      expect(text).not.toContain("fetch(");
      expect(text).not.toContain("apiFetch");
      expect(text).not.toContain("useEffect(");
    }
  });
  it("retains shared status badge and safe per-drive navigation on reports", () => {
    const text = readFileSync("src/components/hr/hr-company-reports-grid.tsx", "utf8");
    expect(text).toContain('import { StatusBadge } from "@/components/ui/status-badge"');
    expect(text).toContain("<StatusBadge");
    expect(text).toContain("encodeURIComponent(row.id)");
    expect(text).toContain("rowActions=");
  });
});
