import "server-only";
import { and, asc, count, desc, eq, ilike, type SQL } from "drizzle-orm";
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
  if (selected?.collegeId) {
    if (query.collegeId && query.collegeId !== selected.collegeId) throw new AuthorizationError("placements.read");
    filters.push(eq(colleges.id, selected.collegeId));
  }
  else if (selected?.organizationId) filters.push(eq(colleges.organizationId, selected.organizationId));
  if (query.trust !== "ALL") filters.push(eq(placementCompanyRelationships.isTrusted, query.trust === "TRUSTED"));
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
    filters.push(ilike(query.searchField === "DOMAIN" ? placementCompanies.primaryDomain : placementCompanies.name, "%" + escaped + "%"));
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
    website: placementCompanies.websiteUrl,
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
