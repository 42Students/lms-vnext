/**
 * DB10 bug-tracker workflow contract, modeled from:
 * lms@21bad59d / BugTrackerWorkflowService.java and BugReport.java.
 *
 * Pure logic only: no DB writes, HTTP endpoint or authorization bypass.
 * Caller must atomically compare expectedVersion, update the row and append
 * returned events in one DB transaction. This module DOES NOT establish
 * persistence parity until that integration is built and tested.
 */
export const BUG_STATUSES = [
  "NEW", "CHECKING", "FIXING", "READY_FOR_RETEST", "CLOSED",
] as const;
export const BUG_RESOLUTIONS = [
  "FIXED", "DUPLICATE", "NOT_A_BUG", "CANNOT_REPRODUCE", "WONT_FIX",
] as const;
export const BUG_AFFECTED_LAYERS = [
  "FRONTEND", "BACKEND", "BOTH", "UNKNOWN",
] as const;
export const BUG_REGRESSION_TEST_STATUSES = [
  "NOT_REVIEWED", "NOT_REQUIRED", "PLANNED", "ADDED",
] as const;
export const BUG_RETEST_RESULTS = ["PASS", "FAIL"] as const;

export type BugStatus = (typeof BUG_STATUSES)[number];
export type BugResolution = (typeof BUG_RESOLUTIONS)[number];
export type BugAffectedLayer = (typeof BUG_AFFECTED_LAYERS)[number];
export type BugRegressionTestStatus =
  (typeof BUG_REGRESSION_TEST_STATUSES)[number];
export type BugRetestResult = (typeof BUG_RETEST_RESULTS)[number];
export type BugRetestStatus = "NOT_RETESTED" | BugRetestResult;

export type BugTrackerActor = {
  id: string;
  active: boolean;
  /** Resolve from server-side identity context. Never accept role from JSON. */
  role: string;
};

export type BugWorkflowSnapshot = {
  id: string;
  status: BugStatus;
  resolution: BugResolution | null;
  affectedLayer: BugAffectedLayer | null;
  rootCause: string | null;
  fixNotes: string | null;
  frontendCommitSha: string | null;
  backendCommitSha: string | null;
  regressionTestStatus: BugRegressionTestStatus;
  productionVerified: boolean;
  retestStatus: BugRetestStatus;
  retestedAt: Date | null;
  version: number;
};

export type BugWorkflowUpdate = {
  expectedVersion: number;
  status?: string | null;
  resolution?: string | null;
  affectedLayer?: string | null;
  rootCause?: string | null;
  fixNotes?: string | null;
  frontendCommitSha?: string | null;
  backendCommitSha?: string | null;
  regressionTestStatus?: string | null;
  productionVerified?: boolean | null;
};

export type BugWorkflowRetest = {
  expectedVersion: number;
  result: string;
  note?: string | null;
};

export type BugWorkflowAuditEvent = {
  type: "STATUS_CHANGED" | "RESOLUTION_CHANGED" | "WORKFLOW_UPDATED" | "RETEST";
  actorId: string;
  issueId: string;
  previous: string | null;
  next: string | null;
  note: string | null;
  changedFields: readonly string[];
  occurredAt: Date;
};

export type BugWorkflowTransition = {
  next: BugWorkflowSnapshot;
  events: readonly BugWorkflowAuditEvent[];
};

export class BugWorkflowError extends Error {
  constructor(
    readonly code:
      | "FORBIDDEN"
      | "STALE_VERSION"
      | "INVALID_INPUT"
      | "INVALID_STATE",
  ) {
    super(code === "INVALID_STATE" ? "Issue is not ready for retest." : code);
    this.name = "BugWorkflowError";
  }

  /** INVALID_STATE is a legacy retest conflict, not a malformed request. */
  get httpStatus(): 400 | 403 | 409 {
    return this.code === "INVALID_STATE" || this.code === "STALE_VERSION"
      ? 409 : this.code === "FORBIDDEN" ? 403 : 400;
  }
}

function requireSuperAdmin(actor: BugTrackerActor) {
  if (!actor.active || actor.role !== "SUPER_ADMIN" || !actor.id.trim()) {
    throw new BugWorkflowError("FORBIDDEN");
  }
}

function requireVersion(actual: number, expected: number) {
  if (!Number.isSafeInteger(expected) || expected < 0) {
    throw new BugWorkflowError("INVALID_INPUT");
  }
  if (actual !== expected) {
    throw new BugWorkflowError("STALE_VERSION");
  }
}

function requiredEnum<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[],
): T {
  const canonical = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!(allowed as readonly string[]).includes(canonical)) {
    throw new BugWorkflowError("INVALID_INPUT");
  }
  return canonical as T;
}

function optionalEnum<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return requiredEnum(raw, allowed);
}

function optionalText(raw: string | null, max: number): string | null {
  if (raw === null) return null;
  if (typeof raw !== "string" || raw.length > max) {
    throw new BugWorkflowError("INVALID_INPUT");
  }
  return raw.trim() || null;
}

function validateNow(value: Date) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new BugWorkflowError("INVALID_INPUT");
  }
}

function audit(
  kind: BugWorkflowAuditEvent["type"],
  actor: BugTrackerActor,
  issue: BugWorkflowSnapshot,
  now: Date,
  previous: string | null,
  next: string | null,
  changedFields: readonly string[] = [],
  note: string | null = null,
): BugWorkflowAuditEvent {
  return {
    type: kind,
    actorId: actor.id,
    issueId: issue.id,
    previous,
    next,
    note,
    changedFields,
    occurredAt: new Date(now.getTime()),
  };
}

/**
 * Mirrors legacy resolution/status/retest semantics. The existing legacy
 * workflow allows non-sequential status jumps and CLOSED with no resolution;
 * these quirks are preserved until a separately approved redesign.
 *
 * Unlike the legacy service, all admin field edits are also audit-attributed
 * (field names only, never sensitive values), and stale edits are rejected.
 */
export function applyBugWorkflowUpdate(
  current: BugWorkflowSnapshot,
  change: BugWorkflowUpdate,
  actor: BugTrackerActor,
  now: Date,
): BugWorkflowTransition {
  requireSuperAdmin(actor);
  requireVersion(current.version, change.expectedVersion);
  validateNow(now);

  const next: BugWorkflowSnapshot = { ...current };
  if (change.affectedLayer !== undefined && change.affectedLayer !== null) {
    next.affectedLayer = optionalEnum(change.affectedLayer, BUG_AFFECTED_LAYERS);
  }
  for (const field of [
    "rootCause", "fixNotes", "frontendCommitSha", "backendCommitSha",
  ] as const) {
    if (change[field] !== undefined && change[field] !== null) {
      const length = field.endsWith("Sha") ? 64 : 4000;
      next[field] = optionalText(change[field], length);
    }
  }
  if (change.regressionTestStatus !== undefined && change.regressionTestStatus !== null) {
    next.regressionTestStatus = requiredEnum(
      change.regressionTestStatus, BUG_REGRESSION_TEST_STATUSES,
    );
  }
  if (change.productionVerified !== undefined && change.productionVerified !== null) {
    if (typeof change.productionVerified !== "boolean") {
      throw new BugWorkflowError("INVALID_INPUT");
    }
    next.productionVerified = change.productionVerified;
  }
  if (change.status !== undefined && change.status !== null) {
    next.status = requiredEnum(change.status, BUG_STATUSES);
  }
  // A provided blank resolution clears it; a nonblank resolution closes.
  if (change.resolution !== undefined && change.resolution !== null) {
    next.resolution = optionalEnum(change.resolution, BUG_RESOLUTIONS);
    if (next.resolution !== null) next.status = "CLOSED";
  }
  if (next.status === "READY_FOR_RETEST") {
    next.resolution = null;
    next.retestStatus = "NOT_RETESTED";
    next.retestedAt = null;
  } else if (next.status !== "CLOSED") {
    next.resolution = null;
  }

  const events: BugWorkflowAuditEvent[] = [];
  if (next.status !== current.status) {
    events.push(audit("STATUS_CHANGED", actor, current, now, current.status, next.status));
  }
  if (next.resolution !== current.resolution) {
    events.push(audit(
      "RESOLUTION_CHANGED", actor, current, now, current.resolution, next.resolution,
    ));
  }
  const metadataFields = [
    "affectedLayer", "rootCause", "fixNotes", "frontendCommitSha",
    "backendCommitSha", "regressionTestStatus", "productionVerified",
    "retestStatus", "retestedAt",
  ] as const;
  const changedFields = metadataFields.filter(
    (field) => {
      const before = current[field], after = next[field];
      if (before instanceof Date || after instanceof Date) {
        return before?.valueOf() !== after?.valueOf();
      }
      return before !== after;
    },
  );
  if (changedFields.length) {
    events.push(audit(
      "WORKFLOW_UPDATED", actor, current, now, null, null, changedFields,
    ));
  }
  next.version = current.version + (events.length ? 1 : 0);
  return { next, events };
}

/** Retest is a privileged mutation in the legacy Super Admin controller.
 * The historic manager/admin label is not a grant: only an active persisted
 * Super Admin may mutate global DB10 workflow state. INVALID_STATE retains
 * the exact legacy text "Issue is not ready for retest." above.
 */
export function applyBugWorkflowRetest(
  current: BugWorkflowSnapshot,
  change: BugWorkflowRetest,
  actor: BugTrackerActor,
  now: Date,
): BugWorkflowTransition {
  requireSuperAdmin(actor);
  requireVersion(current.version, change.expectedVersion);
  validateNow(now);
  if (current.status !== "READY_FOR_RETEST") {
    throw new BugWorkflowError("INVALID_STATE");
  }
  const result = requiredEnum(change.result, BUG_RETEST_RESULTS);
  const note = optionalText(change.note ?? null, 1000);
  const next: BugWorkflowSnapshot = {
    ...current,
    retestStatus: result,
    retestedAt: new Date(now.getTime()),
    status: result === "PASS" ? "CLOSED" : "FIXING",
    resolution: result === "PASS" ? "FIXED" : null,
    productionVerified: result === "PASS" ? current.productionVerified : false,
    version: current.version + 1,
  };
  return {
    next,
    events: [
      audit(
        "RETEST", actor, current, now, current.status,
        result === "PASS" ? "CLOSED / FIXED" : "FIXING", [], note,
      ),
    ],
  };
}
