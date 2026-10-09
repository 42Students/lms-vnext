import { describe, expect, it } from "vitest";
import {
  applyBugWorkflowRetest,
  applyBugWorkflowUpdate,
  type BugTrackerActor,
  type BugWorkflowSnapshot,
} from "@/modules/bug-tracker/workflow";

const now = new Date("2026-10-10T08:00:00.000Z");
const admin: BugTrackerActor = {
  id: "admin-1",
  active: true,
  role: "SUPER_ADMIN",
};

function bug(
  overrides: Partial<BugWorkflowSnapshot> = {},
): BugWorkflowSnapshot {
  return {
    id: "issue-1",
    status: "NEW",
    resolution: null,
    affectedLayer: null,
    rootCause: null,
    fixNotes: null,
    frontendCommitSha: null,
    backendCommitSha: null,
    regressionTestStatus: "NOT_REVIEWED",
    productionVerified: false,
    retestStatus: "NOT_RETESTED",
    retestedAt: null,
    version: 0,
    ...overrides,
  };
}

describe("DB10 legacy bug tracker workflow contract", () => {
  it("retains five legacy statuses and accepts normalization", () => {
    const result = applyBugWorkflowUpdate(
      bug(), { expectedVersion: 0, status: " checking " }, admin, now,
    );
    expect(result.next.status).toBe("CHECKING");
    expect(result.next.version).toBe(1);
    expect(result.events.map(x => x.type)).toEqual(["STATUS_CHANGED"]);
    expect(result.events[0]?.actorId).toBe("admin-1");
  });

  it("nonempty resolution forces CLOSED even when requested status is FIXING", () => {
    const { next, events } = applyBugWorkflowUpdate(
      bug({ status: "FIXING", version: 7 }),
      { expectedVersion: 7, status: "NEW", resolution: " duplicate " },
      admin, now,
    );
    expect(next.status).toBe("CLOSED");
    expect(next.resolution).toBe("DUPLICATE");
    expect(next.version).toBe(8);
    expect(events.map(x => x.type)).toEqual([
      "STATUS_CHANGED", "RESOLUTION_CHANGED",
    ]);
  });

  it("reopening removes stale terminal resolution and preserves legacy nonsquential transitions", () => {
    const reopened = applyBugWorkflowUpdate(
      bug({ status: "CLOSED", resolution: "FIXED", version: 4 }),
      { expectedVersion: 4, status: "NEW" },
      admin, now,
    );
    expect(reopened.next.status).toBe("NEW");
    expect(reopened.next.resolution).toBeNull();
    expect(reopened.events.map(x => x.type)).toEqual([
      "STATUS_CHANGED", "RESOLUTION_CHANGED",
    ]);
  });

  it("READY_FOR_RETEST resets previous retest evidence, including timestamp", () => {
    const { next, events } = applyBugWorkflowUpdate(
      bug({
        status: "CLOSED",
        resolution: "FIXED",
        retestStatus: "PASS",
        retestedAt: new Date("2026-10-09T08:00:00.000Z"),
        version: 9,
      }),
      { expectedVersion: 9, status: "READY_FOR_RETEST" },
      admin, now,
    );
    expect(next.status).toBe("READY_FOR_RETEST");
    expect(next.retestStatus).toBe("NOT_RETESTED");
    expect(next.retestedAt).toBeNull();
    expect(next.resolution).toBeNull();
    expect(events.some(x => x.type === "WORKFLOW_UPDATED")).toBe(true);
    expect(events.find(x => x.type === "WORKFLOW_UPDATED")?.changedFields)
      .toEqual(expect.arrayContaining(["retestStatus", "retestedAt"]));
  });

  it("retest PASS closes with FIXED and audit actor attribution", () => {
    const { next, events } = applyBugWorkflowRetest(
      bug({ status: "READY_FOR_RETEST", version: 1 }),
      { expectedVersion: 1, result: " pass ", note: " regression is green " },
      admin, now,
    );
    expect(next.status).toBe("CLOSED");
    expect(next.resolution).toBe("FIXED");
    expect(next.retestStatus).toBe("PASS");
    expect(next.retestedAt).toEqual(now);
    expect(next.version).toBe(2);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "RETEST",
      actorId: "admin-1",
      previous: "READY_FOR_RETEST",
      next: "CLOSED / FIXED",
      note: "regression is green",
    });
  });

  it("retest FAIL returns to FIXING, clears resolution, invalidates production verification", () => {
    const { next } = applyBugWorkflowRetest(
      bug({ status: "READY_FOR_RETEST", productionVerified: true, version: 2 }),
      { expectedVersion: 2, result: "FAIL" },
      admin, now,
    );
    expect(next).toMatchObject({
      status: "FIXING",
      resolution: null,
      retestStatus: "FAIL",
      productionVerified: false,
      version: 3,
    });
  });

  it("rejects retest unless READY_FOR_RETEST and never changes the caller's snapshot", () => {
    const original = bug({ status: "CLOSED", version: 1 });
    expect(() => applyBugWorkflowRetest(
      original, { expectedVersion: 1, result: "PASS" }, admin, now,
    )).toThrowError("INVALID_STATE");
    expect(original.status).toBe("CLOSED");
    expect(original.version).toBe(1);
  });

  it.each([
    { id: "viewer", active: true, role: "LEARNER" },
    { id: "tpo", active: true, role: "TPO" },
    { id: "admin", active: false, role: "SUPER_ADMIN" },
    { id: "", active: true, role: "SUPER_ADMIN" },
  ])("rejects untrusted and disabled actors: $id/$role", (actor) => {
    expect(() => applyBugWorkflowUpdate(
      bug(), { expectedVersion: 0, status: "CLOSED" }, actor, now,
    )).toThrowError("FORBIDDEN");
    expect(() => applyBugWorkflowRetest(
      bug({ status: "READY_FOR_RETEST" }),
      { expectedVersion: 0, result: "PASS" }, actor, now,
    )).toThrowError("FORBIDDEN");
  });

  it("rejects stale optimistic writes for workflow and retest", () => {
    expect(() => applyBugWorkflowUpdate(
      bug({ version: 8 }), { expectedVersion: 7, status: "CLOSED" }, admin, now,
    )).toThrowError("STALE_VERSION");
    expect(() => applyBugWorkflowRetest(
      bug({ status: "READY_FOR_RETEST", version: 8 }),
      { expectedVersion: 7, result: "PASS" }, admin, now,
    )).toThrowError("STALE_VERSION");
  });

  it("rejects invalid enum status, resolution, layer and test status", () => {
    for (const change of [
      { expectedVersion: 0, status: "RESOLVED" },
      { expectedVersion: 0, resolution: "APPROVED" },
      { expectedVersion: 0, affectedLayer: "DATABASE" },
      { expectedVersion: 0, regressionTestStatus: "SKIPPED" },
    ]) {
      expect(() => applyBugWorkflowUpdate(bug(), change, admin, now))
        .toThrowError("INVALID_INPUT");
    }
    expect(() => applyBugWorkflowRetest(
      bug({ status: "READY_FOR_RETEST" }),
      { expectedVersion: 0, result: "SKIPPED" }, admin, now,
    )).toThrowError("INVALID_INPUT");
  });

  it("enforces commit SHA and engineering note length without persisting sensitive values in audits", () => {
    expect(() => applyBugWorkflowUpdate(
      bug(),
      { expectedVersion: 0, backendCommitSha: "a".repeat(65) },
      admin, now,
    )).toThrowError("INVALID_INPUT");

    const { next, events } = applyBugWorkflowUpdate(
      bug(),
      {
        expectedVersion: 0,
        rootCause: "Sensitive internal explanation",
        frontendCommitSha: "a".repeat(40),
        regressionTestStatus: "ADDED",
      },
      admin, now,
    );
    expect(next.rootCause).toBe("Sensitive internal explanation");
    expect(next.frontendCommitSha).toHaveLength(40);
    expect(next.regressionTestStatus).toBe("ADDED");
    expect(events).toHaveLength(1);
    expect(events[0]?.changedFields).toEqual([
      "rootCause", "frontendCommitSha", "regressionTestStatus",
    ]);
    expect(JSON.stringify(events)).not.toContain("Sensitive internal explanation");
  });

  it("no-op workflow does not mutate, increment version or invent events", () => {
    const original = bug({ version: 3 });
    const { next, events } = applyBugWorkflowUpdate(
      original, { expectedVersion: 3 }, admin, now,
    );
    expect(next).toEqual(original);
    expect(next).not.toBe(original);
    expect(events).toHaveLength(0);
  });

  it("blank resolution clears the old value while preserving CLOSED status", () => {
    const { next } = applyBugWorkflowUpdate(
      bug({ status: "CLOSED", resolution: "FIXED", version: 5 }),
      { expectedVersion: 5, resolution: "  " },
      admin, now,
    );
    expect(next.status).toBe("CLOSED");
    expect(next.resolution).toBeNull();
  });
});
