import "server-only";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {collegeMemberships,users} from "@/db/schema";
import { placementTpoInternalThreads, placementTpoInternalMessages } from "@/db/schema/tpo-internal";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

export const tpoThreadIdSchema = z.string().uuid();
export const tpoMessagePageSchema = z.coerce.number().int().min(1).max(10000).default(1);
const PAGE_SIZE = 500;

/** A recruiter grant is never a credential for private TPO conversations. */
export async function readTpoInternalConversation(context: RequestContext, rawId: unknown, rawPage: unknown = 1) {
  const page = tpoMessagePageSchema.parse(rawPage);
  const id = tpoThreadIdSchema.parse(rawId);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  const college = await requirePlacementManageScope(context, membership.collegeId);
  if (!await placementTableExists("placement_tpo_internal_threads"))
    return { status: "NOT_REGISTERED" as const, thread: null, messages: [], page, pages: 1 };
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
      counterpartName: sql<string>`coalesce((
        select nullif(btrim(u.display_name),'')
        from college_memberships cm join users u on u.id=cm.user_id
        where cm.college_id=${college.id}::uuid
          and cm.id=(case when ${placementTpoInternalThreads.startedByMembershipId}=${membership.id}::uuid
            then ${placementTpoInternalThreads.invitedMembershipId}
            else ${placementTpoInternalThreads.startedByMembershipId} end)
        limit 1
      ),'Team member')`,
    }).from(placementTpoInternalThreads).where(and(
      eq(placementTpoInternalThreads.id, id),
      eq(placementTpoInternalThreads.collegeId, college.id),
      or(
        eq(placementTpoInternalThreads.startedByMembershipId, membership.id),
        eq(placementTpoInternalThreads.invitedMembershipId, membership.id),
      ),
    )).limit(1);
    if (!thread) return { status: "NOT_FOUND" as const, thread: null, messages: [], page, pages: 1 };
    const [count] = await tx.select({ total: sql<number>`count(*)::integer` })
      .from(placementTpoInternalMessages).where(and(
        eq(placementTpoInternalMessages.threadId, thread.id),
        eq(placementTpoInternalMessages.collegeId, college.id),
      ));
    const newestFirst = await tx.select({
      id: placementTpoInternalMessages.id,
      authorMembershipId: placementTpoInternalMessages.authorMembershipId,
      authorName:users.displayName,
      body: placementTpoInternalMessages.body,
      createdAt: placementTpoInternalMessages.createdAt,
      edited: sql<boolean>`exists(select 1 from activity_events ae
       where ae.college_id=${college.id}::uuid and ae.subject_id=${thread.id}
        and ae.event_type='placements.tpo_team.message_edited'
        and ae.metadata->>'messageId'=${placementTpoInternalMessages.id}::text)`,
      removed: sql<boolean>`exists(select 1 from activity_events ae
       where ae.college_id=${college.id}::uuid and ae.subject_id=${thread.id}
        and ae.event_type='placements.tpo_team.message_deleted'
        and ae.metadata->>'messageId'=${placementTpoInternalMessages.id}::text)`,
    }).from(placementTpoInternalMessages)
      .innerJoin(collegeMemberships,and(
       eq(collegeMemberships.id,placementTpoInternalMessages.authorMembershipId),
       eq(collegeMemberships.collegeId,placementTpoInternalMessages.collegeId)))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(
      eq(placementTpoInternalMessages.threadId, thread.id),
      eq(placementTpoInternalMessages.collegeId, college.id),
    )).orderBy(desc(placementTpoInternalMessages.createdAt), desc(placementTpoInternalMessages.id))
      .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
    const pages = Math.max(1, Math.ceil(Number(count?.total ?? 0) / PAGE_SIZE));
    return { status: "READY" as const, thread, messages: newestFirst.reverse(), page, pages };
  });
}
