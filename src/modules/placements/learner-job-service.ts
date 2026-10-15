import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerProgramEnrollments,
  placementApplications,
  placementCompanyRelationships,
  placementCompanies,
  placementJobRoleOptions,
  placementJobs,
  placementJobEligibilityPolicies,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { getOwnPlacementParticipationAccess } from "./batch-participation-service";
import { isPlacementApplicationDeadlinePassed } from "./application-deadline-policy";
import {
  evaluatePlacementEligibility,
  isPlacementJobTargetCohort,
  type PlacementEligibilityResult,
} from "./eligibility-service";

function requireLearner(context: RequestContext) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

export async function listLearnerPlacementJobs(
  context: RequestContext,
  now: Date = new Date(),
) {
  const membership = requireLearner(context);
  await requireLearnerPlacementAccess(context);
  // P-S1-04: a finished placement batch may browse historical drives,
  // but its learner must not be shown an actionable self-apply control.
  const participation = await getOwnPlacementParticipationAccess(context);

  const rows = await getDb()
    .select({
      job: placementJobs,
      roleOption: placementJobRoleOptions,
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
        websiteUrl: placementCompanies.websiteUrl,
        logoObjectPath:
          placementCompanies.logoObjectPath,
      },
      application: {
        id: placementApplications.id,
        channel: placementApplications.channel,
        status: placementApplications.status,
        eligibilityStatus:
          placementApplications.eligibilityStatus,
        submittedAt:
          placementApplications.submittedAt,
        withdrawnAt:
          placementApplications.withdrawnAt,
      },
    })
    .from(placementJobs)
    .innerJoin(
      placementJobRoleOptions,
      and(
        eq(
          placementJobRoleOptions.jobId,
          placementJobs.id,
        ),
        eq(
          placementJobRoleOptions.status,
          "ACTIVE",
        ),
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
    .leftJoin(
      placementApplications,
      and(
        eq(
          placementApplications.roleOptionId,
          placementJobRoleOptions.id,
        ),
        eq(
          placementApplications.membershipId,
          membership.id,
        ),
      ),
    )
    .where(
      and(
        eq(
          placementJobs.collegeId,
          membership.collegeId,
        ),
        eq(placementJobs.status, "PUBLISHED"),
        isNull(placementJobs.archivedAt),
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        isNull(
          placementCompanyRelationships.archivedAt,
        ),
        eq(placementCompanies.status, "ACTIVE"),
      ),
    )
    .orderBy(
      asc(placementJobs.applicationDeadline),
      asc(placementJobs.title),
      asc(placementJobRoleOptions.title),
    );

  // A learner may only discover published jobs targeting the persisted
  // active academic cohort/program. A duplicate enrollment is ambiguous.
  const enrollments = await getDb().select({
    cohortId: learnerProgramEnrollments.cohortId,
    programId: learnerProgramEnrollments.programId,
  }).from(learnerProgramEnrollments).where(and(
    eq(learnerProgramEnrollments.membershipId, membership.id),
    eq(learnerProgramEnrollments.status, "ACTIVE"),
  )).limit(2);
  if (enrollments.length !== 1) return [];

  const policies = rows.length
    ? await getDb().select({
        jobId: placementJobEligibilityPolicies.jobId,
        allowedProgramIds: placementJobEligibilityPolicies.allowedProgramIds,
        allowedCohortIds: placementJobEligibilityPolicies.allowedCohortIds,
      }).from(placementJobEligibilityPolicies).where(inArray(
        placementJobEligibilityPolicies.jobId,
        [...new Set(rows.map((row) => row.job.id))],
      ))
    : [];
  const policyByJobId = new Map(policies.map((policy) => [policy.jobId, policy]));
  const targetedRows = rows.filter((row) =>
    isPlacementJobTargetCohort(
      policyByJobId.get(row.job.id),
      enrollments[0]!,
    ),
  );

  const eligibilityByJob = new Map<
    string,
    Promise<PlacementEligibilityResult>
  >();

  return Promise.all(
    targetedRows.map(async (row) => {
      const application =
        row.application?.id
          ? row.application
          : null;
      let eligibility: PlacementEligibilityResult;

      if (application) {
        eligibility = {
          status:
            application.eligibilityStatus as PlacementEligibilityResult["status"],
          checks: [],
          override: null,
        };
      } else {
        let pending =
          eligibilityByJob.get(row.job.id);
        if (!pending) {
          pending =
            evaluatePlacementEligibility(
              context,
              row.job.id,
            );
          eligibilityByJob.set(
            row.job.id,
            pending,
          );
        }
        eligibility = await pending;
      }

      const deadlinePassed = isPlacementApplicationDeadlinePassed(
        row.job.applicationDeadline,
        now,
      );

      return {
        job: row.job,
        roleOption: row.roleOption,
        company: row.company,
        application,
        eligibility,
        deadlinePassed,
        canApply:
          participation.canSelfApply &&
          !application &&
          !deadlinePassed &&
          (eligibility.status === "ELIGIBLE" ||
            eligibility.status ===
              "ELIGIBLE_WITH_MISSING_EVIDENCE"),
      };
    }),
  );
}
