import "server-only";

import {
  and,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  placementApplicationScreenings,
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementCollegeRules,
  placementJoiningOutcomes,
  placementOffers,
  placementSeasons,
  programs,
  users,
} from "@/db/schema";
import { placementBatchRegistrations } from "@/db/schema/placement-registration";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";
import {
  requirePlacementManageScope,
} from "./scope";
import { PlacementsServiceError } from "./errors";
import { placementTableExists } from "./staged-tables";
import {
  summarizePlacementReports,
  summarizePlacementReportDetails,
  type PlacementReportPoolLearner,
  type PlacementReportDetailedOffer,
  type PlacementReportApplication,
  type PlacementReportBranch,
  type PlacementReportFacts,
  type PlacementReportJob,
  type PlacementReportOffer,
  type PlacementReportRegistration,
} from "./report-model";

export const placementReportQuerySchema = z
  .object({
    collegeId: z.string().uuid(),
    seasonId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
    branch: z.string().trim().max(120).optional(),
    company: z.string().trim().max(200).optional(),
    mode: z.enum(["ON_CAMPUS", "POOL", "OFF_CAMPUS"]).optional(),
    category: z.enum(["REGULAR", "DREAM", "SUPER_DREAM"]).optional(),
  })
  .strict()
  .superRefine((filters, ctx) => {
    // Legacy POOL and SUPER_DREAM are not independently persisted. Returning
    // zero rows for either would fabricate a valid empty result.
    if (filters.mode === "POOL") {
      ctx.addIssue({
        code: "custom",
        path: ["mode"],
        message: "Pool-drive reporting needs a persisted pool classification; this filter is not available yet.",
      });
    }
    if (filters.category === "SUPER_DREAM") {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "Super-dream reporting needs a persisted category; this filter is not available yet.",
      });
    }
  });

export type PlacementReportQuery = z.input<
  typeof placementReportQuerySchema
>;

function reportFilterKey(query: PlacementReportQuery): string {
  return JSON.stringify([
    query.batchId ?? null,
    query.branch?.toLowerCase() ?? null,
    query.company?.toLowerCase() ?? null,
    query.mode ?? null,
    query.category ?? null,
  ]);
}

export async function getPlacementReportWorkspace(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = placementReportQuerySchema.parse(rawQuery);

  /*
   * A global Super Admin must explicitly select a college before accessing
   * these operational reports. This is stronger than the general platform
   * policy's unscoped-admin behavior, intentionally matching attendance and
   * lecture-hall college selection.
   */
  if (
    isSuperAdmin(context) &&
    context.adminScope?.collegeId !== query.collegeId
  ) {
    throw new AuthorizationError("placements.manage");
  }

  const college = await requirePlacementManageScope(
    context,
    query.collegeId,
  );

  const db = getDb();
  const [collegeRules] = await db.select({
    countsAsPlacedAt: placementCollegeRules.countsAsPlacedAt,
  }).from(placementCollegeRules)
    .where(eq(placementCollegeRules.collegeId, college.id)).limit(1);
  const countsAsPlacedAt = (collegeRules?.countsAsPlacedAt ?? "OFFER_RELEASED") as
    "SELECTED" | "OFFER_RELEASED" | "OFFER_ACCEPTED";

  const seasons = await db
    .select({
      id: placementSeasons.id,
      name: placementSeasons.name,
      code: placementSeasons.code,
      status: placementSeasons.status,
      startDate: placementSeasons.startDate,
      endDate: placementSeasons.endDate,
    })
    .from(placementSeasons)
    .where(eq(placementSeasons.collegeId, college.id))
    .orderBy(
      desc(placementSeasons.startDate),
      desc(placementSeasons.createdAt),
    );

  const selectedSeason = query.seasonId
    ? seasons.find((season) => season.id === query.seasonId)
    : seasons.find((season) => season.status === "ACTIVE") ??
      seasons[0];

  if (query.seasonId && !selectedSeason) {
    throw new PlacementsServiceError(
      "PLACEMENT_SEASON_NOT_FOUND",
    );
  }

  const emptyFacts: PlacementReportFacts = {
    countsAsPlacedAt,
    jobs: [],
    applications: [],
    offers: [],
    registrations: [],
    branches: [],
  };

  if (!selectedSeason) {
    return {
      collegeId: college.id,
      seasons,
      selectedSeasonId: null,
      selectedJobId: null,
      selectedReportJobIds: [] as string[],
      reportFilterKey: reportFilterKey(query),
      jobs: [] as PlacementReportJob[],
      report: summarizePlacementReports(emptyFacts),
      noSeason: true,
      registrationScopeNote:
        "Placement registrations are recorded by academic batch, not by season.",
    };
  }

  const jobConditions = [
    eq(placementJobs.collegeId, college.id),
    eq(placementJobs.seasonId, selectedSeason.id),
    isNull(placementJobs.archivedAt),
  ];

  /*
   * Fetch the job selector independently of jobId, so changing the drive
   * filter does not remove other choices from the selector.
   */
  const jobRows = await db
    .select({
      id: placementJobs.id,
      title: placementJobs.title,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
      employmentType: placementJobs.employmentType,
      status: placementJobs.status,
      recruiterDriveMode: placementJobs.recruiterDriveMode,
      isDream: placementJobs.isDream,
      // Type labels require the job_type_label migration; do not select a
      // nonexistent Drizzle column or mislabel a custom drive as a built-in.
      countsAsPlaced: placementJobs.countsAsPlaced,
    })
    .from(placementJobs)
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
    .where(and(...jobConditions))
    .orderBy(
      placementCompanies.name,
      placementJobs.title,
      placementJobs.id,
    );

  if (
    query.jobId &&
    !jobRows.some((row) => row.id === query.jobId)
  ) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }

  // A company, mode or pay category filter changes drive facts, not the
  // registered population. POOL/SUPER_DREAM are not persisted separately.
  const jobs: PlacementReportJob[] = jobRows.filter((job) =>
    (!query.jobId || job.id === query.jobId) &&
    (!query.company || job.companyName.toLowerCase() === query.company.toLowerCase()) &&
    (!query.mode || job.recruiterDriveMode === query.mode) &&
    (!query.category ||
      (query.category === "DREAM" && job.isDream) ||
      (query.category === "REGULAR" && !job.isDream))
  );

  if (jobs.length === 0) {
    return {
      collegeId: college.id,
      seasons,
      selectedSeasonId: selectedSeason.id,
      selectedJobId: query.jobId ?? null,
      selectedReportJobIds: [] as string[],
      reportFilterKey: reportFilterKey(query),
      jobs: jobRows,
      report: summarizePlacementReports(emptyFacts),
      noSeason: false,
      registrationScopeNote:
        "Placement registrations are recorded by academic batch, not by season.",
    };
  }

  /*
   * Scope every application/offer query through the stored job's college,
   * selected season and an independently checked membership college.
   * Do not rely on user-supplied job IDs as authorization evidence.
   */
  const selectedJobCondition = query.jobId
    ? eq(placementJobs.id, query.jobId)
    : undefined;

  const selectedJobFilters = and(
    ...jobConditions,
    selectedJobCondition,
    inArray(placementJobs.id, jobs.map((job) => job.id)),
  );

  const registrationsAvailable = await placementTableExists(
    "placement_batch_registrations",
  );

  const [applicationRows, offerRows, registrationRows, branchRows] =
    await Promise.all([
      db
        .select({
          id: placementApplications.id,
          jobId: placementApplications.jobId,
          membershipId: placementApplications.membershipId,
          status: placementApplications.status,
          screeningStatus: placementApplicationScreenings.status,
        })
        .from(placementApplications)
        .innerJoin(
          placementJobs,
          eq(placementJobs.id, placementApplications.jobId),
        )
        .innerJoin(
          collegeMemberships,
          and(
            eq(
              collegeMemberships.id,
              placementApplications.membershipId,
            ),
            eq(collegeMemberships.collegeId, college.id),
          ),
        )
        .leftJoin(
          placementApplicationScreenings,
          eq(
            placementApplicationScreenings.applicationId,
            placementApplications.id,
          ),
        )
        .where(selectedJobFilters),

      db
        .select({
          id: placementOffers.id,
          jobId: placementApplications.jobId,
          membershipId: placementApplications.membershipId,
          status: placementOffers.status,
          releasedAt:placementOffers.releasedAt,
          kind: placementOffers.kind,
          annualCtcInr: placementOffers.annualCtcInr,
          joiningStatus: placementJoiningOutcomes.status,
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
          eq(placementJobs.id, placementApplications.jobId),
        )
        .innerJoin(
          collegeMemberships,
          and(
            eq(
              collegeMemberships.id,
              placementApplications.membershipId,
            ),
            eq(collegeMemberships.collegeId, college.id),
          ),
        )
        .leftJoin(
          placementJoiningOutcomes,
          eq(
            placementJoiningOutcomes.offerId,
            placementOffers.id,
          ),
        )
        .where(selectedJobFilters),

      registrationsAvailable
        ? db
          .select({
            membershipId: placementBatchRegistrations.membershipId,
          })
          .from(placementBatchRegistrations)
          .innerJoin(
            collegeMemberships,
            and(
              eq(
                collegeMemberships.id,
                placementBatchRegistrations.membershipId,
              ),
              eq(collegeMemberships.collegeId, college.id),
            ),
          )
          .where(
            and(
              eq(placementBatchRegistrations.collegeId, college.id),
              eq(placementBatchRegistrations.choice, "PLACEMENTS"),
              query.batchId
                ? eq(placementBatchRegistrations.cohortId, query.batchId)
                : undefined,
            ),
          )
        : Promise.resolve([] as { membershipId: string }[]),

      db
        .select({
          membershipId: learnerProgramEnrollments.membershipId,
          departmentId: departments.id,
          departmentName: departments.name,
          enrollmentStatus: learnerProgramEnrollments.status,
          admittedAt: learnerProgramEnrollments.admittedAt,
        })
        .from(learnerProgramEnrollments)
        .innerJoin(
          collegeMemberships,
          and(
            eq(
              collegeMemberships.id,
              learnerProgramEnrollments.membershipId,
            ),
            eq(collegeMemberships.collegeId, college.id),
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
        .orderBy(desc(learnerProgramEnrollments.admittedAt)),
    ]);

  const applications: PlacementReportApplication[] =
    applicationRows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      membershipId: row.membershipId,
      status: row.status,
      screeningStatus: row.screeningStatus,
    }));

  const offers: PlacementReportOffer[] =
    offerRows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      membershipId: row.membershipId,
      status: row.status,
      releasedAt:row.releasedAt,
      kind: row.kind,
      annualCtcInr: row.annualCtcInr,
      joiningStatus: row.joiningStatus,
    }));

  const registrations: PlacementReportRegistration[] =
    registrationRows.map((row) => ({
      membershipId: row.membershipId,
    }));

  /*
   * A learner can have historical program enrollments.
   * Prefer their active enrollment; otherwise use the newest enrollment.
   * This is an operational branch projection, not an immutable historical
   * placement-time branch snapshot.
   */
  const branchesByMembership = new Map<
    string,
    PlacementReportBranch & { enrollmentStatus: string }
  >();

  for (const row of branchRows) {
    const existing = branchesByMembership.get(row.membershipId);

    if (
      !existing ||
      (row.enrollmentStatus === "ACTIVE" &&
        existing.enrollmentStatus !== "ACTIVE")
    ) {
      branchesByMembership.set(row.membershipId, {
        membershipId: row.membershipId,
        departmentId: row.departmentId,
        departmentName: row.departmentName,
        enrollmentStatus: row.enrollmentStatus,
      });
    }
  }

  const branches: PlacementReportBranch[] = [
    ...branchesByMembership.values(),
  ].map((row) => ({
    membershipId: row.membershipId,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
  }));

  const chosenBranch = query.branch?.toLowerCase();
  const inBranch = (membershipId: string) => {
    if (!chosenBranch) return true;
    const branch = branchesByMembership.get(membershipId);
    return branch?.departmentName.toLowerCase() === chosenBranch ||
      branch?.departmentId.toLowerCase() === chosenBranch;
  };
  const report = summarizePlacementReports({
    countsAsPlacedAt,
    jobs,
    applications: applications.filter((row) => inBranch(row.membershipId)),
    offers: offers.filter((row) => inBranch(row.membershipId)),
    registrations: registrations.filter((row) => inBranch(row.membershipId)),
    branches,
  });

  return {
    collegeId: college.id,
    seasons,
    selectedSeasonId: selectedSeason.id,
    selectedJobId: query.jobId ?? null,
    selectedReportJobIds: jobs.map((job) => job.id),
    reportFilterKey: reportFilterKey(query),
    jobs: jobRows,
    report,
    noSeason: false,
    registrationScopeNote: !registrationsAvailable
      ? "Placement registration data is not available in this environment yet, so the registered pool and placement rate are shown as empty rather than estimated."
      : "Registrations are current batch-level choices, not season snapshots. " +
      "The placement-rate denominator can therefore differ from historical " +
      "legacy season reports. A drive filter narrows outcomes, not the " +
      "registered cohort denominator. Accepted offers count offers; accepted " +
      "and placed learners count distinct students. No registration data " +
      "means an unknown rate, not zero. Annual CTC uses INR; legacy CTC " +
      "in LPA maps at 1 LPA = 100,000 INR (two-decimal legacy precision). " +
      "Readiness, academic marks and recruiter engagement need separate " +
      "evidence rather than assumptions. " +
      (countsAsPlacedAt==="SELECTED"?"Placed means a selected learner.":countsAsPlacedAt==="OFFER_RELEASED"?
       "Placed means an offer has been released.":"Placed means an offer has been accepted.") ,
  };
}

/**
 * Additional TPO reporting projections.
 *
 * This entry point is additive. getPlacementReportWorkspace and its existing
 * return shape remain unchanged for all current consumers.
 *
 * The caller can pass an already-authorized base workspace to avoid running
 * its queries twice (used by the shared CSV route).
 */
export async function getPlacementReportDetails(
  context: RequestContext,
  rawQuery: unknown,
  authorizedWorkspace?: Awaited<ReturnType<typeof getPlacementReportWorkspace>>,
) {
  const query = placementReportQuerySchema.parse(rawQuery);

  const workspace =
    authorizedWorkspace ??
    (await getPlacementReportWorkspace(context, query));

  // Always re-validate the supplied workspace's tenant and filter identity
  // before using it as authorization evidence.
  if (
    workspace.collegeId !== query.collegeId ||
    (query.seasonId !== undefined &&
      workspace.selectedSeasonId !== query.seasonId) ||
    workspace.selectedJobId !== (query.jobId ?? null) ||
    workspace.reportFilterKey !== reportFilterKey(query)
  ) {
    throw new AuthorizationError("placements.manage");
  }

  // Do not bypass current user authorization when an existing workspace is
  // provided by an internal caller.
  if (
    isSuperAdmin(context) &&
    context.adminScope?.collegeId !== query.collegeId
  ) {
    throw new AuthorizationError("placements.manage");
  }
  await requirePlacementManageScope(context, query.collegeId);
  const [collegeRules] = await getDb().select({
    countsAsPlacedAt: placementCollegeRules.countsAsPlacedAt,
  }).from(placementCollegeRules)
    .where(eq(placementCollegeRules.collegeId, query.collegeId)).limit(1);
  const countsAsPlacedAt = (collegeRules?.countsAsPlacedAt ?? "OFFER_RELEASED") as
    "SELECTED" | "OFFER_RELEASED" | "OFFER_ACCEPTED";

  if (!workspace.selectedSeasonId) {
    return {
      ...workspace,
      details: summarizePlacementReportDetails({
        registeredLearners: [],
        offers: [],
        countsAsPlacedAt,
        asOf: new Date().toISOString(),
      }),
      detailScopeNote:
        "No placement season exists. No season outcomes or unplaced-student list are inferred.",
    };
  }

  const db = getDb();
  const selectedSeasonId = workspace.selectedSeasonId;
  const registrationsAvailable = await placementTableExists(
    "placement_batch_registrations",
  );

  const [poolRows, enrollmentRows, offerRows] = await Promise.all([
    registrationsAvailable
      ? db
          .select({
            membershipId: placementBatchRegistrations.membershipId,
            displayName: users.displayName,
          })
          .from(placementBatchRegistrations)
          .innerJoin(
            collegeMemberships,
            and(
              eq(
                collegeMemberships.id,
                placementBatchRegistrations.membershipId,
              ),
              eq(collegeMemberships.collegeId, query.collegeId),
            ),
          )
          .innerJoin(
            users,
            eq(users.id, collegeMemberships.userId),
          )
          .where(
            and(
              eq(placementBatchRegistrations.collegeId, query.collegeId),
              eq(placementBatchRegistrations.choice, "PLACEMENTS"),
              query.batchId
                ? eq(placementBatchRegistrations.cohortId, query.batchId)
                : undefined,
            ),
          )
      : Promise.resolve(
          [] as { membershipId: string; displayName: string | null }[],
        ),

    db
      .select({
        membershipId: learnerProgramEnrollments.membershipId,
        departmentId: departments.id,
        departmentName: departments.name,
        enrollmentStatus: learnerProgramEnrollments.status,
        admittedAt: learnerProgramEnrollments.admittedAt,
      })
      .from(learnerProgramEnrollments)
      .innerJoin(
        collegeMemberships,
        and(
          eq(
            collegeMemberships.id,
            learnerProgramEnrollments.membershipId,
          ),
          eq(collegeMemberships.collegeId, query.collegeId),
        ),
      )
      .innerJoin(
        programs,
        eq(programs.id, learnerProgramEnrollments.programId),
      )
      .innerJoin(
        departments,
        and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, query.collegeId),
        ),
      )
      .orderBy(desc(learnerProgramEnrollments.admittedAt)),

    db
      .select({
        id: placementOffers.id,
        membershipId: placementApplications.membershipId,
        jobId: placementJobs.id,
        jobTitle: placementJobs.title,
        companyId: placementCompanies.id,
        companyName: placementCompanies.name,
        employmentType: placementJobs.employmentType,
        countsAsPlaced: placementJobs.countsAsPlaced,
        status: placementOffers.status,
        kind: placementOffers.kind,
        annualCtcInr: placementOffers.annualCtcInr,
        expiresAt: placementOffers.expiresAt,
        joiningStatus: placementJoiningOutcomes.status,
      })
      .from(placementOffers)
      .innerJoin(
        placementApplications,
        eq(placementApplications.id, placementOffers.applicationId),
      )
      .innerJoin(
        placementJobs,
        eq(placementJobs.id, placementApplications.jobId),
      )
      .innerJoin(
        collegeMemberships,
        and(
          eq(
            collegeMemberships.id,
            placementApplications.membershipId,
          ),
          eq(collegeMemberships.collegeId, query.collegeId),
        ),
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
            query.collegeId,
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
        placementJoiningOutcomes,
        eq(placementJoiningOutcomes.offerId, placementOffers.id),
      )
      .where(
        and(
          eq(placementJobs.collegeId, query.collegeId),
          eq(placementJobs.seasonId, selectedSeasonId),
          isNull(placementJobs.archivedAt),
          inArray(placementJobs.id, workspace.selectedReportJobIds),
        ),
      ),
  ]);

  // Prefer an ACTIVE program enrollment, then the most recently admitted
  // enrollment. This is current academic branch attribution, not a
  // historical branch snapshot captured at offer issuance.
  const branches = new Map<
    string,
    {
      departmentId: string;
      departmentName: string;
      enrollmentStatus: string;
    }
  >();

  for (const row of enrollmentRows) {
    const previous = branches.get(row.membershipId);

    if (
      !previous ||
      (row.enrollmentStatus === "ACTIVE" &&
        previous.enrollmentStatus !== "ACTIVE")
    ) {
      branches.set(row.membershipId, {
        departmentId: row.departmentId,
        departmentName: row.departmentName,
        enrollmentStatus: row.enrollmentStatus,
      });
    }
  }

  const chosenBranch = query.branch?.toLowerCase();
  const inBranch = (membershipId: string) => {
    if (!chosenBranch) return true;
    const branch = branches.get(membershipId);
    return branch?.departmentName.toLowerCase() === chosenBranch ||
      branch?.departmentId.toLowerCase() === chosenBranch;
  };
  const registeredLearners: PlacementReportPoolLearner[] =
    poolRows.filter((row) => inBranch(row.membershipId)).map((row) => {
      const branch = branches.get(row.membershipId);
      return {
        membershipId: row.membershipId,
        displayName: row.displayName?.trim() || "Name unavailable",
        departmentId: branch?.departmentId ?? null,
        departmentName: branch?.departmentName ?? "Unassigned branch",
      };
    });

  const offers: PlacementReportDetailedOffer[] = offerRows
    .filter((row) => inBranch(row.membershipId)).map(
    (row) => ({
      id: row.id,
      membershipId: row.membershipId,
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      companyId: row.companyId,
      companyName: row.companyName,
      employmentType: row.employmentType,
      countsAsPlaced: row.countsAsPlaced,
      status: row.status,
      kind: row.kind,
      annualCtcInr: row.annualCtcInr,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      joiningStatus: row.joiningStatus,
    }),
  );

  return {
    ...workspace,
    details: summarizePlacementReportDetails({
      registeredLearners,
      offers,
      countsAsPlacedAt,
      asOf: new Date().toISOString(),
    }),
    detailScopeNote:
      "The unplaced pool uses current batch registration choices, not a " +
      "historical season snapshot. A learner is unplaced here when no " +
      "qualifying full-time offer reaches the college's placed-count stage " +
      "in the selected season and drive scope; other offers may exist. " +
      "Branches use current program enrollment. Expired outstanding offers " +
      "are calculated from the stored expiry timestamp as of report load. " +
      "Joining counts use current accepted offers and recorded joining " +
      "outcomes; missing outcomes remain pending.",
  };
}
