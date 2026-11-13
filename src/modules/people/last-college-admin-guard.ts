import "server-only";
import {and,eq,isNull,ne,sql} from "drizzle-orm";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {PermissionTransaction} from "@/modules/permissions/persisted-actor";
import {PeopleServiceError} from "./errors";

/**
 * #81 — serialize last-admin decisions at the college boundary across
 * role removal, membership suspension/ending, and global account disable.
 *
 * Every caller acquires this advisory transaction lock before its final
 * read of live College Admin coverage. Locking this key does NOT conflict
 * with existing parent membership FOR UPDATE/college FOR SHARE locks.
 * A separate READ COMMITTED query after taking the lock sees the preceding
 * committed mutation; concurrent changes therefore cannot both regard
 * the other admin as their surviving replacement.
 *
 * These are application-writer invariants. Direct SQL paths not using
 * this helper need a separate database-trigger acceptance pass.
 */
export async function assertAnotherActiveCollegeAdmin(
  tx: PermissionTransaction,
  collegeId: string,
  removedMembershipId: string,
) {
  await tx.execute(sql`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${"lms:last-college-admin:" + collegeId}, 0)
    )
  `);

  // The target may have stopped being an active administrator while a
  // global-user disable was waiting for the per-college lock.
  const [stillAdmin] = await tx.select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"COLLEGE_ADMIN"),
    ))
    .innerJoin(users,and(
      eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .where(and(
      eq(collegeMemberships.id,removedMembershipId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      isNull(collegeMemberships.suspendedAt),
    ))
    .limit(1);
  if(!stillAdmin)return;

  const [replacement] = await tx
    .select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "COLLEGE_ADMIN"),
    ))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(collegeMemberships.collegeId, collegeId),
      ne(collegeMemberships.id, removedMembershipId),
      eq(collegeMemberships.status, "ACTIVE"),
      isNull(collegeMemberships.suspendedAt),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .limit(1);
  if (!replacement) throw new PeopleServiceError("LAST_COLLEGE_ADMIN");
}
