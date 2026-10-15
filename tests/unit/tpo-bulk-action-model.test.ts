import { describe, expect, it } from "vitest";
import { bulkActionCommandSchema, previewBulkAction, countBulkOutcomes, canExactUndo } from "@/modules/placements/tpo-bulk-action-model";

const a = "a1d5c117-1a6e-4d45-b83d-001fc5077011";
const b = "b2d5c117-1a6e-4d45-b83d-001fc5077011";
describe("shared TPO bulk action contract", () => {
  it("explains exclusions and duplicates before writing", () => {
    const rows = previewBulkAction([
      { id: a, version: "1", label: "A" },
      { id: b, version: "2", label: "B" },
      { id: a, version: "1", label: "A" },
    ], (row) => row.id === b ? { allowed: false, reason: "Blocked" } : { allowed: true });
    expect(rows.map((row) => [row.status, row.reason])).toEqual([
      ["ready", null], ["skipped", "Blocked"], ["skipped", "Duplicate selection"],
    ]);
  });
  it("validates a confirmed and deduplicated versioned command", () => {
    const record = { id: a, version: "v1" };
    const command = { action: "DECIDE", previewToken: "t", confirmed: true, selections: [record] };
    expect(bulkActionCommandSchema.safeParse(command).success).toBe(true);
    expect(bulkActionCommandSchema.safeParse({ ...command, confirmed: false }).success).toBe(false);
    expect(bulkActionCommandSchema.safeParse({ ...command, selections: [record, record] }).success).toBe(false);
  });
  it("reports partial failures and enforces exact-version undo", () => {
    expect(countBulkOutcomes([
      { id: a, status: "updated", reason: null },
      { id: b, status: "failed", reason: "Stale" },
    ])).toEqual({ updated: 1, skipped: 0, failed: 1 });
    expect(canExactUndo({ id: a, undoVersion: "v2" }, { id: a, version: "v2" })).toBe(true);
    expect(canExactUndo({ id: a, undoVersion: "v2" }, { id: a, version: "v3" })).toBe(false);
  });
});
