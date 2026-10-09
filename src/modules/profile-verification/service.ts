import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import {
  planVerificationReview,
  planVerificationSubmission,
  VerificationStateError,
  type Actor,
  type SafeSnapshot,
  type Transition,
  type VerificationRecord,
  type VerificationSection,
} from "./domain";

/**
 * Every method in this repository is server-authoritative. No target identity,
 * TPO role, document readiness, or snapshot may be taken from request JSON.
 *
 * withLockedTransition MUST:
 *  1. start a DB transaction and lock current record/key for membership+section;
 *  2. execute the plan under that lock;
 *  3. atomically persist current row, event history and any verified evidence;
 *  4. enforce the plan's expected row version and rollback on mismatch.
 *
 * Until a PostgreSQL adapter implements this contract, these service methods
 * must NOT be connected to public API routes.
 */
export type VerificationLearnerTarget = {
    membershipId: string;
    collegeId: string;
    organizationId: string;
    userId: string;
    status: "ACTIVE" | "SUSPENDED" | "ENDED";
    hasLearnerRole: boolean;
};

export interface VerificationTransactionRepository {
  resolveLearner(membershipId: string): Promise<VerificationLearnerTarget | null>;
  /** Display-name snapshot for audit; resolve from canonical user/actor membership. */
  reviewerDisplayName(userId: string): Promise<string | null>;
  isTpoAdministrator(actorUserId: string, collegeId: string): Promise<boolean>;
  isTpoVerificationEnabled(collegeId: string): Promise<boolean>;
  withLockedTransition(
    membershipId: string,
    section: VerificationSection,
    plan: (current: VerificationRecord | null) => Promise<Transition>,
  ): Promise<VerificationRecord>;
  /** Authoritative current learner section; private receipt checks are mandatory. */
  readCurrentSectionForSubmission(
    membershipId: string,
    section: VerificationSection,
  ): Promise<{ snapshot: SafeSnapshot; documentsReady: boolean }>;
  /** Must inspect the receipt status and purpose of submitted document IDs. */
  submittedEvidenceIsValid(
    membershipId: string,
    section: VerificationSection,
    snapshot: SafeSnapshot,
  ): Promise<boolean>;
}

function assertLearnerTarget(target: VerificationLearnerTarget | null): asserts target is VerificationLearnerTarget {
  if (!target || target.status !== "ACTIVE" || !target.hasLearnerRole) {
    throw new VerificationStateError("NOT_ALLOWED");
  }
}

function ownLearner(context: RequestContext, membershipId: string) {
  if (context.user.platformStatus !== "ACTIVE" ||
      context.membership?.id !== membershipId ||
      context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "LEARNER")) {
    throw new AuthorizationError("profile-verification.review");
  }
}

function actor(context: RequestContext): Actor {
  let kind: Actor["kind"];
  if (isSuperAdmin(context)) kind = "SUPER_ADMIN";
  else if (hasMembershipRole(context, "COLLEGE_ADMIN")) kind = "COLLEGE_ADMIN";
  else if (hasMembershipRole(context, "TPO")) kind = "TPO";
  else kind = "LEARNER";
  return { userId: context.user.id, kind, displayName: null };
}

export async function submitOwnVerification(
  context: RequestContext,
  section: VerificationSection,
  expectedVersion: number,
  repository: VerificationTransactionRepository,
  now: Date = new Date(),
): Promise<VerificationRecord> {
  const membershipId = context.membership?.id;
  if (!membershipId) throw new AuthorizationError("profile-verification.review");
  ownLearner(context, membershipId);
  const target = await repository.resolveLearner(membershipId);
  assertLearnerTarget(target);
  if (target.userId !== context.user.id || target.collegeId !== context.membership?.collegeId) {
    throw new VerificationStateError("NOT_ALLOWED");
  }
  return repository.withLockedTransition(membershipId, section, async (existing) => {
    // Source the snapshot from the current server-held profile rather than body JSON.
    const prepared = await repository.readCurrentSectionForSubmission(membershipId, section);
    return planVerificationSubmission({
      learnerMembershipId: membershipId, section, existing, expectedVersion,
      snapshot: prepared.snapshot, documentsReady: prepared.documentsReady,
      actor: actor(context), now,
    });
  });
}

export async function reviewProfileVerification(
  context: RequestContext,
  input: {
    learnerMembershipId: string;
    section: VerificationSection;
    expectedVersion: number;
    action: "VERIFY" | "SEND_BACK";
    reason?: string;
  },
  repository: VerificationTransactionRepository,
  now: Date = new Date(),
): Promise<VerificationRecord> {
  const target = await repository.resolveLearner(input.learnerMembershipId);
  assertLearnerTarget(target);
  const tpo = hasMembershipRole(context, "TPO");
  // Always look up the team's role and college settings server-side, at action time.
  const [tpoAdministrator, tpoVerificationEnabled] = tpo
    ? await Promise.all([
        repository.isTpoAdministrator(context.user.id, target.collegeId),
        repository.isTpoVerificationEnabled(target.collegeId),
      ])
    : [false, false];
  requirePermission(context, "profile-verification.review", {
    collegeId: target.collegeId, organizationId: target.organizationId,
    tpoVerificationAdministrator: tpoAdministrator,
    tpoVerificationEnabled,
  });
  const reviewer: Actor = {...actor(context), displayName:
    await repository.reviewerDisplayName(context.user.id)};
  if (reviewer.kind === "LEARNER") throw new VerificationStateError("NOT_ALLOWED");
  return repository.withLockedTransition(input.learnerMembershipId, input.section, async (existing) => {
    // Recheck after the writer has acquired the college lock. The earlier
    // fast-fail check cannot protect against a grant/settings revocation race.
    const [stillTpoAdmin,stillTpoEnabled] = tpo
      ? await Promise.all([
          repository.isTpoAdministrator(context.user.id,target.collegeId),
          repository.isTpoVerificationEnabled(target.collegeId),
        ])
      : [false,false];
    requirePermission(context,"profile-verification.review",{
      collegeId:target.collegeId,organizationId:target.organizationId,
      tpoVerificationAdministrator:stillTpoAdmin,
      tpoVerificationEnabled:stillTpoEnabled,
    });
    if (!existing) throw new VerificationStateError("INVALID_TRANSITION");
    const documentsReviewedAndAccepted = input.action === "VERIFY"
      ? await repository.submittedEvidenceIsValid(
          input.learnerMembershipId, input.section, existing.submittedSnapshot,
        )
      : false;
    return planVerificationReview({
      existing, expectedVersion: input.expectedVersion, action: input.action,
      actor: reviewer, reason: input.reason, documentsReviewedAndAccepted, now,
    });
  });
}
