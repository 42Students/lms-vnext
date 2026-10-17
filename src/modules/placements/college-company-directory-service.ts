import "server-only";
import {and,asc,count,eq,ilike,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {
  COLLEGE_COMPANIES_PAGE_SIZE,literalCompanySearch,type CollegeCompaniesQuery,
} from "./college-company-directory-model";

/** SQL filters and counts execute under a persisted College Admin tenant. */
export async function listCollegeCompanyDirectory(
  context:RequestContext,query:CollegeCompaniesQuery,
){
  const collegeId=await requireCollegePlacementAdmin(context);
  const where=and(
    eq(placementCompanyRelationships.collegeId,collegeId),
    eq(placementCompanyRelationships.status,query.status),
    query.status==="ACTIVE"?isNull(placementCompanyRelationships.archivedAt):undefined,
    eq(placementCompanies.status,"ACTIVE"),
    query.q?ilike(placementCompanies.name,literalCompanySearch(query.q)):undefined,
  );
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
    }).from(placementCompanyRelationships)
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .where(where)
      .orderBy(asc(placementCompanies.name),asc(placementCompanyRelationships.id))
      .limit(COLLEGE_COMPANIES_PAGE_SIZE)
      .offset((query.page-1)*COLLEGE_COMPANIES_PAGE_SIZE),
  ]);
  const total=totals[0]?.total??0;
  return {items,total,totalPages:Math.max(1,Math.ceil(total/COLLEGE_COMPANIES_PAGE_SIZE))};
}
