import {afterCollegeOutcomeSchema} from "./tpo-after-college-model";
import {tpoHiddenProfileMatchesSearch} from "./tpo-hidden-profile-search";
import {readTpoAfterCollegeMatches} from "./tpo-after-college-filter-service";
import {readTpoStudentVerificationFacts,studentVerificationFact} from "./tpo-student-verification-facts";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  departments,
  learnerProfiles,
  learnerProgramEnrollments,
  membershipRoles,
  placementApplications,
  placementApplicationScreenings,
  placementCandidateAcademicEvidence,
  placementCandidatePreferences,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRounds,
  placementJobs,
  placementJoiningOutcomes,
  placementLearnerRequests,
  placementOffers,
  placementRoundResults,
  placementSeasons,
  programs,
  sectionEnrollments,
  sections,
  users,
} from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import { placementBatchRegistrations } from "@/db/schema/placement-registration";
import {placementBatchLifecycles} from "@/db/schema/placement-batches";
import {placementDebarments} from "@/db/schema/placement-debarments";
import {isDebarmentActive} from "./batch-registration-policy";
import {placementCollegeDateInIndia} from "./placement-debarment-gate";
import { placementExternalOffers } from "@/db/schema/placement-external";

import { sortTpoRequestRows,tpoRequestUrgent } from "@/modules/placements/tpo-global-requests-model";
import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";
import type { RequestContext } from "@/modules/identity/context";

import {
  resolvePlacementParticipation,
  type PlacementScopeDecision,
} from "./batch-eligibility-policy";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";
import {
  TPO_STUDENT_JOURNEY_STATES,
  deriveTpoStudent,
  filterTpoStudentRoster,
  summarizeTpoStudentBranches,
  summarizeTpoStudents,
  selectTpoStudentWorkingSet,
  type TpoStudentApplicationSignal,
  type TpoStudentOfferSignal,
  type TpoStudentRoundSignal,
  type TpoStudentSource,
} from "./tpo-students-model";

const uuid = z.string().uuid();
/** Route filter strings are re-parsed by the service after URL validation. */
const yesNo=z.union([z.boolean(),z.enum(["YES","NO"])]).transform(
 value=>typeof value==="boolean"?value:value==="YES",
);

const paginationFields = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};

export const tpoStudentsQuerySchema = z
  .object({
    collegeId: uuid,
    journeyState: z
      .enum(TPO_STUDENT_JOURNEY_STATES)
      .optional(),
    branchId: uuid.optional(),
    programId:uuid.optional(),
    classId:uuid.optional(),
    afterCollege:afterCollegeOutcomeSchema.optional(),
    profileStatus:z.enum(["VERIFIED","WAITING","SENT_BACK","NOT_VERIFIED"]).optional(),
    legacyStage:z.enum(["ELIGIBLE","INVITED","REGISTERED","VERIFIED","PLACED"]).optional(),
    minRoundReached:z.coerce.number().int().min(0).max(10000).optional(),
    interviewedWith:z.string().trim().max(100).optional(),
    needsAttention:yesNo.optional(),
    debarred:yesNo.optional(),
    gender:z.enum(["Male","Female","Other"]).optional(),
    birthYear:z.coerce.number().int().min(1900).max(2100).optional(),
    minSkills:z.coerce.number().int().min(0).max(100).optional(),
    minProjects:z.coerce.number().int().min(0).max(50).optional(),
    minCertifications:z.coerce.number().int().min(0).max(50).optional(),
    minExperiences:z.coerce.number().int().min(0).max(30).optional(),
    hasProfileLinks:yesNo.optional(),
    hasResume:yesNo.optional(),
    hasCodingProfiles:yesNo.optional(),
    minApplications:z.coerce.number().int().min(0).max(10000).optional(),
    maxApplications:z.coerce.number().int().min(0).max(10000).optional(),
    minOffers:z.coerce.number().int().min(0).max(10000).optional(),
    maxOffers:z.coerce.number().int().min(0).max(10000).optional(),
    offerWaiting:z.union([z.boolean(),z.enum(["YES","NO"])]).transform(value=>typeof value==="boolean"?value:value==="YES").optional(),
    minCgpa:z.coerce.number().min(0).max(10).optional(),
    minTenthPct:z.coerce.number().min(0).max(100).optional(),
    minTwelfthPct:z.coerce.number().min(0).max(100).optional(),
    minDiplomaPct:z.coerce.number().min(0).max(100).optional(),
    minUgPct:z.coerce.number().min(0).max(100).optional(),
    passingYear:z.coerce.number().int().min(1950).max(2100).optional(),
    maxGapYears:z.coerce.number().int().min(0).max(100).optional(),
    marksVerified:yesNo.optional(),
    isLateralEntry:yesNo.optional(),
    maxCgpa:z.coerce.number().min(0).max(10).optional(),
    maxActiveBacklogs:z.coerce.number().int().min(0).max(100).optional(),
    maxPastBacklogs:z.coerce.number().int().min(0).max(100).optional(),
    cgpaRecorded:z.union([z.boolean(),z.enum(["YES","NO"])]).transform(value=>typeof value==="boolean"?value:value==="YES").optional(),
    batchId: uuid.optional(),
    search: z.string().trim().max(150).optional(),
    ...paginationFields,
  })
  .strict()
  .superRefine((value,ctx)=>{
    if(value.minCgpa!==undefined&&value.maxCgpa!==undefined&&value.minCgpa>value.maxCgpa)
     ctx.addIssue({code:"custom",path:["maxCgpa"],message:"CGPA upper bound must be at least the lower bound"});
    if(value.minApplications!==undefined&&value.maxApplications!==undefined&&value.minApplications>value.maxApplications)
     ctx.addIssue({code:"custom",path:["maxApplications"],message:"Maximum applications must be at least the minimum"});
    if(value.minOffers!==undefined&&value.maxOffers!==undefined&&value.minOffers>value.maxOffers)
     ctx.addIssue({code:"custom",path:["maxOffers"],message:"Maximum offers must be at least the minimum"});
  });

export const tpoStudentRequestsQuerySchema = z
  .object({
    collegeId: uuid,
    status: z
      .enum([
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ])
      .optional(),
    requestType: z.enum(["APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION"]).optional(),
    sort: z.enum(["URGENCY_FIRST","NEWEST_FIRST","OLDEST_FIRST","DECIDED_NEWEST","DECIDED_OLDEST"]).optional(),
    requestedBefore:z.date().optional(),
    requestedAfter:z.date().optional(),
    urgentOnly:z.boolean().default(false),
    jobId:uuid.optional(),
    search: z.string().trim().max(150).optional(),
    ...paginationFields,
  })
  .strict();

export type TpoStudentsQuery = z.input<
  typeof tpoStudentsQuerySchema
>;

export type TpoStudentRequestsQuery = z.input<
  typeof tpoStudentRequestsQuerySchema
>;

type ApplicationSignal =
  TpoStudentApplicationSignal;

type OfferSignal =
  TpoStudentOfferSignal;

type RoundSignal =
  TpoStudentRoundSignal;

function appendToMap<T>(
  map: Map<string, T[]>,
  key: string,
  value: T,
) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function decisionView(
  row: {
    status: string;
    reason: string | null;
    note: string | null;
    decidedAt: Date;
  } | undefined,
): PlacementScopeDecision | null {
  if (!row) return null;

  return {
    status: row.status as "ELIGIBLE" | "INELIGIBLE",
    reason: row.reason,
    note: row.note,
    decidedAt: row.decidedAt,
  };
}

/**
 * Authorized, college-wide TPO Students read.
 *
 * Population: active Learner memberships with exactly one
 * ACTIVE program enrollment in this college, regardless of
 * whether they registered for placements. Academic branch
 * is resolved through program -> department.
 *
 * Registration belongs to the learner's active COHORT.
 * Applications, offers and applied results belong to the
 * current ACTIVE placement season. Verified external offers
 * have no season FK, so only those verified during the active
 * season's India-local date window are included.
 *
 * This read does not attempt to decide job-specific
 * eligibility or claim that academic evidence proves
 * employer/interview readiness.
 */
export async function getTpoStudentsIntelligence(
  context: RequestContext,
  rawInput: unknown,
  options: { includeExportRows?: boolean } = {},
) {
  const input =
    tpoStudentsQuerySchema.parse(rawInput);

  const college =
    await requirePlacementManageScope(
      context,
      input.collegeId,
    );

  const db = getDb();

  const [activeSeason] = await db
    .select({
      id: placementSeasons.id,
      name: placementSeasons.name,
      startDate: placementSeasons.startDate,
      endDate: placementSeasons.endDate,
    })
    .from(placementSeasons)
    .where(
      and(
        eq(placementSeasons.collegeId, college.id),
        eq(placementSeasons.status, "ACTIVE"),
      ),
    )
    .orderBy(desc(placementSeasons.startDate))
    .limit(1);

  const learners = await db
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
      rollNumber: learnerProfiles.rollNumber,
      profileDocument:learnerProfiles.profileDocument,
      registrationNumber:
        learnerProfiles.registrationNumber,
      enrollmentId: learnerProgramEnrollments.id,
      enrollmentStatus: learnerProgramEnrollments.status,
      cohortId: cohorts.id,
      cohortName: cohorts.name,
      batchInvitedAt:placementBatchLifecycles.invitedAt,
      programId: programs.id,
      programName: programs.name,
      branchId: departments.id,
      branchName: departments.name,
      cgpaHundredths:
        placementCandidateAcademicEvidence.cgpaHundredths,
      activeBacklogs:
        placementCandidateAcademicEvidence.activeBacklogs,
      pastBacklogs:
        placementCandidateAcademicEvidence.pastBacklogs,
      tenthPctBasisPoints:placementCandidateAcademicEvidence.tenthPctBasisPoints,
      twelfthPctBasisPoints:placementCandidateAcademicEvidence.twelfthPctBasisPoints,
      diplomaPctBasisPoints:placementCandidateAcademicEvidence.diplomaPctBasisPoints,
      undergraduatePctBasisPoints:placementCandidateAcademicEvidence.undergraduatePctBasisPoints,
      passingYear:placementCandidateAcademicEvidence.passingYear,
      gapYears:placementCandidateAcademicEvidence.gapYears,
      isLateralEntry:placementCandidateAcademicEvidence.isLateralEntry,
      academicSource:placementCandidateAcademicEvidence.source,
      verifiedAt:placementCandidateAcademicEvidence.verifiedAt,
      preferencesMembershipId:
        placementCandidatePreferences.membershipId,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "LEARNER"),
      ),
    )
    .innerJoin(
      learnerProgramEnrollments,
      and(
        eq(
          learnerProgramEnrollments.membershipId,
          collegeMemberships.id,
        ),
      ),
    )
    .innerJoin(
      cohorts,
      and(
        eq(
          cohorts.id,
          learnerProgramEnrollments.cohortId,
        ),
        eq(
          cohorts.programId,
          learnerProgramEnrollments.programId,
        ),
      ),
    )
    .leftJoin(
      placementBatchLifecycles,
      and(
        eq(placementBatchLifecycles.cohortId,cohorts.id),
        eq(placementBatchLifecycles.collegeId,college.id),
      ),
    )
    .innerJoin(
      programs,
      eq(
        programs.id,
        learnerProgramEnrollments.programId,
      ),
    )
    .innerJoin(
      departments,
      and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, college.id),
      ),
    )
    .leftJoin(
      learnerProfiles,
      eq(
        learnerProfiles.membershipId,
        collegeMemberships.id,
      ),
    )
    .leftJoin(
      placementCandidateAcademicEvidence,
      eq(
        placementCandidateAcademicEvidence.membershipId,
        collegeMemberships.id,
      ),
    )
    .leftJoin(
      placementCandidatePreferences,
      eq(
        placementCandidatePreferences.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(
      and(
        eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        input.batchId?eq(learnerProgramEnrollments.cohortId,input.batchId):undefined,
        or(
          eq(learnerProgramEnrollments.status,"ACTIVE"),
          input.batchId?and(eq(learnerProgramEnrollments.status,"COMPLETED"),
            isNotNull(placementBatchLifecycles.finishedAt)):undefined,
        ),
      ),
    )
    .orderBy(
      asc(users.displayName),
      asc(collegeMemberships.id),
    );

  const registrationChoiceByLearner = new Map<string, string>();
  const registrationsAvailable = await placementTableExists(
    "placement_batch_registrations",
  );

  if (registrationsAvailable) {
    const registrations = await db
      .select({
        membershipId: placementBatchRegistrations.membershipId,
        cohortId: placementBatchRegistrations.cohortId,
        choice: placementBatchRegistrations.choice,
      })
      .from(placementBatchRegistrations)
      .where(eq(placementBatchRegistrations.collegeId, college.id));

    for (const registration of registrations) {
      registrationChoiceByLearner.set(
        `${registration.membershipId}:${registration.cohortId}`,
        registration.choice,
      );
    }
  }

  const externalOffersAvailable = await placementTableExists(
    "placement_external_offers",
  );

  const emptySummary =
    summarizeTpoStudents([]);

  if (learners.length === 0) {
    return {
      collegeId: college.id,
      season: activeSeason ?? null,
      summary: emptySummary,
      branches: [],
      classChoices:[],
      roster: filterTpoStudentRoster(
        [],
        input,
      ),
      // Server-only export option: avoids repeated full-college queries
      // for each CSV page. Never serialize this field into client props.
      exportRows: options.includeExportRows ? [] : null,
      definitions: {
        afterCollegeAvailable:input.afterCollege?await placementTableExists("placement_tpo_after_college"):true,
        verificationAvailable:await placementTableExists("profile_verifications"),
        registrationsAvailable,
        externalOffersAvailable,
        registrationScope: "ACTIVE_COHORT",
        applicationScope: "ACTIVE_SEASON",
        readinessVerified: false,
        placedVerified: false,
      },
    };
  }

  const enrollmentIds = learners.map(
    (learner) => learner.enrollmentId,
  );

  const [
    activeSections,
    participationDecisions,
    applications,
    offers,
    results,
    externalOffers,
  ] = await Promise.all([
    db
      .select({
        enrollmentId:
          sectionEnrollments.learnerEnrollmentId,
        sectionId: sections.id,
        sectionName:sections.name,
        cohortId: sections.cohortId,
      })
      .from(sectionEnrollments)
      .innerJoin(
        sections,
        and(
          eq(
            sections.id,
            sectionEnrollments.sectionId,
          ),
          eq(
            sections.academicPeriodId,
            sectionEnrollments.academicPeriodId,
          ),
        ),
      )
      .where(
        and(
          inArray(
            sectionEnrollments.learnerEnrollmentId,
            enrollmentIds,
          ),
          eq(sectionEnrollments.status, "ACTIVE"),
          eq(sections.status, "ACTIVE"),
        ),
      ),

    db
      .select({
        scopeType:
          placementEligibilityDecisions.scopeType,
        scopeId: placementEligibilityDecisions.scopeId,
        status: placementEligibilityDecisions.status,
        reason: placementEligibilityDecisions.reason,
        note: placementEligibilityDecisions.note,
        decidedAt:
          placementEligibilityDecisions.decidedAt,
      })
      .from(placementEligibilityDecisions)
      .where(
        eq(
          placementEligibilityDecisions.collegeId,
          college.id,
        ),
      ),

    activeSeason
      ? db
          .select({
            id: placementApplications.id,
            membershipId:
              placementApplications.membershipId,
            status: placementApplications.status,
            screeningStatus:
              placementApplicationScreenings.status,
            companyName:placementCompanies.name,
          })
          .from(placementApplications)
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
            ),
          )
          .innerJoin(placementCompanyRelationships,and(
            eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
            eq(placementCompanyRelationships.collegeId,college.id),
          ))
          .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
          .leftJoin(
            placementApplicationScreenings,
            eq(
              placementApplicationScreenings.applicationId,
              placementApplications.id,
            ),
          )
          .where(
            and(
              eq(placementJobs.collegeId, college.id),
              eq(
                placementJobs.seasonId,
                activeSeason.id,
              ),
            ),
          )
      : Promise.resolve([]),

    activeSeason
      ? db
          .select({
            membershipId:
              placementApplications.membershipId,
            status: placementOffers.status,
            joiningStatus:
              placementJoiningOutcomes.status,
          })
          .from(placementOffers)
          .innerJoin(
            placementApplications,
            eq(
              placementApplications.id,
              placementOffers.applicationId,
            ),
          )
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
            ),
          )
          .leftJoin(
            placementJoiningOutcomes,
            eq(
              placementJoiningOutcomes.offerId,
              placementOffers.id,
            ),
          )
          .where(
            and(
              eq(placementJobs.collegeId, college.id),
              eq(
                placementJobs.seasonId,
                activeSeason.id,
              ),
            ),
          )
      : Promise.resolve([]),

    activeSeason
      ? db
          .select({
            membershipId:
              placementApplications.membershipId,
            applicationId:
              placementApplications.id,
            sequence: placementJobRounds.sequence,
            kind: placementJobRounds.kind,
            outcome: placementRoundResults.outcome,
          })
          .from(placementRoundResults)
          .innerJoin(
            placementJobRounds,
            eq(
              placementJobRounds.id,
              placementRoundResults.roundId,
            ),
          )
          .innerJoin(
            placementApplications,
            and(
              eq(
                placementApplications.id,
                placementRoundResults.applicationId,
              ),
              eq(
                placementApplications.jobId,
                placementJobRounds.jobId,
              ),
            ),
          )
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
            ),
          )
          .where(
            and(
              eq(placementJobs.collegeId, college.id),
              eq(
                placementJobs.seasonId,
                activeSeason.id,
              ),
              eq(placementRoundResults.status, "APPLIED"),
            ),
          )
      : Promise.resolve([]),

    activeSeason && externalOffersAvailable
      ? db
          .select({
            membershipId:
              placementExternalOffers.membershipId,
          })
          .from(placementExternalOffers)
          .where(
            and(
              eq(
                placementExternalOffers.collegeId,
                college.id,
              ),
              eq(
                placementExternalOffers.status,
                "VERIFIED",
              ),
              gte(
                placementExternalOffers.reviewedAt,
                parseActivityDateBoundary(
                  activeSeason.startDate,
                  "from",
                ),
              ),
              lte(
                placementExternalOffers.reviewedAt,
                parseActivityDateBoundary(
                  activeSeason.endDate,
                  "to",
                ),
              ),
            ),
          )
      : Promise.resolve([]),
  ]);

  const sectionsByEnrollment = new Map<
    string,
    string[]
  >();

  const cohortByEnrollment = new Map(
    learners.map((learner) => [
      learner.enrollmentId,
      learner.cohortId,
    ]),
  );

  for (const section of activeSections) {
    if (
      cohortByEnrollment.get(section.enrollmentId) !==
      section.cohortId
    ) {
      continue;
    }

    appendToMap(
      sectionsByEnrollment,
      section.enrollmentId,
      section.sectionId,
    );
  }

  const decisionsByScope = new Map(
    participationDecisions.map((row) => [
      `${row.scopeType}:${row.scopeId}`,
      row,
    ]),
  );

  const applicationsByMember = new Map<
    string,
    ApplicationSignal[]
  >();

  const offersByMember = new Map<
    string,
    OfferSignal[]
  >();

  const resultsByMember = new Map<
    string,
    RoundSignal[]
  >();

  const externalOffersByMember =
    new Map<string, number>();

  // All upstream application/offer/result reads are
  // independently job-college scoped. Membership IDs are
  // joined back only to this authorized learner population.
  const authorizedMembers = new Set(
    learners.map((learner) => learner.membershipId),
  );

  for (const application of applications) {
    if (
      !authorizedMembers.has(application.membershipId)
    ) {
      continue;
    }

    appendToMap(
      applicationsByMember,
      application.membershipId,
      {
        id: application.id,
        status: application.status,
        screeningStatus:
          application.screeningStatus,
        companyName:application.companyName,
      },
    );
  }

  for (const offer of offers) {
    if (!authorizedMembers.has(offer.membershipId)) {
      continue;
    }

    appendToMap(
      offersByMember,
      offer.membershipId,
      {
        status: offer.status,
        joiningStatus: offer.joiningStatus,
      },
    );
  }

  for (const result of results) {
    if (
      !authorizedMembers.has(result.membershipId)
    ) {
      continue;
    }

    appendToMap(
      resultsByMember,
      result.membershipId,
      {
        applicationId: result.applicationId,
        sequence: result.sequence,
        kind: result.kind,
        outcome: result.outcome,
      },
    );
  }

  for (const external of externalOffers) {
    if (
      !authorizedMembers.has(external.membershipId)
    ) {
      continue;
    }

    externalOffersByMember.set(
      external.membershipId,
      (externalOffersByMember.get(
        external.membershipId,
      ) ?? 0) + 1,
    );
  }

  const now = new Date();
  const verificationFacts=await readTpoStudentVerificationFacts(college.id);

  const studentRows = learners.map((learner) => {
    const sectionIds =
      sectionsByEnrollment.get(
        learner.enrollmentId,
      ) ?? [];

    const ambiguousSection =
      sectionIds.length > 1;

    const sectionId =
      sectionIds.length === 1
        ? sectionIds[0]
        : undefined;

    const findDecision = (
      scopeType: string,
      scopeId: string | undefined,
    ) =>
      scopeId
        ? decisionView(
            decisionsByScope.get(
              `${scopeType}:${scopeId}`,
            ),
          )
        : null;

    const participation =
      ambiguousSection
        ? resolvePlacementParticipation({
            learner: null,
            section: null,
            cohort: null,
          })
        : resolvePlacementParticipation({
            learner: findDecision(
              "MEMBERSHIP",
              learner.membershipId,
            ),
            section: findDecision(
              "SECTION",
              sectionId,
            ),
            cohort: findDecision(
              "COHORT",
              learner.cohortId,
            ),
          });

    const source: TpoStudentSource = {
      membershipId: learner.membershipId,
      displayName: learner.displayName,
      email: learner.email,
      rollNumber: learner.rollNumber,
      registrationNumber:
        learner.registrationNumber,
      branchId: learner.branchId,
      branchName: learner.branchName,
      programId:learner.programId,
      programName: learner.programName,
      cohortId: learner.cohortId,
      cohortName: learner.cohortName,
      classIds:sectionIds,
      fromFinishedBatch:learner.enrollmentStatus==="COMPLETED",
      registrationOpen:learner.batchInvitedAt!==null,
      profileDocument:learner.profileDocument,
      hiddenSearchMatched:tpoHiddenProfileMatchesSearch(learner.profileDocument,input.search??""),
      registrationChoice:
        registrationChoiceByLearner.get(
          `${learner.membershipId}:${learner.cohortId}`,
        ) ?? null,
      participation,
      academicEvidence: {
        cgpaHundredths: learner.cgpaHundredths,
        activeBacklogs: learner.activeBacklogs,
        pastBacklogs: learner.pastBacklogs,
        tenthPctBasisPoints:learner.tenthPctBasisPoints,
        twelfthPctBasisPoints:learner.twelfthPctBasisPoints,
        diplomaPctBasisPoints:learner.diplomaPctBasisPoints,
        undergraduatePctBasisPoints:learner.undergraduatePctBasisPoints,
        passingYear:learner.passingYear,gapYears:learner.gapYears,
        isLateralEntry:learner.isLateralEntry,
        academicSource:learner.academicSource,verifiedAt:learner.verifiedAt,
      },
      preferencesPresent:
        learner.preferencesMembershipId !== null,
      verification:studentVerificationFact(verificationFacts,learner.membershipId),
      applications:
        applicationsByMember.get(
          learner.membershipId,
        ) ?? [],
      offers:
        offersByMember.get(
          learner.membershipId,
        ) ?? [],
      appliedResults:
        resultsByMember.get(
          learner.membershipId,
        ) ?? [],
      verifiedExternalOfferCount:
        externalOffersByMember.get(
          learner.membershipId,
        ) ?? 0,
      ambiguousSection,
    };

    return deriveTpoStudent(source, now);
  });

  // Legacy working set: placement-eligible learners only; a completed
  // academic enrollment reappears only when its finished cohort is selected.
  const debarmentAvailable=await placementTableExists("placement_debarments");
  const debarmentRecords=debarmentAvailable?await db.select({
    membershipId:placementDebarments.membershipId,
    untilDate:placementDebarments.untilDate,
    untilDrives:placementDebarments.untilDrives,
    drivesCounted:placementDebarments.drivesCounted,
    liftedAt:placementDebarments.liftedAt,
  }).from(placementDebarments).where(eq(placementDebarments.collegeId,college.id)):[];
  const debarredIds=new Set(debarmentRecords.filter(record=>
    isDebarmentActive(record,placementCollegeDateInIndia(now))).map(record=>record.membershipId));
  const rowsWithDebarment=studentRows.map(row=>({...row,
    debarred:debarmentAvailable?debarredIds.has(row.membershipId):null,
  }));
  const workingRows=selectTpoStudentWorkingSet(rowsWithDebarment,Boolean(input.batchId));
  const outcomeMatches=input.afterCollege?await readTpoAfterCollegeMatches(college.id,input.afterCollege):null;
  const filteredRows=!outcomeMatches?workingRows:!outcomeMatches.available?[]:
    workingRows.filter(row=>outcomeMatches.matched.has(row.membershipId)||
      input.afterCollege==="NOT_DECIDED"&&!outcomeMatches.assigned.has(row.membershipId));
  // Journey tiles follow the same scoped filter as the roster rather than
  // reporting whole-college counts after a branch or program is selected.
  const scopedRows=filterTpoStudentRoster(filteredRows,{
    ...input,page:1,pageSize:Math.max(1,filteredRows.length),
  }).items;
  return {
    collegeId: college.id,
    season: activeSeason ?? null,
    summary: summarizeTpoStudents(scopedRows),
    debarmentAvailable,
    debarredCount:debarmentAvailable?scopedRows.filter(row=>row.debarred===true).length:null,
    uninvitedCount:scopedRows.filter(row=>row.registrationOpen===false&&!row.registeredForPlacements&&!row.fromFinishedBatch).length,
    branches: summarizeTpoStudentBranches(workingRows),
    classChoices:[...new Map(activeSections.filter(section=>
      cohortByEnrollment.get(section.enrollmentId)===section.cohortId)
      .map(section=>[section.sectionId,section.sectionName] as const))]
      .map(([id,name])=>({id,name})),
    roster: filterTpoStudentRoster(filteredRows,input),
    // Filtering here uses the same pure derivation as the visible roster.
    // Page size is deliberately unrestricted only inside this trusted,
    // authorized service operation; public input remains Zod-bounded.
    exportRows: options.includeExportRows
      ? filterTpoStudentRoster(filteredRows, {
          ...input,
          page: 1,
          pageSize: Math.max(1, workingRows.length),
        }).items
      : null,
    definitions: {
      afterCollegeAvailable:outcomeMatches?.available??true,
      verificationAvailable:verificationFacts.available,
      registrationsAvailable,
      externalOffersAvailable,
      registrationScope: "ACTIVE_COHORT",
      applicationScope: "ACTIVE_SEASON",
      readinessVerified: false,
      placedVerified: false,
    },
  };
}

export type TpoStudentRequestView = {
  id: string;
  requestType: string;
  status: string;
  requestedAt: Date;
  updatedAt: Date;
  reason: string;
  decisionNote: string | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  membershipId: string;
  studentName: string;
  rollNumber: string | null;
  branchName: string | null;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  roundId: string | null;
  offerId: string | null;
  nextRoundAt: Date | null;
  nextRoundName: string | null;
  urgent: boolean;
};

export type TpoStudentRequestSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
};

/**
 * Global Students Requests read side. Reuses authoritative
 * placement_learner_requests rows rather than inventing a
 * second student-request state machine.
 *
 * Decisions are performed by the existing request service,
 * not by this read function.
 */
export async function listTpoStudentRequests(
  context: RequestContext,
  rawInput: unknown,
) {
  const input =
    tpoStudentRequestsQuerySchema.parse(
      rawInput,
    );

  const college =
    await requirePlacementManageScope(
      context,
      input.collegeId,
    );

  const asOf=new Date();
  const rows = await getDb()
    .select({
      id: placementLearnerRequests.id,
      nextRoundAt:sql<Date|null>`(select min(next_round.scheduled_at) from placement_job_rounds next_round
        where next_round.job_id = ${placementJobs.id}
        and next_round.status = 'SCHEDULED'
        and next_round.scheduled_at >= ${asOf.toISOString()}::timestamptz)`,
      nextRoundName:sql<string|null>`(select next_round.name from placement_job_rounds next_round
        where next_round.job_id = ${placementJobs.id}
        and next_round.status = 'SCHEDULED'
        and next_round.scheduled_at >= ${asOf.toISOString()}::timestamptz
        order by next_round.scheduled_at, next_round.id limit 1)`,
      requestType:
        placementLearnerRequests.requestType,
      status: placementLearnerRequests.status,
      requestedAt:
        placementLearnerRequests.requestedAt,
      updatedAt: placementLearnerRequests.updatedAt,
      reason: placementLearnerRequests.reason,
      decisionNote:
        placementLearnerRequests.decisionNote,
      decidedAt:placementLearnerRequests.decidedAt,
      decidedBy:sql<string|null>`(select decider.display_name from users decider where decider.id=${placementLearnerRequests.decidedByUserId} limit 1)`,
      membershipId: collegeMemberships.id,
      studentName: users.displayName,
      rollNumber: learnerProfiles.rollNumber,
      applicationId: placementApplications.id,
      jobId: placementJobs.id,
      jobTitle: placementJobs.title,
      companyName: placementCompanies.name,
      roundId: placementLearnerRequests.roundId,
      offerId: placementLearnerRequests.offerId,
    })
    .from(placementLearnerRequests)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementLearnerRequests.applicationId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
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
    .innerJoin(
      placementCompanyRelationships,
      and(
        eq(
          placementCompanyRelationships.id,
          placementJobs.companyRelationshipId,
        ),
        eq(
          placementCompanyRelationships.collegeId,
          college.id,
        ),
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
      learnerProfiles,
      eq(
        learnerProfiles.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(
      and(
        eq(placementJobs.collegeId, college.id),
        eq(
          collegeMemberships.collegeId,
          college.id,
        ),
      ),
    )
    .orderBy(
      desc(placementLearnerRequests.requestedAt),
      desc(placementLearnerRequests.id),
    );

  const summary: TpoStudentRequestSummary = {
    total: rows.length,
    pending: rows.filter(
      (row) => row.status === "PENDING",
    ).length,
    approved: rows.filter(
      (row) => row.status === "APPROVED",
    ).length,
    rejected: rows.filter(
      (row) => row.status === "REJECTED",
    ).length,
    cancelled: rows.filter(
      (row) => row.status === "CANCELLED",
    ).length,
  };

  const search =
    input.search?.toLocaleLowerCase("en-IN") ?? "";

  const filtered = rows.filter((row) => {
    if (
      input.status &&
      row.status !== input.status
    ) {
      return false;
    }
    if(input.requestType&&row.requestType!==input.requestType)return false;
    if(input.jobId&&row.jobId!==input.jobId)return false;
    if(input.urgentOnly&&!tpoRequestUrgent(row,asOf))return false;
    if(input.requestedBefore&&row.requestedAt>=input.requestedBefore)return false;
    if(input.requestedAfter&&row.requestedAt<input.requestedAfter)return false;

    if (!search) return true;

    return [
      row.studentName,
      row.rollNumber,
      row.jobTitle,
      row.companyName,
      row.requestType,
    ].some((value) =>
      value
        ?.toLocaleLowerCase("en-IN")
        .includes(search),
    );
  });

  const start = (input.page - 1) * input.pageSize;
  const ordered = sortTpoRequestRows(filtered,input.sort ?? "URGENCY_FIRST",asOf);

  const pageRows=ordered.slice(start,start+input.pageSize);
  const membershipIds=[...new Set(pageRows.map(row=>row.membershipId))];
  const scopedEnrollments=membershipIds.length?await getDb().select({
    membershipId:learnerProgramEnrollments.membershipId,
    branchName:departments.name,
  }).from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,college.id)))
    .where(and(inArray(learnerProgramEnrollments.membershipId,membershipIds),
      eq(learnerProgramEnrollments.status,"ACTIVE"))):[];
  const byMembership=new Map(scopedEnrollments.map(row=>[row.membershipId,row.branchName]));
  const requests: TpoStudentRequestView[] =
    pageRows
      .map((row) => ({
        id: row.id,
        requestType: row.requestType,
        status: row.status,
        requestedAt: row.requestedAt,
        updatedAt: row.updatedAt,
        reason: row.reason,
        decisionNote: row.decisionNote,
        decidedAt:row.decidedAt,
        decidedBy:row.decidedBy,
        membershipId: row.membershipId,
        studentName:
          row.studentName ?? "Unnamed learner",
        rollNumber: row.rollNumber,
        branchName:byMembership.get(row.membershipId)??null,
        applicationId: row.applicationId,
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        companyName: row.companyName,
        roundId: row.roundId,
        offerId: row.offerId,
        nextRoundAt: row.nextRoundAt,
        nextRoundName: row.nextRoundName,
        urgent:tpoRequestUrgent(row,asOf),
      }));

  return {
    collegeId: college.id,
    summary,
    total: filtered.length,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(
      filtered.length / input.pageSize,
    ),
    requests,
  };
}
