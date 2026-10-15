import "server-only";
import { and, asc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementTpoInternalThreads, placementTpoInternalMessages } from "@/db/schema/tpo-internal";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

export const tpoThreadIdSchema = z.string().uuid();

/** A recruiter grant is never a credential for private TPO conversations. */
export async function readTpoInternalConversation(context: RequestContext, rawId: unknown) {
  const id = tpoThreadIdSchema.parse(rawId);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  const college = await requirePlacementManageScope(context, membership.collegeId);
  if (!await placementTableExists("placement_tpo_internal_threads"))
    return { status: "NOT_REGISTERED" as const, thread: null, messages: [] };
  return getDb().transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      organizationId: college.organizationId, collegeId: college.id,
    });
    const [thread] = await tx.select({
      id: placementTpoInternalThreads.id,
      topic: placementTpoInternalThreads.topic,
      startedByMembershipId: placementTpoInternalThreads.startedByMembershipId,
      invitedMembershipId: placementTpoInternalThreads.invitedMembershipId,
      createdAt: placementTpoInternalThreads.createdAt,
    }).from(placementTpoInternalThreads).where(and(
      eq(placementTpoInternalThreads.id, id),
      eq(placementTpoInternalThreads.collegeId, college.id),
      or(
        eq(placementTpoInternalThreads.startedByMembershipId, membership.id),
        eq(placementTpoInternalThreads.invitedMembershipId, membership.id),
      ),
    )).limit(1);
    if (!thread) return { status: "NOT_FOUND" as const, thread: null, messages: [] };
    const messages = await tx.select({
      id: placementTpoInternalMessages.id,
      authorMembershipId: placementTpoInternalMessages.authorMembershipId,
      body: placementTpoInternalMessages.body,
      createdAt: placementTpoInternalMessages.createdAt,
    }).from(placementTpoInternalMessages).where(and(
      eq(placementTpoInternalMessages.threadId, thread.id),
      eq(placementTpoInternalMessages.collegeId, college.id),
    )).orderBy(asc(placementTpoInternalMessages.createdAt), asc(placementTpoInternalMessages.id)).limit(200);
    return { status: "READY" as const, thread, messages };
  });
}
