import "server-only";

import { and, asc, desc, count, eq, gte, ilike, lte, or, sql, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementCompanies, placementCompanyRelationships, placementJobs, placementSeasons } from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { collegeDriveListQuerySchema } from "./college-drive-read-model";

export async function requireCollegePlacementAdmin(context: RequestContext) {
 // The existing College Admin pathway is unchanged; a Super Admin uses only
 // the persisted selected-college scope and never impersonates a membership.
 if(!isSuperAdmin(context)&&(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN")))
  throw new AuthorizationError("placements.manage");
 const acting=await resolveActingCollege(context,"placements.manage");
 await requirePlacementManageScope(context,acting.collegeId);
 return acting.collegeId;
}

function pattern(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

/** One college's totals follow the legacy dashboard's two distinct concepts:
 * active published drives and all retained non-deleted drives. Archived rows
 * are visible only in the explicit history filter, never counted as active. */
export async function getCollegeDriveStatusTotals(context:RequestContext){
 const collegeId=await requireCollegePlacementAdmin(context);
 const [row]=await getDb().select({
  all:sql<number>`count(*) filter (where ${placementJobs.archivedAt} is null)::integer`,
  active:sql<number>`count(*) filter (where ${placementJobs.status}='PUBLISHED' and ${placementJobs.archivedAt} is null)::integer`,
  inactive:sql<number>`count(*) filter (where ${placementJobs.status}!='PUBLISHED' and ${placementJobs.archivedAt} is null)::integer`,
  archived:sql<number>`count(*) filter (where ${placementJobs.archivedAt} is not null)::integer`,
 }).from(placementJobs).where(eq(placementJobs.collegeId,collegeId));
 return {total:row?.all??0,active:row?.active??0,
  inactive:row?.inactive??0,archived:row?.archived??0,
  labels:{active:"Active jobs",inactive:"Closed / draft",archived:"Archived"}};
}
/** Legacy repository compatibility: retrieve only the selected college's
 * nondeleted jobs, newest first, with a bounded page rather than JSON-heavy
 * all-row loads. Numeric legacy IDs must first resolve through a trusted
 * migration crosswalk and are never accepted here as a tenant override. */
export async function listCollegeDrives(context: RequestContext, raw: unknown) {
  const query = collegeDriveListQuerySchema.parse(raw);
  const collegeId = await requireCollegePlacementAdmin(context);
  const db = getDb();
  const source = db.select({
    id: placementJobs.id,
    title: placementJobs.title,
    status: placementJobs.status,
    applicationDeadline: placementJobs.applicationDeadline,
    openings: placementJobs.openings,
    type: placementJobs.employmentType,
    locations: placementJobs.locations,
    publishedAt: placementJobs.publishedAt,
    createdAt: placementJobs.createdAt,
    postedAt:sql<Date>`coalesce(${placementJobs.legacyPostedAt},
      ${placementJobs.publishedAt},${placementJobs.createdAt})`.as("posted_at"),
    // The legacy Applicants column is the historical application count,
    // including subsequently withdrawn records. Keep the operational active
    // count separate so other flows do not mistake it for total history.
    applicants: sql<number>`(select count(*)::integer from placement_applications pa
      where pa.job_id = ${placementJobs.id})`.as("applicants"),
    activeApplicants: sql<number>`(select count(*)::integer from placement_applications pa
      where pa.job_id = ${placementJobs.id} and pa.status = 'SUBMITTED')`.as("active_applicants"),

    seasonId: sql<string>`${placementSeasons.id}`.as("season_id"),
    seasonName: sql<string>`${placementSeasons.name}`.as("season_name"),
    relationshipId: sql<string>`${placementCompanyRelationships.id}`.as("relationship_id"),
    companyName: sql<string>`${placementCompanies.name}`.as("company_name"),
  }).from(placementJobs)
    .innerJoin(placementSeasons, and(
      eq(placementSeasons.id, placementJobs.seasonId),
      eq(placementSeasons.collegeId, collegeId),
    ))
    .innerJoin(placementCompanyRelationships, and(
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId),
    ))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      // Deletion is an explicit history view, never implicitly mixed with
      // operational "All" or published/draft/closed drives.
      query.status === "ARCHIVED"
        ? isNotNull(placementJobs.archivedAt)
        : isNull(placementJobs.archivedAt),
      query.status === "ALL" || query.status === "ARCHIVED"
        ? undefined : eq(placementJobs.status, query.status),
      query.seasonId ? eq(placementJobs.seasonId, query.seasonId) : undefined,
      query.relationshipId ? eq(placementJobs.companyRelationshipId, query.relationshipId) : undefined,
      query.deadlineBefore
        ? lte(placementJobs.applicationDeadline,new Date(query.deadlineBefore+"T23:59:59+05:30"))
        : undefined,
      query.deadlineAfter
        ? gte(placementJobs.applicationDeadline,new Date(query.deadlineAfter+"T00:00:00+05:30"))
        : undefined,
      query.q ? or(
        ilike(placementJobs.title, pattern(query.q)),
        ilike(placementCompanies.name, pattern(query.q)),
        sql<boolean>`${placementJobs.locations}::text ILIKE ${pattern(query.q)}`,
      ) : undefined,
    )).as("college_scoped_drives");
  const applicantsFilter = query.minimumApplicants !== undefined
    ? gte(source.applicants,query.minimumApplicants) : undefined;
  const [totals, items, seasons, companies] = await Promise.all([
    db.select({ total: count() }).from(source).where(applicantsFilter),
    db.select().from(source).where(applicantsFilter).orderBy(query.sort==="DEADLINE"?asc(source.applicationDeadline):
        query.sort==="NEWEST"?desc(source.postedAt):
        query.sort==="APPLICANTS"?desc(source.applicants):asc(source.title),desc(source.createdAt),asc(source.id))
      .limit(Math.min(100,query.pageSize)).offset((query.page - 1) * query.pageSize),
    db.select({ id: placementSeasons.id, name: placementSeasons.name }).from(placementSeasons)
      .where(eq(placementSeasons.collegeId, collegeId)).orderBy(asc(placementSeasons.name)),
    db.select({ id: placementCompanyRelationships.id, name: placementCompanies.name })
      .from(placementCompanyRelationships)
      .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
      .where(eq(placementCompanyRelationships.collegeId, collegeId))
      .orderBy(asc(placementCompanies.name)),
  ]);
  const total = totals[0]?.total ?? 0;
  return { query, items, seasons, companies, total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    // Admin "All" excludes archived records. The archived filter preserves
    // historical item access but never licenses modification.
    label:query.status==="ARCHIVED"?"Archived jobs":
      query.status==="PUBLISHED"?"Active jobs":"All drives" };
}
