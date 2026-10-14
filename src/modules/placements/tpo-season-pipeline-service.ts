import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications, placementApplicationScreenings,
  placementCompanies, placementCompanyRelationships, placementJobs,
  placementJoiningOutcomes, placementOffers, placementSeasons,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { projectTpoSeasonPipeline, tpoSeasonPipelineQuerySchema } from "./tpo-season-pipeline-model";

export async function getTpoSeasonPipeline(context: RequestContext, raw: unknown) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO") ||
    membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const filters = tpoSeasonPipelineQuerySchema.parse(raw);
  await requirePlacementManageScope(context, collegeId);
  const db = getDb();
  const seasons = await db.select({
    id: placementSeasons.id, name: placementSeasons.name, code: placementSeasons.code,
    status: placementSeasons.status, startDate: placementSeasons.startDate,
  }).from(placementSeasons).where(eq(placementSeasons.collegeId, collegeId))
    .orderBy(desc(placementSeasons.startDate), desc(placementSeasons.createdAt));
  const season = filters.seasonId
    ? seasons.find((row) => row.id === filters.seasonId)
    : seasons.find((row) => row.status === "ACTIVE") ?? seasons[0];
  if (filters.seasonId && !season) {
    throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
  }
  if (!season) {
    return {
      seasons, season: null, selectedJobId: null,
      jobs: [] as { id: string; title: string; companyName: string }[],
      ...projectTpoSeasonPipeline([], [], []),
    };
  }
  const jobs = await db.select({
    id: placementJobs.id, title: placementJobs.title,
    companyName: placementCompanies.name,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId),
    ))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.seasonId, season.id), isNull(placementJobs.archivedAt)))
    .orderBy(placementCompanies.name, placementJobs.title, placementJobs.id);
  if (filters.jobId && !jobs.some((row) => row.id === filters.jobId)) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }
  const chosen = filters.jobId ? jobs.filter((row) => row.id === filters.jobId) : jobs;
  if (chosen.length === 0) {
    return { seasons, season, selectedJobId: filters.jobId ?? null, jobs,
      ...projectTpoSeasonPipeline([], [], []) };
  }
  const selection = and(
    eq(placementJobs.collegeId, collegeId),
    eq(placementJobs.seasonId, season.id),
    isNull(placementJobs.archivedAt),
    filters.jobId ? eq(placementJobs.id, filters.jobId) : undefined,
    eq(collegeMemberships.collegeId, collegeId),
  );
  const [applications, offers] = await Promise.all([
    db.select({
      id: placementApplications.id, jobId: placementApplications.jobId,
      status: placementApplications.status, screeningStatus: placementApplicationScreenings.status,
    }).from(placementApplications)
      .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .leftJoin(placementApplicationScreenings,
        eq(placementApplicationScreenings.applicationId, placementApplications.id))
      .where(selection),
    db.select({
      id: placementOffers.id, applicationId: placementOffers.applicationId,
      jobId: placementApplications.jobId, status: placementOffers.status,
      joiningStatus: placementJoiningOutcomes.status,
    }).from(placementOffers)
      .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
      .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
      .where(selection),
  ]);
  return {
    seasons, season, selectedJobId: filters.jobId ?? null, jobs,
    ...projectTpoSeasonPipeline(chosen, applications, offers),
  };
}
