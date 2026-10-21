import "server-only";
import { and, asc, count, desc, eq, exists, gte, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, placementCompanies, placementCompanyRelationships, placementCompanyDomains, placementCompanyAliases } from "@/db/schema";
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
  const dbPlaceholderDomain=(pattern:string)=>getDb().select({id:placementCompanyDomains.id})
    .from(placementCompanyDomains).where(and(eq(placementCompanyDomains.companyId,placementCompanies.id),
      ilike(placementCompanyDomains.domain,pattern)));
  const dbPlaceholderAlias=(pattern:string)=>getDb().select({id:placementCompanyAliases.id})
    .from(placementCompanyAliases).where(and(eq(placementCompanyAliases.companyId,placementCompanies.id),
      ilike(placementCompanyAliases.alias,pattern)));
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
    const domainSearch=or(ilike(placementCompanies.primaryDomain,needle),
      exists(dbPlaceholderDomain(needle)))!;
    const nameSearch=or(ilike(placementCompanies.name,needle),
      exists(dbPlaceholderAlias(needle)))!;
    filters.push(query.searchField==="DOMAIN"?domainSearch:
      query.searchField==="NAME"?nameSearch:or(nameSearch,domainSearch,
       ilike(placementCompanies.industry,needle))!);
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
    // Contact data is private to the selected college's relationship.
    // A global or organization-level result never projects these fields.
    contactPersonName:selected?.collegeId?placementCompanyRelationships.contactPersonName:
      sql<string|null>`null::text`,
    contactEmail:selected?.collegeId?placementCompanyRelationships.contactEmail:
      sql<string|null>`null::text`,
    verifiedAt: placementCompanies.verifiedAt,
    website: placementCompanies.websiteUrl,
    industry: placementCompanies.industry,
    addedByType:sql<string>`(case when exists(
      select 1 from system_roles sr
      where sr.user_id=${placementCompanies.createdByUserId} and sr.role='SUPER_ADMIN')
      then '42 platform' else 'College user' end)`,
    about: placementCompanies.about,
    logoPublicUrl: placementCompanies.logoPublicUrl,
    updatedAt: placementCompanies.updatedAt,
    primaryDomain:placementCompanies.primaryDomain,
    domains:sql<string[]>`(select coalesce(array_agg(d.domain order by d.domain),array[]::text[])
      from placement_company_domains d where d.company_id=${placementCompanies.id})`,
    aliases:sql<string[]>`(select coalesce(array_agg(a.alias order by a.alias),array[]::text[])
      from placement_company_aliases a where a.company_id=${placementCompanies.id})`,
    // SA-company scope: a selected college or organization must not disclose
    // the count of company relationships in other tenants.
    companyCollegeCount:sql<number>`(select count(*)::integer
      from placement_company_relationships cr
      inner join colleges linked_college on linked_college.id = cr.college_id
      where cr.company_id = ${placementCompanies.id}
      ${selected?.collegeId ? sql`and cr.college_id = ${selected.collegeId}`
        : selected?.organizationId ? sql`and linked_college.organization_id = ${selected.organizationId}`
        : sql``})`.mapWith(Number),
    driveCount:sql<number>`(select count(*)::integer from placement_jobs j where j.company_relationship_id = ${placementCompanyRelationships.id} and j.college_id = ${colleges.id} and j.status != 'ARCHIVED')`.mapWith(Number),
    lastActiveAt:sql<Date|null>`(select max(j.updated_at) from placement_jobs j where j.company_relationship_id = ${placementCompanyRelationships.id} and j.college_id = ${colleges.id})`,
    createdAt:placementCompanies.createdAt,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .innerJoin(colleges, eq(colleges.id, placementCompanyRelationships.collegeId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(...(query.sort === "RECENT"
      ? [desc(placementCompanyRelationships.updatedAt),asc(placementCompanyRelationships.id)]
      : query.sort==="DRIVES"||query.sort==="DRIVES_ASC"
        ? [query.sort==="DRIVES"
           ? desc(sql`(select count(*) from placement_jobs j
             where j.company_relationship_id=${placementCompanyRelationships.id}
              and j.college_id=${colleges.id} and j.status!='ARCHIVED')`)
           : asc(sql`(select count(*) from placement_jobs j
             where j.company_relationship_id=${placementCompanyRelationships.id}
              and j.college_id=${colleges.id} and j.status!='ARCHIVED')`),
           asc(placementCompanies.name),asc(placementCompanyRelationships.id)]
        : query.sort==="LAST_ACTIVE"||query.sort==="LAST_ACTIVE_ASC"
          ? [query.sort==="LAST_ACTIVE"
            ? sql`(select max(j.updated_at) from placement_jobs j
                where j.company_relationship_id=${placementCompanyRelationships.id}
                 and j.college_id=${colleges.id}) desc nulls last`
            : sql`(select max(j.updated_at) from placement_jobs j
                where j.company_relationship_id=${placementCompanyRelationships.id}
                 and j.college_id=${colleges.id}) asc nulls last`,
             asc(placementCompanies.name),asc(placementCompanyRelationships.id)]
          : [query.sort==="NAME_DESC"?desc(placementCompanies.name):asc(placementCompanies.name),
             asc(colleges.name),asc(placementCompanyRelationships.id)]))
    .limit(10).offset((query.page-1)*10),
  ]);
  const total=totalRows[0]?.total ?? 0;
  return {
    query, scope: { collegeId: selected?.collegeId ?? null, organizationId: selected?.organizationId ?? null },
    ...projectAdminCompanies(results), truncated: query.page * 10 < total, cap: 10,
    total, totalPages: Math.max(1,Math.ceil(total/10)),
  };
}

/** Platform-wide canonical employer identities. A company without any college
 * link still belongs in this catalogue; counting relationship rows as
 * companies would drop identities and duplicate employers across pages.
 *
 * Clearing the acting organization/college is an explicit prerequisite:
 * this query must never silently expand a selected college's permissions.
 */
export async function listSuperAdminGlobalCompanyCatalogue(
 context:RequestContext,raw:unknown,
){
 const query=adminCompaniesQuerySchema.parse(raw);
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||
    context.adminScope?.organizationId||query.collegeId||
    query.trust!=="ALL"||query.owner!=="ALL")
  throw new AuthorizationError("placements.read");
 requirePermission(context,"placements.read",{});
 const conditions:SQL[]=[];
 if(query.companyId)conditions.push(eq(placementCompanies.id,query.companyId));
 const effectiveStatus=query.companyStatus==="MATCH"?query.status:query.companyStatus;
 if(effectiveStatus!=="ALL")
  conditions.push(eq(placementCompanies.status,effectiveStatus));
 if(query.verified==="VERIFIED")conditions.push(isNotNull(placementCompanies.verifiedAt));
 if(query.verified==="NOT_VERIFIED")conditions.push(isNull(placementCompanies.verifiedAt));
 if(query.website==="HAS_WEBSITE")
  conditions.push(sql`nullif(btrim(${placementCompanies.websiteUrl}), '') is not null`);
 if(query.website==="MISSING_WEBSITE")
  conditions.push(sql`nullif(btrim(${placementCompanies.websiteUrl}), '') is null`);
 if(query.changedWithin!=="ALL"){
  const cutoff=new Date(Date.now()-Number(query.changedWithin)*24*60*60*1000);
  conditions.push(gte(placementCompanies.updatedAt,cutoff));
 }
 if(query.q){
  const escaped=query.q.replace(/[\\%_]/g,"\\$&");
  const needle="%"+escaped+"%";
  const nameSearch=or(ilike(placementCompanies.name,needle),
   exists(getDb().select({id:placementCompanyAliases.id}).from(placementCompanyAliases)
    .where(and(eq(placementCompanyAliases.companyId,placementCompanies.id),
      ilike(placementCompanyAliases.alias,needle)))));
  const domainSearch=or(ilike(placementCompanies.primaryDomain,needle),
   exists(getDb().select({id:placementCompanyDomains.id}).from(placementCompanyDomains)
    .where(and(eq(placementCompanyDomains.companyId,placementCompanies.id),
      ilike(placementCompanyDomains.domain,needle)))));
  conditions.push(query.searchField==="NAME"?nameSearch!:
    query.searchField==="DOMAIN"?domainSearch!:or(nameSearch,domainSearch)!);
 }
 const filter=conditions.length?and(...conditions):undefined;
 const db=getDb();
 const [totals,companies]=await Promise.all([
  db.select({total:count()}).from(placementCompanies).where(filter),
  db.select({
   companyId:placementCompanies.id,name:placementCompanies.name,
   companyStatus:placementCompanies.status,
   website:placementCompanies.websiteUrl,primaryDomain:placementCompanies.primaryDomain,
   industry:placementCompanies.industry,about:placementCompanies.about,
   logoPublicUrl:placementCompanies.logoPublicUrl,verifiedAt:placementCompanies.verifiedAt,
   createdAt:placementCompanies.createdAt,updatedAt:placementCompanies.updatedAt,
   domains:sql<string[]>`(select coalesce(array_agg(d.domain order by d.domain),array[]::text[])
    from placement_company_domains d where d.company_id=${placementCompanies.id})`,
   aliases:sql<string[]>`(select coalesce(array_agg(a.alias order by a.alias),array[]::text[])
    from placement_company_aliases a where a.company_id=${placementCompanies.id})`,
   companyCollegeCount:sql<number>`(select count(distinct r.college_id)::int
    from placement_company_relationships r where r.company_id=${placementCompanies.id})`.mapWith(Number),
   driveCount:sql<number>`(select count(*)::int from placement_jobs j
    inner join placement_company_relationships r on r.id=j.company_relationship_id
    where r.company_id=${placementCompanies.id} and j.status!='ARCHIVED')`.mapWith(Number),
   lastActiveAt:sql<Date|null>`(select max(j.updated_at) from placement_jobs j
    inner join placement_company_relationships r on r.id=j.company_relationship_id
    where r.company_id=${placementCompanies.id})`,
  }).from(placementCompanies).where(filter)
   .orderBy(...(query.sort==="RECENT"
    ?[desc(placementCompanies.updatedAt),asc(placementCompanies.id)]
    :query.sort==="DRIVES"?
      [desc(sql`(select count(*) from placement_jobs j
       inner join placement_company_relationships r on r.id=j.company_relationship_id
       where r.company_id=${placementCompanies.id} and j.status!='ARCHIVED')`),
       asc(placementCompanies.id)]
    :query.sort==="LAST_ACTIVE"?
      [sql`case when ${placementCompanies.verifiedAt} is null then 0 else 1 end`,
       desc(placementCompanies.createdAt),asc(placementCompanies.id)]
    :[asc(placementCompanies.name),asc(placementCompanies.id)]))
   .limit(50).offset((query.page-1)*50),
 ]);
 const total=Number(totals[0]?.total??0);
 return {query,scope:{collegeId:null,organizationId:null},rows:companies,
  total,cap:50,totalPages:Math.max(1,Math.ceil(total/50)),
  truncated:query.page*50<total};
}
