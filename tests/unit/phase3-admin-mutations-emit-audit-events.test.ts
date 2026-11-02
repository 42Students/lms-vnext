import { describe, expect, it, vi } from "vitest";
import { AUDIT_CALL, exportedMethods, hopSources, read, rel, routeFiles } from "./phase3-scan-helpers";

vi.setConfig({ testTimeout: 60_000 });

/**
 * A mutating Super Admin route must reach a real activity-event write
 * (recordActivityEvent / recordActivityEventInTransaction) within three import
 * hops of the route file. The signal is deliberately a call expression, not the
 * word "audit", so a comment or an import alone cannot satisfy it.
 */
const MUTATING_ADMIN = routeFiles("src/app/api/admin")
  .map((abs) => ({ abs, file: rel(abs), methods: exportedMethods(read(abs)) }))
  .filter((r) => r.methods.some((m) => m !== "GET"));

/** Routes whose audit write sits deeper than three hops or is intentionally absent; each needs a reason. */
const EXEMPT: Record<string, string> = {};

describe("Phase 3: every mutating Super Admin route reaches an audit-event write", () => {
  it("finds the mutating admin routes", () => {
    expect(MUTATING_ADMIN.length).toBeGreaterThanOrEqual(45);
  });

  it("each mutating admin route has a recordActivityEvent call within three hops", () => {
    const missing = MUTATING_ADMIN.filter(
      ({ abs, file }) => !(file in EXEMPT) && !AUDIT_CALL.test(hopSources(abs, 3)),
    ).map((r) => r.file);
    expect(missing, `mutating admin routes without an audit-event call: ${missing.join(", ")}`).toEqual([]);
  });

  it("the broadcast route needs three hops (guards the hop limit from silently shrinking)", () => {
    const f = "src/app/api/admin/announcements/broadcast/route.ts";
    expect(AUDIT_CALL.test(hopSources(f, 2))).toBe(false);
    expect(AUDIT_CALL.test(hopSources(f, 3))).toBe(true);
  });

  it("the detector rejects a comment or an import with no call", () => {
    expect(AUDIT_CALL.test("// recordActivityEvent is called elsewhere")).toBe(false);
    expect(AUDIT_CALL.test('import {recordActivityEvent} from "@/x";')).toBe(false);
    expect(AUDIT_CALL.test("await recordActivityEventInTransaction(tx,ctx,{})")).toBe(true);
    expect(AUDIT_CALL.test("await recordActivityEvent(ctx,{})")).toBe(true);
  });

  it("every exemption has a written reason and still names an existing route", () => {
    for (const [file, reason] of Object.entries(EXEMPT)) {
      expect(reason.length, `${file} needs a reason`).toBeGreaterThan(20);
      expect(MUTATING_ADMIN.some((r) => r.file === file), `${file} no longer exists`).toBe(true);
    }
  });
});
