import "server-only";

import {randomUUID} from "node:crypto";
import {and,count,desc,eq,isNull,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  projectInstances,projectSubmissions,projectReleases,projectSprints,projectTasks,
} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectLifecycleAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {
  closeoutChecklist,mentorCloseoutParamsSchema,mentorCloseoutSchema,
} from "./mentor-closeout-model";

async function scopeMentor(context:RequestContext,projectId:string){
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope=await requireProjectLifecycleAccess(context,projectId);
  if(scope.access!=="MENTOR"||!can(context,"projects.read",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
  })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  return scope;
}
async function facts(db:ReturnType<typeof getDb>,projectId:string,projectStatus:string){
  const [latest]=await db.select({status:projectSubmissions.status})
    .from(projectSubmissions).where(eq(projectSubmissions.projectId,projectId))
    .orderBy(desc(projectSubmissions.version)).limit(1);
  const [tasks]=await db.select({n:count()}).from(projectTasks)
    .where(and(eq(projectTasks.projectId,projectId),ne(projectTasks.status,"DONE"),isNull(projectTasks.deletedAt))));
  const [sprints]=await db.select({n:count()}).from(projectSprints)
    .where(and(eq(projectSprints.projectId,projectId),ne(projectSprints.status,"COMPLETED"),isNull(projectSprints.deletedAt))));
  const [releases]=await db.select({n:count()}).from(projectReleases)
    .where(and(eq(projectReleases.projectId,projectId),ne(projectReleases.status,"SHIPPED")));
  return closeoutChecklist({
    projectStatus,approved:latest?.status==="APPROVED",
    openTasks:Number(tasks?.n??0),openSprints:Number(sprints?.n??0),
    openReleases:Number(releases?.n??0),
  });
}

export async function getMentorProjectCloseout(context:RequestContext,raw:unknown){
  const params=mentorCloseoutParamsSchema.parse(raw);
  const scope=await scopeMentor(context,params.projectId);
  const checklist=await facts(getDb(),scope.project.id,scope.project.status);
  return {
    id:scope.project.id,title:scope.project.title,status:scope.project.status,
    expectedUpdatedAt:scope.project.updatedAt.toISOString(),checklist,
  };
}

/** Locked, token-checked transition to the only persisted closeout status, COMPLETED. */
export async function completeMentorProject(
  context:RequestContext,rawParams:unknown,rawBody:unknown,
){
  const params=mentorCloseoutParamsSchema.parse(rawParams);
  const input=mentorCloseoutSchema.parse(rawBody);
  const scope=await scopeMentor(context,params.projectId);
  return getDb().transaction(async tx=>{
    const [locked]=await tx.select().from(projectInstances).where(and(
      eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId),
    )).for("update").limit(1);
    if(!locked||locked.status!=="ACTIVE"||
      locked.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime())
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    // Guard the closeout decision against revoked memberships and stale Mentor assignments.
    await assertPersistedProjectMutationActor(tx,context,scope);
    // PostgreSQL FK/mutation ownership ensures all rows originate from this project.
    const [latest]=await tx.select({status:projectSubmissions.status})
      .from(projectSubmissions).where(eq(projectSubmissions.projectId,locked.id))
      .orderBy(desc(projectSubmissions.version)).limit(1);
    const [tasks]=await tx.select({n:count()}).from(projectTasks)
      .where(and(eq(projectTasks.projectId,locked.id),ne(projectTasks.status,"DONE"),isNull(projectTasks.deletedAt))));
    const [sprints]=await tx.select({n:count()}).from(projectSprints)
      .where(and(eq(projectSprints.projectId,locked.id),ne(projectSprints.status,"COMPLETED"),isNull(projectSprints.deletedAt))));
    const [releases]=await tx.select({n:count()}).from(projectReleases)
      .where(and(eq(projectReleases.projectId,locked.id),ne(projectReleases.status,"SHIPPED")));
    const checklist=closeoutChecklist({
      projectStatus:locked.status,approved:latest?.status==="APPROVED",
      openTasks:Number(tasks?.n??0),openSprints:Number(sprints?.n??0),
      openReleases:Number(releases?.n??0),
    });
    if(!checklist.canComplete) throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    const now=new Date(Math.max(Date.now(),locked.updatedAt.getTime()+1));
    const [completed]=await tx.update(projectInstances).set({
      status:"COMPLETED",updatedAt:now,
    }).where(and(eq(projectInstances.id,locked.id),
      eq(projectInstances.collegeId,scope.collegeId),
      eq(projectInstances.status,"ACTIVE"))).returning();
    if(!completed) throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_COMPLETED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_instance",subjectId:locked.id,
      subjectLabel:locked.title,summary:"Mentor completed approved project",
      metadata:{projectId:locked.id,from:"ACTIVE",to:"COMPLETED",
        confirmed:["deliveryReviewed","teamNotified","closeout"]},
      groupKey:"project:"+locked.id,dedupeKey:"project-completed:"+locked.id+":"+randomUUID(),
    });
    return completed;
  });
}
