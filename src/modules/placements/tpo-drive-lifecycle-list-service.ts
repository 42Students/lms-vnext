import "server-only";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementCompanies, placementCompanyRelationships, placementJobs, placementSeasons } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { tpoDriveLifecyclePage, tpoDriveLifecycleQuerySchema } from "./tpo-drive-lifecycle-list-model";
import {tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";
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
  const target=filters.view==="DRAFT"?"DRAFT":filters.view==="LIVE"?"PUBLISHED":filters.view==="CLOSED"?"CLOSED":null;
  const emptyCounts={total:0,drafts:0,live:0,closed:0,deadlinesNextSevenDays:0};
  const projection=season?await db.transaction(async tx=>{
   const scope=and(eq(placementJobs.collegeId,collegeId),eq(placementJobs.seasonId,season.id),
    isNull(placementJobs.archivedAt),filters.search?or(
     ilike(placementJobs.title,tpoApplicantExportSearchPattern(filters.search)),
     ilike(placementCompanies.name,tpoApplicantExportSearchPattern(filters.search))):undefined);
   const [counts]=await tx.select({total:sql<number>`count(*)::int`,
    drafts:sql<number>`count(*) filter(where ${placementJobs.status} = 'DRAFT')::int`,
    live:sql<number>`count(*) filter(where ${placementJobs.status} = 'PUBLISHED')::int`,
    closed:sql<number>`count(*) filter(where ${placementJobs.status} = 'CLOSED')::int`,
    deadlinesNextSevenDays:sql<number>`count(*) filter(where ${placementJobs.status} = 'PUBLISHED'
     and ${placementJobs.applicationDeadline} >= ${now.toISOString()}::timestamptz
     and ${placementJobs.applicationDeadline} <= ${now.toISOString()}::timestamptz + interval '7 days')::int`,
   }).from(placementJobs).innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,collegeId)))
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(scope);
   const totals=counts??emptyCounts;
   const totalMatching=filters.view==="DRAFT"?totals.drafts:filters.view==="LIVE"?totals.live:
    filters.view==="CLOSED"?totals.closed:totals.total;
   const pagination=tpoDriveLifecyclePage(totalMatching,filters.page);
   const rows = await tx.select({
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
    .where(and(scope,target?eq(placementJobs.status,target):undefined))
    .orderBy(placementCompanies.name, placementJobs.title, placementJobs.id)
    .limit(pagination.pageSize).offset(pagination.offset);
   return {counts:totals,...pagination,rows:rows.map((row) => ({
    ...row, applicationDeadline: row.applicationDeadline?.toISOString() ?? null,
   }))};
  },{isolationLevel:"repeatable read",accessMode:"read only"}):
   {counts:emptyCounts,...tpoDriveLifecyclePage(0,filters.page),rows:[]};
  return {
    ...projection, seasons, season, view: filters.view,search:filters.search,
    asOf: now.toISOString(),
    requestsAvailable: false as const,
  };
}
