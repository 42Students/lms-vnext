import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  cohorts,
  collegeMemberships,
  colleges,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  moduleAccessRules,
  placementApplications,
  placementApplicationStatusHistory,
  placementApplicationScreenings,
  placementCandidateAcademicEvidence,
  placementCompanyRelationships,
  placementCompanies,
  placementDriveDayCoordinatorAssignments,
  placementDebarments,
  placementEligibilityDecisions,
  placementEligibilityOverrides,
  placementJobs,
  placementJobEligibilityPolicies,
  placementCollegeRules,
  placementOffers,
  placementRoundResults,
  placementBatchRegistrations,
  placementJobRoleOptions,
  placementJobRounds,
  placementRoundCandidateSlots,
  placementApplicationRoundExceptions,
  programs,
  sectionEnrollments,
  sections,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { learnerWithdrawalReasonSchema } from "./learner-withdrawal-model";
import {learnerStaffApplicationOptOut} from "./learner-staff-application-optout-model";
import {learnerWithdrawalMode} from "./learner-withdrawal-mode-model";
import { evaluatePlacementEligibility, isPlacementJobTargetCohort, placementApplyEligibilityDenial } from "./eligibility-service";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { getOwnPlacementParticipationAccess } from "./batch-participation-service";
import { isPlacementLearnerDebarred } from "./debarment-service";
import { placementBatchLifecycles } from "@/db/schema/placement-batches";
import { resolveSelfApplyRegistrationChoice } from "./batch-registration-policy";
import { canAddPlacementHeldOffer } from "./held-offer-policy";
import { loadPlacementHeldOfferFacts } from "./held-offer-facts-service";
import { isPlacementApplicationDeadlinePassed } from "./application-deadline-policy";
import { hasActivePlacementDebarment } from "./placement-debarment-gate";
import {
  createPlacementApplicationInputSchema,
  placementApplicationIdSchema,
  placementJobIdSchema,
  type CreatePlacementApplicationInput,
} from "./validation";

async function loadJob(jobId: string) {
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }
  return job;
}

function requireLearnerMembership(
  context: RequestContext,
  collegeId?: string,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER") ||
    (collegeId &&
      context.membership.collegeId !== collegeId)
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

/**
 * Freeze every currently persisted input which can make learner self-apply
 * more restrictive while the application transaction is in flight.
 *
 * Lock order is deliberate: caller already holds placement_jobs FOR UPDATE,
 * then we lock the learner membership and its academic/access inputs. Job
 * eligibility writers use the same job row; academic-evidence writers use the
 * same membership row. Existing module/participation rows are locked FOR SHARE
 * so an UPDATE/revoke that started first wins and is observed by the live
 * recheck, while a later writer waits until the application commits.
 *
 * This does not replace the live authorization recheck below. Locks establish
 * ordering; requireLearnerPlacementAccess/evaluatePlacementEligibility decide.
 */
async function lockLearnerApplicationGateInputs(
  tx: Tx,
  context: RequestContext,
  jobId: string,
  membershipId: string,
) {
  const membership = context.membership;
  if (!membership || membership.id !== membershipId) {
    throw new AuthorizationError("placements.read");
  }

  const [persistedMembership] = await tx
    .select({
      id: collegeMemberships.id,
      userId: collegeMemberships.userId,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    })
    .from(collegeMemberships)
    .where(eq(collegeMemberships.id, membershipId))
    .for("share")
    .limit(1);

  if (
    !persistedMembership ||
    persistedMembership.status !== "ACTIVE" ||
    persistedMembership.userId !== context.user.id ||
    persistedMembership.collegeId !== membership.collegeId
  ) {
    throw new AuthorizationError("placements.read");
  }

  // A cached request context can still say ACTIVE after platform disablement.
  // Lock the persisted account for the remainder of this application write;
  // otherwise disable can commit between the gate read and INSERT.
  const [account] = await tx
    .select({ platformStatus: users.platformStatus })
    .from(users)
    .where(eq(users.id, context.user.id))
    .for("share")
    .limit(1);
  if (!account || account.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.read");
  }

  const [learnerRole] = await tx
    .select({ id: membershipRoles.id })
    .from(membershipRoles)
    .where(
      and(
        eq(membershipRoles.membershipId, membershipId),
        eq(membershipRoles.role, "LEARNER"),
      ),
    )
    .for("share")
    .limit(1);
  if (!learnerRole) {
    throw new AuthorizationError("placements.read");
  }

  const enrollments = await tx
    .select({
      id: learnerProgramEnrollments.id,
      cohortId: learnerProgramEnrollments.cohortId,
      programId: learnerProgramEnrollments.programId,
    })
    .from(learnerProgramEnrollments)
    .where(
      and(
        eq(learnerProgramEnrollments.membershipId, membershipId),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      ),
    )
    .for("share");

  if (enrollments.length !== 1) {
    throw new AuthorizationError("placements.read");
  }
  const enrollment = enrollments[0]!;

  const [cohort] = await tx
    .select({
      id: cohorts.id,
      programId: cohorts.programId,
    })
    .from(cohorts)
    .where(eq(cohorts.id, enrollment.cohortId))
    .for("share")
    .limit(1);
  if (!cohort || cohort.programId !== enrollment.programId) {
    throw new AuthorizationError("placements.read");
  }

  const [program] = await tx
    .select({
      id: programs.id,
      departmentId: programs.departmentId,
    })
    .from(programs)
    .where(eq(programs.id, enrollment.programId))
    .for("share")
    .limit(1);
  if (!program) {
    throw new AuthorizationError("placements.read");
  }

  const [department] = await tx
    .select({ collegeId: departments.collegeId })
    .from(departments)
    .where(eq(departments.id, program.departmentId))
    .for("share")
    .limit(1);
  if (!department || department.collegeId !== membership.collegeId) {
    throw new AuthorizationError("placements.read");
  }

  const activeSectionEnrollments = await tx
    .select({ sectionId: sectionEnrollments.sectionId })
    .from(sectionEnrollments)
    .where(
      and(
        eq(sectionEnrollments.learnerEnrollmentId, enrollment.id),
        eq(sectionEnrollments.status, "ACTIVE"),
      ),
    )
    .for("share");

  if (activeSectionEnrollments.length > 1) {
    throw new AuthorizationError("placements.read");
  }

  let sectionId: string | null = null;
  if (activeSectionEnrollments[0]) {
    sectionId = activeSectionEnrollments[0].sectionId;
    const [section] = await tx
      .select({
        cohortId: sections.cohortId,
        status: sections.status,
      })
      .from(sections)
      .where(eq(sections.id, sectionId))
      .for("share")
      .limit(1);
    if (
      !section ||
      section.status !== "ACTIVE" ||
      section.cohortId !== enrollment.cohortId
    ) {
      throw new AuthorizationError("placements.read");
    }
  }

  const moduleScopes = or(
    and(
      eq(moduleAccessRules.scopeType, "COLLEGE"),
      eq(moduleAccessRules.scopeId, membership.collegeId),
    ),
    and(
      eq(moduleAccessRules.scopeType, "ORGANIZATION"),
      eq(moduleAccessRules.scopeId, membership.organizationId),
    ),
    and(
      eq(moduleAccessRules.scopeType, "GLOBAL"),
      isNull(moduleAccessRules.scopeId),
    ),
  );
  await tx
    .select({ id: moduleAccessRules.id })
    .from(moduleAccessRules)
    .where(
      and(
        eq(moduleAccessRules.module, "placements"),
        moduleScopes,
      ),
    )
    .for("share");

  const participationScopeIds = [
    membershipId,
    enrollment.cohortId,
    ...(sectionId ? [sectionId] : []),
  ];
  await tx
    .select({ id: placementEligibilityDecisions.id })
    .from(placementEligibilityDecisions)
    .where(
      and(
        eq(placementEligibilityDecisions.collegeId, membership.collegeId),
        inArray(placementEligibilityDecisions.scopeId, participationScopeIds),
      ),
    )
    .for("share");

  await tx
    .select({ id: placementEligibilityOverrides.id })
    .from(placementEligibilityOverrides)
    .where(
      and(
        eq(placementEligibilityOverrides.jobId, jobId),
        eq(placementEligibilityOverrides.membershipId, membershipId),
        isNull(placementEligibilityOverrides.revokedAt),
      ),
    )
    .for("share");

  await tx
    .select({ jobId: placementJobEligibilityPolicies.jobId })
    .from(placementJobEligibilityPolicies)
    .where(eq(placementJobEligibilityPolicies.jobId, jobId))
    .for("share");

  await tx
    .select({ membershipId: placementCandidateAcademicEvidence.membershipId })
    .from(placementCandidateAcademicEvidence)
    .where(eq(placementCandidateAcademicEvidence.membershipId, membershipId))
    .for("share");

  return { programId: enrollment.programId, cohortId: enrollment.cohortId };
}

async function resolveApplicationRoleOption(
  jobId: string,
  roleOptionId: string | undefined,
) {
  const db = getDb();

  if (roleOptionId) {
    const [role] = await db
      .select()
      .from(placementJobRoleOptions)
      .where(
        and(
          eq(
            placementJobRoleOptions.id,
            roleOptionId,
          ),
          eq(
            placementJobRoleOptions.jobId,
            jobId,
          ),
          eq(
            placementJobRoleOptions.status,
            "ACTIVE",
          ),
        ),
      )
      .limit(1);

    if (!role) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_NOT_FOUND",
      );
    }
    return role;
  }

  const roles = await db
    .select()
    .from(placementJobRoleOptions)
    .where(
      and(
        eq(
          placementJobRoleOptions.jobId,
          jobId,
        ),
        eq(
          placementJobRoleOptions.status,
          "ACTIVE",
        ),
      ),
    )
    .orderBy(
      desc(
        placementJobRoleOptions.isPrimary,
      ),
      asc(placementJobRoleOptions.createdAt),
    );

  if (roles.length === 1) {
    return roles[0]!;
  }

  throw new PlacementsServiceError(
    "PLACEMENT_ROLE_OPTION_REQUIRED",
  );
}

function resolveApplicationChannel(
  applicationMode: string,
  input: ReturnType<
    typeof createPlacementApplicationInputSchema.parse
  >,
) {
  let channel: "INTERNAL" | "EXTERNAL";

  if (applicationMode === "INTERNAL") {
    if (input.channel === "EXTERNAL") {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_CHANNEL_INVALID",
      );
    }
    channel = "INTERNAL";
  } else if (applicationMode === "EXTERNAL_ONLY") {
    if (input.channel === "INTERNAL") {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_CHANNEL_INVALID",
      );
    }
    channel = "EXTERNAL";
  } else if (applicationMode === "HYBRID") {
    if (!input.channel) {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_CHANNEL_REQUIRED",
      );
    }
    channel = input.channel;
  } else {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_CHANNEL_INVALID",
    );
  }

  if (
    channel === "EXTERNAL" &&
    !input.externalConfirmation
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_EXTERNAL_CONFIRMATION_REQUIRED",
    );
  }

  return channel;
}

async function loadApplicationDetails(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: placementJobs,
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
      },
      candidate: {
        membershipId: collegeMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
      },
    })
    .from(placementApplications)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(eq(placementApplications.id, applicationId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_NOT_FOUND",
    );
  }

  const history = await getDb()
    .select()
    .from(placementApplicationStatusHistory)
    .where(
      eq(
        placementApplicationStatusHistory.applicationId,
        applicationId,
      ),
    )
    .orderBy(
      asc(
        placementApplicationStatusHistory.createdAt,
      ),
    );

  return { ...row, history };
}

export function resolveExistingApplication(
  existing: typeof placementApplications.$inferSelect,
  channel: "INTERNAL" | "EXTERNAL",
) {
  if (existing.status === "WITHDRAWN") {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_ALREADY_WITHDRAWN",
    );
  }
  if (existing.channel !== channel) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_CHANNEL_CONFLICT",
    );
  }
  return existing;
}

/** Re-application never resurrects stale screening, rounds, or official offers. */
export function canReapplyWithdrawnPlacementApplication(input: {
  sameChannel: boolean;
  hasPriorOffer: boolean;
  hasPriorRound: boolean;
  screeningStatus: string | null;
}): boolean {
  return input.sameChannel && !input.hasPriorOffer && !input.hasPriorRound &&
    input.screeningStatus === "PENDING";
}

export async function applyToPlacementJob(
  context: RequestContext,
  jobIdInput: string,
  rawInput: CreatePlacementApplicationInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input =
    createPlacementApplicationInputSchema.parse(
      rawInput,
    );
  const job = await loadJob(jobId);
  const membership = requireLearnerMembership(
    context,
    job.collegeId,
  );
  // Legacy V188: do not let per-job INCLUDE override the college switch or
  // student/class/batch placement participation decision.
  await requireLearnerPlacementAccess(context);
  if (!(await getOwnPlacementParticipationAccess(context)).canSelfApply ||
      await isPlacementLearnerDebarred(job.collegeId, membership.id)) {
    throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
  }

  if (job.status !== "PUBLISHED" || job.archivedAt !== null) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_JOB_NOT_OPEN",
    );
  }

  const now = new Date();
  if (isPlacementApplicationDeadlinePassed(job.applicationDeadline, now)) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_DEADLINE_PASSED",
    );
  }

  const roleOption =
    await resolveApplicationRoleOption(
      job.id,
      input.roleOptionId,
    );
  const channel = resolveApplicationChannel(
    job.applicationMode,
    input,
  );
  if (
    channel === "EXTERNAL" &&
    !job.externalApplicationUrl
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_EXTERNAL_URL_UNAVAILABLE",
    );
  }

  const [existing] = await getDb()
    .select()
    .from(placementApplications)
    .where(
      and(
        eq(
          placementApplications.roleOptionId,
          roleOption.id,
        ),
        eq(
          placementApplications.membershipId,
          membership.id,
        ),
      ),
    )
    .limit(1);

  if (existing && existing.status !== "WITHDRAWN") {
    return resolveExistingApplication(existing, channel);
  }
  // A WITHDRAWN application must pass all current live eligibility gates
  // again; only the audited transaction may restore SUBMITTED.

  const eligibility =
    await evaluatePlacementEligibility(
      context,
      job.id,
    );

  const preflightDenial = placementApplyEligibilityDenial(eligibility.status);
  if (preflightDenial) throw new PlacementsServiceError(preflightDenial);

  const created = await getDb().transaction(
    async (tx) => {
      // Lock the live job and role before inserting, not just during the
      // earlier optimistic read. A concurrent close/archive/role-removal
      // cannot make a new submission succeed after these changes.
      const [liveJob] = await tx.select({
        status: placementJobs.status,
        archivedAt: placementJobs.archivedAt,
        applicationDeadline: placementJobs.applicationDeadline,
        applicationMode: placementJobs.applicationMode,
        externalApplicationUrl: placementJobs.externalApplicationUrl,
      }).from(placementJobs)
        .where(eq(placementJobs.id, job.id))
        .for("update").limit(1);
      if (!liveJob || liveJob.status !== "PUBLISHED" ||
          liveJob.archivedAt !== null) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_JOB_NOT_OPEN");
      }
      if (isPlacementApplicationDeadlinePassed(
        liveJob.applicationDeadline, new Date(),
      )) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_DEADLINE_PASSED");
      }

      const enrollment = await lockLearnerApplicationGateInputs(
        tx,
        context,
        job.id,
        membership.id,
      );
      // P-S1-02: a job-level INCLUDE override cannot bypass a live
      // college debarment. Check in the write transaction before INSERT.
      const bans = await tx.select().from(placementDebarments).where(and(
        eq(placementDebarments.collegeId, job.collegeId),
        eq(placementDebarments.membershipId, membership.id),
      )).for("share");
      if (hasActivePlacementDebarment(bans, new Date())) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }

      // P-S1-03: a manual per-learner INCLUDE override cannot bypass
      // a drive restricted to other programs or cohorts.
      const [targetPolicy] = await tx.select({
        allowedProgramIds: placementJobEligibilityPolicies.allowedProgramIds,
        allowedCohortIds: placementJobEligibilityPolicies.allowedCohortIds,
      }).from(placementJobEligibilityPolicies)
        .where(eq(placementJobEligibilityPolicies.jobId, job.id))
        .for("share").limit(1);
      if (!isPlacementJobTargetCohort(targetPolicy, enrollment)) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }
      // Serialize with batch finish and creation, which first take the
      // parent college FOR UPDATE lock in batch-participation-service.
      await tx.select({ id: colleges.id }).from(colleges)
        .where(eq(colleges.id, job.collegeId)).for("share").limit(1);
      const [batch] = await tx.select({
        finishedAt: placementBatchLifecycles.finishedAt,
      }).from(placementBatchLifecycles).where(and(
        eq(placementBatchLifecycles.collegeId, job.collegeId),
        eq(placementBatchLifecycles.cohortId, enrollment.cohortId),
      )).for("share").limit(1);
      if (batch?.finishedAt) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }
      // DB08 registration changes take the parent college FOR UPDATE lock.
      // Having that lock already makes this a commit-boundary consent check,
      // rather than relying on the earlier uncoupled learner listing.
      const [registration] = await tx.select({
        choice: placementBatchRegistrations.choice,
      }).from(placementBatchRegistrations).where(and(
        eq(placementBatchRegistrations.collegeId, job.collegeId),
        eq(placementBatchRegistrations.cohortId, enrollment.cohortId),
        eq(placementBatchRegistrations.membershipId, membership.id),
      )).for("share").limit(1);
      const registrationState = resolveSelfApplyRegistrationChoice(
        registration?.choice === "PLACEMENTS" ? { choice: "PLACEMENTS" } :
        registration ? { choice: "NOT_INTERESTED" } : null,
      );
      if (registrationState !== "CAN_APPLY") {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }
      // Debarment creation/lift also locks the college parent FOR UPDATE;
      // after our share lock it cannot change until this apply commits.
      if (await isPlacementLearnerDebarred(job.collegeId, membership.id)) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }
      // Re-run both the paid/inherited placement gate and the job-specific
      // policy after the ordering locks above. The pre-transaction checks are
      // fail-fast only; this live result is the one persisted with application.
      const liveEligibility = await evaluatePlacementEligibility(
        context,
        job.id,
        undefined,
        tx,
      );
      const liveDenial = placementApplyEligibilityDenial(liveEligibility.status);
      if (liveDenial) throw new PlacementsServiceError(liveDenial);

      // The manager's coordinator assignment writer takes the same job-row
      // lock. A learner cannot become both applicant and coordinator for one
      // drive, including different assignment dates.
      const [coordinator] = await tx.select({
        id: placementDriveDayCoordinatorAssignments.id,
      }).from(placementDriveDayCoordinatorAssignments)
        .where(and(
          eq(placementDriveDayCoordinatorAssignments.jobId, job.id),
          eq(placementDriveDayCoordinatorAssignments.collegeId, job.collegeId),
          eq(placementDriveDayCoordinatorAssignments.learnerMembershipId, membership.id),
        )).limit(1);
      if (coordinator) {
        throw new PlacementsServiceError("PLACEMENT_COORDINATOR_APPLICANT_CONFLICT");
      }

      const [liveRole] = await tx.select({
        id: placementJobRoleOptions.id,
        status: placementJobRoleOptions.status,
        jobId: placementJobRoleOptions.jobId,
        minimumAnnualCtcInr: placementJobRoleOptions.minimumAnnualCtcInr,
      }).from(placementJobRoleOptions)
        .where(eq(placementJobRoleOptions.id, roleOption.id))
        .for("update").limit(1);
      if (!liveRole || liveRole.status !== "ACTIVE" ||
          liveRole.jobId !== job.id) {
        throw new PlacementsServiceError("PLACEMENT_ROLE_OPTION_NOT_FOUND");
      }
      if (resolveApplicationChannel(liveJob.applicationMode, input) !== channel ||
          (channel === "EXTERNAL" && !liveJob.externalApplicationUrl)) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_CHANNEL_INVALID");
      }

      // P-S1-05: check official held offers under the same learner's
      // membership lock acquired above. NULL CTC is not an uplift bypass.
      const [rules] = await tx.select({
        maxHeldOffers: placementCollegeRules.maxHeldOffers,
        upliftPct: placementCollegeRules.upliftPct,
      }).from(placementCollegeRules)
        .where(eq(placementCollegeRules.collegeId, job.collegeId))
        .for("share").limit(1);
      const heldOffers = await loadPlacementHeldOfferFacts(
        job.collegeId, membership.id, tx,
      );
      if (!canAddPlacementHeldOffer({
        maxHeldOffers: rules?.maxHeldOffers ?? 1,
        upliftPct: rules?.upliftPct ?? 40,
        nextAnnualCtcInr: liveRole.minimumAnnualCtcInr ??
          job.minimumAnnualCtcInr,
        isDream: job.isDream,
        heldOffers,
      })) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }

      // D2: apply idempotency is decided against the locked, persisted
      // existing role/membership row, not only the optimistic preflight.
      const [liveExisting] = await tx.select().from(placementApplications)
        .where(and(
          eq(placementApplications.roleOptionId, roleOption.id),
          eq(placementApplications.membershipId, membership.id),
        )).for("update").limit(1);
      if (liveExisting) {
        if (liveExisting.status !== "WITHDRAWN") {
          return resolveExistingApplication(liveExisting, channel);
        }
        // P-S2-11: old withdrawn applications can be re-applied via 0088
        // history ONLY if no previous offer/round/review must be unwound.
        const [existingOffer] = await tx.select({ id: placementOffers.id })
          .from(placementOffers)
          .where(eq(placementOffers.applicationId, liveExisting.id)).limit(1);
        const [existingRound] = await tx.select({ id: placementRoundResults.id })
          .from(placementRoundResults)
          .where(eq(placementRoundResults.applicationId, liveExisting.id)).limit(1);
        const [screening] = await tx.select({ status: placementApplicationScreenings.status })
          .from(placementApplicationScreenings)
          .where(eq(placementApplicationScreenings.applicationId, liveExisting.id))
          .for("update").limit(1);
        if (!canReapplyWithdrawnPlacementApplication({
          sameChannel: liveExisting.channel === channel,
          hasPriorOffer: Boolean(existingOffer),
          hasPriorRound: Boolean(existingRound),
          screeningStatus: screening?.status ?? null,
        })) {
          throw new PlacementsServiceError("PLACEMENT_APPLICATION_ALREADY_WITHDRAWN");
        }
        const [restored] = await tx.update(placementApplications).set({
          status: "SUBMITTED", withdrawnAt: null,
          eligibilityStatus: liveEligibility.status,
          eligibilitySnapshot: liveEligibility,
          submittedAt: new Date(), submittedByUserId: context.user.id,
          updatedAt: new Date(),
        }).where(and(eq(placementApplications.id, liveExisting.id),
          eq(placementApplications.status, "WITHDRAWN"))).returning();
        if (!restored) throw new PlacementsServiceError("PLACEMENT_APPLICATION_ALREADY_WITHDRAWN");
        await tx.insert(placementApplicationStatusHistory).values({
          applicationId: restored.id,
          fromStatus: "WITHDRAWN", toStatus: "SUBMITTED",
          actorUserId: context.user.id,
        });
        return restored;
      }

      const [application] = await tx
        .insert(placementApplications)
        .values({
          jobId: job.id,
          roleOptionId: roleOption.id,
          membershipId: membership.id,
          channel,
          eligibilityStatus: liveEligibility.status,
          eligibilitySnapshot: liveEligibility,
          submittedByUserId: context.user.id,
          submittedAt: now,
        })
        .onConflictDoNothing()
        .returning();

      if (!application) return null;

      await tx
        .insert(
          placementApplicationStatusHistory,
        )
        .values({
          applicationId: application.id,
          fromStatus: null,
          toStatus: "SUBMITTED",
          actorUserId: context.user.id,
        });

      await tx
        .insert(placementApplicationScreenings)
        .values({
          applicationId: application.id,
        });

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_SUBMITTED,
          collegeId: job.collegeId,
          subjectType:
            "placement_application",
          subjectId: application.id,
          subjectLabel: roleOption.title,
          summary:
            `Application submitted for ${roleOption.title}`,
          metadata: {
            jobId: job.id,
            roleOptionId: roleOption.id,
            membershipId: membership.id,
            channel,
          },
          groupKey:
            `placement-job:${job.id}:applications`,
          dedupeKey:
            `placement-application:${application.id}:submitted`,
        },
      );

      return application;
    },
  );

  if (created) return created;

  const [concurrent] = await getDb()
    .select()
    .from(placementApplications)
    .where(
      and(
        eq(
          placementApplications.roleOptionId,
          roleOption.id,
        ),
        eq(
          placementApplications.membershipId,
          membership.id,
        ),
      ),
    )
    .limit(1);

  if (!concurrent) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_CHANNEL_CONFLICT",
    );
  }
  return resolveExistingApplication(
    concurrent,
    channel,
  );
}

export async function listOwnPlacementApplications(
  context: RequestContext,
) {
  const membership = requireLearnerMembership(
    context,
  );
  await requireLearnerPlacementAccess(context);

  return getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: placementJobs,
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
      },
    })
    .from(placementApplications)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      eq(
        placementApplications.membershipId,
        membership.id,
      ),
    )
    .orderBy(desc(placementApplications.submittedAt));
}

export async function listPlacementJobApplications(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      candidate: {
        membershipId: collegeMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
      },
    })
    .from(placementApplications)
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      eq(placementApplications.jobId, job.id),
    )
    .orderBy(desc(placementApplications.submittedAt));
}

export async function getPlacementApplication(
  context: RequestContext,
  applicationIdInput: string,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const row =
    await loadApplicationDetails(applicationId);

  if (
    context.membership?.id ===
      row.application.membershipId &&
    hasMembershipRole(context, "LEARNER")
  ) {
    await requireLearnerPlacementAccess(context);
    return row;
  }

  await requirePlacementManageScope(
    context,
    row.job.collegeId,
  );
  return row;
}

/** P-S2-11: do not bypass an issued or accepted offer via self-withdrawal. */
export function canSelfWithdrawPlacementApplication(
  offers: readonly { status: string }[],
): boolean {
  return !offers.some((offer) =>
    offer.status === "ISSUED" || offer.status === "ACCEPTED");
}

export async function withdrawPlacementApplication(
  context: RequestContext,
  applicationIdInput: string,
  reasonInput?: string,
) {
  // Older internal callers may omit a reason; confirmed UI writes must supply
  // one through the strict route schema. No invented default reason is stored.
  const reason = learnerWithdrawalReasonSchema.optional().parse(reasonInput) ?? null;
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const row =
    await loadApplicationDetails(applicationId);
  const membership = requireLearnerMembership(
    context,
    row.job.collegeId,
  );
  if (!can(context, "placements.read", {
    collegeId: row.job.collegeId,
    organizationId: membership.organizationId,
  })) {
    throw new AuthorizationError("placements.read");
  }

  if (
    membership.id !==
    row.application.membershipId
  ) {
    throw new AuthorizationError("placements.read");
  }

  // Loss of placement access never deletes past applications, but self
  // withdrawal is no longer exposed while placement participation is denied.
  await requireLearnerPlacementAccess(context);
  if (row.application.status === "WITHDRAWN") {
    return row.application;
  }

  const now = new Date();
  const updated = await getDb().transaction(
    async (tx) => {
      // Self-withdrawal is also a write: do not let a cached request context
      // outlive a persisted account disable, membership suspension, or role
      // removal between the preflight and the status/history update.
      // Lock in the same order as application creation: membership, user, role.
      const [liveMembership] = await tx
        .select({
          userId: collegeMemberships.userId,
          collegeId: collegeMemberships.collegeId,
          status: collegeMemberships.status,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, membership.id))
        .for("share")
        .limit(1);
      if (!liveMembership || liveMembership.status !== "ACTIVE" ||
          liveMembership.collegeId !== row.job.collegeId ||
          liveMembership.userId !== context.user.id) {
        throw new AuthorizationError("placements.read");
      }

      const [liveUser] = await tx
        .select({ platformStatus: users.platformStatus })
        .from(users)
        .where(eq(users.id, context.user.id))
        .for("share")
        .limit(1);
      if (!liveUser || liveUser.platformStatus !== "ACTIVE") {
        throw new AuthorizationError("placements.read");
      }

      const [liveRole] = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(and(
          eq(membershipRoles.membershipId, membership.id),
          eq(membershipRoles.role, "LEARNER"),
        ))
        .for("share")
        .limit(1);
      if (!liveRole) throw new AuthorizationError("placements.read");

      // LEARNER-placements-30: staff-added applications have a persisted
      // 48-hour opt-out window. Recheck under the same application lock as
      // the withdrawal update so stale views cannot skip the cutoff.
      const [liveApplication]=await tx.select({
        status:placementApplications.status,
        submittedAt:placementApplications.submittedAt,
        submittedByUserId:placementApplications.submittedByUserId,
      }).from(placementApplications)
        .where(and(eq(placementApplications.id,applicationId),
          eq(placementApplications.membershipId,membership.id)))
        .for("update").limit(1);
      if(!liveApplication||liveApplication.status!=="SUBMITTED")
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      const optOut=learnerStaffApplicationOptOut({
        submittedAt:liveApplication.submittedAt,
        submittedByUserId:liveApplication.submittedByUserId,
        learnerUserId:context.user.id,now,
      });
      if(optOut.staffApplied&&!optOut.canOptOut)
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");

      // LEARNER-placements-29 / R05: a booking is candidate-specific.
      // A scheduled round elsewhere in the drive is not evidence this
      // learner was booked. Never infer a booking from a screening label.
      const [liveScreening]=await tx.select({status:placementApplicationScreenings.status})
        .from(placementApplicationScreenings)
        .where(eq(placementApplicationScreenings.applicationId,applicationId))
        .limit(1);
      const scheduled=await tx.select({id:placementRoundCandidateSlots.id})
        .from(placementRoundCandidateSlots)
        .where(and(
          eq(placementRoundCandidateSlots.jobId,row.job.id),
          eq(placementRoundCandidateSlots.applicationId,applicationId),
          eq(placementRoundCandidateSlots.status,"BOOKED"),
        )).limit(1);
      // An approved learner-specific schedule exception is also a real
      // commitment, even if the slot planner did not issue a BOOKED row.
      const scheduleExceptions=await tx.select({id:placementApplicationRoundExceptions.id})
        .from(placementApplicationRoundExceptions)
        .innerJoin(placementJobRounds,eq(
          placementJobRounds.id,placementApplicationRoundExceptions.roundId,
        ))
        .where(and(
          eq(placementApplicationRoundExceptions.applicationId,applicationId),
          eq(placementJobRounds.jobId,row.job.id),
          eq(placementJobRounds.status,"SCHEDULED"),
        )).limit(1);
      if(learnerWithdrawalMode({
        applicationStatus:row.application.status,
        screeningStatus:liveScreening?.status??"UNDER_REVIEW",
        scheduledRoundCount:scheduled.length+scheduleExceptions.length,
      })==="REQUEST")
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");

      // P-S2-11: a live official offer belongs to the TPO response flow;
      // a learner may not remove its application while ISSUED or ACCEPTED.
      const activeOffers = await tx.select({
        status: placementOffers.status,
      }).from(placementOffers)
        .where(eq(placementOffers.applicationId, applicationId))
        .for("share");
      if (!canSelfWithdrawPlacementApplication(activeOffers)) {
        throw new PlacementsServiceError("PLACEMENT_APPLICATION_INELIGIBLE");
      }

      const [application] = await tx
        .update(placementApplications)
        .set({
          status: "WITHDRAWN",
          withdrawnAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(
              placementApplications.id,
              applicationId,
            ),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
            eq(placementApplications.membershipId, membership.id),
          ),
        )
        .returning();

      if (!application) return null;

      await tx
        .insert(
          placementApplicationStatusHistory,
        )
        .values({
          applicationId: application.id,
          fromStatus: "SUBMITTED",
          toStatus: "WITHDRAWN",
          actorUserId: context.user.id,
          reason,
        });

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_WITHDRAWN,
          collegeId: row.job.collegeId,
          subjectType:
            "placement_application",
          subjectId: application.id,
          subjectLabel: row.roleOption.title,
          summary:
            `Application withdrawn from ${row.roleOption.title}`,
          metadata: {
            jobId: row.job.id,
            roleOptionId:
              row.roleOption.id,
            membershipId: membership.id,
            reasonProvided: reason !== null,
          },
          groupKey:
            `placement-job:${row.job.id}:applications`,
          dedupeKey:
            `placement-application:${application.id}:withdrawn`,
        },
      );

      return application;
    },
  );

  if (updated) return updated;

  const latest =
    await loadApplicationDetails(applicationId);
  return latest.application;
}
