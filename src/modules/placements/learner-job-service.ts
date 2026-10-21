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
  sectionEnrollments,
  sections,
  placementApplications,
  placementCompanyRelationships,
  placementCompanies,
  placementJobRoleOptions,
  placementJobs,
  placementCollegeRules,
  placementJobEligibilityPolicies,
  placementBatchRegistrations,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { getOwnPlacementParticipationAccess } from "./batch-participation-service";
import { isPlacementLearnerDebarred } from "./debarment-service";
import { canAddPlacementHeldOffer, canShowLearnerSelfApply } from "./held-offer-policy";
import { learnerJobApplyBlockers } from "./learner-job-apply-blockers-model";
import { loadPlacementHeldOfferFacts } from "./held-offer-facts-service";
import { resolveSelfApplyRegistrationChoice } from "./batch-registration-policy";
import { isPlacementApplicationDeadlinePassed } from "./application-deadline-policy";
import {placementJobIdSchema} from "./validation";
import {
  evaluatePlacementEligibility,
  isPlacementJobTargetCohort,
  isPlacementJobTargetSection,
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
  jobId?: string,
  requestedJobIds?:readonly string[],
) {
  const membership = requireLearner(context);
  await requireLearnerPlacementAccess(context);
  // An explicitly empty selection must never turn into an unrestricted feed.
  if(requestedJobIds&&requestedJobIds.length===0)return [];
  if(requestedJobIds&&requestedJobIds.length>100)
   throw new Error("Choose no more than 100 placement jobs.");
  // P-S1-04: a finished placement batch may browse historical drives,
  // but its learner must not be shown an actionable self-apply control.
  const participation = await getOwnPlacementParticipationAccess(context);
  const debarred = await isPlacementLearnerDebarred(
    membership.collegeId,
    membership.id,
    now,
  );

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
        jobId ? eq(placementJobs.id, jobId) : undefined,
        requestedJobIds ? inArray(placementJobs.id,[...new Set(requestedJobIds)]) : undefined,
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
      asc(placementJobs.id),
      asc(placementJobRoleOptions.title),
      asc(placementJobRoleOptions.id),
    );

  // A learner may only discover published jobs targeting the persisted
  // active academic cohort/program. A duplicate enrollment is ambiguous.
  const enrollments = await getDb().select({
    id: learnerProgramEnrollments.id,
    cohortId: learnerProgramEnrollments.cohortId,
    programId: learnerProgramEnrollments.programId,
  }).from(learnerProgramEnrollments).where(and(
    eq(learnerProgramEnrollments.membershipId, membership.id),
    eq(learnerProgramEnrollments.status, "ACTIVE"),
  )).limit(2);
  if (enrollments.length !== 1) return [];
  const activeSections = await getDb().select({id:sections.id})
    .from(sectionEnrollments)
    .innerJoin(sections,eq(sections.id,sectionEnrollments.sectionId))
    .where(and(
      eq(sectionEnrollments.learnerEnrollmentId,enrollments[0]!.id),
      eq(sectionEnrollments.status,"ACTIVE"),
      eq(sections.status,"ACTIVE"),
      eq(sections.cohortId,enrollments[0]!.cohortId),
    ));
  const activeSectionIds = activeSections.map(row=>row.id);
  const [registration] = await getDb().select({
    choice: placementBatchRegistrations.choice,
  }).from(placementBatchRegistrations).where(and(
    eq(placementBatchRegistrations.collegeId, membership.collegeId),
    eq(placementBatchRegistrations.cohortId, enrollments[0].cohortId),
    eq(placementBatchRegistrations.membershipId, membership.id),
  )).limit(1);
  const registrationState = resolveSelfApplyRegistrationChoice(
    registration?.choice === "PLACEMENTS" ? { choice: "PLACEMENTS" } :
    registration ? { choice: "NOT_INTERESTED" } : null,
  );

  const policies = rows.length
    ? await getDb().select({
        jobId: placementJobEligibilityPolicies.jobId,
        allowedProgramIds: placementJobEligibilityPolicies.allowedProgramIds,
        allowedCohortIds: placementJobEligibilityPolicies.allowedCohortIds,
        allowedSectionIds: placementJobEligibilityPolicies.allowedSectionIds,
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
    ) && isPlacementJobTargetSection(
      policyByJobId.get(row.job.id)?.allowedSectionIds ?? [],activeSectionIds,
    ),
  );

  // Apply the same current-college held-offer limit that the write path
  // checks again under locks. This controls only the affordance, not access.
  const [rules] = await getDb().select({
    maxHeldOffers: placementCollegeRules.maxHeldOffers,
    upliftPct: placementCollegeRules.upliftPct,
  }).from(placementCollegeRules)
    .where(eq(placementCollegeRules.collegeId, membership.collegeId)).limit(1);
  const heldOffers = await loadPlacementHeldOfferFacts(
    membership.collegeId, membership.id,
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

      const heldOfferEligible = canAddPlacementHeldOffer({
        maxHeldOffers: rules?.maxHeldOffers ?? 1,
        upliftPct: rules?.upliftPct ?? 40,
        nextAnnualCtcInr: row.roleOption.minimumAnnualCtcInr ??
          row.job.minimumAnnualCtcInr,
        isDream: row.job.isDream,
        heldOffers,
      });
      const applyContext = {
        registrationState,
        debarred,
        canSelfApply: participation.canSelfApply,
        hasApplication: application !== null,
        deadlinePassed,
        eligibilityStatus: eligibility.status,
        heldOfferEligible,
      };
      return {
        job: row.job,
        roleOption: row.roleOption,
        company: row.company,
        application,
        eligibility,
        deadlinePassed,
        canApply: canShowLearnerSelfApply(applyContext),
        applicationBlockers: learnerJobApplyBlockers(applyContext),
      };
    }),
  );
}

/** Read-only bulk decisions, never a route for resolving arbitrary job IDs.
 * Invalid, archived, non-targeted or cross-college IDs are intentionally
 * omitted. The existing per-job write transaction remains authoritative.
 */
export async function listLearnerPlacementBulkDecisions(
 context:RequestContext,requestedJobIds:readonly string[],
 now:Date=new Date(),
){
 // Even empty/invalid requests require the same authenticated learner grant.
 requireLearner(context);
 await requireLearnerPlacementAccess(context);
 // Bound expensive per-job eligibility evaluation and preserve request order.
 if(requestedJobIds.length>100)
  throw new Error("Choose no more than 100 placement jobs.");
 const ids=[...new Set(requestedJobIds.filter(id=>
  placementJobIdSchema.safeParse(id).success))];
 if(ids.length===0)return [];
 const found=await listLearnerPlacementJobs(context,now,undefined,ids);
 const byJob=new Map<string,typeof found>();
 for(const item of found){
  const group=byJob.get(item.job.id)??[];
  group.push(item);
  byJob.set(item.job.id,group);
 }
 return ids.flatMap(id=>{
  const items=byJob.get(id);
  if(!items?.length)return [];
  return [{
   jobId:id,
   canApply:items.some(item=>item.canApply),
   roles:items.map(item=>({
    roleOptionId:item.roleOption.id,
    canApply:item.canApply,
    blockers:item.applicationBlockers,
    eligibilityStatus:item.eligibility.status,
    deadlinePassed:item.deadlinePassed,
   })),
  }];
 });
}
