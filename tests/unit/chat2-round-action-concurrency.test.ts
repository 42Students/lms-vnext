import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  roundActionJobMutable,
  roundActionSnapshotMatches,
} from "@/modules/placements/round-action-guards";

const first = new Date("2099-10-20T04:00:00.000Z");
const second = new Date("2099-10-20T04:00:00.001Z");

describe("chat-2 round action concurrency and job lifecycle", () => {
  it("TPO-round-action-01 rejects a stale reschedule tab even when status is unchanged", () => {
    const locked = { status: "SCHEDULED", updatedAt: second };
    expect(roundActionSnapshotMatches(locked, "SCHEDULED", first.toISOString())).toBe(false);
    expect(roundActionSnapshotMatches(locked, "SCHEDULED", second.toISOString())).toBe(true);
    expect(roundActionSnapshotMatches(locked, "PENDING", second.toISOString())).toBe(false);
    expect(roundActionSnapshotMatches(locked, "SCHEDULED")).toBe(true);
    expect(roundActionSnapshotMatches(null, "SCHEDULED")).toBe(false);
    expect(roundActionSnapshotMatches({ status: "SCHEDULED", updatedAt: new Date("invalid") }, "SCHEDULED")).toBe(false);
    expect(roundActionSnapshotMatches(locked, "SCHEDULED", "not-a-revision")).toBe(false);
  });

  it("TPO-round-action-02 never mutates rounds of closed or archived jobs", () => {
    expect(roundActionJobMutable({ status: "PUBLISHED" })).toBe(true);
    expect(roundActionJobMutable({ status: "DRAFT" })).toBe(true);
    expect(roundActionJobMutable({ status: "CLOSED" })).toBe(false);
    expect(roundActionJobMutable({ status: "ARCHIVED" })).toBe(false);
    expect(roundActionJobMutable(null)).toBe(false);
  });

  it("TPO-round-action-03 revalidates the locked job and version on schedule, completion and cancellation", () => {
    const service = readFileSync("src/modules/placements/round-service.ts", "utf8");
    const start = service.indexOf("export async function actOnPlacementRound(");
    const end = service.indexOf("async function findRoundOrderLock(", start);
    const action = service.slice(start, end);
    const schedule = action.slice(0, action.indexOf('if (input.action === "COMPLETE")'));
    const complete = action.slice(action.indexOf('if (input.action === "COMPLETE")'), action.indexOf('  if (\n    current.round.status !== "PENDING"'));
    const cancel = action.slice(action.indexOf('  if (\n    current.round.status !== "PENDING"'));
    for (const branch of [schedule, complete, cancel]) {
      expect(branch).toContain('roundActionJobMutable(lockedJob)');
      expect(branch).toContain('roundActionSnapshotMatches(');
      expect(branch).toContain('.for("update")');
    }
    expect(complete).toContain('recordActivityEventInTransaction(');
    expect(complete).toContain('ACTIVITY_EVENT_TYPES.PLACEMENTS_ROUND_COMPLETED');
    expect(complete).toContain("greatest(clock_timestamp()");
    expect(cancel).toContain("greatest(clock_timestamp()");
    expect(action).not.toContain("updatedAt: now,");
  });

  it("TPO-round-action-04 edits also recheck the job lock before the optimistic round CAS", () => {
    const service = readFileSync("src/modules/placements/round-service.ts", "utf8");
    const edit = service.slice(service.indexOf("export async function updatePlacementRound("), service.indexOf("export async function actOnPlacementRound("));
    expect(edit).toContain("roundActionJobMutable(lockedJob)");
    expect(edit.indexOf("roundActionJobMutable(lockedJob)")).toBeLessThan(edit.indexOf(".update(placementJobRounds)"));
    expect(edit).toContain("date_trunc('milliseconds'");
    expect(edit).toContain('eq(placementJobRounds.status, "PENDING")');
  });
});
