import { z } from "zod";
export const tenantLifecycleQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  organizationId: z.union([z.uuid(), z.literal("")]).default(""),
  status: z.enum(["ACTIVE", "ARCHIVED", "ALL"]).default("ACTIVE"),
  // Do not interpret scientific notation, hex or whitespace as a URL page.
  // Internal callers may pass an already validated numeric page.
  page: z.union([
    z.number().int().min(1).max(1000),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(1000)),
  ]).default(1),
});
/** Reject ambiguous duplicate, unknown and array-valued URL parameters
 * before validating the tenant directory query. Coercing ["1"] to 1 would
 * otherwise silently accept repeated page keys on some runtimes. */
export function parseTenantLifecycleSearchParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(Array.isArray))return null;
 const parsed=tenantLifecycleQuerySchema.safeParse(
  Object.fromEntries(Object.entries(raw).filter(([,value])=>value!==undefined))
 );
 return parsed.success?parsed.data:null;
}
/** Legacy Colleges and Organizations tables paginate 25 per page. */
export const TENANT_LIFECYCLE_PAGE_SIZE = 25;
export function tenantLifecyclePaging(total: number, requested: number) {
  const totalPages = Math.max(1, Math.ceil(total / TENANT_LIFECYCLE_PAGE_SIZE));
  const page = Math.min(tenantLifecycleQuerySchema.parse({ page: requested }).page, totalPages);
  return { total, totalPages, page, offset: (page - 1) * TENANT_LIFECYCLE_PAGE_SIZE };
}
export function tenantLifecycleHref(raw: unknown) {
  const query = tenantLifecycleQuerySchema.parse(raw), params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  return "/admin/tenants" + (params.size ? `?${params}` : "");
}
export function tenantSetupLinksAvailable(collegeStatus: string, organizationStatus: string) {
  return collegeStatus === "ACTIVE" && organizationStatus === "ACTIVE";
}
