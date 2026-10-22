import {
  and,
  asc,
  desc,
  eq,
  gt,
  sql,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {placementBatchLifecycles} from "@/db/schema/placement-batches";
import {effectiveTpoBatchRuleFields} from "./tpo-batch-rules-model";
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
  placementOffers,
  placementJoiningOutcomes,
  placementBatchRegistrations,
  placementApplicationScreenings,
  placementCompanyApplicantShares,
  placementCompanyShareSelections,
  collegeMemberships,
  learnerProfiles,
  programs,
  departments,
  users,
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
import { learnerJobApplyBlockers, learnerJobApplyGate } from "./learner-job-apply-blockers-model";
import { loadPlacementHeldOfferFacts } from "./held-offer-facts-service";
import { resolveSelfApplyRegistrationChoice } from "./batch-registration-policy";
import { isPlacementApplicationDeadlinePassed } from "./application-deadline-policy";
import {placementJobIdSchema} from "./validation";
import {getOwnLearnerApplicationCompany} from "./learner-application-detail-service";
import {COMPANY_SHARE_COLUMNS,projectCompanyShareRows,safeCompanyShareColumns} from "./company-share/column-model";
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
  const scopedJobId=jobId?placementJobIdSchema.parse(jobId):undefined;
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
        logoPublicUrl:placementCompanies.logoPublicUrl,
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
        // A migrated ATS-only legacy job was never discoverable in the
        // learner's jobs list, even when technically published.
        or(isNull(placementJobs.legacyVisibilityType),
          ne(placementJobs.legacyVisibilityType,"EXTERNAL_ONLY")),
        or(isNull(placementJobs.legacyWasDeleted),
          eq(placementJobs.legacyWasDeleted,false)),
        scopedJobId ? eq(placementJobs.id,scopedJobId) : undefined,
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
    // Legacy learner Jobs defaults to newly posted first. Deadline is a
    // visible badge and an apply guard, never the default discovery order.
    // UUID/role-option tie-breakers make this stable across pagination.
    .orderBy(
      desc(placementJobs.createdAt),
      desc(placementJobs.id),
      asc(placementJobRoleOptions.title),
      asc(placementJobRoleOptions.id),
    );

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
  // Legacy JobSearch indexed the target Department and Program names, not
  // their UUIDs. Resolve only approved target IDs inside the current college
  // in one batch, never from an organization-global catalogue.
  const targetProgramIds=[...new Set(policies.flatMap(policy=>policy.allowedProgramIds))];
  const targetPrograms=targetProgramIds.length?await getDb().select({
    id:programs.id,name:programs.name,departmentName:departments.name,
  }).from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(inArray(programs.id,targetProgramIds),
      eq(departments.collegeId,membership.collegeId))):[];
  const programById=new Map(targetPrograms.map(row=>[row.id,row]));
  const targetNamesByJobId=new Map(policies.map(policy=>{
    const entries=policy.allowedProgramIds.map(id=>programById.get(id))
      .filter((value):value is (typeof targetPrograms)[number]=>value!==undefined);
    return [policy.jobId,{
      programs:[...new Set(entries.map(value=>value.name))].join(", "),
      departments:[...new Set(entries.map(value=>value.departmentName))].join(", "),
    }] as const;
  }));

  const targetedRows = rows.filter((row) =>
    isPlacementJobTargetCohort(
      policyByJobId.get(row.job.id),
      enrollments[0]!,
    ) && isPlacementJobTargetSection(
      policyByJobId.get(row.job.id)?.allowedSectionIds ?? [],activeSectionIds,
    ),
  );
  // Read released offers only for the learner's already scoped application IDs.
  // Draft/unreleased recruiter decisions must never appear in learner status.
  const applicationIds=[...new Set(targetedRows.map(row=>row.application?.id)
    .filter((id):id is string=>typeof id==="string"))];
  const releasedOffers=applicationIds.length?await getDb().select({
    applicationId:placementOffers.applicationId,status:placementOffers.status,
    joiningStatus:placementJoiningOutcomes.status,
  }).from(placementOffers)
    .leftJoin(placementJoiningOutcomes,
      eq(placementJoiningOutcomes.offerId,placementOffers.id))
    .where(and(
      inArray(placementOffers.applicationId,applicationIds),
      isNotNull(placementOffers.releasedAt),
      eq(placementOffers.kind,"OFFER"),
    )).orderBy(desc(placementOffers.version),desc(placementOffers.id)):[];
  const latestOfferByApplication=new Map<string,(typeof releasedOffers)[number]>();
  for(const offer of releasedOffers){
    if(!latestOfferByApplication.has(offer.applicationId)){
      latestOfferByApplication.set(offer.applicationId,offer);
    }
  }

  // Apply the same current-college held-offer limit that the write path
  // checks again under locks. This controls only the affordance, not access.
  const [rules] = await getDb().select({
    countsAsPlacedAt:placementCollegeRules.countsAsPlacedAt,
    maxHeldOffers: placementCollegeRules.maxHeldOffers,
    upliftPct: placementCollegeRules.upliftPct,
    minResponseHours:placementCollegeRules.minResponseHours,
  }).from(placementCollegeRules)
    .where(eq(placementCollegeRules.collegeId, membership.collegeId)).limit(1);
  // Apply the same validated batch rules as the own Rules page.
  const [activeBatch]=await getDb().select({rulesOverride:placementBatchLifecycles.rulesOverride,
    finishedAt:placementBatchLifecycles.finishedAt})
    .from(placementBatchLifecycles).where(and(
      eq(placementBatchLifecycles.collegeId,membership.collegeId),
      eq(placementBatchLifecycles.cohortId,enrollments[0]!.cohortId),
    )).limit(1);
  const effectiveRules=rules?effectiveTpoBatchRuleFields(rules,activeBatch?.rulesOverride):null;
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
        maxHeldOffers: effectiveRules?.maxHeldOffers ?? 1,
        upliftPct: effectiveRules?.upliftPct ?? 40,
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
        job: {...row.job,
          targetDepartmentName:targetNamesByJobId.get(row.job.id)?.departments??"",
          targetProgramName:targetNamesByJobId.get(row.job.id)?.programs??"",
        },
        roleOption: row.roleOption,
        company: row.company,
        application,
        offerStatus:application?latestOfferByApplication.get(application.id)?.status??null:null,
        // A signed offer is not a joining outcome. The legacy HIRED label
        // requires a persisted JOINED outcome, not merely accepted terms.
        legacyDisplayStatus:!application?null:application.status==="WITHDRAWN"?"WITHDRAWN":
          latestOfferByApplication.get(application.id)?.status==="ACCEPTED"&&
          latestOfferByApplication.get(application.id)?.joiningStatus==="JOINED"?"HIRED":
          ["ISSUED","ACCEPTED"].includes(latestOfferByApplication.get(application.id)?.status??"")?"OFFERED":
          latestOfferByApplication.get(application.id)?.status==="DECLINED"?"REJECTED":"APPLIED",
        eligibility,
        deadlinePassed,
        canApply: canShowLearnerSelfApply(applyContext),
        applicationBlockers: learnerJobApplyBlockers(applyContext),
        applicationGate: learnerJobApplyGate({...applyContext,
          published:row.job.status==="PUBLISHED",
          inPlacements:participation.showPlacements,
          batchFinished:Boolean(activeBatch?.finishedAt),
        }),
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

/** The learner's employer-facing preview is available only after a persisted
 * application. Read the same allowlisted company-share projection used by the
 * application page; never spread the eligibility, debarment, readiness, staff
 * comments or internal college profile into a recruiter-shaped object.
 */
export async function getOwnLearnerJobCompanySharePreview(
 context:RequestContext,rawJobId:unknown,
){
 const membership=requireLearner(context);
 await requireLearnerPlacementAccess(context);
 const jobId=placementJobIdSchema.parse(rawJobId);
 const [application]=await getDb().select({
  id:placementApplications.id,status:placementApplications.status,
 }).from(placementApplications).innerJoin(placementJobs,
   eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementApplications.jobId,jobId),
   eq(placementApplications.membershipId,membership.id),
   eq(placementJobs.collegeId,membership.collegeId)))
  .orderBy(desc(placementApplications.submittedAt),desc(placementApplications.id))
  .limit(1);
 if(!application)return null;
 const detail=await getOwnLearnerApplicationCompany(context,application.id);
 if(!detail)return null;

 // Resolve only this learner's data; the employer's shared-link read selects
 // precisely these fields and passes them through projectCompanyShareRows.
 // Full learner profiles, academic gates, debarment and staff notes must never
 // be serialized as part of a company preview.
 const [source]=await getDb().select({
  displayName:users.displayName,email:users.email,phone:users.phoneE164,
  rollNumber:learnerProfiles.rollNumber,
  profileDocument:learnerProfiles.profileDocument,
  stage:placementApplicationScreenings.status,
  branch:sql<string|null>`(SELECT p.name FROM learner_program_enrollments lpe
    JOIN programs p ON p.id=lpe.program_id
    WHERE lpe.membership_id=${collegeMemberships.id} AND lpe.status='ACTIVE'
    ORDER BY p.name,p.id LIMIT 1)`,
 }).from(placementApplications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .leftJoin(placementApplicationScreenings,
   eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(and(eq(placementApplications.id,application.id),
   eq(placementApplications.membershipId,membership.id),
   eq(collegeMemberships.collegeId,membership.collegeId),
   eq(collegeMemberships.userId,context.user.id))).limit(1);
 if(!source)return null;
 // The external share requires an explicit selected-applicant row; empty
 // selection never broadens the share to every applicant. Use the actual
 // live share's allowlisted column choices; no client-supplied columns.
 const [shared]=await getDb().select({
  selectedColumns:placementCompanyApplicantShares.selectedColumns,
 }).from(placementCompanyShareSelections)
  .innerJoin(placementCompanyApplicantShares,
   eq(placementCompanyApplicantShares.id,placementCompanyShareSelections.shareId))
  .where(and(
   eq(placementCompanyShareSelections.applicationId,application.id),
   eq(placementCompanyApplicantShares.collegeId,membership.collegeId),
   eq(placementCompanyApplicantShares.jobId,jobId),
   isNull(placementCompanyApplicantShares.revokedAt),
   gt(placementCompanyApplicantShares.expiresAt,new Date()),
  )).orderBy(desc(placementCompanyApplicantShares.createdAt)).limit(1);
 const columns=safeCompanyShareColumns(shared?.selectedColumns);
 const [projected]=projectCompanyShareRows([{
  applicationId:detail.publicRef,displayName:source.displayName,
  email:source.email,phone:source.phone,rollNumber:source.rollNumber,
  profileDocument:source.profileDocument,branch:source.branch,
  stage:source.stage,
  // Private storage grants are minted only by the authorized share-link
  // service. A self-preview never exposes a raw object path or bearer token.
  resumeSignedUrl:null,resumeExpiresAt:null,
 }],columns);
 if(!projected)return null;
 return {
  columns:columns.map(column=>COMPANY_SHARE_COLUMNS[column]),
  columnKeys:columns,
  preview:{
   applicantReference:detail.publicRef,
   learnerName:projected.displayName,
   email:projected.email,
   cells:projected.cells,
  },
  currentlyShared:Boolean(shared&&application.status==="SUBMITTED"&&
   source.stage==="SHORTLISTED"),
 };
}
