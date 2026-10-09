import { describe, expect, it } from "vitest";
import {
  hasEffectiveVerifiedSnapshot,
  planVerificationReview,
  planVerificationSubmission,
  safeVerificationSnapshot,
  sameSnapshot,
  type Actor,
  type VerificationRecord,
} from "@/modules/profile-verification/domain";

const now = new Date("2026-10-10T00:00:00.000Z");
const membershipId = "94535f51-cf64-4072-88da-35b1fc545f30";
const documentId = "6b88df90-58d0-40f9-b88c-760b9d8db319";
const learner: Actor = { kind: "LEARNER", userId: "learner", displayName: null };
const admin: Actor = { kind: "COLLEGE_ADMIN", userId: "admin", displayName: "College Admin" };
const tpo: Actor = { kind: "TPO", userId: "tpo", displayName: "Placement Admin" };
const oldMarks = { education: [{ grade: "9.2", scale: "CGPA", max: "10", marksheetDocumentId: documentId }] };
const newMarks = { education: [{ grade: "9.5", scale: "CGPA", max: "10", marksheetDocumentId: documentId }] };

function submit(existing: VerificationRecord | null, snapshot: unknown = oldMarks) {
  return planVerificationSubmission({ learnerMembershipId: membershipId, section: "EDUCATION",
    existing, expectedVersion: existing?.version ?? 0, documentsReady: true,
    snapshot, actor: learner, now });
}
function decide(existing: VerificationRecord, action: "VERIFY" | "SEND_BACK", reason?: string) {
  return planVerificationReview({ existing, expectedVersion: existing.version, action,
    actor: admin, reason, documentsReviewedAndAccepted: true, now });
}

describe("DB04 profile verification state transitions", () => {
  it("submits initial data with one event plan", () => {
    const first = submit(null);
    expect(first.record).toMatchObject({ status: "SUBMITTED", version: 1, verifiedSnapshot: null });
    expect(first.event).toMatchObject({ action: "SUBMITTED", priorVersion: 0, nextVersion: 1, actorKind: "LEARNER" });
    expect(hasEffectiveVerifiedSnapshot(first.record)).toBe(false);
  });

  it("preserves first-submit sendback, resubmission and approval", () => {
    const returned = decide(submit(null).record, "SEND_BACK", "Please attach a clearer marksheet");
    expect(returned.record.status).toBe("SENT_BACK");
    expect(returned.event).toMatchObject({ action: "SENT_BACK", snapshot: null });
    const retried = submit(returned.record, newMarks);
    expect(retried.record).toMatchObject({ status: "SUBMITTED", note: null, version: 3 });
    const approved = decide(retried.record, "VERIFY");
    expect(approved.record.status).toBe("VERIFIED");
    expect(approved.record.verifiedSnapshot).toEqual(newMarks);
    expect(approved.record.decidedByUserId).toBe("admin");
    expect(approved.event.action).toBe("VERIFIED");
  });

  it("keeps old verified values while an update waits and after update sendback", () => {
    const verified = decide(submit(null).record, "VERIFY");
    const changed = submit(verified.record, newMarks);
    expect(changed.record.status).toBe("UPDATE_PENDING");
    expect(changed.event.action).toBe("UPDATE_SUBMITTED");
    expect(changed.record.verifiedSnapshot).toEqual(oldMarks);
    expect(hasEffectiveVerifiedSnapshot(changed.record)).toBe(true);
    const sentBack = decide(changed.record, "SEND_BACK", "Needs correction");
    expect(sentBack.record.status).toBe("VERIFIED");
    expect(sentBack.record.verifiedSnapshot).toEqual(oldMarks);
    expect(sentBack.record.submittedSnapshot).toEqual(newMarks);
    expect(sentBack.event.action).toBe("SENT_BACK");
  });

  it("publishes the new snapshot on verified updates only", () => {
    const verified = decide(submit(null).record, "VERIFY");
    const changed = submit(verified.record, newMarks);
    const accepted = decide(changed.record, "VERIFY");
    expect(accepted.record.verifiedSnapshot).toEqual(newMarks);
    expect(accepted.record.verifiedAt).toEqual(now);
    expect(accepted.record.version).toBe(4);
  });

  it("blocks stale reviewer decisions with optimistic version expectation", () => {
    const accepted = decide(submit(null).record, "VERIFY");
    expect(() => planVerificationReview({ existing: accepted.record, expectedVersion: 1,
      action: "SEND_BACK", reason: "Stale review", actor: tpo,
      documentsReviewedAndAccepted: true, now })).toThrowError("STALE_VERSION");
  });

  it("denies learner approval, invalid transitions and short sendback reasons", () => {
    const first = submit(null).record;
    expect(() => planVerificationReview({ existing: first, expectedVersion: 1,
      action: "VERIFY", actor: learner, documentsReviewedAndAccepted: true, now })).toThrowError("NOT_ALLOWED");
    expect(() => decide(decide(first, "VERIFY").record, "VERIFY")).toThrowError("INVALID_TRANSITION");
    expect(() => decide(first, "SEND_BACK", "no")).toThrowError("REASON_REQUIRED");
  });

  it("requires trusted document readiness on submit and verify", () => {
    expect(() => planVerificationSubmission({ learnerMembershipId: membershipId, section: "EDUCATION",
      existing: null, expectedVersion: 0, snapshot: oldMarks, documentsReady: false, actor: learner, now }))
      .toThrowError("INCOMPLETE_DOCUMENTS");
    expect(() => planVerificationReview({ existing: submit(null).record, expectedVersion: 1,
      action: "VERIFY", actor: admin, documentsReviewedAndAccepted: false, now }))
      .toThrowError("INCOMPLETE_DOCUMENTS");
  });

  it("rejects unchanged repeated submissions, matching verified snapshots and stale revisions", () => {
    const first = submit(null).record;
    expect(() => submit(first)).toThrowError("NOTHING_CHANGED");
    const verified = decide(first, "VERIFY").record;
    expect(() => submit(verified)).toThrowError("NOTHING_CHANGED");
    expect(() => planVerificationSubmission({ learnerMembershipId: membershipId, section: "EDUCATION",
      existing: verified, expectedVersion: 1, snapshot: newMarks, documentsReady: true, actor: learner, now }))
      .toThrowError("STALE_VERSION");
  });

  it("denies cross-membership/section submissions and non-learner impersonation", () => {
    const first = submit(null).record;
    expect(() => planVerificationSubmission({ learnerMembershipId: "other", section: "EDUCATION",
      existing: first, expectedVersion: 1, snapshot: newMarks, documentsReady: true, actor: learner, now }))
      .toThrowError("NOT_ALLOWED");
    expect(() => planVerificationSubmission({ learnerMembershipId: membershipId, section: "IDENTITY",
      existing: first, expectedVersion: 1, snapshot: {}, documentsReady: true, actor: learner, now }))
      .toThrowError("NOT_ALLOWED");
    expect(() => planVerificationSubmission({ learnerMembershipId: membershipId, section: "EDUCATION",
      existing: first, expectedVersion: 1, snapshot: newMarks, documentsReady: true, actor: admin, now }))
      .toThrowError("NOT_ALLOWED");
  });

  it("rejects raw ID numbers, public document URLs, malformed receipts and foreign prototypes", () => {
    expect(() => safeVerificationSnapshot({aadhaarNumber: "123412341234"})).toThrowError("UNSAFE_SNAPSHOT");
    expect(() => safeVerificationSnapshot({panNumber: "ABCDE1234F"})).toThrowError("UNSAFE_SNAPSHOT");
    expect(() => safeVerificationSnapshot({identity: {aadhaarDocumentUrl: "https://example.com/file"}}))
      .toThrowError("UNSAFE_SNAPSHOT");
    expect(() => safeVerificationSnapshot({marksheetDocumentId: "not-a-uuid"})).toThrowError("UNSAFE_SNAPSHOT");
    expect(() => safeVerificationSnapshot(Object.create({oops: true}))).toThrowError("INVALID_SNAPSHOT");
    expect(safeVerificationSnapshot({aadhaarNumber: "XXXXXXXX1234", aadhaarDocumentId: documentId}))
      .toEqual({aadhaarNumber: "XXXXXXXX1234", aadhaarDocumentId: documentId});
  });

  it("compares semantically identical snapshots independently of object key order", () => {
    expect(sameSnapshot({education: [{grade: "9.2", scale: "CGPA"}]},
      {education: [{scale: "CGPA", grade: "9.2"}]})).toBe(true);
  });
});
