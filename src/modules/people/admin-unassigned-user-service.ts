import "server-only";
import { and, asc, count, eq, exists, ilike, inArray, notExists, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, systemRoles, users } from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { ADMIN_UNASSIGNED_USERS_PAGE_SIZE, adminUnassignedUsersQuerySchema, unassignedIdentityPage, unassignedIdentityScopeAllowed } from "./admin-unassigned-user-model";
export async function listSuperAdminUnassignedUsers(context: RequestContext, rawQuery: unknown) {
  // An identity with no membership has no tenant ownership to authorize in a selected safety scope.
  if (!isSuperAdmin(context) || !unassignedIdentityScopeAllowed(context.adminScope)) throw new AuthorizationError("people.manage");
  requirePermission(context, "people.manage");
  const query = adminUnassignedUsersQuerySchema.parse(rawQuery);
  const db = getDb();
  const memberships = db.select({ id: collegeMemberships.id }).from(collegeMemberships)
    .where(eq(collegeMemberships.userId, users.id));
  const assignedRoles = db.select({ id: systemRoles.id }).from(systemRoles).where(eq(systemRoles.userId, users.id));
  const conditions: SQL[] = [notExists(memberships)];
  if (query.platformStatus !== "ALL") conditions.push(eq(users.platformStatus, query.platformStatus));
  if (query.role === "SUPER_ADMIN") conditions.push(exists(assignedRoles));
  if (query.role === "NONE") conditions.push(notExists(assignedRoles));
  if (query.q) conditions.push(ilike(users.displayName, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"));
  const where = and(...conditions);
  const [totals] = await db.select({ total: count() }).from(users).where(where);
  const paging = unassignedIdentityPage(totals?.total ?? 0, query.page);
  // Intentionally exclude contacts, provider identifiers, session/device data and all credentials.
  const rows = await db.select({ id: users.id, displayName: users.displayName, platformStatus: users.platformStatus,
    createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(where)
    .orderBy(asc(users.displayName), asc(users.id)).limit(ADMIN_UNASSIGNED_USERS_PAGE_SIZE).offset(paging.offset);
  const ids = new Set(rows.map(row => row.id));
  const roleRows = rows.length ? await db.select({ userId: systemRoles.userId, role: systemRoles.role }).from(systemRoles)
    .where(inArray(systemRoles.userId, rows.map(row => row.id))) : [];
  const roles = new Map<string, string[]>();
  for (const row of roleRows) if (ids.has(row.userId)) roles.set(row.userId, [...(roles.get(row.userId) ?? []), row.role]);
  return { query: { ...query, page: paging.page }, ...paging, items: rows.map(row => ({ ...row, roles: roles.get(row.id) ?? [] })) };
}
