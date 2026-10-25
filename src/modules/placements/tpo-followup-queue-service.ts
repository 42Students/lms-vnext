import "server-only";

import { and, asc, count, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementTpoFollowups,
  placementTpoLeadActivities,
  placementTpoLeads,
  collegeMemberships,
  membershipRoles,
  users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {
  confirmedTpoFollowupCreateSchema,
  confirmedTpoFollowupDoneSchema,
  confirmedTpoFollowupRescheduleSchema,
  projectTpoFollowupQueue,
  tpoFollowupQueueQuerySchema,
  tpoFollowupCreatedAudit,
  tpoFollowupDoneAudit,
  tpoFollowupIdSchema,
  tpoFollowupCsv,
} from "./tpo-followup-queue-model";
import { TpoCrmError } from "./tpo-crm-service";

async function requireTpo(context: RequestContext) {
  const membership = context.membership;
  if (!membership || (!hasMembershipRole(context, "TPO") && !hasMembershipRole(context, "COLLEGE_ADMIN"))) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const [stored]=await getDb().select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"]),
    ))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(
      eq(collegeMemberships.id,membership.id),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    )).limit(1);
  if(!stored)throw new AuthorizationError("placements.manage");
  await requirePlacementManageScope(context, collegeId);
  return { collegeId, ownerMembershipId: membership.id };
}

/** Paginated by a hard cap; never treat unavailable or truncated data as zero. */
export async function getTpoDueFollowupQueue(
  context: RequestContext,
  now = new Date(),
  rawQuery: unknown = {},
) {
  const { collegeId, ownerMembershipId } = await requireTpo(context);
  const query=tpoFollowupQueueQuerySchema.parse(rawQuery);
  const db = getDb();
  const weekEnd=new Date(now.getTime()+7*86400000);
  const timeConditions=query.window==="DUE"?[lte(placementTpoFollowups.dueAt,now)]:
    [gte(placementTpoFollowups.dueAt,now),lte(placementTpoFollowups.dueAt,weekEnd)];
  const conditions=and(
    eq(placementTpoFollowups.collegeId,collegeId),
    eq(placementTpoLeads.collegeId,collegeId),
    isNull(placementTpoFollowups.doneAt),
    ...timeConditions,
    ...(query.scope==="MINE"?[or(
      eq(placementTpoFollowups.ownerMembershipId,ownerMembershipId),
      isNull(placementTpoFollowups.ownerMembershipId),
    )]:[]),
    ...(query.q?[sql<boolean>`position(lower(${query.q}::text) in lower(coalesce(${placementTpoLeads.name}, '') || ' ' || coalesce(${placementTpoLeads.companyName}, ''))) > 0`]:[]),
  );
  const [totalResult]=await db.select({total:count()}).from(placementTpoFollowups)
    .innerJoin(placementTpoLeads,and(
      eq(placementTpoFollowups.leadId,placementTpoLeads.id),
      eq(placementTpoFollowups.collegeId,placementTpoLeads.collegeId),
    )).where(conditions);
  const total=Number(totalResult?.total??0);
  const pageSize=25;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  const facts=await db.select({
    id:placementTpoFollowups.id,
    leadId:placementTpoFollowups.leadId,
    leadName:placementTpoLeads.name,
    companyName:placementTpoLeads.companyName,
    dueAt:placementTpoFollowups.dueAt,
    note:placementTpoFollowups.note,
    phoneNorm:placementTpoLeads.phoneNorm,
    unsubscribedAt:placementTpoLeads.unsubscribedAt,
    recruiterUserId:placementTpoLeads.recruiterUserId,
  }).from(placementTpoFollowups)
    .innerJoin(placementTpoLeads,and(
      eq(placementTpoFollowups.leadId,placementTpoLeads.id),
      eq(placementTpoFollowups.collegeId,placementTpoLeads.collegeId),
    ))
    .where(conditions)
    .orderBy(asc(placementTpoFollowups.dueAt),asc(placementTpoFollowups.id))
    .limit(pageSize).offset((page-1)*pageSize);

  const leads = await db.select({
    id: placementTpoLeads.id,
    name: placementTpoLeads.name,
    companyName: placementTpoLeads.companyName,
  }).from(placementTpoLeads)
    .where(and(
      eq(placementTpoLeads.collegeId, collegeId),
      isNull(placementTpoLeads.unsubscribedAt),
      isNull(placementTpoLeads.recruiterUserId),
    ))
    .orderBy(desc(placementTpoLeads.updatedAt), asc(placementTpoLeads.id))
    .limit(201);

  return {
    ...projectTpoFollowupQueue(facts, now),
    hasMoreDue: page<totalPages,
    page,pageSize,total,totalPages,
    scope: query.scope,
    window: query.window,
    q: query.q,
    leads: leads.slice(0, 200),
    hasMoreLeads: leads.length > 200,
  };
}

/** Both the due-row and immutable, actor-attributed activity commit atomically. */
export async function createConfirmedTpoFollowup(
  context: RequestContext,
  raw: unknown,
) {
  const scope = await requireTpo(context);
  const input = confirmedTpoFollowupCreateSchema.parse(raw);
  const dueAt = new Date(input.dueAt);
  const actorUserId = context.user.id;
  return getDb().transaction(async (tx) => {
    const [lead] = await tx.select({
      id: placementTpoLeads.id,
      unsubscribedAt: placementTpoLeads.unsubscribedAt,
      recruiterUserId: placementTpoLeads.recruiterUserId,
    }).from(placementTpoLeads).where(and(
      eq(placementTpoLeads.collegeId, scope.collegeId),
      eq(placementTpoLeads.id, input.leadId),
    )).for("update").limit(1);
    if (!lead || lead.unsubscribedAt || lead.recruiterUserId) {
      throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    }

    const [created] = await tx.insert(placementTpoFollowups).values({
      collegeId: scope.collegeId,
      leadId: lead.id,
      dueAt,
      ownerMembershipId: scope.ownerMembershipId,
      note: input.note ?? null,
    }).returning();
    if (!created) throw new Error("TPO_FOLLOWUP_CREATE_FAILED");

    await tx.insert(placementTpoLeadActivities).values({
      collegeId: scope.collegeId,
      leadId: lead.id,
      type: "NOTE",
      isSystem: false,
      outcome: "FOLLOWUP_CREATED",
      note: tpoFollowupCreatedAudit(dueAt),
      createdByUserId: actorUserId,
    });
    return { id: created.id, leadId: created.leadId, dueAt: created.dueAt.toISOString() };
  });
}

/** Compares expected due time under row lock: stale and repeated Done are rejected. */
export async function completeConfirmedTpoFollowup(
  context: RequestContext,
  rawFollowupId: unknown,
  raw: unknown,
) {
  const scope = await requireTpo(context);
  const id = tpoFollowupIdSchema.parse(rawFollowupId);
  const input = confirmedTpoFollowupDoneSchema.parse(raw);
  const actorUserId = context.user.id;
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select({
      id: placementTpoFollowups.id,
      leadId: placementTpoFollowups.leadId,
      dueAt: placementTpoFollowups.dueAt,
      doneAt: placementTpoFollowups.doneAt,
    }).from(placementTpoFollowups)
      .innerJoin(placementTpoLeads, and(
        eq(placementTpoLeads.collegeId, placementTpoFollowups.collegeId),
        eq(placementTpoLeads.id, placementTpoFollowups.leadId),
      ))
      .where(and(
        eq(placementTpoFollowups.collegeId, scope.collegeId),
        eq(placementTpoLeads.collegeId, scope.collegeId),
        eq(placementTpoFollowups.id, id),
      )).for("update", { of: placementTpoFollowups }).limit(1);

    if (!current) throw new TpoCrmError("TPO_CRM_FOLLOWUP_NOT_FOUND");
    if (current.doneAt !== null) {
      if(input.nextDueAt)throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
      return {id:current.id,done:true as const,unchanged:true as const};
    }
    if (current.dueAt.toISOString() !== new Date(input.expectedDueAt).toISOString()) {
      throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
    }

    // Same persistence rule as a separately confirmed new follow-up.
    // A Done & next action is atomic: either both rows + both audit entries
    // commit or neither does; a failed or stale write never adds next work.
    const nextDueAt=input.nextDueAt?new Date(input.nextDueAt):null;
    if(nextDueAt){
      const now=new Date();
      if(!Number.isFinite(nextDueAt.getTime())||
        nextDueAt.getTime()<=now.getTime()||
        nextDueAt.getTime()>now.getTime()+2*365*86400000)
        throw new TpoCrmError("TPO_CRM_INVALID_DUE_AT");
      const [lead]=await tx.select({
        unsubscribedAt:placementTpoLeads.unsubscribedAt,
        recruiterUserId:placementTpoLeads.recruiterUserId,
      }).from(placementTpoLeads).where(and(
        eq(placementTpoLeads.id,current.leadId),
        eq(placementTpoLeads.collegeId,scope.collegeId),
      )).for("update").limit(1);
      if(!lead||lead.unsubscribedAt||lead.recruiterUserId)
        throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    }

    const [done] = await tx.update(placementTpoFollowups)
      .set({ doneAt: new Date() })
      .where(and(
        eq(placementTpoFollowups.id, id),
        eq(placementTpoFollowups.collegeId, scope.collegeId),
        isNull(placementTpoFollowups.doneAt),
      )).returning({ id: placementTpoFollowups.id });
    if (!done) throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
    await tx.insert(placementTpoLeadActivities).values({
      collegeId: scope.collegeId,
      leadId: current.leadId,
      type: "NOTE",
      isSystem: false,
      outcome: "FOLLOWUP_DONE",
      note: tpoFollowupDoneAudit(input.outcome, input.note),
      createdByUserId: actorUserId,
    });
    if(nextDueAt){
      const [next]=await tx.insert(placementTpoFollowups).values({
        collegeId:scope.collegeId,
        leadId:current.leadId,
        dueAt:nextDueAt,
        ownerMembershipId:scope.ownerMembershipId,
        note:("Follow-up after "+input.outcome.toLowerCase().replaceAll("_"," ")+
          ": "+input.note).slice(0,500),
      }).returning({id:placementTpoFollowups.id});
      if(!next)throw new Error("TPO_FOLLOWUP_CREATE_FAILED");
      await tx.insert(placementTpoLeadActivities).values({
        collegeId:scope.collegeId,leadId:current.leadId,
        type:"NOTE",isSystem:false,outcome:"FOLLOWUP_CREATED",
        note:tpoFollowupCreatedAudit(nextDueAt),
        createdByUserId:actorUserId,
      });
      return {id:done.id,done:true as const,nextFollowupId:next.id};
    }
    return { id: done.id, done: true as const };
  });
}

/** Filtered read-only export, independently authorized and capped before serialization. */
export async function getTpoFollowupQueueCsv(
 context:RequestContext,raw:unknown,now=new Date(),
){
 const {collegeId,ownerMembershipId}=await requireTpo(context);
 const input=tpoFollowupQueueQuerySchema.omit({page:true}).parse(raw);
 const end=new Date(now.getTime()+7*86400000);
 const when=input.window==="DUE"?[lte(placementTpoFollowups.dueAt,now)]:
  [gte(placementTpoFollowups.dueAt,now),lte(placementTpoFollowups.dueAt,end)];
 const facts=await getDb().select({
  id:placementTpoFollowups.id,leadId:placementTpoFollowups.leadId,
  leadName:placementTpoLeads.name,companyName:placementTpoLeads.companyName,
  dueAt:placementTpoFollowups.dueAt,note:placementTpoFollowups.note,
 }).from(placementTpoFollowups).innerJoin(placementTpoLeads,and(
  eq(placementTpoFollowups.leadId,placementTpoLeads.id),
  eq(placementTpoFollowups.collegeId,placementTpoLeads.collegeId),
 )).where(and(
  eq(placementTpoFollowups.collegeId,collegeId),
  eq(placementTpoLeads.collegeId,collegeId),
  isNull(placementTpoFollowups.doneAt),...when,
  ...(input.scope==="MINE"?[eq(placementTpoFollowups.ownerMembershipId,ownerMembershipId)]:[]),
  ...(input.q?[sql<boolean>`position(lower(${input.q}::text) in lower(coalesce(${placementTpoLeads.name}, '') || ' ' || coalesce(${placementTpoLeads.companyName}, ''))) > 0`]:[]),
 )).orderBy(asc(placementTpoFollowups.dueAt),asc(placementTpoFollowups.id)).limit(501);
 return tpoFollowupCsv(facts,input);
}

/** Compatibility adapter for the old flat follow-up list. Always bound to
 * the authenticated TPO/College Admin college; this does not expose global
 * tenant search, and only the requested paged window is returned. */
export async function listLegacyTpoFollowups(
 context:RequestContext,rawQuery:unknown={},
){
 const queue=await getTpoDueFollowupQueue(context,new Date(),rawQuery);
 return queue.rows;
}

/** Atomic, tenant-scoped Tomorrow operation. A task cannot be duplicated by
 * concurrent tabs, overwritten after a competing change, or moved after Done.
 * Recording the actor and previous/new time is part of the same transaction. */
export async function rescheduleConfirmedTpoFollowup(
 context:RequestContext,rawFollowupId:unknown,raw:unknown,now=new Date(),
){
 const scope=await requireTpo(context);
 const id=tpoFollowupIdSchema.parse(rawFollowupId);
 const input=confirmedTpoFollowupRescheduleSchema.parse(raw);
 const dueAt=new Date(input.dueAt);
 if(!Number.isFinite(dueAt.getTime())||dueAt.getTime()<=now.getTime())
  throw new TpoCrmError("TPO_CRM_INVALID_DUE_AT");
 return getDb().transaction(async tx=>{
  const [current]=await tx.select({
   id:placementTpoFollowups.id,
   leadId:placementTpoFollowups.leadId,
   dueAt:placementTpoFollowups.dueAt,
   doneAt:placementTpoFollowups.doneAt,
  }).from(placementTpoFollowups)
   .innerJoin(placementTpoLeads,and(
    eq(placementTpoFollowups.leadId,placementTpoLeads.id),
    eq(placementTpoFollowups.collegeId,placementTpoLeads.collegeId),
   )).where(and(
    eq(placementTpoFollowups.id,id),
    eq(placementTpoFollowups.collegeId,scope.collegeId),
    eq(placementTpoLeads.collegeId,scope.collegeId),
   )).for("update",{of:placementTpoFollowups}).limit(1);
  if(!current)throw new TpoCrmError("TPO_CRM_FOLLOWUP_NOT_FOUND");
  if(current.doneAt!==null||current.dueAt.toISOString()!==new Date(input.expectedDueAt).toISOString())
   throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
  const [updated]=await tx.update(placementTpoFollowups)
   .set({dueAt}).where(and(eq(placementTpoFollowups.id,id),
    eq(placementTpoFollowups.collegeId,scope.collegeId),
    eq(placementTpoFollowups.dueAt,current.dueAt),
    isNull(placementTpoFollowups.doneAt)))
   .returning({id:placementTpoFollowups.id});
  if(!updated)throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
  await tx.insert(placementTpoLeadActivities).values({
   collegeId:scope.collegeId,leadId:current.leadId,type:"NOTE",
   isSystem:false,outcome:"FOLLOWUP_RESCHEDULED",
   note:"Follow-up moved from "+current.dueAt.toISOString()+" to "+dueAt.toISOString(),
   createdByUserId:context.user.id,
  });
  return {id:updated.id,dueAt:dueAt.toISOString()};
 });
}
