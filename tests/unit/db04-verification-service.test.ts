import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { submitOwnVerification, reviewProfileVerification, type VerificationTransactionRepository } from
  "@/modules/profile-verification/service";
import type { SafeSnapshot, Transition, VerificationRecord, VerificationSection } from
  "@/modules/profile-verification/domain";

const now = new Date("2026-10-10T01:00:00Z");
const collegeA = "college-a", orgA = "org-a", learnerMembership = "learner-membership";
const doc = "6b88df90-58d0-40f9-b88c-760b9d8db319";
const identity: SafeSnapshot = {aadhaarNumber: "XXXXXXXX1234", aadhaarDocumentId: doc};
const updated: SafeSnapshot = {aadhaarNumber: "XXXXXXXX5678", aadhaarDocumentId: doc};

function ctx(kind: "LEARNER" | "COLLEGE_ADMIN" | "TPO" | "SUPER_ADMIN", collegeId = collegeA): RequestContext {
  const superAdmin = kind === "SUPER_ADMIN";
  const membershipRole = kind === "SUPER_ADMIN" ? "COLLEGE_ADMIN" : kind;
  return {
    user: {
      id: kind === "LEARNER" ? "learner-user" : kind.toLowerCase(),
      identityUid: "identity-" + kind,
      platformStatus: "ACTIVE",
      systemRoles: superAdmin ? ["SUPER_ADMIN"] : [],
    },
    membership: superAdmin ? null : {
      id: kind === "LEARNER" ? learnerMembership : "actor-" + kind,
      collegeId,
      organizationId: orgA,
      status: "ACTIVE",
      roles: [membershipRole],
    },
  };
}

class MemoryRepo implements VerificationTransactionRepository {
  current: VerificationRecord | null = null;
  events: Transition["event"][] = [];
  snapshot = identity;
  documentsReady = true;
  evidenceValid = true;
  tpoAdmin = true;
  tpoEnabled = true;
  targetCollege = collegeA;
  targetStatus: "ACTIVE" | "SUSPENDED" | "ENDED" = "ACTIVE";
  async resolveLearner(id: string) {
    if (id !== learnerMembership) return null;
    return {
      membershipId: id,
      collegeId: this.targetCollege,
      organizationId: orgA,
      userId: "learner-user",
      status: this.targetStatus,
      hasLearnerRole: true,
    };
  }
  async isTpoAdministrator() { return this.tpoAdmin; }
  async isTpoVerificationEnabled() { return this.tpoEnabled; }
  async readCurrentSectionForSubmission() {
    return {snapshot: this.snapshot, documentsReady: this.documentsReady};
  }
  async submittedEvidenceIsValid() { return this.evidenceValid; }
  async withLockedTransition(
    _id: string, _section: VerificationSection,
    plan: (existing: VerificationRecord | null) => Promise<Transition>,
  ) {
    const transition = await plan(this.current);
    this.current = transition.record;
    this.events.push(transition.event);
    return transition.record;
  }
}
const command = (expectedVersion: number, action: "VERIFY" | "SEND_BACK" = "VERIFY", reason?: string) =>
  ({learnerMembershipId: learnerMembership, section: "IDENTITY" as const, expectedVersion, action, reason});

describe("DB04 verification service enforcement", () => {
  it("sources learner snapshot from server and maintains paired revision/events", async () => {
    const db = new MemoryRepo();
    const first = await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now);
    expect(first.status).toBe("SUBMITTED");
    expect(first.submittedSnapshot).toEqual(identity);
    expect(db.events).toHaveLength(1);
    expect(db.events[0]).toMatchObject({action: "SUBMITTED", nextVersion: 1});
    expect((await reviewProfileVerification(ctx("COLLEGE_ADMIN"), command(1), db, now)).status)
      .toBe("VERIFIED");
    expect(db.events).toHaveLength(2);
  });

  it("maintains original verified data on a rejected update", async () => {
    const db = new MemoryRepo();
    await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now);
    await reviewProfileVerification(ctx("COLLEGE_ADMIN"), command(1), db, now);
    db.snapshot = updated;
    const pending = await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 2, db, now);
    expect(pending.status).toBe("UPDATE_PENDING");
    expect(pending.verifiedSnapshot).toEqual(identity);
    const back = await reviewProfileVerification(ctx("COLLEGE_ADMIN"),
      command(3, "SEND_BACK", "Document mismatch"), db, now);
    expect(back.status).toBe("VERIFIED");
    expect(back.verifiedSnapshot).toEqual(identity);
    expect(db.events.map((e) => e.action)).toEqual([
      "SUBMITTED", "VERIFIED", "UPDATE_SUBMITTED", "SENT_BACK",
    ]);
  });

  it("denies self-verification, cross-tenant admins and coordinators", async () => {
    const db = new MemoryRepo();
    await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now);
    await expect(reviewProfileVerification(ctx("LEARNER"), command(1), db, now))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(reviewProfileVerification(ctx("COLLEGE_ADMIN", "college-b"), command(1), db, now))
      .rejects.toBeInstanceOf(AuthorizationError);
    db.tpoAdmin = false;
    await expect(reviewProfileVerification(ctx("TPO"), command(1), db, now))
      .rejects.toBeInstanceOf(AuthorizationError);
    expect(db.events).toHaveLength(1);
  });

  it("revokes TPO permission at decision time when college setting changes", async () => {
    const db = new MemoryRepo();
    await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now);
    db.tpoEnabled = false;
    await expect(reviewProfileVerification(ctx("TPO"), command(1), db, now))
      .rejects.toBeInstanceOf(AuthorizationError);
    db.tpoEnabled = true;
    expect((await reviewProfileVerification(ctx("TPO"), command(1), db, now)).status).toBe("VERIFIED");
  });

  it("requires actual accepted private evidence, never an unchecked blind approval", async () => {
    const db = new MemoryRepo();
    await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now);
    db.evidenceValid = false;
    await expect(reviewProfileVerification(ctx("COLLEGE_ADMIN"), command(1), db, now))
      .rejects.toThrowError("INCOMPLETE_DOCUMENTS");
    expect(db.events).toHaveLength(1);
    expect(db.current?.status).toBe("SUBMITTED");
  });

  it("denies impersonation by another account and suspended target membership", async () => {
    const db = new MemoryRepo();
    await expect(submitOwnVerification(ctx("COLLEGE_ADMIN"), "IDENTITY", 0, db, now))
      .rejects.toBeInstanceOf(AuthorizationError);
    db.targetStatus = "SUSPENDED";
    await expect(submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now))
      .rejects.toThrowError("NOT_ALLOWED");
  });

  it("respects superadmin selected-college scope", async () => {
    const db = new MemoryRepo();
    await submitOwnVerification(ctx("LEARNER"), "IDENTITY", 0, db, now);
    const scoped = {...ctx("SUPER_ADMIN"),
      adminScope: {collegeId: "college-b", organizationId: orgA}};
    await expect(reviewProfileVerification(scoped, command(1), db, now))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
});
