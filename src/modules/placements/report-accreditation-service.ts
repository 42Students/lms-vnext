import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementOffers,
  placementSeasons,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import {
  buildAccreditationExport,
  type AccreditationFacts,
} from "./report-accreditation-model";
const accreditationQuerySchema = z.object({
  collegeId: z.string().uuid(),
  seasonId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
}).strict();
import { requirePlacementManageScope } from "./scope";

/**
 * Accreditation working export: queries ONLY registered Drizzle tables.
 * Does not access staged placement_batch_registrations or external offers.
 * Both the college and each joined learner membership are tenant-bound.
 */
export async function getPlacementAccreditationReport(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = accreditationQuerySchema.parse(rawQuery);
  if (
    isSuperAdmin(context) &&
    context.adminScope?.collegeId !== query.collegeId
  ) {
    throw new AuthorizationError("placements.manage");
  }
  await requirePlacementManageScope(context, query.collegeId);

  const db = getDb();
  const seasons = await db
    .select({
      id: placementSeasons.id,
      name: placementSeasons.name,
      code: placementSeasons.code,
      startDate: placementSeasons.startDate,
      endDate: placementSeasons.endDate,
      status: placementSeasons.status,
    })
    .from(placementSeasons)
    .where(eq(placementSeasons.collegeId, query.collegeId))
    .orderBy(desc(placementSeasons.startDate), desc(placementSeasons.createdAt));

  const season = query.seasonId
    ? seasons.find((item) => item.id === query.seasonId)
    : seasons.find((item) => item.status === "ACTIVE") ?? seasons[0];

  if (query.seasonId && !season) {
    throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
  }

  const empty: AccreditationFacts = {
    jobs: [],
    applications: [],
    offers: [],
    branches: [],
  };
  if (!season) {
    return {
      ...buildAccreditationExport(null, empty),
      selectedSeasonId: null,
      selectedJobId: null,
    };
  }

  const jobFilters = and(
    eq(placementJobs.collegeId, query.collegeId),
    eq(placementJobs.seasonId, season.id),
    isNull(placementJobs.archivedAt),
  );
  const jobs = await db
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
        eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
        eq(placementCompanyRelationships.collegeId, query.collegeId),
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(jobFilters);

  if (query.jobId && !jobs.some((item) => item.id === query.jobId)) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }
  const selectedJobs = query.jobId
    ? jobs.filter((item) => item.id === query.jobId)
    : jobs;

  if (selectedJobs.length === 0) {
    return {
      ...buildAccreditationExport(season, { ...empty, jobs: selectedJobs }),
      selectedSeasonId: season.id,
      selectedJobId: query.jobId ?? null,
    };
  }

  const selectedJobFilters = and(
    jobFilters,
    query.jobId ? eq(placementJobs.id, query.jobId) : undefined,
  );

  const [applicationRows, offerRows] = await Promise.all([
    db
      .select({
        id: placementApplications.id,
        jobId: placementApplications.jobId,
        membershipId: placementApplications.membershipId,
        status: placementApplications.status,
      })
      .from(placementApplications)
      .innerJoin(
        placementJobs,
        eq(placementJobs.id, placementApplications.jobId),
      )
      .innerJoin(
        collegeMemberships,
        and(
          eq(collegeMemberships.id, placementApplications.membershipId),
          eq(collegeMemberships.collegeId, query.collegeId),
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
          eq(collegeMemberships.id, placementApplications.membershipId),
          eq(collegeMemberships.collegeId, query.collegeId),
        ),
      )
      .where(selectedJobFilters),
  ]);

  const branchRows = await db
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
        eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
        eq(collegeMemberships.collegeId, query.collegeId),
      ),
    )
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(
      departments,
      and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, query.collegeId),
      ),
    )
    .orderBy(desc(learnerProgramEnrollments.admittedAt));

  const branchByMembership = new Map<
    string,
    (typeof branchRows)[number]
  >();
  for (const row of branchRows) {
    const prior = branchByMembership.get(row.membershipId);
    if (
      !prior ||
      (row.enrollmentStatus === "ACTIVE" &&
        prior.enrollmentStatus !== "ACTIVE")
    ) {
      branchByMembership.set(row.membershipId, row);
    }
  }

  const facts: AccreditationFacts = {
    jobs: selectedJobs,
    applications: applicationRows.map((row) => ({
      ...row,
      screeningStatus: null,
    })),
    offers: offerRows.map((row) => ({
      ...row,
      joiningStatus: null,
    })),
    branches: [...branchByMembership.values()].map((row) => ({
      membershipId: row.membershipId,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
    })),
  };

  return {
    ...buildAccreditationExport(season, facts),
    selectedSeasonId: season.id,
    selectedJobId: query.jobId ?? null,
  };
}
