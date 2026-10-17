import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,projectInstances,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectManageAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {readinessOverrideInputSchema,type ReadinessOverrideState} from "./readiness-override-model";

type ReadableDb=Pick<ReturnType<typeof getDb>,"select">;
export async function readProjectReadinessOverride(db:ReadableDb,projectId:string,collegeId:string) {
  const [row]=await db.select({metadata:activityEvents.metadata,occurredAt:activityEvents.occurredAt,
    overriddenBy:users.displayName})
    .from(activityEvents).leftJoin(users,eq(users.id,activityEvents.actorUserId)).where(and(eq(activityEvents.subjectType,"project_instance"),
      eq(activityEvents.subjectId,projectId),eq(activityEvents.collegeId,collegeId),
      eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN)))
    .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  const value=row?.metadata?.state;
  const state:ReadinessOverrideState|null=value==="FORCE_UNLOCK"||value==="FORCE_BLOCK"||value==="CLEAR"?value:null;
  return {state, note:state==="CLEAR"?null:typeof row?.metadata?.note==="string"?row.metadata.note:null,
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
        eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
    if(!project||project.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_INVALID_STATE");
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
