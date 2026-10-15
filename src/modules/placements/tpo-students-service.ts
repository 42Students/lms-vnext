import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
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
import { placementExternalOffers } from "@/db/schema/placement-external";

import { sortTpoRequestRows } from "@/modules/placements/tpo-global-requests-model";
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
  type TpoStudentApplicationSignal,
  type TpoStudentOfferSignal,
  type TpoStudentRoundSignal,
  type TpoStudentSource,
} from "./tpo-students-model";

const uuid = z.string().uuid();

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
    search: z.string().trim().max(150).optional(),
    ...paginationFields,
  })
  .strict();

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
    sort: z.enum(["NEWEST_FIRST","OLDEST_FIRST"]).optional(),
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
      registrationNumber:
        learnerProfiles.registrationNumber,
      enrollmentId: learnerProgramEnrollments.id,
      cohortId: cohorts.id,
      cohortName: cohorts.name,
      programName: programs.name,
      branchId: departments.id,
      branchName: departments.name,
      cgpaHundredths:
        placementCandidateAcademicEvidence.cgpaHundredths,
      activeBacklogs:
        placementCandidateAcademicEvidence.activeBacklogs,
      pastBacklogs:
        placementCandidateAcademicEvidence.pastBacklogs,
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
        eq(
          learnerProgramEnrollments.status,
          "ACTIVE",
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
      roster: filterTpoStudentRoster(
        [],
        input,
      ),
      // Server-only export option: avoids repeated full-college queries
      // for each CSV page. Never serialize this field into client props.
      exportRows: options.includeExportRows ? [] : null,
      definitions: {
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
          })
          .from(placementApplications)
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
            ),
          )
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
      programName: learner.programName,
      cohortId: learner.cohortId,
      cohortName: learner.cohortName,
      registrationChoice:
        registrationChoiceByLearner.get(
          `${learner.membershipId}:${learner.cohortId}`,
        ) ?? null,
      participation,
      academicEvidence: {
        cgpaHundredths: learner.cgpaHundredths,
        activeBacklogs: learner.activeBacklogs,
        pastBacklogs: learner.pastBacklogs,
      },
      preferencesPresent:
        learner.preferencesMembershipId !== null,
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

  return {
    collegeId: college.id,
    season: activeSeason ?? null,
    summary: summarizeTpoStudents(studentRows),
    branches: summarizeTpoStudentBranches(
      studentRows,
    ),
    roster: filterTpoStudentRoster(
      studentRows,
      input,
    ),
    // Filtering here uses the same pure derivation as the visible roster.
    // Page size is deliberately unrestricted only inside this trusted,
    // authorized service operation; public input remains Zod-bounded.
    exportRows: options.includeExportRows
      ? filterTpoStudentRoster(studentRows, {
          ...input,
          page: 1,
          pageSize: Math.max(1, studentRows.length),
        }).items
      : null,
    definitions: {
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
  membershipId: string;
  studentName: string;
  rollNumber: string | null;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  roundId: string | null;
  offerId: string | null;
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

  const rows = await getDb()
    .select({
      id: placementLearnerRequests.id,
      requestType:
        placementLearnerRequests.requestType,
      status: placementLearnerRequests.status,
      requestedAt:
        placementLearnerRequests.requestedAt,
      updatedAt: placementLearnerRequests.updatedAt,
      reason: placementLearnerRequests.reason,
      decisionNote:
        placementLearnerRequests.decisionNote,
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
  const ordered = sortTpoRequestRows(filtered,input.sort ?? "NEWEST_FIRST");

  const requests: TpoStudentRequestView[] =
    ordered
      .slice(start, start + input.pageSize)
      .map((row) => ({
        id: row.id,
        requestType: row.requestType,
        status: row.status,
        requestedAt: row.requestedAt,
        updatedAt: row.updatedAt,
        reason: row.reason,
        decisionNote: row.decisionNote,
        membershipId: row.membershipId,
        studentName:
          row.studentName ?? "Unnamed learner",
        rollNumber: row.rollNumber,
        applicationId: row.applicationId,
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        companyName: row.companyName,
        roundId: row.roundId,
        offerId: row.offerId,
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
