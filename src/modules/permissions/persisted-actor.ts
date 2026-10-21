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
  "placements.recruiter.note",
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
  options: { actorLock?: "share" | "update" } = {},
): Promise<RequestContext> {
  if (recruiterOnlyPermissions.has(permission)) {
    throw new AuthorizationError(permission);
  }

  const actorQuery = tx
    .select({
      platformStatus: users.platformStatus,
    })
    .from(users)
    .where(eq(users.id, context.user.id));

  const [actor] =
    options.actorLock === "update"
      ? await actorQuery.for("update").limit(1)
      : await actorQuery.for("share").limit(1);

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

/**
 * Verify many roster resources using one actor reconstruction under locks.
 * The audit sink must persist denials separately from a failed write transaction.
 * No credentials, contact details, or request payloads enter the audit event.
 */
export async function assertPersistedPlatformPermissionBatch(
 tx:PermissionTransaction,context:RequestContext,permission:PlatformPermission,
 resources:readonly ResourceScope[],
 auditDenial:(denial:{permission:PlatformPermission;collegeId:string|null})=>Promise<void>,
):Promise<RequestContext> {
 if(resources.length===0||resources.length>500)throw new AuthorizationError(permission);
 let actor:RequestContext;
 try {
   actor=await assertPersistedPlatformPermission(tx,context,permission,resources[0]!);
 }catch(error){
   await auditDenial({permission,collegeId:resources[0]?.collegeId??null});
   throw error;
 }
 for(const resource of resources.slice(1)){
   try {requirePermission(actor,permission,resource);}
   catch(error){
     await auditDenial({permission,collegeId:resource.collegeId??null});
     throw error;
   }
 }
 return actor;
}
