import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementCompanies, placementCompanyRelationships, placementJobs, placementSeasons } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { projectTpoDriveLifecycle, tpoDriveLifecycleQuerySchema } from "./tpo-drive-lifecycle-list-model";
import { PlacementsServiceError } from "./errors";

/** Tenant comes only from the authenticated TPO membership. Requests need their own persisted workflow. */
export async function getTpoDriveLifecycleList(context: RequestContext, raw: unknown, now = new Date()) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = member.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const filters = tpoDriveLifecycleQuerySchema.parse(raw);
  await requirePlacementManageScope(context, collegeId);
  const db = getDb();
  const seasons = await db.select({ id: placementSeasons.id, name: placementSeasons.name,
    status: placementSeasons.status, startDate: placementSeasons.startDate })
    .from(placementSeasons).where(eq(placementSeasons.collegeId, collegeId))
    .orderBy(desc(placementSeasons.startDate), desc(placementSeasons.createdAt));
  const season = filters.seasonId
    ? seasons.find((s) => s.id === filters.seasonId)
    : seasons.find((s) => s.status === "ACTIVE") ?? seasons[0] ?? null;
  if (filters.seasonId && !season) throw new PlacementsServiceError("PLACEMENT_SEASON_NOT_FOUND");
  const rows = season ? await db.select({
    id: placementJobs.id, title: placementJobs.title,
    company: placementCompanies.name, status: placementJobs.status,
    workMode: placementJobs.workMode, employmentType: placementJobs.employmentType,
    applicationDeadline: placementJobs.applicationDeadline,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId)))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(eq(placementJobs.collegeId, collegeId), eq(placementJobs.seasonId, season.id),
      isNull(placementJobs.archivedAt)))
    .orderBy(placementCompanies.name, placementJobs.title, placementJobs.id)
    .limit(501) : [];
  const projection = projectTpoDriveLifecycle(rows.slice(0,500).map((row) => ({
    ...row, applicationDeadline: row.applicationDeadline?.toISOString() ?? null,
  })), filters.view, now.toISOString());
  return {
    ...projection, seasons, season, view: filters.view,
    truncated: rows.length > 500,
    asOf: now.toISOString(),
    requestsAvailable: false as const,
  };
}
