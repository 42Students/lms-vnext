import "server-only";
import {and,asc,count,desc,eq,ilike,isNull,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {
  COLLEGE_COMPANIES_PAGE_SIZE,literalCompanySearch,type CollegeCompaniesQuery,
} from "./college-company-directory-model";

type DirectoryQuery=Pick<CollegeCompaniesQuery,"q"|"page">&
 Partial<Pick<CollegeCompaniesQuery,"pageSize"|"showDeleted"|"sort">>;

/** All filters, totals, and exports operate exclusively inside the caller's persisted college. */
export async function listCollegeCompanyDirectory(
  context:RequestContext,query:DirectoryQuery,options:{exportAll?:boolean}={},
){
  const collegeId=await requireCollegePlacementAdmin(context);
  const showDeleted=query.showDeleted==="1";
  const search=query.q?literalCompanySearch(query.q):null;
  const where=and(
    eq(placementCompanyRelationships.collegeId,collegeId),
    showDeleted?undefined:eq(placementCompanyRelationships.status,"ACTIVE"),
    showDeleted?undefined:isNull(placementCompanyRelationships.archivedAt),
    showDeleted?undefined:eq(placementCompanies.status,"ACTIVE"),
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
      isTrusted:placementCompanyRelationships.isTrusted,
      ownerMembershipId:placementCompanyRelationships.ownerMembershipId,
      drives, lastActive,
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
