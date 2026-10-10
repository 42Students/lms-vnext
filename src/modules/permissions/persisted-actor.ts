import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  membershipRoles,
  systemRoles,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
  type PlatformPermission,
  type ResourceScope,
} from "./policy";

type Client = ReturnType<typeof getDb>;
export type PermissionTransaction =
  Parameters<Parameters<Client["transaction"]>[0]>[0];

const recruiterOnlyPermissions = new Set<PlatformPermission>([
  "placements.recruiter.read",
  "placements.recruiter.result.stage",
]);

/**
 * Rebuilds the authorization-relevant RequestContext from persisted rows while
 * holding SHARE locks until the surrounding transaction commits.
 *
 * Call this INSIDE the same transaction as the protected write, preferably
 * after locking the target resource row. The locks prevent user disable,
 * membership suspension and role revocation from racing a mutation that has
 * already authenticated an older RequestContext.
 *
 * Recruiter grants are deliberately unsupported here because they require
 * relationship-specific persisted grant reconstruction. Recruiter mutations
 * must use a dedicated persisted recruiter guard rather than trusting the
 * request snapshot.
 */
export async function assertPersistedPlatformPermission(
  tx: PermissionTransaction,
  context: RequestContext,
  permission: PlatformPermission,
  resource: ResourceScope = {},
): Promise<RequestContext> {
  if (recruiterOnlyPermissions.has(permission)) {
    throw new AuthorizationError(permission);
  }

  const [actor] = await tx
    .select({
      platformStatus: users.platformStatus,
    })
    .from(users)
    .where(eq(users.id, context.user.id))
    .for("share")
    .limit(1);

  if (!actor) {
    throw new AuthorizationError(permission);
  }

  const persistedSystemRoles = await tx
    .select({ role: systemRoles.role })
    .from(systemRoles)
    .where(eq(systemRoles.userId, context.user.id))
    .for("share");

  let membership: RequestContext["membership"] = null;

  if (context.membership) {
    const [persistedMembership] = await tx
      .select({
        id: collegeMemberships.id,
        userId: collegeMemberships.userId,
        collegeId: collegeMemberships.collegeId,
        organizationId: colleges.organizationId,
        status: collegeMemberships.status,
      })
      .from(collegeMemberships)
      .innerJoin(
        colleges,
        eq(colleges.id, collegeMemberships.collegeId),
      )
      .where(
        eq(
          collegeMemberships.id,
          context.membership.id,
        ),
      )
      .for("share")
      .limit(1);

    if (
      !persistedMembership ||
      persistedMembership.userId !== context.user.id
    ) {
      throw new AuthorizationError(permission);
    }

    const persistedMembershipRoles = await tx
      .select({ role: membershipRoles.role })
      .from(membershipRoles)
      .where(
        eq(
          membershipRoles.membershipId,
          persistedMembership.id,
        ),
      )
      .for("share");

    membership = {
      id: persistedMembership.id,
      collegeId: persistedMembership.collegeId,
      organizationId:
        persistedMembership.organizationId,
      status: persistedMembership.status,
      roles: persistedMembershipRoles.map(
        ({ role }) => role,
      ),
    };
  }

  const persistedContext: RequestContext = {
    user: {
      id: context.user.id,
      identityUid: context.user.identityUid,
      platformStatus: actor.platformStatus,
      systemRoles: persistedSystemRoles.map(
        ({ role }) => role,
      ),
    },
    membership,
    adminScope: context.adminScope ?? null,
    recruiter: null,
  };

  requirePermission(
    persistedContext,
    permission,
    resource,
  );

  return persistedContext;
}
