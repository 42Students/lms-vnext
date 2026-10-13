import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  organizations,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";

/**
 * The signed-in person's own account summary (name, contacts, roles, college).
 * Everything is keyed by the authenticated user and the membership already
 * verified into the request context; nothing here accepts an id from the
 * caller, so it can only ever describe the caller.
 */
export type OwnAccountSummary = {
  displayName: string | null;
  phoneE164: string | null;
  email: string | null;
  college: {
    name: string;
    code: string;
    organizationName: string;
  } | null;
  roles: string[];
  isSuperAdmin: boolean;
};

export async function getOwnAccountSummary(
  context: RequestContext,
): Promise<OwnAccountSummary | null> {
  const db = getDb();

  const [user] = await db
    .select({
      displayName: users.displayName,
      phoneE164: users.phoneE164,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, context.user.id))
    .limit(1);

  if (!user) return null;

  let college: OwnAccountSummary["college"] = null;
  let roles: string[] = [];

  if (context.membership) {
    const [row] = await db
      .select({
        name: colleges.name,
        code: colleges.code,
        organizationName: organizations.name,
      })
      .from(collegeMemberships)
      .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(
        and(
          eq(collegeMemberships.id, context.membership.id),
          eq(collegeMemberships.userId, context.user.id),
        ),
      )
      .limit(1);
    college = row ?? null;

    // Roles are read only once the membership is proven to be the caller's.
    if (row) {
      roles = (
        await db
          .select({ role: membershipRoles.role })
          .from(membershipRoles)
          .where(eq(membershipRoles.membershipId, context.membership.id))
      ).map((entry) => entry.role);
    }
  }

  return {
    ...user,
    college,
    roles,
    isSuperAdmin: context.user.systemRoles.includes("SUPER_ADMIN"),
  };
}
