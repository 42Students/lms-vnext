import "server-only";

import {
  and,
  desc,
  eq,
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
  placementJoiningOutcomes,
  placementOffers,
  placementSeasons,
  programs,
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
import {
  summarizePlacementReports,
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
  })
  .strict();

export type PlacementReportQuery = z.input<
  typeof placementReportQuerySchema
>;

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

  const jobs: PlacementReportJob[] = query.jobId
    ? jobRows.filter((job) => job.id === query.jobId)
    : jobRows;

  if (jobs.length === 0) {
    return {
      collegeId: college.id,
      seasons,
      selectedSeasonId: selectedSeason.id,
      selectedJobId: query.jobId ?? null,
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

      db
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
          ),
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

  const report = summarizePlacementReports({
    jobs,
    applications,
    offers,
    registrations,
    branches,
  });

  return {
    collegeId: college.id,
    seasons,
    selectedSeasonId: selectedSeason.id,
    selectedJobId: query.jobId ?? null,
    jobs: jobRows,
    report,
    noSeason: false,
    registrationScopeNote:
      "Registrations are current batch-level choices, not season snapshots. " +
      "The placement-rate denominator can therefore differ from historical " +
      "legacy season reports. A drive filter narrows outcomes, not the " +
      "registered cohort denominator.",
  };
}
