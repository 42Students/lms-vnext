import "server-only";
import { and, asc, count, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { colleges, organizations } from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { listOrganizations } from "@/modules/organizations/service";
import { TENANT_DIRECTORY_CSV_CAP, buildTenantDirectoryCsv, tenantDirectoryExportQuerySchema } from "./admin-tenant-export-model";
import { CollegeServiceError } from "./service";
import { TENANT_LIFECYCLE_PAGE_SIZE, tenantLifecyclePaging, tenantLifecycleQuerySchema } from "./admin-tenant-lifecycle-model";
function scopedTenantSource(context: RequestContext, query?: z.output<typeof tenantLifecycleQuerySchema>) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("college.read");
  const scope = context.adminScope;
  requirePermission(context, "college.read", { collegeId: scope?.collegeId,
    organizationId: query?.organizationId || scope?.organizationId });
  const where: SQL[] = [];
  if (scope?.collegeId) where.push(eq(colleges.id, scope.collegeId));
  if (scope?.organizationId) where.push(eq(colleges.organizationId, scope.organizationId));
  if (query?.organizationId) where.push(eq(colleges.organizationId, query.organizationId));
  if (query && query.status !== "ALL") where.push(eq(colleges.status, query.status));
  if (query?.q) {
    const pattern = "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%";
    where.push(or(ilike(colleges.name, pattern), ilike(colleges.code, pattern), ilike(organizations.name, pattern))!);
  }
  // Every colliding source column has its own SQL alias and decoder, including both names/statuses/IDs.
  return getDb().select({
    id: sql<string>`${colleges.id}`.mapWith(colleges.id).as("tenant_college_id"),
    organizationId: sql<string>`${colleges.organizationId}`.mapWith(colleges.organizationId).as("tenant_organization_id"),
    name: sql<string>`${colleges.name}`.mapWith(colleges.name).as("tenant_college_name"),
    organizationName: sql<string>`${organizations.name}`.mapWith(organizations.name).as("tenant_organization_name"),
    status: sql<"ACTIVE" | "ARCHIVED">`${colleges.status}`.mapWith(colleges.status).as("tenant_college_status"),
    organizationStatus: sql<"ACTIVE" | "ARCHIVED">`${organizations.status}`.mapWith(organizations.status).as("tenant_organization_status"),
    code: colleges.code, city: colleges.city, state: colleges.state, country: colleges.country,
    createdAt: colleges.createdAt, updatedAt: colleges.updatedAt,
  }).from(colleges).innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(...where)).as("admin_tenant_lifecycle_scope");
}
export async function getSuperAdminTenantLifecycleDirectory(context: RequestContext, raw: unknown) {
  const query = tenantLifecycleQuerySchema.parse(raw), source = scopedTenantSource(context, query), db = getDb();
  const [totals] = await db.select({ total: count() }).from(source);
  const paging = tenantLifecyclePaging(totals?.total ?? 0, query.page);
  const [items, organizationOptions] = await Promise.all([
    db.select().from(source).orderBy(asc(source.name), asc(source.id)).limit(TENANT_LIFECYCLE_PAGE_SIZE).offset(paging.offset),
    listOrganizations(context),
  ]);
  return { query: { ...query, page: paging.page }, ...paging, items, organizations: organizationOptions };
}
export async function getSuperAdminTenantLifecycleDetail(context: RequestContext, rawId: unknown) {
  const source = scopedTenantSource(context);
  const parsed = z.uuid().safeParse(rawId);
  if (!parsed.success) throw new CollegeServiceError("COLLEGE_NOT_FOUND");
  const [row] = await getDb().select().from(source).where(eq(source.id, parsed.data)).limit(1);
  if (!row) throw new CollegeServiceError("COLLEGE_NOT_FOUND");
  return row;
}

export async function exportSuperAdminTenantDirectory(context: RequestContext, raw: unknown) {
  const query = tenantDirectoryExportQuerySchema.parse(raw);
  const source = scopedTenantSource(context, { ...query, page: 1 });
  const rows = await getDb().select().from(source).orderBy(asc(source.name), asc(source.id))
    .limit(TENANT_DIRECTORY_CSV_CAP + 1);
  const truncated = rows.length > TENANT_DIRECTORY_CSV_CAP;
  return { csv: buildTenantDirectoryCsv(rows, truncated), truncated,
    exported: Math.min(rows.length, TENANT_DIRECTORY_CSV_CAP), cap: TENANT_DIRECTORY_CSV_CAP };
}
