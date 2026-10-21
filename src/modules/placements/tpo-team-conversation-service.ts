import "server-only";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import {createTpoInternalThread} from "./tpo-team-internal-create-service";
import {postTpoInternalMessage} from "./tpo-team-internal-reply-service";
import {createTpoTeamAsk} from "./tpo-team-asks-service";
import {internalThreadSchema} from "./tpo-team-internal-model";
import {tpoTeamAskCreateSchema} from "./tpo-team-asks-model";
import { getDb } from "@/db/client";
import {collegeMemberships,users} from "@/db/schema";
import { placementTpoInternalThreads, placementTpoInternalMessages } from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {hasPlacementTeamMembership} from "./placement-team-access-model";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

export const tpoThreadIdSchema = z.string().uuid();
export const tpoMessagePageSchema = z.coerce.number().int().min(1).max(10000).default(1);
const PAGE_SIZE = 500;

/** Legacy start/send compatibility: use typed context, mentions and optional ask
 * rather than trusting any legacy author or college ID. The scoped vNext
 * writers re-check active team membership and persist audit/notifications.
 * An optional ask is a separate audited action; a successful message with an
 * unsuccessful ask is reported as PARTIAL, not rolled back or marked delivered.
 */
const legacyTeamSendSchema=z.strictObject({
 threadId:z.string().uuid().optional(),
 recipientMembershipId:z.string().uuid().optional(),
 topic:z.string().trim().min(1).max(200).optional(),
 body:z.string().trim().min(1).max(4000),
 mentionMembershipIds:z.array(z.string().uuid()).max(20).default([]),
 markDecision:z.boolean().default(false),
 idempotencyKey:z.string().uuid().optional(),
 ask:z.object({
  assigneeMembershipId:z.string().uuid(),
  title:z.string().trim().min(1).max(200),
  dueAt:z.string().datetime({offset:true}).nullable().default(null),
  requestKey:z.string().uuid(),
 }).strict().optional(),
}).superRefine((input,ctx)=>{
 if(!input.threadId&&(!input.recipientMembershipId||!input.topic))ctx.addIssue({
  code:"custom",path:["threadId"],message:"Choose an existing thread or a recipient and topic",
 });
 if(input.threadId&&(input.recipientMembershipId||input.topic))ctx.addIssue({
  code:"custom",path:["threadId"],message:"Do not change recipients through Send",
 });
 if(new Set(input.mentionMembershipIds).size!==input.mentionMembershipIds.length)
  ctx.addIssue({code:"custom",path:["mentionMembershipIds"],message:"Duplicate mention"});
});
export async function sendLegacyTpoTeamConversation(context:RequestContext,raw:unknown){
 const input=legacyTeamSendSchema.parse(raw);
 const member=context.membership;
 if(!member||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 // The visibility read distinguishes absent/inaccessible thread from a
 // temporarily unregistered table, and never exposes private message bodies
 // to an unverified caller.
 const existing=input.threadId?await readTpoInternalConversation(context,input.threadId,1):null;
 if(existing&&existing.status!=="READY")
  return {status:existing.status,threadId:input.threadId??null};
 if(existing?.status==="READY"&&input.mentionMembershipIds.length){
  const authorized=new Set([
   existing.thread.startedByMembershipId,existing.thread.invitedMembershipId,
  ]);
  // For a group, notifications already fan out to active participants in the
  // persisted message writer; IDs outside the direct pair require a group
  // participant membership service rather than an unscoped mention.
  if(input.mentionMembershipIds.some(id=>!authorized.has(id)))
   throw new AuthorizationError("placements.manage");
 }
 const threadId=input.threadId??(await createTpoInternalThread(context,
  internalThreadSchema.parse({
   recipientMembershipId:input.recipientMembershipId,
   topic:input.topic,firstMessage:undefined,
   idempotencyKey:input.idempotencyKey,
  }))).id;
 const message=await postTpoInternalMessage(context,{
  threadId,body:input.body,markDecision:input.markDecision,
  idempotencyKey:input.idempotencyKey,
 });
 if(!input.ask)return {status:"READY" as const,threadId,messageId:message.id,
  notified:message.notified,askId:null};
 const askInput=tpoTeamAskCreateSchema.parse({...input.ask,threadId});
 try{
  const ask=await createTpoTeamAsk(context,askInput);
  return {status:"READY" as const,threadId,messageId:message.id,
   notified:message.notified,askId:ask.id};
 }catch{
  // Do not repeat the already-committed message on a retry. Keep the real
  // message receipt visible and direct the user to retry the separate ask.
  return {status:"PARTIAL" as const,threadId,messageId:message.id,
   notified:message.notified,askId:null,notice:"Message sent, but the team ask was not created."};
 }
}

/** Normalize safe legacy detail states without allowing a failed request to
 * masquerade as an empty thread or an unavailable deployment. */
export async function legacyTpoTeamThreadDetail(context:RequestContext,id:string,page=1){
 try{return await readTpoInternalConversation(context,id,page);}
 catch(error){
  if(error instanceof AuthorizationError)return {status:"FORBIDDEN" as const,
   thread:null,messages:[],page,pages:1};
  return {status:"FAILED" as const,thread:null,messages:[],page,pages:1};
 }
}

/** A recruiter grant is never a credential for private TPO conversations. */
export async function readTpoInternalConversation(context: RequestContext, rawId: unknown, rawPage: unknown = 1) {
  const page = tpoMessagePageSchema.parse(rawPage);
  const id = tpoThreadIdSchema.parse(rawId);
  const membership = context.membership;
  if (!membership || !hasPlacementTeamMembership(context))
    throw new AuthorizationError("placements.manage");
  const college = await requirePlacementManageScope(context, membership.collegeId);
  const groupsReady=await placementTableExists("placement_tpo_internal_thread_participants");
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
      kind:groupsReady?placementTpoInternalThreads.kind:sql<"DIRECT">`'DIRECT'`,
      isPrivate:placementTpoInternalThreads.isPrivate,
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
      groupsReady ? sql`((
        ${placementTpoInternalThreads.kind} = 'DIRECT'
        and (${placementTpoInternalThreads.startedByMembershipId} = ${membership.id}::uuid
          or ${placementTpoInternalThreads.invitedMembershipId} = ${membership.id}::uuid)
      ) or (
        ${placementTpoInternalThreads.kind} <> 'DIRECT'
        and exists (select 1 from placement_tpo_internal_thread_participants p
          where p.thread_id=${placementTpoInternalThreads.id}
            and p.college_id=${college.id}::uuid
            and p.membership_id=${membership.id}::uuid and p.left_at is null)
      ))` : or(
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
      decision: sql<boolean>`coalesce((select ae.event_type='placements.tpo_team.decision_marked'
       from activity_events ae where ae.college_id=${college.id}::uuid
        and ae.subject_type='team_thread' and ae.subject_id=${thread.id}
        and ae.event_type in ('placements.tpo_team.decision_marked',
         'placements.tpo_team.decision_unmarked')
        and ae.metadata->>'messageId'=${placementTpoInternalMessages.id}::text
       order by ae.occurred_at desc,ae.id desc limit 1),false)`,
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
