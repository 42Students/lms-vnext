import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, systemRoles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

export class GroupActorAccessError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "GroupActorAccessError";
  }
}

/**
 * A RequestContext can remain valid in memory after an account, membership or
 * role is revoked. Every group write must re-authorize the actor against the
 * database in its own transaction, *after* the target group is locked.
 *
 * SHARE row locks prevent role/account changes from racing the write. They are
 * held until the transaction commits, so actor validity is not time-of-check
 * only. Callers must still run their resource-scoped request-context policy.
 */
export async function assertPersistedGroupActor(
  tx: Tx,
  context: RequestContext,
  options: { collegeId: string | null; mode: "SELF" | "MANUAL"; memberId?: string },
): Promise<void> {
  const [actor] = await tx.select({ status: users.platformStatus })
    .from(users).where(eq(users.id, context.user.id)).for("share");
  if (!actor || actor.status !== "ACTIVE")
    throw new GroupActorAccessError("GROUP_ACTOR_INACTIVE");

  if (options.mode === "SELF") {
    if (!options.collegeId || !context.membership ||
        options.memberId !== context.membership.id)
      throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
    const [member] = await tx.select({
      userId: collegeMemberships.userId,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    }).from(collegeMemberships)
      .where(eq(collegeMemberships.id, context.membership.id)).for("share");
    if (!member || member.userId !== context.user.id ||
        member.collegeId !== options.collegeId || member.status !== "ACTIVE")
      throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
    const [role] = await tx.select({ role: membershipRoles.role })
      .from(membershipRoles)
      .where(and(eq(membershipRoles.membershipId, context.membership.id),
                 eq(membershipRoles.role, "LEARNER"))).for("share");
    if (!role) throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
    return;
  }

  if (context.user.systemRoles.includes("SUPER_ADMIN")) {
    const [role] = await tx.select({ role: systemRoles.role })
      .from(systemRoles)
      .where(and(eq(systemRoles.userId, context.user.id),
                 eq(systemRoles.role, "SUPER_ADMIN"))).for("share");
    if (!role) throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
    return;
  }

  if (!options.collegeId || !context.membership)
    throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
  const [member] = await tx.select({
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
  }).from(collegeMemberships)
    .where(eq(collegeMemberships.id, context.membership.id)).for("share");
  if (!member || member.userId !== context.user.id ||
      member.collegeId !== options.collegeId || member.status !== "ACTIVE")
    throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
  const [role] = await tx.select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId, context.membership.id),
               eq(membershipRoles.role, "COLLEGE_ADMIN"))).for("share");
  if (!role) throw new GroupActorAccessError("GROUP_ACTOR_NOT_AUTHORIZED");
}
