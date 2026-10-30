import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,projectInstances,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectManageAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {readinessOverrideInputSchema,isDuplicateProjectReadinessOverride,type ReadinessOverrideState} from "./readiness-override-model";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

/** Readiness override rows are authoritative state, not disposable analytics.
 * Retention jobs must never compact this event type until a durable
 * versioned per-project state table is registered, replayed and migrated.
 * This invariant is exported to the activity retention owner as a contract;
 * it does not by itself change the global activity retention worker.
 */
export const PROJECT_READINESS_OVERRIDE_RETENTION_POLICY={
 protectedEventType:ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN,
 allowCompaction:false,
 requiresDurableSnapshotBeforePrune:true,
} as const;

type ReadableDb=Pick<ReturnType<typeof getDb>,"select">;
export async function readProjectReadinessOverride(db:ReadableDb,projectId:string,collegeId:string) {
  const [row]=await db.select({metadata:activityEvents.metadata,occurredAt:activityEvents.occurredAt,
    overriddenBy:users.displayName})
    .from(activityEvents).leftJoin(users,eq(users.id,activityEvents.actorUserId)).where(and(eq(activityEvents.subjectType,"project_instance"),
      eq(activityEvents.subjectId,projectId),eq(activityEvents.collegeId,collegeId),
      eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN)))
    .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  const value=row?.metadata?.["state"];
  const state:ReadinessOverrideState|null=value==="FORCE_UNLOCK"||value==="FORCE_BLOCK"||value==="CLEAR"?value:null;
  return {state, note:state&&state!=="CLEAR"&&typeof row?.metadata?.["note"]==="string"?row.metadata["note"]:null,
    occurredAt:row?.occurredAt??null,overriddenBy:row?.overriddenBy??null};
}

export async function overrideProjectReadiness(context:RequestContext,projectIdInput:string,raw:unknown){
  const scope=await requireProjectManageAccess(context,projectIdInput);
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const input=readinessOverrideInputSchema.parse(raw);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({id:projectInstances.id,title:projectInstances.title,status:projectInstances.status})
      .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId),
        isNull(projectInstances.deletedAt))).for("update").limit(1);
    if(!project||project.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    // Session roles can change between opening the dialog and submitting.
    // Check the persisted user/membership under transactional locks before
    // either returning a retry or recording a new audit event.
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      organizationId:scope.organizationId,collegeId:scope.collegeId,
    });
    const previous=await readProjectReadinessOverride(tx,project.id,scope.collegeId);
    if(isDuplicateProjectReadinessOverride(previous,input))
      return {state:input.state,note:"note" in input?input.note:null};
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_instance",subjectId:project.id,subjectLabel:project.title,
      summary:"Readiness updated",metadata:{state:input.state,
        ...("note" in input?{note:input.note}:{}),projectId:project.id},
      groupKey:"project:"+project.id,dedupeKey:"project-readiness:"+project.id+":"+randomUUID(),
    });
    return {state:input.state,note:"note" in input?input.note:null};
  });
}
