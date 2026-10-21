import "server-only";
import {and,asc,count,desc,eq,ilike,isNull,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {
  COLLEGE_COMPANIES_PAGE_SIZE,literalCompanySearch,type CollegeCompaniesQuery,
} from "./college-company-directory-model";

export type DirectoryQuery=Pick<CollegeCompaniesQuery,"q"|"page">&
 Partial<Pick<CollegeCompaniesQuery,"pageSize"|"showDeleted"|"sort"|"status">>;

/** All filters, totals, and exports operate exclusively inside the caller's persisted college. */
export async function listCollegeCompanyDirectory(
  context:RequestContext,query:DirectoryQuery,options:{exportAll?:boolean}={},
){
  const collegeId=await requireCollegePlacementAdmin(context);
  const showDeleted=query.showDeleted==="1";
  const status=query.status??"ACTIVE";
  const search=query.q?literalCompanySearch(query.q):null;
  const where=and(
    eq(placementCompanyRelationships.collegeId,collegeId),
    // A deleted college relationship and a deleted canonical company are
    // separate lifecycle states. Either one makes the college row archived.
    status==="ARCHIVED"
      ? or(eq(placementCompanyRelationships.status,"ARCHIVED"),eq(placementCompanies.status,"ARCHIVED"))
      : showDeleted ? undefined : and(
          eq(placementCompanyRelationships.status,"ACTIVE"),
          isNull(placementCompanyRelationships.archivedAt),
          eq(placementCompanies.status,"ACTIVE"),
          isNull(placementCompanies.archivedAt),
        ),
    search?or(ilike(placementCompanies.name,search),
      ilike(placementCompanies.industry,search)):undefined,
  );
  // Correlated aggregates stay tenant-scoped: neither another college's jobs
  // nor private relationship notes can affect these directory counts.
  const drives=sql<number>`(select count(*)::int from placement_jobs job
    where job.company_relationship_id = ${placementCompanyRelationships.id}
      and job.college_id = ${collegeId})`;
  const lastActive=sql<Date>`coalesce((select max(job.updated_at)
    from placement_jobs job where job.company_relationship_id = ${placementCompanyRelationships.id}
      and job.college_id = ${collegeId}),${placementCompanyRelationships.updatedAt})`;
  // These counts are historical, not merely current active applications.
  // Every nested query is restricted to the same persisted college and link.
  const applicants=sql<number>`(select count(*)::int from placement_applications app
    inner join placement_jobs job on job.id = app.job_id
    where job.company_relationship_id = ${placementCompanyRelationships.id}
      and job.college_id = ${collegeId})`;
  const hired=sql<number>`(select count(distinct app.membership_id)::int
    from placement_applications app
    inner join placement_jobs job on job.id = app.job_id
    inner join placement_offers offer on offer.application_id = app.id and offer.status = 'ACCEPTED'
    inner join placement_joining_outcomes outcome on outcome.offer_id = offer.id and outcome.status = 'JOINED'
    where job.company_relationship_id = ${placementCompanyRelationships.id}
      and job.college_id = ${collegeId})`;
  const sort=query.sort??"LAST_ACTIVE";
  const pageSize=query.pageSize??COLLEGE_COMPANIES_PAGE_SIZE;
  const limit=options.exportAll?2001:pageSize;
  const db=getDb();
  const [totals,items]=await Promise.all([
    db.select({total:count()}).from(placementCompanyRelationships)
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .where(where),
    db.select({
      relationshipId:placementCompanyRelationships.id,
      companyId:placementCompanies.id,
      name:placementCompanies.name,
      websiteUrl:placementCompanies.websiteUrl,
      primaryDomain:placementCompanies.primaryDomain,
      verifiedAt:placementCompanies.verifiedAt,
      companyStatus:placementCompanies.status,
      relationshipStatus:placementCompanyRelationships.status,
      industry:placementCompanies.industry,
      // College-private CRM contacts only: this service enforces placement
      // administration scope before projecting any personal information.
      contactName:placementCompanyRelationships.contactPersonName,
      contactEmail:placementCompanyRelationships.contactEmail,
      isTrusted:placementCompanyRelationships.isTrusted,
      ownerMembershipId:placementCompanyRelationships.ownerMembershipId,
      drives, applicants, hired, lastActive,
    }).from(placementCompanyRelationships)
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .where(where)
      .orderBy(sort==="COMPANY"?asc(placementCompanies.name):
        sort==="DRIVES"?desc(drives):desc(lastActive),asc(placementCompanies.name),
        asc(placementCompanyRelationships.id))
      .limit(limit)
      .offset(options.exportAll?0:(query.page-1)*pageSize),
  ]);
  const total=totals[0]?.total??0;
  return {items:options.exportAll?items.slice(0,2000):items,total,
    truncated:Boolean(options.exportAll&&items.length>2000),
    totalPages:Math.max(1,Math.ceil(total/pageSize))};
}
