import "server-only";

import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementTpoLeadActivities,placementTpoLeads} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";

const requestSchema=z.strictObject({
 confirmed:z.literal(true),
 runAuditId:z.string().uuid(),
});
const stage=z.enum(["NEW","CONTACTED","NOT_NOW"]);
const stageSnapshot=z.strictObject({
 leadId:z.string().uuid(),beforeStage:stage,afterStage:stage,
 beforeReason:z.string().nullable(),afterReason:z.string().nullable(),
 beforeUntil:z.string().nullable(),afterUntil:z.string().nullable(),
 afterUpdatedAt:z.iso.datetime({offset:true}),
});
const ownerSnapshot=z.strictObject({
 leadId:z.string().uuid(),beforeOwnerId:z.string().uuid().nullable(),
 afterOwnerId:z.string().uuid(),afterUpdatedAt:z.iso.datetime({offset:true}),
});
const undoWindowMs=5*60*1000;

export class TpoBulkUndoError extends Error {
 constructor(readonly code:"NOT_FOUND"|"EXPIRED"|"ALREADY_RESTORED"|"STALE"|"INVALID_SNAPSHOT"){
  super(code);
 }
}

/** Five-minute, actor-only, single-use compensation of a fully audited
 * TPO manual-stage or owner batch. Never overwrites subsequent edits.
 * The audit event lock, deterministic lead locks and unique dedupe key
 * make concurrent Undo attempts single-winner across app instances.
 */
export async function undoTpoRecruiterBulkRun(context:RequestContext,raw:unknown){
 const input=requestSchema.parse(raw);
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
   !hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const collegeId=membership.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 const college=await requirePlacementManageScope(context,collegeId);
 return getDb().transaction(async tx=>{
  const [event]=await tx.select().from(activityEvents).where(and(
   eq(activityEvents.id,input.runAuditId),eq(activityEvents.collegeId,college.id),
   eq(activityEvents.actorUserId,context.user.id),
   eq(activityEvents.actorMembershipId,membership.id),eq(activityEvents.module,"PLACEMENTS"),
  )).for("update").limit(1);
  if(!event||!["PLACEMENTS_RECRUITER_BULK_STAGE","PLACEMENTS_RECRUITER_BULK_OWNER"].includes(event.eventType))
   throw new TpoBulkUndoError("NOT_FOUND");
  const now=new Date();
  const [already]=await tx.select({id:activityEvents.id}).from(activityEvents).where(eq(
   activityEvents.dedupeKey,"tpo-recruiter-bulk-undo:"+input.runAuditId)).limit(1);
  if(already)throw new TpoBulkUndoError("ALREADY_RESTORED");
  const age=now.getTime()-event.occurredAt.getTime();
  if(age<0||age>undoWindowMs)throw new TpoBulkUndoError("EXPIRED");
  const stageRun=event.eventType==="PLACEMENTS_RECRUITER_BULK_STAGE";
  const model=z.strictObject({
   undoVersion:z.literal(1),
   changed:z.array(stageRun?stageSnapshot:ownerSnapshot).min(1).max(100),
  }).passthrough();
  const snapshot=model.safeParse(event.metadata);
  if(!snapshot.success)throw new TpoBulkUndoError("INVALID_SNAPSHOT");
  const changed=snapshot.data.changed as Array<{
   leadId:string;beforeStage?:string;afterStage?:string;
   beforeReason?:string|null;afterReason?:string|null;
   beforeUntil?:string|null;afterUntil?:string|null;
   beforeOwnerId?:string|null;afterOwnerId?:string;afterUpdatedAt:string;
  }>;
  if(new Set(changed.map(row=>row.leadId)).size!==changed.length)
   throw new TpoBulkUndoError("INVALID_SNAPSHOT");
  const auditLeadIds=event.metadata["leadIds"];
  if(!Array.isArray(auditLeadIds)||
     changed.some(row=>!auditLeadIds.includes(row.leadId)))
   throw new TpoBulkUndoError("INVALID_SNAPSHOT");
  const sorted=[...changed].sort((a,b)=>a.leadId.localeCompare(b.leadId));
  // The audit event row is locked before lead rows, serializing same-run undo attempts.
  for(const change of sorted){
   const [lead]=await tx.select({
    id:placementTpoLeads.id,
    manualStage:placementTpoLeads.manualStage,notNowReason:placementTpoLeads.notNowReason,
    notNowUntil:placementTpoLeads.notNowUntil,ownerMembershipId:placementTpoLeads.ownerMembershipId,
    updatedAt:placementTpoLeads.updatedAt,
   }).from(placementTpoLeads).where(and(
    eq(placementTpoLeads.id,change.leadId),eq(placementTpoLeads.collegeId,college.id),
   )).for("update").limit(1);
   if(!lead||lead.updatedAt.getTime()!==new Date(change.afterUpdatedAt).getTime())
    throw new TpoBulkUndoError("STALE");
   if(stageRun){
    if (change.beforeStage === undefined) throw new TpoBulkUndoError("INVALID_SNAPSHOT");
    if(lead.manualStage!==change.afterStage||lead.notNowReason!==change.afterReason||
       lead.notNowUntil!==change.afterUntil)throw new TpoBulkUndoError("STALE");
    await tx.update(placementTpoLeads).set({
     manualStage:change.beforeStage,notNowReason:change.beforeReason??null,
     notNowUntil:change.beforeUntil??null,updatedAt:now,
    }).where(and(eq(placementTpoLeads.id,lead.id),eq(placementTpoLeads.collegeId,college.id)));
   }else{
    if(lead.ownerMembershipId!==change.afterOwnerId)throw new TpoBulkUndoError("STALE");
    await tx.update(placementTpoLeads).set({
     ownerMembershipId:change.beforeOwnerId??null,updatedAt:now,
    }).where(and(eq(placementTpoLeads.id,lead.id),eq(placementTpoLeads.collegeId,college.id)));
   }
   await tx.insert(placementTpoLeadActivities).values({
    collegeId:college.id,leadId:lead.id,type:"NOTE",isSystem:false,
    note:stageRun?"Undid audited bulk manual-stage update":"Undid audited bulk owner assignment",
    createdByUserId:context.user.id,
   });
  }
  const firstChange = sorted[0];
  if (!firstChange) throw new TpoBulkUndoError("INVALID_SNAPSHOT");
  const [audit]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_RECRUITER_BULK_UNDO",subjectType:"placement_tpo_lead",
   subjectId:firstChange.leadId,summary:"Undid recruiter lead bulk update",
   metadata:{originalRunAuditId:input.runAuditId,kind:stageRun?"STAGE":"OWNER",restored:sorted.length},
   dedupeKey:"tpo-recruiter-bulk-undo:"+input.runAuditId,
   occurredAt:now,
  }).returning({id:activityEvents.id});
  if(!audit)throw new TpoBulkUndoError("ALREADY_RESTORED");
  return {restored:sorted.length,undoAuditId:audit.id};
 });
}
