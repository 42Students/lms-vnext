/**
 * DB04 pure state transition planner.
 * A persistence adapter MUST lock the row, write the new record and append its
 * event in a single transaction. This module does not certify file uploads.
 */
export type VerificationSection = "EDUCATION" | "IDENTITY";
export type VerificationStatus = "SUBMITTED" | "SENT_BACK" | "VERIFIED" | "UPDATE_PENDING";
export type VerificationAction = "SUBMITTED" | "UPDATE_SUBMITTED" | "VERIFIED" | "SENT_BACK";
export type VerificationActorKind = "LEARNER" | "COLLEGE_ADMIN" | "SUPER_ADMIN" | "TPO";
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type SafeSnapshot = { [key: string]: JsonValue };

export type VerificationRecord = {
  learnerMembershipId: string;
  section: VerificationSection;
  status: VerificationStatus;
  submittedSnapshot: SafeSnapshot;
  verifiedSnapshot: SafeSnapshot | null;
  submittedAt: Date;
  verifiedAt: Date | null;
  decidedAt: Date | null;
  decidedByUserId: string | null;
  decidedByName: string | null;
  note: string | null;
  version: number;
};
export type VerificationEvent = {
  action: VerificationAction;
  section: VerificationSection;
  actorKind: VerificationActorKind;
  actorUserId: string;
  actorName: string | null;
  occurredAt: Date;
  priorVersion: number;
  nextVersion: number;
  note: string | null;
  snapshot: SafeSnapshot | null;
};
export type Transition = { record: VerificationRecord; event: VerificationEvent };
export type Actor = { userId: string; kind: VerificationActorKind; displayName: string | null };
export type VerificationErrorCode =
  | "INVALID_SNAPSHOT" | "UNSAFE_SNAPSHOT" | "INCOMPLETE_DOCUMENTS"
  | "STALE_VERSION" | "INVALID_TRANSITION" | "NOTHING_CHANGED"
  | "NOT_ALLOWED" | "REASON_REQUIRED";
export class VerificationStateError extends Error {
  readonly code: VerificationErrorCode;
  constructor(code: VerificationErrorCode) {
    super(code);
    this.code = code;
    this.name = "VerificationStateError";
  }
}

/**
 * Defense-in-depth guard for already validated producer data.
 * Require masked identity values and UUID document references; never put raw
 * identity numbers, binary files or public URLs into verification/event JSON.
 */
export function safeVerificationSnapshot(value: unknown): SafeSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) {
    throw new VerificationStateError("INVALID_SNAPSHOT");
  }
  const seen = new WeakSet<object>();
  const walk = (part: unknown, key: string, depth: number): JsonValue => {
    if (depth > 12) throw new VerificationStateError("INVALID_SNAPSHOT");
    if (part === null || typeof part === "boolean" || typeof part === "string") {
      if (typeof part === "string" && part.length > 12000) throw new VerificationStateError("INVALID_SNAPSHOT");
      if (/^(aadhaarNumber|panNumber|identityNumber|aadhaar|pan)$/i.test(key) &&
          typeof part === "string" && part &&
          !/^[*Xx•-]{4,}[A-Za-z0-9]{0,4}$/.test(part)) {
        throw new VerificationStateError("UNSAFE_SNAPSHOT");
      }
      if (/(?:Document|Marksheet|Resume)(?:Url|Link|Path)?$/i.test(key) && typeof part === "string" &&
          /^(?:https?:|data:|gs:|s3:|\/\/)/i.test(part)) {
        throw new VerificationStateError("UNSAFE_SNAPSHOT");
      }
      if (/(?:DocumentId|ReceiptId)$/i.test(key) && typeof part === "string" &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(part)) {
        throw new VerificationStateError("UNSAFE_SNAPSHOT");
      }
      return part;
    }
    if (typeof part === "number") {
      if (!Number.isFinite(part)) throw new VerificationStateError("INVALID_SNAPSHOT");
      return part;
    }
    if (typeof part !== "object" || !part || seen.has(part)) {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    seen.add(part);
    if (Array.isArray(part)) {
      if (part.length > 100) throw new VerificationStateError("INVALID_SNAPSHOT");
      const out = part.map((child) => walk(child, key, depth + 1));
      seen.delete(part);
      return out;
    }
    if (Object.getPrototypeOf(part) !== Object.prototype || Object.keys(part).length > 100) {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    const out: { [key: string]: JsonValue } = {};
    for (const [childKey, child] of Object.entries(part)) {
      if (childKey === "__proto__" || childKey === "constructor" || childKey === "prototype") {
        throw new VerificationStateError("INVALID_SNAPSHOT");
      }
      out[childKey] = walk(child, childKey, depth + 1);
    }
    seen.delete(part);
    return out;
  };
  const snapshot = walk(value, "", 0) as SafeSnapshot;
  if (JSON.stringify(snapshot).length > 65536) throw new VerificationStateError("INVALID_SNAPSHOT");
  return snapshot;
}
function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => JSON.stringify(key) + ":" + canonicalJson(child)).join(",") + "}";
}
export function sameSnapshot(a: SafeSnapshot | null, b: SafeSnapshot | null): boolean {
  return a !== null && b !== null && canonicalJson(a) === canonicalJson(b);
}
export function hasEffectiveVerifiedSnapshot(record: VerificationRecord | null): boolean {
  return Boolean(record?.verifiedSnapshot &&
    (record.status === "VERIFIED" || record.status === "UPDATE_PENDING"));
}
function assertVersion(record: VerificationRecord | null, expectedVersion: number): void {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 ||
      (record?.version ?? 0) !== expectedVersion) {
    throw new VerificationStateError("STALE_VERSION");
  }
}
function makeEvent(action: VerificationAction, section: VerificationSection, actor: Actor,
                   now: Date, priorVersion: number, snapshot: SafeSnapshot | null, note: string | null): VerificationEvent {
  return { action, section, actorKind: actor.kind, actorUserId: actor.userId,
    actorName: actor.displayName, occurredAt: now, priorVersion, nextVersion: priorVersion + 1,
    note, snapshot };
}

/** Preconditions: actor derived from authenticated session, documentsReady
 * from trusted private receipt checks, and expectedVersion from current row. */
export function planVerificationSubmission(input: {
  learnerMembershipId: string;
  section: VerificationSection;
  existing: VerificationRecord | null;
  expectedVersion: number;
  snapshot: unknown;
  documentsReady: boolean;
  actor: Actor;
  now: Date;
}): Transition {
  const { learnerMembershipId, section, existing, expectedVersion, documentsReady, actor, now } = input;
  if (actor.kind !== "LEARNER" ||
      (existing && (existing.learnerMembershipId !== learnerMembershipId || existing.section !== section))) {
    throw new VerificationStateError("NOT_ALLOWED");
  }
  assertVersion(existing, expectedVersion);
  if (!documentsReady) throw new VerificationStateError("INCOMPLETE_DOCUMENTS");
  const snapshot = safeVerificationSnapshot(input.snapshot);
  if (existing && sameSnapshot(existing.submittedSnapshot, snapshot) &&
      (existing.status === "SUBMITTED" || existing.status === "UPDATE_PENDING")) {
    throw new VerificationStateError("NOTHING_CHANGED");
  }
  const update = existing?.status === "VERIFIED" || existing?.status === "UPDATE_PENDING";
  if (update && sameSnapshot(existing.verifiedSnapshot, snapshot)) {
    throw new VerificationStateError("NOTHING_CHANGED");
  }
  const record: VerificationRecord = {
    learnerMembershipId, section, status: update ? "UPDATE_PENDING" : "SUBMITTED",
    submittedSnapshot: snapshot, verifiedSnapshot: existing?.verifiedSnapshot ?? null,
    submittedAt: now, verifiedAt: existing?.verifiedAt ?? null,
    decidedAt: existing?.decidedAt ?? null, decidedByUserId: existing?.decidedByUserId ?? null,
    decidedByName: existing?.decidedByName ?? null, note: null, version: expectedVersion + 1,
  };
  return { record, event: makeEvent(update ? "UPDATE_SUBMITTED" : "SUBMITTED", section,
    actor, now, expectedVersion, snapshot, null) };
}

/** A rejected update goes back to VERIFIED without replacing its old verified
 * snapshot. First-time rejection is SENT_BACK. */
export function planVerificationReview(input: {
  existing: VerificationRecord;
  expectedVersion: number;
  action: "VERIFY" | "SEND_BACK";
  actor: Actor;
  reason?: string;
  documentsReviewedAndAccepted: boolean;
  now: Date;
}): Transition {
  const { existing, expectedVersion, action, actor, now } = input;
  if (actor.kind === "LEARNER") throw new VerificationStateError("NOT_ALLOWED");
  assertVersion(existing, expectedVersion);
  if (existing.status !== "SUBMITTED" && existing.status !== "UPDATE_PENDING") {
    throw new VerificationStateError("INVALID_TRANSITION");
  }
  const reason = input.reason?.trim() ?? "";
  if (action === "SEND_BACK" && reason.length < 3) throw new VerificationStateError("REASON_REQUIRED");
  if (action === "VERIFY" && !input.documentsReviewedAndAccepted) {
    throw new VerificationStateError("INCOMPLETE_DOCUMENTS");
  }
  const approved = action === "VERIFY";
  const record: VerificationRecord = {
    ...existing,
    status: approved ? "VERIFIED" : existing.status === "UPDATE_PENDING" ? "VERIFIED" : "SENT_BACK",
    verifiedSnapshot: approved ? existing.submittedSnapshot : existing.verifiedSnapshot,
    verifiedAt: approved ? now : existing.verifiedAt,
    decidedAt: now, decidedByUserId: actor.userId, decidedByName: actor.displayName,
    note: approved ? null : reason, version: expectedVersion + 1,
  };
  return { record, event: makeEvent(approved ? "VERIFIED" : "SENT_BACK", existing.section,
    actor, now, expectedVersion, approved ? existing.submittedSnapshot : null, approved ? null : reason) };
}
