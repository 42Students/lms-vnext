import { z } from "zod";
export const ADMIN_UNASSIGNED_USERS_PAGE_SIZE = 30;
export const adminUnassignedUsersQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  platformStatus: z.enum(["ALL", "ACTIVE", "DISABLED"]).default("ALL"),
  role: z.enum(["ALL", "SUPER_ADMIN", "NONE"]).default("ALL"),
  page: z.union([z.number().int(), z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int())])
    .pipe(z.number().int().min(1).max(1000)).default(1),
});
export function unassignedIdentityScopeAllowed(scope: { organizationId?: string | null; collegeId?: string | null } | null | undefined) {
  return !scope?.organizationId && !scope?.collegeId;
}
export function unassignedIdentityPage(total: number, requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_UNASSIGNED_USERS_PAGE_SIZE));
  const page = Math.min(adminUnassignedUsersQuerySchema.parse({ page: requestedPage }).page, totalPages);
  return { total, totalPages, page, offset: (page - 1) * ADMIN_UNASSIGNED_USERS_PAGE_SIZE };
}
export function adminUnassignedUsersHref(rawQuery: unknown) {
  const query = adminUnassignedUsersQuerySchema.parse(rawQuery);
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.platformStatus !== "ALL") params.set("platformStatus", query.platformStatus);
  if (query.role !== "ALL") params.set("role", query.role);
  if (query.page > 1) params.set("page", String(query.page));
  return "/admin/people/unassigned" + (params.size ? `?${params}` : "");
}
