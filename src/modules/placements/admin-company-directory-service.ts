import "server-only";
import { and, asc, count, desc, eq, gte, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, placementCompanies, placementCompanyRelationships } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { adminCompaniesQuerySchema, projectAdminCompanies } from "./admin-company-directory-model";

/** Super Admin only, scoped by the selected organization/college. No CRM/private notes. */
export async function listSuperAdminCompanyDirectory(context: RequestContext, raw: unknown) {
  const query = adminCompaniesQuerySchema.parse(raw);
  if (!isSuperAdmin(context)) throw new AuthorizationError("placements.read");
  const selected = context.adminScope;
  requirePermission(context, "placements.read", {
    organizationId: selected?.organizationId,
    collegeId: selected?.collegeId,
  });
  const filters: SQL[] = [];
  if(query.collegeId) filters.push(eq(colleges.id,query.collegeId));
  if(query.companyId) filters.push(eq(placementCompanies.id,query.companyId));
  if(query.owner==="ASSIGNED") filters.push(isNotNull(placementCompanyRelationships.ownerMembershipId));
  if(query.owner==="UNASSIGNED") filters.push(isNull(placementCompanyRelationships.ownerMembershipId));
  if(query.website==="HAS_WEBSITE") filters.push(sql`nullif(btrim(${placementCompanies.websiteUrl}), '') is not null`);
  if(query.website==="MISSING_WEBSITE") filters.push(sql`nullif(btrim(${placementCompanies.websiteUrl}), '') is null`);
  if(query.changedWithin!=="ALL") {
    const cutoff=new Date(Date.now()-Number(query.changedWithin)*24*60*60*1000);
    filters.push(gte(placementCompanyRelationships.updatedAt,cutoff));
  }
  if (selected?.collegeId) {
    if (query.collegeId && query.collegeId !== selected.collegeId) throw new AuthorizationError("placements.read");
    filters.push(eq(colleges.id, selected.collegeId));
  }
  else if (selected?.organizationId) filters.push(eq(colleges.organizationId, selected.organizationId));
  if (query.trust !== "ALL") filters.push(eq(placementCompanyRelationships.isTrusted, query.trust === "TRUSTED"));
  if (query.verified === "VERIFIED") filters.push(isNotNull(placementCompanies.verifiedAt));
  if (query.verified === "NOT_VERIFIED") filters.push(isNull(placementCompanies.verifiedAt));
  if (query.status !== "ALL") {
    filters.push(eq(placementCompanyRelationships.status, query.status));
  }
  const effectiveCompanyStatus = query.companyStatus === "MATCH" ? query.status : query.companyStatus;
  if (effectiveCompanyStatus !== "ALL") {
    filters.push(eq(placementCompanies.status, effectiveCompanyStatus));
  }
  if (query.q) {
    // SQL wildcard characters in user searches are literal, not scope selectors.
    const escaped = query.q.replace(/[\\%_]/g, "\\$&");
    const needle="%"+escaped+"%";
    filters.push(query.searchField==="DOMAIN"?ilike(placementCompanies.primaryDomain,needle):
      query.searchField==="NAME"?ilike(placementCompanies.name,needle):
      or(ilike(placementCompanies.name,needle),ilike(placementCompanies.primaryDomain,needle))!);
  }
  const db = getDb();
  const [totalRows, results] = await Promise.all([
    db.select({total:count()}).from(placementCompanyRelationships)
      .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
      .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
      .where(filters.length ? and(...filters) : undefined),
    db.select({
    relationshipId: placementCompanyRelationships.id,
    companyId: placementCompanies.id,
    name: placementCompanies.name,
    collegeId: colleges.id,
    collegeName: colleges.name,
    organizationId: colleges.organizationId,
    relationshipStatus: placementCompanyRelationships.status,
    companyStatus: placementCompanies.status,
    trusted: placementCompanyRelationships.isTrusted,
    verifiedAt: placementCompanies.verifiedAt,
    website: placementCompanies.websiteUrl,
    industry: placementCompanies.industry,
    about: placementCompanies.about,
    logoPublicUrl: placementCompanies.logoPublicUrl,
    updatedAt: placementCompanies.updatedAt,
    primaryDomain:placementCompanies.primaryDomain,
    companyCollegeCount:sql<number>`(select count(*)::integer from placement_company_relationships cr where cr.company_id = ${placementCompanies.id})`.mapWith(Number),
    driveCount:sql<number>`(select count(*)::integer from placement_jobs j where j.company_relationship_id = ${placementCompanyRelationships.id} and j.status != 'ARCHIVED')`.mapWith(Number),
    lastActiveAt:sql<Date|null>`(select max(j.updated_at) from placement_jobs j where j.company_relationship_id = ${placementCompanyRelationships.id})`,
    createdAt:placementCompanies.createdAt,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .innerJoin(colleges, eq(colleges.id, placementCompanyRelationships.collegeId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(...(query.sort === "RECENT"
      ? [desc(placementCompanyRelationships.updatedAt),asc(placementCompanyRelationships.id)]
      : [asc(placementCompanies.name),asc(colleges.name),asc(placementCompanyRelationships.id)]))
    .limit(50).offset((query.page-1)*50),
  ]);
  const total=totalRows[0]?.total ?? 0;
  return {
    query, scope: { collegeId: selected?.collegeId ?? null, organizationId: selected?.organizationId ?? null },
    ...projectAdminCompanies(results), truncated: query.page * 50 < total, cap: 50,
    total, totalPages: Math.max(1,Math.ceil(total/50)),
  };
}
